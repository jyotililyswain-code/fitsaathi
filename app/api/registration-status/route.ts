import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiAuthError, requireApiUser } from "@/lib/server-auth";
import { dashboardPathForRole } from "@/lib/roles";

const registrationTypes = ["coach", "dojo", "seller"] as const;
type RegistrationType = (typeof registrationTypes)[number];

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");
    if (!registrationTypes.includes(type as RegistrationType)) {
      return json(
        { error: "Choose a valid registration type." },
        { status: 400 },
      );
    }

    const user = await requireApiUser(request);
    const registrationType = type as RegistrationType;
    const existing =
      registrationType === "coach"
        ? await prisma.coach.findUnique({
            where: { ownerId: user.id },
            select: { id: true, status: true },
          })
        : registrationType === "dojo"
          ? await prisma.dojo.findUnique({
              where: { ownerId: user.id },
              select: { id: true, status: true },
            })
          : await prisma.seller.findUnique({
              where: { ownerId: user.id },
              select: { id: true, status: true },
            });

    if (existing) {
      const label =
        registrationType === "coach"
          ? "coach"
          : registrationType === "dojo"
            ? "dojo or gym"
            : "seller";
      return json({
        exists: true,
        canRegister: false,
        status: existing.status,
        message: `You have already submitted a ${label} registration.`,
        manageHref:
          registrationType === "dojo"
            ? `/owner/dojos/${existing.id}/edit`
            : registrationType === "coach"
              ? "/coach-dashboard"
              : "/seller-dashboard",
        manageLabel:
          registrationType === "dojo"
            ? "Open or edit registration"
            : `Open ${registrationType} dashboard`,
      });
    }

    const canRegister =
      user.role === "customer" || user.role === registrationType;
    return json({
      exists: false,
      canRegister,
      message: canRegister
        ? undefined
        : "Your current account role cannot create this additional provider registration.",
      manageHref: dashboardPathForRole(user.role),
      manageLabel: "Open my dashboard",
    });
  } catch (error) {
    const status = error instanceof ApiAuthError ? error.status : 500;
    if (status >= 500) console.error("registration_status.load_failed", error);
    return json(
      {
        error:
          status >= 500
            ? "Registration access could not be checked right now."
            : error instanceof Error
              ? error.message
              : "Registration access could not be checked.",
      },
      { status },
    );
  }
}

function json(body: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(body, init);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  return response;
}
