import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type ApplicationSessionUser = { id: string; email: string; role: string };

export const applicationSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export async function issueApplicationSession(user: ApplicationSessionUser) {
  const claims = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(claims, requiredSecret("JWT_SECRET"), { expiresIn: "15m" });
  const refreshToken = jwt.sign(claims, requiredSecret("JWT_REFRESH_SECRET"), { expiresIn: "30d", jwtid: crypto.randomUUID() });

  await prisma.refreshToken.create({
    data: {
      tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 86400_000)
    }
  });

  return { accessToken, refreshToken };
}

function requiredSecret(name: "JWT_SECRET" | "JWT_REFRESH_SECRET") {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} is not configured.`);
  return secret;
}
