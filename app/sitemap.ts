import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

const publicRoutes = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/home", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/find-coach", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/dojos", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/booking", changeFrequency: "monthly" as const, priority: 0.8 },
  {
    path: "/become-a-coach",
    changeFrequency: "monthly" as const,
    priority: 0.8,
  },
  {
    path: "/register-seller",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  { path: "/shop", changeFrequency: "daily" as const, priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const staticItems: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [coaches, dojos] = await Promise.all([
      prisma.coach.findMany({
        where: { verified: true, status: "approved" },
        select: { id: true, updatedAt: true },
      }),
      prisma.dojo.findMany({
        where: { approved: true, status: "approved" },
        select: { id: true, updatedAt: true },
      }),
    ]);
    return [
      ...staticItems,
      ...coaches.map((coach) => ({
        url: absoluteUrl(`/coaches/${coach.id}`),
        lastModified: coach.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...dojos.map((dojo) => ({
        url: absoluteUrl(`/dojos/${dojo.id}`),
        lastModified: dojo.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticItems;
  }
}
