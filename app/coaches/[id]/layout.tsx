import type { Metadata } from "next";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const coach = await prisma.coach.findUnique({
      where: { id },
      select: {
        name: true,
        category: true,
        city: true,
        bio: true,
        photoPath: true,
        verified: true,
        status: true,
      },
    });
    if (!coach || !coach.verified || coach.status !== "approved") {
      return generateSeoMetadata({
        title: "Coach Profile - FitSaathi",
        description: "This coach profile is not available for search indexing.",
        path: `/coaches/${id}`,
        noIndex: true,
      });
    }
    return generateSeoMetadata({
      title: `${coach.name} - Fitness Coach on FitSaathi`,
      description: `View ${coach.name}'s ${coach.category} coaching profile${coach.city ? ` in ${coach.city}` : ""}, training details, and booking options on FitSaathi.`,
      path: `/coaches/${id}`,
      image: coach.photoPath ? `/api/coaches/${id}/photo` : undefined,
      keywords: [
        coach.name,
        `${coach.category} coach`,
        coach.city
          ? `fitness coach in ${coach.city}`
          : "fitness coach in India",
        "book fitness coach",
      ],
    });
  } catch {
    return generateSeoMetadata({
      title: "Coach Profile - FitSaathi",
      description:
        "View fitness coach details and booking options on FitSaathi.",
      path: `/coaches/${id}`,
      noIndex: true,
    });
  }
}

export default function CoachProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
