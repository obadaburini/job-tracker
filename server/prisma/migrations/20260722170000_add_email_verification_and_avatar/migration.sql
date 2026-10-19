ALTER TABLE "User"
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verificationTokenHash" TEXT,
ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_verificationTokenHash_key"
ON "User"("verificationTokenHash");
