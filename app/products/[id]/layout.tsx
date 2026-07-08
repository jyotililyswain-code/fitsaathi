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
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        category: true,
        brand: true,
        status: true,
        images: {
          select: { path: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
    });
    if (!product || product.status !== "approved")
      return generateSeoMetadata({
        title: "Fitness Product - FitSaathi",
        path: `/products/${id}`,
        noIndex: true,
      });
    return generateSeoMetadata({
      title: `${product.title} - FitSaathi Fitness Shop`,
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
    return generateSeoMetadata({
      title: "Fitness Product - FitSaathi",
      path: `/products/${id}`,
      noIndex: true,
    });
  }
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children;
}
