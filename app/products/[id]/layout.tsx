import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

const getPublicProduct = cache((id: string) =>
  prisma.product.findFirst({
    where: {
      id,
      status: "approved",
      seller: {
        status: { in: ["verified", "trusted"] },
        owner: { emailVerified: true, accountStatus: "active" },
      },
    },
    select: {
      title: true,
      description: true,
      category: true,
      brand: true,
      images: {
        select: { path: true },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
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
    const product = await getPublicProduct(id);
    if (!product) notFound();
    return generateSeoMetadata({
      title: `${product.title} – Fitness Product`,
      description: product.description.slice(0, 155),
      path: `/products/${id}`,
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
        { name: product.title, path: `/products/${id}` },
      ])} />
      {children}
    </>
  );
}
