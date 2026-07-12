import type { Prisma, ProviderStatus } from "@prisma/client";

export const PUBLIC_DOJO_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  address: true,
  city: true,
  experience: true,
  originalPrice: true,
  finalPrice: true,
  rating: true,
  imagePath: true,
  status: true,
  approved: true
} satisfies Prisma.DojoSelect;

export type PublicDojoRecord = Prisma.DojoGetPayload<{ select: typeof PUBLIC_DOJO_SELECT }>;
export type DojoSearchFilters = { search?: string; category?: string; city?: string };

export function publicDojoWhere(filters: DojoSearchFilters = {}): Prisma.DojoWhereInput {
  const search = filters.search?.trim();
  const category = filters.category?.trim();
  const city = filters.city?.trim();
  return {
    status: "approved",
    approved: true,
    ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(search ? { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } }
    ] } : {})
  };
}

export function publicDojo(record: PublicDojoRecord) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    category: record.category,
    address: record.address,
    city: record.city,
    experience: record.experience,
    originalPrice: record.originalPrice,
    finalPrice: record.finalPrice,
    rating: record.rating,
    imagePath: record.imagePath ? `/api/dojos/${record.id}/business-photo` : undefined,
    status: record.status,
    approved: record.approved,
    verified: record.status === "approved" && record.approved
  };
}

export function dojoModerationData(status: ProviderStatus) {
  return { status, approved: status === "approved" } as const;
}
