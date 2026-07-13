import type { NextFunction, Response } from "express";
import {
  ageFromBirthDate,
  MATCH_MAKING_AGE_MESSAGE,
  MATCH_MAKING_MINIMUM_AGE,
} from "../../lib/age-eligibility";
import type { AuthRequest } from "./auth";
import { prisma } from "./db";

export async function requireAdultSocialAccess(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) {
  try {
    // Administrative moderation is not participation in Match Making.
    if (request.path === "/admin" || request.path.startsWith("/admin/")) {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { birthDate: true },
    });
    const age = ageFromBirthDate(user?.birthDate);

    if (age == null || age < MATCH_MAKING_MINIMUM_AGE) {
      response.status(403).json({
        error: MATCH_MAKING_AGE_MESSAGE,
        code: "MATCH_MAKING_AGE_RESTRICTED",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
