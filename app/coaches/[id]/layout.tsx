import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { getPublicCoach } from "@/lib/public-content";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const publicId = encodeURIComponent(id);
  try {
    const coach = await getPublicCoach(id);
    if (!coach) notFound();
    return generateSeoMetadata({
      title: `${coach.name} – Fitness Coach Profile`,
      description: `View ${coach.name}'s ${coach.category} coaching profile${coach.city ? ` in ${coach.city}` : ""}, training details, and booking options on FitSaathi.`,
      path: `/coaches/${publicId}`,
      image: coach.photoPath ? `/api/coaches/${publicId}/photo` : undefined,
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
  const publicId = encodeURIComponent(id);
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
          { name: coach.name, path: `/coaches/${publicId}` },
        ])}
      />
      {children}
    </>
  );
}
