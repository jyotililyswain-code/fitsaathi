import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { getPublicSeller } from "@/lib/public-content";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const publicId = encodeURIComponent(id);
  try {
    const seller = await getPublicSeller(id);
    if (!seller) notFound();
    return generateSeoMetadata({
      title: `${seller.storeName} – Fitness Seller`,
      description: `Browse approved fitness and sports products from ${seller.storeName} on FitSaathi.`,
      path: `/sellers/${publicId}`,
      image: seller.profilePath || undefined,
    });
  } catch {
    notFound();
  }
}

export default async function SellerLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicId = encodeURIComponent(id);
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
        { name: seller.storeName, path: `/sellers/${publicId}` },
      ])} />
      {children}
    </>
  );
}
