import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../lib/auth.js";
import { EmailDeliveryError, sendVerificationEmail } from "../lib/email.js";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/authenticate.js";

import { issueCode, verifyCode, RESEND_SECONDS } from "../lib/verification.js";
import { authRateLimit } from "../middleware/authRateLimit.js";

const router = Router();

const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

const emailSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
});

const verifySchema = emailSchema.extend({ code: z.string().regex(/^\d{6}$/) });

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  companyId: true,
  avatarUrl: true,
  emailVerified: true,
  company: { select: { name: true } },
} as const;

router.post("/register", authRateLimit(20), async (request, response) => {
  const result = registerSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ message: "Invalid registration details" });
    return;
  }

  const { companyName, name, email, password } = result.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    response.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (transaction) => {
    const company = await transaction.company.create({
      data: { name: companyName },
    });

    return transaction.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        passwordHash,
        role: "MANAGER",
      },
      select: publicUserSelect,
    });
  });

  let emailDelivery = "sent";
  try {
    const code = await issueCode(user.id);
    if (code) await sendVerificationEmail({ email: user.email, code });
  } catch (error) {
    if (!(error instanceof EmailDeliveryError)) throw error;
    emailDelivery = "failed";
  }
  response.status(201).json({ requiresVerification: true, email: user.email, emailDelivery,
    resendAfterSeconds: RESEND_SECONDS,
    message: emailDelivery === "failed" ? "Account created, but we could not send your code. Please request a new code shortly." : "Verification code sent.",
  });
});

router.post("/verify-email", authRateLimit(60), async (request, response) => {
  const result = verifySchema.safeParse(request.body);
  if (!result.success || !(await verifyCode(result.data.email, result.data.code))) {
    response.status(400).json({ message: "Invalid or expired code. Request a new code if needed." });
    return;
  }
  response.json({ message: "Email verified successfully" });
});

router.post("/resend-verification", authRateLimit(10), async (request, response) => {
  const result = emailSchema.safeParse(request.body);
  if (result.success) {
    const user = await prisma.user.findUnique({ where: { email: result.data.email } });
    if (user) {
      const code = await issueCode(user.id);
      if (code) {
        try { await sendVerificationEmail({ email: user.email, code }); }
        catch (error) { if (!(error instanceof EmailDeliveryError)) throw error; }
      }
    }
  }
  // Same public response for unknown, verified, cooldown, and delivery-failed accounts.
  response.json({ message: "If your account needs verification, a code will be sent when eligible. If it does not arrive, try again later.", resendAfterSeconds: RESEND_SECONDS });
});

router.post("/login", async (request, response) => {
  const result = loginSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ message: "Invalid email or password" });
    return;
  }

  const userWithPassword = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (
    !userWithPassword ||
    !userWithPassword.isActive ||
    !(await bcrypt.compare(result.data.password, userWithPassword.passwordHash))
  ) {
    response.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (!userWithPassword.emailVerified) {
    response.status(403).json({
      message: "Your account has not been verified yet.",
      code: "EMAIL_NOT_VERIFIED",
    });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userWithPassword.id },
    select: publicUserSelect,
  });

  setAuthCookie(response, createAuthToken(user));
  response.json({ user });
});

router.get("/me", authenticate, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id, isActive: true },
    select: publicUserSelect,
  });

  if (!user) {
    clearAuthCookie(response);
    response.status(401).json({ message: "Account not found" });
    return;
  }

  response.json({ user });
});

router.post("/logout", (_request, response) => {
  clearAuthCookie(response);
  response.status(204).send();
});

export default router;
