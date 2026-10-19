import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Router } from "express";
import multer from "multer";

import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
const avatarDirectory = resolve("uploads", "avatars");
mkdirSync(avatarDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: avatarDirectory,
    filename: (_request, file, callback) =>
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

function removeLocalAvatar(avatarUrl: string | null): void {
  if (!avatarUrl?.startsWith("/uploads/avatars/")) return;
  const path = resolve("uploads", "avatars", avatarUrl.split("/").pop()!);
  if (existsSync(path)) unlinkSync(path);
}

router.post("/avatar", authenticate, upload.single("avatar"), async (request, response) => {
  if (!request.file) {
    response.status(400).json({ message: "Please select a JPG, PNG, or WebP image" });
    return;
  }

  const currentUser = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id } });
  const avatarUrl = `/uploads/avatars/${request.file.filename}`;
  const user = await prisma.user.update({
    where: { id: request.user!.id },
    data: { avatarUrl },
    select: { avatarUrl: true },
  });
  removeLocalAvatar(currentUser.avatarUrl);
  response.json(user);
});

router.delete("/avatar", authenticate, async (request, response) => {
  const currentUser = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id } });
  await prisma.user.update({ where: { id: request.user!.id }, data: { avatarUrl: null } });
  removeLocalAvatar(currentUser.avatarUrl);
  response.status(204).send();
});

export default router;
