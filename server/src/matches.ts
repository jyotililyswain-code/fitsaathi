import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthRequest } from "./auth";
import { prisma } from "./db";

export const matchesRouter = Router();

const asyncRoute = (handler: (request: any, response: any) => Promise<unknown>) => (request: any, response: any, next: any) => Promise.resolve(handler(request, response)).catch(next);

matchesRouter.use(authenticate);

matchesRouter.get("/interests", asyncRoute(async (request: AuthRequest, response) => {
  const interest = z.string().trim().min(2).max(50).parse(request.query.interest);
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: request.user!.id },
    include: {
      interests: true,
      profilePhotos: { orderBy: { sortOrder: "asc" } },
      socialVerification: true
    }
  });

  const currentAge = ageFromDate(currentUser.birthDate);
  if (!isProfileCompleteForMatching(currentUser) || currentAge == null) {
    return response.status(409).json({
      error: "Complete your profile verification before using Interest Match Search.",
      code: "PROFILE_INCOMPLETE",
      redirectTo: "/complete-profile"
    });
  }

  if (!["male", "female"].includes(String(currentUser.gender))) {
    return response.status(422).json({ error: "Interest Match Search currently supports male/female opposite-gender matching.", code: "UNSUPPORTED_GENDER" });
  }

  const oppositeGender = currentUser.gender === "male" ? "female" : "male";
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      accountStatus: "active",
      gender: oppositeGender,
      interests: { some: { interest: { equals: interest, mode: "insensitive" } } },
      socialVerification: { status: "approved" },
      blocksReceived: { none: { blockerId: currentUser.id } },
      blocksMade: { none: { blockedId: currentUser.id } }
    },
    include: {
      interests: { orderBy: { interest: "asc" } },
      profilePhotos: { where: { moderationStatus: { not: "blocked" } }, orderBy: { sortOrder: "asc" } },
      socialVerification: true
    },
    orderBy: { lastSeenAt: "desc" },
    take: 100
  });

  const minAge = currentAge - 2;
  const items = candidates
    .map((user) => ({ user, age: ageFromDate(user.birthDate) }))
    .filter(({ user, age }) => age != null && age >= minAge && age <= currentAge && isProfileCompleteForMatching(user))
    .slice(0, 30)
    .map(({ user, age }) => ({
      id: user.id,
      name: user.name,
      age,
      gender: user.gender,
      interests: user.interests.map((item) => item.interest),
      city: user.city,
      photos: user.profilePhotos.map((photo) => photo.path),
      shortBio: user.profileBio ? user.profileBio.slice(0, 180) : ""
    }));

  response.set("Cache-Control", "no-store").json({ interest, items });
}));

function isProfileCompleteForMatching(user: any) {
  return Boolean(
    user.gender &&
    user.birthDate &&
    user.interests?.length &&
    user.socialVerification?.governmentIdEncrypted &&
    user.socialVerification?.ageProofEncrypted &&
    user.socialVerification?.status === "approved" &&
    user.profilePhotos?.length >= 4
  );
}

function ageFromDate(value?: Date | string | null) {
  if (!value) return null;
  const birth = new Date(value);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
