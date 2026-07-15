import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

const getPublicCoach = cache((id: string) =>
  prisma.coach.findFirst({
    where: {
      id,
      verified: true,
      status: "approved",
      owner: { accountStatus: "active" },
    },
    select: {
      name: true,
      category: true,
      city: true,
      bio: true,
      photoPath: true,
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const coach = await getPublicCoach(id);
    if (!coach) notFound();
    return generateSeoMetadata({
      title: `${coach.name} – Fitness Coach Profile`,
      description: `View ${coach.name}'s ${coach.category} coaching profile${coach.city ? ` in ${coach.city}` : ""}, training details, and booking options on TheFitSaathi.`,
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
    notFound();
  }
}

export default async function CoachProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let coach;
  try {
    coach = await getPublicCoach(id);
  } catch {
    notFound();
  }
  if (!coach) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Fitness Coaches", path: "/coaches" },
          { name: coach.name, path: `/coaches/${id}` },
        ])}
      />
      {children}
    </>
  );
}
