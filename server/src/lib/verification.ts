import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

export const RESEND_SECONDS = 60;
export const OTP_LIFETIME_SECONDS = 600;

export function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(userId: string, code: string) {
  // A keyed hash prevents offline brute force of the small numeric code space.
  return createHmac("sha256", env.JWT_SECRET).update(`email-verification:${userId}:${code}`).digest("hex");
}

export async function issueCode(userId: string) {
  return prisma.$transaction(async (tx) => {
    // Serialize verification and issuance for the same user across API processes.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerified || !user.isActive) return null;
    const previous = await tx.emailVerificationCode.findUnique({ where: { userId } });
    const now = new Date();
    if (previous && now.getTime() - previous.createdAt.getTime() < RESEND_SECONDS * 1000) return null;
    let code = generateCode();
    while (previous?.codeHash === hashCode(userId, code)) code = generateCode();
    const data = {
      codeHash: hashCode(userId, code), expiresAt: new Date(now.getTime() + OTP_LIFETIME_SECONDS * 1000),
      usedAt: null, failedAttempts: 0, createdAt: now,
    };
    await tx.emailVerificationCode.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    return code;
  });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return false;
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
    const currentUser = await tx.user.findUnique({ where: { id: user.id } });
    const record = await tx.emailVerificationCode.findUnique({ where: { userId: user.id } });
    const now = new Date();
    if (!currentUser?.isActive || currentUser.emailVerified || !record || record.usedAt || record.expiresAt <= now || record.failedAttempts >= 5) return false;
    const matches = timingSafeEqual(Buffer.from(record.codeHash, "hex"), Buffer.from(hashCode(user.id, code), "hex"));
    if (!matches) {
      const failedAttempts = record.failedAttempts + 1;
      await tx.emailVerificationCode.update({ where: { userId: user.id }, data: {
        failedAttempts, ...(failedAttempts >= 5 ? { usedAt: now } : {}),
      } });
      return false;
    }
    await tx.emailVerificationCode.update({ where: { userId: user.id }, data: { usedAt: now } });
    await tx.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    return true;
  });
}
