import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { resolveDojoImageUrl } from "@/lib/dojo-image";
import {
  generateSeoMetadata,
  sportsActivityLocationJsonLd,
} from "@/lib/seo";

export const revalidate = 0;

const getPublicDojo = cache((id: string) =>
  prisma.dojo.findFirst({
    where: {
      id,
      approved: true,
      status: "active",
      owner: { emailVerified: true, accountStatus: "active" },
    },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      establishmentType: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      imagePath: true,
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
    const dojo = await getPublicDojo(id);
    if (!dojo) {
      return generateSeoMetadata({
        title: "Dojo Profile - FitSaathi",
        description: "This dojo profile is not available for search indexing.",
        path: `/dojos/${id}`,
        noIndex: true,
      });
    }
    return generateSeoMetadata({
      title: `${dojo.name} - Dojo / Academy on FitSaathi`,
      description: `View ${dojo.name}'s ${dojo.category} training details${dojo.city ? ` in ${dojo.city}` : ""} and booking options on FitSaathi.`,
      path: `/dojos/${id}`,
      image: dojo.imagePath ? resolveDojoImageUrl(dojo.imagePath, id) : undefined,
      keywords: [
        dojo.name,
        dojo.category,
        dojo.city ? `dojo in ${dojo.city}` : "dojo in India",
        "martial arts academy",
      ],
    });
  } catch {
    return generateSeoMetadata({
      title: "Dojo Profile - FitSaathi",
      description: "View dojo and academy training details on FitSaathi.",
      path: `/dojos/${id}`,
      noIndex: true,
    });
  }
}

export default async function DojoProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dojo = await getPublicDojo(id).catch(() => null);
  const hasAccurateLocation = Boolean(
    dojo && (dojo.address || dojo.city || dojo.state || dojo.pincode),
  );

  if (!dojo || !hasAccurateLocation) return children;

  return (
    <>
      <JsonLd
        data={sportsActivityLocationJsonLd({
          id: dojo.id,
          name: dojo.name,
          category: dojo.category,
          description: dojo.description,
          image: dojo.imagePath
            ? resolveDojoImageUrl(dojo.imagePath, dojo.id)
            : null,
          address: dojo.address,
          city: dojo.city,
          state: dojo.state,
          pincode: dojo.pincode,
        })}
      />
      {children}
    </>
  );
}
