import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

const getPublicSeller = cache((id: string) =>
  prisma.seller.findFirst({
    where: {
      id,
      status: { in: ["verified", "trusted"] },
      owner: { accountStatus: "active" },
    },
    select: { storeName: true, bio: true, profilePath: true },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const seller = await getPublicSeller(id);
    if (!seller) notFound();
    return generateSeoMetadata({
      title: `${seller.storeName} – Fitness Seller`,
      description:
        seller.bio ||
        `Browse approved fitness products from ${seller.storeName} on TheFitSaathi.`,
      path: `/sellers/${id}`,
      image: seller.profilePath || undefined,
    });
  } catch {
    notFound();
  }
}

export default async function SellerLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  let seller;
  try {
    seller = await getPublicSeller(id);
  } catch {
    notFound();
  }
  if (!seller) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Fitness Shop", path: "/shop" },
        { name: seller.storeName, path: `/sellers/${id}` },
      ])} />
      {children}
    </>
  );
}
