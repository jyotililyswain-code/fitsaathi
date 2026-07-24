import type { Prisma, ProviderStatus } from "@prisma/client";
import { resolveDojoImageUrl } from "@/lib/dojo-image";

export const PUBLIC_DOJO_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  experience: true,
  originalPrice: true,
  finalPrice: true,
  rating: true,
  imagePath: true,
  imageFit: true,
  imagePosition: true,
  status: true,
  approved: true,
  verified: true
} satisfies Prisma.DojoSelect;

// Keep the priority in the database query so every page of a filtered or
// paginated result set has verified listings first. The id tie-breaker makes
// rows with the same verification and creation timestamp deterministic.
export const PUBLIC_DOJO_ORDER_BY = [
  { verified: "desc" },
  { createdAt: "desc" },
  { id: "asc" },
] satisfies Prisma.DojoOrderByWithRelationInput[];

export type PublicDojoRecord = Prisma.DojoGetPayload<{ select: typeof PUBLIC_DOJO_SELECT }>;
export type DojoSearchFilters = { search?: string; category?: string; city?: string };

export function publicDojoWhere(filters: DojoSearchFilters = {}): Prisma.DojoWhereInput {
  const search = filters.search?.trim();
  const normalizedSearch = search?.toLowerCase();
  const category = filters.category?.trim();
  const city = filters.city?.trim();
  const establishmentMatches: Prisma.DojoWhereInput[] = [];
  if (normalizedSearch && /\b(gym|gyms)\b/.test(normalizedSearch)) establishmentMatches.push({ establishmentType: "GYM" });
  if (normalizedSearch?.includes("fitness studio")) establishmentMatches.push({ establishmentType: "FITNESS_STUDIO" });
  if (normalizedSearch?.includes("yoga studio")) establishmentMatches.push({ establishmentType: "YOGA_STUDIO" });
  if (normalizedSearch && /\b(dojo|dojos)\b/.test(normalizedSearch)) establishmentMatches.push({ establishmentType: "DOJO" });
  return {
    status: "active",
    approved: true,
    owner: { accountStatus: "active" },
    ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(search ? { OR: [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { customEstablishmentType: { contains: search, mode: "insensitive" } },
      ...establishmentMatches
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
    state: record.state,
    pincode: record.pincode,
    experience: record.experience,
    originalPrice: record.originalPrice,
    finalPrice: record.finalPrice,
    rating: record.rating,
    imagePath: record.imagePath ? resolveDojoImageUrl(record.imagePath, record.id) : undefined,
    imageFit: record.imageFit,
    imagePosition: record.imagePosition,
    status: record.status,
    approved: record.approved,
    verified: record.verified
  };
}

export function dojoModerationData(status: ProviderStatus) {
  return { status, approved: status === "active", approvedAt: status === "active" ? new Date() : null } as const;
}

export function automaticDojoActivation(approvedAt = new Date()) {
  return { status: "active" as const, approved: true, approvedAt, verified: false };
}

export function canManageDojo(user: { id: string; role: string }, ownerId: string) {
  return user.id === ownerId || ["admin", "super_admin", "moderator", "support_admin"].includes(user.role);
}
