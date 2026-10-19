import type { Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export type AuthTokenPayload = {
  id: string;
  companyId: string;
  role: "MANAGER" | "RECRUITER";
};

const COOKIE_NAME = "job_tracker_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function createAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

export function setAuthCookie(response: Response, token: string): void {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookie(response: Response): void {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export { COOKIE_NAME };
