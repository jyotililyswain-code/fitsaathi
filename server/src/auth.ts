import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";
import { prisma } from "./db";

export type SessionUser = { id: string; email: string; role: string };
export type AuthRequest = Request & { user?: SessionUser; requestId?: string };
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
export const accessToken = (user: SessionUser) => jwt.sign(user, config.jwtSecret, { expiresIn: "15m" });
export const refreshToken = (user: SessionUser) => jwt.sign(user, config.refreshSecret, { expiresIn: "30d", jwtid: crypto.randomUUID() });

export async function authenticate(request: AuthRequest, response: Response, next: NextFunction) {
  const bearer = request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7) : "";
  const token = bearer || parseCookies(request.headers.cookie || "").fitsaathi_access || "";
  try {
    const claims = jwt.verify(token, config.jwtSecret) as SessionUser;
    const user = await prisma.user.findUnique({ where: { id: claims.id }, select: { id: true, email: true, role: true, accountStatus: true, emailVerified: true } });
    if (!user || user.accountStatus !== "active") throw new Error("Inactive database user");
    request.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch { response.status(401).json({ error: "Authentication required." }); }
}

function parseCookies(header: string) {
  return Object.fromEntries(header.split(";").map(value => value.trim()).filter(Boolean).map(value => {
    const separator = value.indexOf("=");
    return separator < 0 ? [value, ""] : [value.slice(0, separator), decodeURIComponent(value.slice(separator + 1))];
  }));
}

export function allowRoles(...roles: string[]) {
  return (request: AuthRequest, response: Response, next: NextFunction) => roles.includes(request.user?.role || "") ? next() : response.status(403).json({ error: "Insufficient permission." });
}
