import "dotenv/config";
import os from "node:os";
import path from "node:path";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function enabled(name: string) {
  return process.env[name] === "true";
}

const vercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export const config = {
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  jwtSecret: required("JWT_SECRET"),
  refreshSecret: required("JWT_REFRESH_SECRET"),
  uploadRoot: path.resolve(process.env.UPLOAD_PATH || (vercelRuntime ? path.join(os.tmpdir(), "fitsaathi-uploads") : path.join(process.cwd(), "server", "uploads"))),
  privateRoot: path.resolve(process.env.PRIVATE_UPLOAD_PATH || (vercelRuntime ? path.join(os.tmpdir(), "fitsaathi-private") : path.join(process.cwd(), "server", "private"))),
  enableDojoGymRegistrationPayment: enabled("ENABLE_DOJO_GYM_REGISTRATION_PAYMENT"),
  enableAadhaarVerification: enabled("ENABLE_AADHAAR_VERIFICATION"),
  enableBankDetails: enabled("ENABLE_BANK_DETAILS"),
  vercelRuntime
};
