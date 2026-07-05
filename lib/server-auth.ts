import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export class ApiAuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function requireApiUser(request: Request) {
  const header = request.headers.get("authorization") || "";
  const cookieToken = parseCookies(request.headers.get("cookie") || "").fitsaathi_access;
  const token = header.startsWith("Bearer ") ? header.slice(7) : cookieToken || "";
  if (!token) throw new ApiAuthError("Authentication is required.", 401);

  try {
    const claims = jwt.verify(token, requiredSecret()) as { id?: string; email?: string; role?: string };
    if (!claims.id) throw new Error("Missing user ID");
    const user = await prisma.user.findUnique({ where: { id: claims.id } });
    if (!user || user.accountStatus !== "active") throw new ApiAuthError("Your session is invalid or expired.", 401);
    return { id: user.id, uid: user.id, email: user.email, name: user.name, role: user.role };
  } catch (error) {
    if (error instanceof ApiAuthError) throw error;
    throw new ApiAuthError("Your session is invalid or expired.", 401);
  }
}

function parseCookies(header: string) {
  return Object.fromEntries(header.split(";").map(value => value.trim()).filter(Boolean).map(value => {
    const separator = value.indexOf("=");
    return separator < 0 ? [value, ""] : [value.slice(0, separator), decodeURIComponent(value.slice(separator + 1))];
  }));
}

function requiredSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return secret;
}
