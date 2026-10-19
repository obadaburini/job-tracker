import { env } from "../config/env.js";
import { verifyEmailConnection } from "../lib/email.js";

if (env.NODE_ENV !== "development") {
  console.error("SMTP verification is available only with NODE_ENV=development.");
  process.exitCode = 1;
} else {
  const timeout = setTimeout(() => {
    console.error("SMTP verification timed out after 30 seconds. Check DNS, firewall, and outbound SMTP access.");
    process.exit(1);
  }, 30000);
  try {
    await verifyEmailConnection();
    console.log("SMTP connection, TLS, and authentication verified. No email was sent.");
  } catch {
    console.error("SMTP verification failed. Check the safe diagnostic code above.");
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}
