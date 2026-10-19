import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler } from "express";
import { resolve } from "node:path";

import { env } from "./config/env.js";
import { EmailDeliveryError } from "./lib/email.js";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.NODE_ENV === "development"
  ? [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"]
  : env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(resolve("uploads")));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/health/database", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ status: "ok", database: "connected" });
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;
  if (error instanceof EmailDeliveryError) {
    response.status(503).json({ message: error.message });
    return;
  }
  console.error(error);
  response.status(500).json({ message: "Internal server error" });
};

app.use(errorHandler);
