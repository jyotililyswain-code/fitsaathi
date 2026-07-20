import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/JsonLd";
import { getPublicProduct } from "@/lib/public-content";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const publicId = encodeURIComponent(id);
  try {
    const product = await getPublicProduct(id);
    if (!product) notFound();
    return generateSeoMetadata({
      title: `${product.title} – Fitness Product`,
      description: `Explore ${product.title}${product.brand ? ` by ${product.brand}` : ""} in ${product.category} through the FitSaathi fitness and sports shop.`,
      path: `/products/${publicId}`,
      image: product.images[0]?.path,
      keywords: [
        product.title,
        product.brand,
        product.category,
        "fitness products India",
      ],
    });
  } catch {
    notFound();
  }
}

export default async function ProductLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publicId = encodeURIComponent(id);
  let product;
  try {
    product = await getPublicProduct(id);
  } catch {
    notFound();
  }
  if (!product) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Fitness Products", path: "/products" },
        { name: product.title, path: `/products/${publicId}` },
      ])} />
      {children}
    </>
  );
}
