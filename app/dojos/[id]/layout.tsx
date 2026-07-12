import type { Metadata } from "next";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { generateSeoMetadata } from "@/lib/seo";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const dojo = await prisma.dojo.findUnique({
      where: { id },
      select: {
        name: true,
        category: true,
        city: true,
        imagePath: true,
        approved: true,
        status: true,
      },
    });
    if (!dojo || !dojo.approved || dojo.status !== "active") {
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
      image: dojo.imagePath ? `/api/dojos/${id}/business-photo` : undefined,
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

export default function DojoProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
