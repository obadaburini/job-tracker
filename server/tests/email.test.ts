import assert from "node:assert/strict";
import { test } from "node:test";
import nodemailer from "nodemailer";
import { env } from "../src/config/env.js";
import { EmailDeliveryError, sendVerificationEmail, verifyEmailConnection } from "../src/lib/email.js";

test("SMTP delivery, verification, failure redaction, and missing configuration", async () => {
  const original = nodemailer.createTransport;
  const saved = { host: env.SMTP_HOST, user: env.SMTP_USER, pass: env.SMTP_PASS };
  const originalLog = console.error;
  const logs: string[] = [];
  let closed = 0;
  let sends = 0;
  let fail = false;
  try {
    env.SMTP_HOST = "smtp.gmail.com";
    env.SMTP_USER = "test@example.com";
    env.SMTP_PASS = "test-only-secret";
    console.error = (...args) => { logs.push(JSON.stringify(args)); };
    nodemailer.createTransport = ((options: { requireTLS: boolean; secure: boolean }) => {
      assert.equal(options.requireTLS, env.SMTP_PORT !== 465);
      assert.equal(options.secure, env.SMTP_PORT === 465);
      return {
        verify: async () => true,
        close: () => { closed++; },
        sendMail: async (mail: { html: string; text: string; subject: string }) => {
          sends++;
          assert.equal(mail.subject, "Job Tracker Verification Code");
          assert.ok(mail.text.includes("123456"));
          assert.ok(mail.html.includes("123456"));
          assert.doesNotMatch(mail.html + mail.text, /https?:|localhost|href=|<img|verify-email/i);
          if (fail) throw Object.assign(new Error("test-only-secret token"), { code: "EAUTH", responseCode: 535 });
          return { accepted: ["test@example.com"], rejected: [] };
        },
      };
    }) as unknown as typeof nodemailer.createTransport;
    await verifyEmailConnection();
    assert.equal(sends, 0);
    const input = { email: "test@example.com", code: "123456" };
    await sendVerificationEmail(input);
    fail = true;
    await assert.rejects(sendVerificationEmail(input), EmailDeliveryError);
    assert.equal(closed, 3);
    env.SMTP_PASS = "";
    await assert.rejects(sendVerificationEmail(input), EmailDeliveryError);
    assert.ok(logs.join().includes("EAUTH"));
    assert.ok(!logs.join().includes("test-only-secret"));
    assert.ok(!logs.join().includes("123456"));
  } finally {
    nodemailer.createTransport = original;
    console.error = originalLog;
    Object.assign(env, { SMTP_HOST: saved.host, SMTP_USER: saved.user, SMTP_PASS: saved.pass });
  }
});
