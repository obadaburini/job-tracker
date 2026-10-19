import type { RequestHandler } from "express";

// Per-process IP burst protection; per-account resend cooldown is persisted in DB.
export function authRateLimit(limit: number): RequestHandler {
  const entries = new Map<string, { count: number; reset: number }>();
  return (request, response, next) => {
    const now = Date.now();
    for (const [key, value] of entries) if (value.reset <= now) entries.delete(key);
    const key = request.ip ?? "unknown";
    const entry = entries.get(key) ?? { count: 0, reset: now + 15 * 60_000 };
    if ((!entries.has(key) && entries.size >= 10000) || entry.count >= limit) {
      response.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000));
      response.status(429).json({ message: "Too many requests. Please try again later." });
      return;
    }
    entry.count++;
    entries.set(key, entry);
    next();
  };
}
