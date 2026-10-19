import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import nodemailer from "nodemailer";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/config/env.js";
import { generateCode, hashCode } from "../src/lib/verification.js";

test("OTP auth routes with real database and mocked SMTP", async (t) => {
  const original = nodemailer.createTransport;
  const smtp = { host: env.SMTP_HOST, user: env.SMTP_USER, pass: env.SMTP_PASS };
  const email = `otp-test-${randomUUID()}@example.invalid`;
  const failedEmail = `otp-test-${randomUUID()}@example.invalid`;
  const password = "Test-only-password-123";
  const messages: { to: string; text: string; html: string; subject: string }[] = [];
  let fail = false;
  // All transports are replaced before any request. No SMTP network connection.
  nodemailer.createTransport = (() => ({
    close() {},
    async sendMail(mail: typeof messages[number]) {
      if (fail) throw Object.assign(new Error("mock SMTP failure"), { code: "EAUTH", responseCode: 535 });
      messages.push(mail);
      return { accepted: [mail.to], rejected: [] };
    },
  })) as unknown as typeof nodemailer.createTransport;
  env.SMTP_HOST = "smtp.invalid"; env.SMTP_USER = "test@example.invalid"; env.SMTP_PASS = "mock-only";
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  async function post(path: string, body: object) {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/${path}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie") };
  }
  const latestCode = () => messages.at(-1)!.text.match(/\b\d{6}\b/)![0];
  const user = () => prisma.user.findUniqueOrThrow({ where: { email } });
  const record = async () => prisma.emailVerificationCode.findUniqueOrThrow({ where: { userId: (await user()).id } });
  const ageCode = async () => prisma.emailVerificationCode.update({ where: { userId: (await user()).id }, data: { createdAt: new Date(Date.now() - 61000) } });
  try {
    await t.test("secure numeric generator preserves six digits", () => {
      for (let index = 0; index < 100; index++) assert.match(generateCode(), /^\d{6}$/);
    });
    await t.test("registration creates unverified manager and stores only a keyed hash", async () => {
      const result = await post("register", { companyName: "OTP Test", name: "Test Manager", email, password });
      assert.equal(result.status, 201);
      assert.equal(result.body.emailDelivery, "sent");
      assert.equal((await user()).emailVerified, false);
      assert.equal((await user()).role, "MANAGER");
      assert.match(latestCode(), /^\d{6}$/);
      assert.equal((await record()).codeHash, hashCode((await user()).id, latestCode()));
      assert.notEqual((await record()).codeHash, latestCode());
      assert.ok((await record()).expiresAt.getTime() > Date.now() + 590000);
      assert.doesNotMatch(JSON.stringify(result.body), new RegExp(latestCode()));
    });
    await t.test("emails contain only OTP content, no verification URL", () => {
      assert.equal(messages[0]!.subject, "Job Tracker Verification Code");
      assert.doesNotMatch(messages[0]!.text + messages[0]!.html, /https?:|localhost|href=|<img|verify-email/i);
    });
    await t.test("unverified login is blocked, wrong password stays generic", async () => {
      const result = await post("login", { email, password });
      assert.equal(result.status, 403);
      assert.equal(result.body.message, "Your account has not been verified yet.");
      assert.equal((await post("login", { email, password: "wrong" })).status, 401);
    });
    await t.test("wrong and malformed codes fail", async () => {
      const wrong = latestCode() === "000000" ? "000001" : "000000";
      assert.equal((await post("verify-email", { email, code: wrong })).status, 400);
      assert.equal((await record()).failedAttempts, 1);
      assert.equal((await post("verify-email", { email, code: "12345" })).status, 400);
    });
    await t.test("resend cooldown sends nothing and matches unknown-account response", async () => {
      const count = messages.length;
      const known = await post("resend-verification", { email });
      const unknown = await post("resend-verification", { email: "unknown@example.invalid" });
      assert.deepEqual(known.body, unknown.body);
      assert.equal(messages.length, count);
    });
    await t.test("resend invalidates the old code", async () => {
      const previous = latestCode();
      await ageCode();
      assert.equal((await post("resend-verification", { email })).status, 200);
      assert.notEqual(latestCode(), previous);
      assert.equal((await post("verify-email", { email, code: previous })).status, 400);
    });
    await t.test("expired code cannot verify", async () => {
      await prisma.emailVerificationCode.update({ where: { userId: (await user()).id }, data: { expiresAt: new Date(Date.now() - 1) } });
      assert.equal((await post("verify-email", { email, code: latestCode() })).status, 400);
    });
    await t.test("used code fails even while the account remains unverified", async () => {
      await prisma.emailVerificationCode.update({ where: { userId: (await user()).id }, data: {
        usedAt: new Date(), expiresAt: new Date(Date.now() + 600000),
      } });
      assert.equal((await post("verify-email", { email, code: latestCode() })).status, 400);
      assert.equal((await user()).emailVerified, false);
    });
    await t.test("five wrong attempts invalidate even the correct code", async () => {
      await ageCode(); await post("resend-verification", { email });
      const correct = latestCode();
      const wrong = correct === "000000" ? "000001" : "000000";
      for (let index = 0; index < 5; index++) assert.equal((await post("verify-email", { email, code: wrong })).status, 400);
      assert.equal((await record()).failedAttempts, 5);
      assert.ok((await record()).usedAt);
      assert.equal((await post("verify-email", { email, code: correct })).status, 400);
    });
    await t.test("correct code verifies once, including concurrent requests", async () => {
      await ageCode(); await post("resend-verification", { email });
      const results = await Promise.all([post("verify-email", { email, code: latestCode() }), post("verify-email", { email, code: latestCode() })]);
      assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
      assert.equal((await user()).emailVerified, true);
      assert.ok((await record()).usedAt);
      assert.equal((await post("verify-email", { email, code: latestCode() })).status, 400);
    });
    await t.test("verified login succeeds and sets session cookie", async () => {
      const result = await post("login", { email, password });
      assert.equal(result.status, 200);
      assert.ok(result.cookie?.includes("HttpOnly"));
      assert.equal(result.body.user.emailVerified, true);
    });
    await t.test("SMTP failure keeps account and offers resend", async () => {
      fail = true;
      const result = await post("register", { companyName: "OTP Failure Test", name: "Test Manager", email: failedEmail, password });
      assert.equal(result.status, 201);
      assert.equal(result.body.emailDelivery, "failed");
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { email: failedEmail } })).emailVerified, false);
      const failedUser = await prisma.user.findUniqueOrThrow({ where: { email: failedEmail } });
      await prisma.emailVerificationCode.update({ where: { userId: failedUser.id }, data: { createdAt: new Date(Date.now() - 61000) } });
      fail = false;
      await post("resend-verification", { email: failedEmail });
      assert.equal(messages.at(-1)!.to, failedEmail);
    });
    await t.test("resend IP burst limit returns 429", async () => {
      let status = 200;
      for (let index = 0; index < 11; index++) status = (await post("resend-verification", { email: "unknown@example.invalid" })).status;
      assert.equal(status, 429);
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    const users = await prisma.user.findMany({ where: { email: { in: [email, failedEmail] } }, select: { companyId: true } });
    await prisma.company.deleteMany({ where: { id: { in: users.map(value => value.companyId) } } });
    await prisma.$disconnect();
    nodemailer.createTransport = original;
    Object.assign(env, { SMTP_HOST: smtp.host, SMTP_USER: smtp.user, SMTP_PASS: smtp.pass });
  }
});
