import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { policies } from "@/lib/policies";

const publicRoutes = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/find-coach", changeFrequency: "daily" as const, priority: 0.95 },
  { path: "/coaches", changeFrequency: "daily" as const, priority: 0.85 },
  { path: "/dojos", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/shop", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/products", changeFrequency: "daily" as const, priority: 0.75 },
  { path: "/seller", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/become-a-coach", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/register-dojo", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/register-seller", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/live-data", changeFrequency: "daily" as const, priority: 0.6 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/fitsaathi-owner", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/policies", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  ...policies
    .filter((policy) => !["privacy", "terms"].includes(policy.slug))
    .map((policy) => ({
      path: `/policies/${policy.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticItems: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [coaches, dojos, products, sellers] = await Promise.all([
      prisma.coach.findMany({
        where: {
          verified: true,
          status: "approved",
          owner: { accountStatus: "active" },
        },
        select: { id: true, updatedAt: true },
      }),
      prisma.dojo.findMany({
        where: {
          approved: true,
          status: "active",
          owner: { accountStatus: "active" },
        },
        select: { id: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: {
          status: "approved",
          seller: {
            status: { in: ["verified", "trusted"] },
            owner: { accountStatus: "active" },
          },
        },
        select: { id: true, updatedAt: true },
      }),
      prisma.seller.findMany({
        where: {
          status: { in: ["verified", "trusted"] },
          owner: { accountStatus: "active" },
        },
        select: { id: true, updatedAt: true },
      }),
    ]);
    return [
      ...staticItems,
      ...coaches.map((coach) => ({
        url: absoluteUrl(`/coaches/${encodeURIComponent(coach.id)}`),
        lastModified: coach.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...dojos.map((dojo) => ({
        url: absoluteUrl(`/dojos/${encodeURIComponent(dojo.id)}`),
        lastModified: dojo.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((product) => ({
        url: absoluteUrl(`/products/${encodeURIComponent(product.id)}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...sellers.map((seller) => ({
        url: absoluteUrl(`/sellers/${encodeURIComponent(seller.id)}`),
        lastModified: seller.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.55,
      })),
    ];
  } catch {
    return staticItems;
  }
}
