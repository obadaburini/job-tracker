# Job Tracker

A job-application tracking interface with a React frontend and an Express/PostgreSQL account API. Review application stages, manage a local application list, and visualize progress through dashboard charts.

## Overview

The frontend implements Dashboard, Applications, Statistics, Settings, and account/verification screens. Applications are initialized from six bundled examples and saved in browser localStorage through ApplicationContext. They are not currently synchronized with the server's Prisma application models. The server handles company/account registration, email verification, authentication, and profile/avatar operations.

## Screenshots

Selected existing captures from the real application using a temporary demo account and bundled sample applications. These were reviewed and reused rather than recaptured. They do not represent a newly verified live backend session.

| Dashboard | Applications |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Applications](docs/screenshots/applications.png) |

| Add application | Statistics |
| --- | --- |
| ![Application form](docs/screenshots/add-application.png) | ![Stage statistics](docs/screenshots/statistics.png) |

## Features

- Add, edit, delete, search, and filter local applications by company, role, location, and stage.
- Dashboard totals and Recharts application statistics, including interview stages.
- English/Arabic interface preferences, RTL support, and light/dark themes.
- Account/company registration, verification-code screens, and sign-in backed by an Express API when configured.
- Profile avatar upload/removal and cookie-based JWT authentication on the server.

Jobs, Candidates, and Interviews do not have standalone pages. This repository is not a complete applicant-tracking platform with server-persisted application CRUD.

## Stack and structure

React 19, TypeScript, Vite 8, React Router, and Recharts on the client; Express 5, Prisma 7, PostgreSQL, bcryptjs, Zod, Multer, and Nodemailer on the server.

```text
src/pages/             Account screens and main workspaces
src/context/           Authentication, local applications, and preferences
src/data/              Bundled sample applications
src/utils/             Statistics calculations
server/src/routes/     HTTP account/profile routes
server/src/lib/        Prisma and verification helpers
server/prisma/         Data schema and migrations
server/tests/          Authentication and email checks
docs/screenshots/      Existing real UI captures
```

## Getting started

Use a current Node.js version compatible with the locked Vite/Prisma toolchain; this review used Node 24. Install PostgreSQL for the account API. From the repository root:

```powershell
npm ci
cd server
npm ci
# Create server/.env locally with the configuration described below.
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

In a second terminal, from the repository root:

```powershell
npm run dev
```

Open http://localhost:5173. The Vite development proxy forwards /api and /uploads to http://127.0.0.1:4000. Migration commands modify the selected PostgreSQL database: choose a dedicated development database and inspect migrations first.

## Configuration

Keep server/.env local. Set DATABASE_URL and a randomly generated JWT_SECRET of at least 32 characters. Optional server settings are PORT (default 4000), CLIENT_URL (default http://localhost:5173), and NODE_ENV. Email delivery uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM. Configure real SMTP before expecting verification messages to arrive.

The client accepts VITE_API_URL; the default is /api. Production hosting must supply API/upload routing and a history fallback for React Router. Never put server secrets in VITE_ variables, which are public client build inputs.

## Validation and status

The client production build and server TypeScript build passed locally. The server build requires Prisma client generation first; the generated client is not committed. The compiled client rendered its sign-in screen. Full account/database/email runtime verification was blocked by absent local PostgreSQL/SMTP configuration. Existing account/email tests also stop at configuration validation without DATABASE_URL and JWT_SECRET; they are not reported as passing.

```powershell
npm run build
cd server
npm run prisma:generate
npm run build
# With an appropriate local test environment configured:
npm run test:auth
npm run test:email
```

Application storage remains browser-local and can be cleared by the browser. The frontend build reports a large JavaScript chunk warning. Backend integration and production deployment require further validation.
