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
    const seller = await prisma.seller.findFirst({
      where: {
        id,
        status: { in: ["verified", "trusted"] },
        owner: { emailVerified: true, accountStatus: "active" },
      },
      select: { storeName: true, bio: true, profilePath: true },
    });
    if (!seller)
      return generateSeoMetadata({
        title: "Fitness Seller - FitSaathi",
        path: `/sellers/${id}`,
        noIndex: true,
      });
    return generateSeoMetadata({
      title: `${seller.storeName} - Fitness Seller on FitSaathi`,
      description:
        seller.bio ||
        `Browse approved fitness products from ${seller.storeName} on FitSaathi.`,
      path: `/sellers/${id}`,
      image: seller.profilePath || undefined,
    });
  } catch {
    return generateSeoMetadata({
      title: "Fitness Seller - FitSaathi",
      path: `/sellers/${id}`,
      noIndex: true,
    });
  }
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  return children;
}
