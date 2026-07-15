import "dotenv/config";
import os from "node:os";
import path from "node:path";
import { isServerlessRuntime } from "./runtime";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function enabled(name: string) {
  return process.env[name] === "true";
}

const vercelRuntime = isServerlessRuntime();

function storageRoot(environmentName: string, serverlessFolder: string, localFolder: string) {
  // Vercel's deployed application directory (/var/task) is read-only. Always
  // use the writable temporary directory in a serverless function, even if a
  // local UPLOAD_PATH value was accidentally included in the environment.
  if (vercelRuntime) return path.join(os.tmpdir(), serverlessFolder);
  return path.resolve(process.env[environmentName] || path.join(process.cwd(), "server", localFolder));
}

export const config = {
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  jwtSecret: required("JWT_SECRET"),
  refreshSecret: required("JWT_REFRESH_SECRET"),
  uploadRoot: storageRoot("UPLOAD_PATH", "fitsaathi-uploads", "uploads"),
  privateRoot: storageRoot("PRIVATE_UPLOAD_PATH", "fitsaathi-private", "private"),
  enableAadhaarVerification: enabled("ENABLE_AADHAAR_VERIFICATION"),
  vercelRuntime
};
