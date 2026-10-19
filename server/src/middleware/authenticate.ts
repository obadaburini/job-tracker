import type { NextFunction, Request, Response } from "express";

import { COOKIE_NAME, verifyAuthToken } from "../lib/auth.js";

export function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const token = request.cookies[COOKIE_NAME] as string | undefined;

  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    request.user = verifyAuthToken(token);
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired session" });
  }
}
