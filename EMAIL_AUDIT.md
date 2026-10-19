# Job Tracker email OTP verification

Account verification uses Nodemailer + Gmail SMTP. Verification emails contain a six-digit code only, in plain text and minimal HTML, with the subject `Job Tracker Verification Code`. No links, images, or tracking are included. SMTP environment variables and credentials are unchanged.

## Flow and API

- `POST /api/auth/register`: `{ companyName, name, email, password }`. Creates an unverified manager and company, stores a hashed code, and attempts delivery. Returns 201 with `requiresVerification`, `email`, `emailDelivery`, `message`, and `resendAfterSeconds`. Delivery failure keeps the account and takes the frontend to verification with a safe explanation.
- `POST /api/auth/verify-email`: `{ email, code }`. Requires exactly six ASCII digits. Returns 200 on success; malformed, wrong, expired, used, locked, and unknown-account codes receive a generic 400.
- `POST /api/auth/resend-verification`: `{ email }`. At most one code issuance per account per 60 seconds. Unknown, verified, inactive, cooling-down, and delivery-failed accounts receive the same generic 200 response. SMTP failures are logged safely. IP bursts receive 429 with Retry-After.
- `POST /api/auth/login`: validates the password before revealing verification status. Correct credentials for an unverified account return 403 and `Your account has not been verified yet.` The UI offers `Resend verification code`. Wrong credentials remain generic. Successful verification does not automatically sign in.

The Verify Email page accepts paste, uses inputMode=numeric and autocomplete=one-time-code, shows a six-digit field, countdowns, loading states, errors, and resend. Email can be entered manually when opening the page directly. `/check-email` renders the same OTP page for compatibility. Existing verification-link tokens no longer work; request a code instead.

## Database and security

Migration `20261019140000_email_verification_otp` removes User.verificationTokenHash and User.verificationTokenExpiresAt and creates EmailVerificationCode with id, unique userId, codeHash, expiresAt, usedAt, failedAttempts, and createdAt. No unrelated models change. One row per user is replaced on eligible resend, invalidating the old code. Verified accounts remain verified.

Codes use node:crypto randomInt with zero-padding, including leading zeroes. Only HMAC-SHA256(userId + code) is stored, keyed by the existing JWT_SECRET, preventing offline enumeration from a database-only disclosure. Changing JWT_SECRET invalidates active OTPs as well as sessions. Codes expire in ten minutes. Five incorrect valid-format attempts invalidate the record. Success consumes the record and marks the account verified in one transaction. User row locks serialize issuance and verification across processes. A resend never generates the same code as its predecessor.

Resend cooldown is persisted in PostgreSQL. The additional per-IP burst limiter is process-local (10 resend requests per 15 minutes, 60 verification requests, 20 registrations); deployments with multiple API replicas should use shared IP rate-limit storage. Reverse-proxy trust settings should be configured to match the deployment before trusting forwarded client IPs. No proxy trust is enabled by default.

## Connectivity and configuration

Development frontend: port 5173, strictPort enabled. Backend default: port 4000. Browser requests default to same-origin `/api`, proxied by Vite to http://127.0.0.1:4000. `/uploads` is also proxied to preserve avatars. Development CORS allows CLIENT_URL plus localhost:5173 and 127.0.0.1:5173; production allows CLIENT_URL only.

Previously requests used a hardcoded cross-origin localhost:4000 URL with no dev proxy and only one allowed origin; opening the frontend under a different hostname could break requests. The exact historical Failed to fetch event was not reproduced. The current proxy and direct CORS paths were checked successfully. A stopped backend or incorrect VITE_API_URL still requires correcting that runtime configuration; network exceptions now display a useful message and backend JSON errors are preserved.

Set VITE_API_URL only when overriding the default, including `/api` in the value. Production hosting must route `/api` and `/uploads` to the API, or set VITE_API_URL to the deployed API URL at build time. Vite preview is a static preview, not the development API proxy.

Private server/.env is loaded relative to the configuration module, before email configuration. Required settings: DATABASE_URL, JWT_SECRET (at least 32 characters), SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM. CLIENT_URL defaults to http://localhost:5173; NODE_ENV defaults to development; PORT defaults to 4000. Gmail uses smtp.gmail.com:587 with required STARTTLS and Gmail address + App Password. Never put secrets in VITE_ variables. No real credentials, OTPs, passwords, or tokens are logged. No email is automatically sent at startup.

## Running and testing

From the project root on Windows PowerShell:

```powershell
npm.cmd --prefix server run prisma:generate
# Apply committed migrations; never reset the database:
cd server
npx.cmd prisma validate
npx.cmd prisma migrate deploy
cd ..
npm.cmd --prefix server run dev
# In a separate terminal:
npm.cmd run dev
```

Automated validation:

Latest results: 15 auth checks and 1 email test passed with mocked SMTP; frontend and backend builds passed; Prisma validation and migration deployment passed. Lint completed with no errors and seven generated-Prisma unused-directive warnings. The frontend build retains its existing bundle-size warning. Live development checks returned 200 for frontend, verification page, proxied API health, and database health; malformed auth requests returned expected 400 responses through the proxy. Both localhost and 127.0.0.1 development CORS preflights returned 204 with credentials allowed. No real emails were sent during validation.

```powershell
npm.cmd --prefix server run test:auth
npm.cmd --prefix server run test:email
npm.cmd --prefix server run build
npm.cmd run build
npm.cmd run lint
```

Auth integration tests use DATABASE_URL, create uniquely named temporary companies/users, and delete only those fixtures afterward. Apply migrations first and use a local/test database. SMTP is replaced entirely with a mock before requests; no real email is sent. Coverage includes registration, six-digit generation, keyed storage, wrong/malformed/expired/used codes, resend invalidation and cooldown, five-attempt lockout, concurrent one-time verification, verified/unverified login, delivery failure recovery, generic resend responses, and IP rate limiting. Email tests check no URLs and secret-safe diagnostics.

`npm.cmd --prefix server run email:verify` remains an explicitly invoked development-only connection/authentication check. It sends no message. To test real delivery manually, register an account using an inbox you control, enter its emailed code, and then sign in.
