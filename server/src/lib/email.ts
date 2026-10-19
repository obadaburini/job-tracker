import nodemailer from "nodemailer";

import { env } from "../config/env.js";

type VerificationEmailInput = {
  email: string;
  code: string;
};

export class EmailDeliveryError extends Error {
  constructor() {
    super("Email delivery failed. Please try resending your verification email later.");
  }
}

function createTransporter() {
  if (!env.SMTP_HOST?.trim() || !env.SMTP_USER?.trim() || !env.SMTP_PASS?.trim()) {
    console.error("[email] Missing SMTP_HOST, SMTP_USER, or SMTP_PASS configuration");
    throw new EmailDeliveryError();
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST.trim(),
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT !== 465,
    auth: { user: env.SMTP_USER.trim(), pass: env.SMTP_PASS },
    connectionTimeout: 10000,
    dnsTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

function reportFailure(error: unknown, operation: string) {
  // Raw SMTP errors can include sensitive response text; log only known codes.
  const details = error as { code?: unknown; responseCode?: unknown } | null;
  const codes = ["EAUTH", "ECONNECTION", "ETIMEDOUT", "EDNS", "ESOCKET", "ETLS", "EENVELOPE", "EMESSAGE"];
  const code = typeof details?.code === "string" && codes.includes(details.code) ? details.code : "EMAIL_FAILURE";
  const responseCode = typeof details?.responseCode === "number" ? details.responseCode : undefined;
  console.error("[email]", { operation, code, responseCode });
}

export async function verifyEmailConnection(): Promise<void> {
  const transporter = createTransporter();
  try {
    await transporter.verify();
  } catch (error) {
    reportFailure(error, "verify");
    throw new EmailDeliveryError();
  } finally {
    transporter.close();
  }
}

export async function sendVerificationEmail({ email, code }: VerificationEmailInput): Promise<void> {
  if (!/^\d{6}$/.test(code)) throw new EmailDeliveryError();
  const transporter = createTransporter();
  try {
    const result = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Job Tracker Verification Code",
      text: `Job Tracker\n\nYour verification code is:\n\n${code}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif"><h2>Job Tracker</h2><p>Your verification code is:</p><p style="font-size:32px;letter-spacing:6px;font-weight:bold">${code}</p><p>This code expires in 10 minutes.</p><p>If you did not create this account, ignore this email.</p></div>`,
    });
    if (!result.accepted?.length || result.rejected?.length) throw new EmailDeliveryError();
  } catch (error) {
    reportFailure(error, "send-verification");
    throw new EmailDeliveryError();
  } finally {
    transporter.close();
  }
}
