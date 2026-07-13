import { API_URL, localApi } from "@/lib/local-api";
import { rankProducts, type Product, type Seller } from "@/lib/marketplace";
import { DEFAULT_PLATFORM_FEE } from "@/lib/pricing";
import type { Booking, Coach, Dojo, PlatformStats, Review } from "@/lib/types";

const apiOrigin = API_URL.startsWith("http") ? API_URL.replace(/\/api$/, "") : "";
const asset = (value?: string | null) => value ? value.startsWith("http") || value.startsWith("data:") ? value : `${apiOrigin}${value}` : undefined;

export async function getCollectionCount(name: string) {
  const summary = await localApi<Record<string, number>>("/dashboard/summary");
  const aliases: Record<string, string> = { favorites: "favorites", reviews: "reviews", attendance: "attendance", notifications: "notifications", students: "students", memberships: "memberships" };
  return summary[aliases[name] || name] || 0;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const stats = await localApi<PlatformStats>("/stats");
  return { coaches: stats.coaches, dojos: stats.dojos, sellers: stats.sellers, bookings: stats.bookings, users: stats.users };
}

export async function getPlatformFee() { return DEFAULT_PLATFORM_FEE; }

function mapCoach(item: any): Coach {
  return { ...item, price: item.baseFee, originalPrice: item.baseFee, base_fee: item.baseFee, customer_price: item.customerPrice, coach_payout: item.coachPayout, totalPrice: item.customerPrice, finalPrice: item.customerPrice, photoUrl: asset(item.photoPath) };
}

function mapDojo(item: any): Dojo {
  return { ...item, price: item.originalPrice, imageUrl: asset(item.imagePath), approvalStatus: item.status };
}

export async function getCoaches(max = 24) { return (await localApi<any[]>(`/coaches?limit=${max}`)).map(mapCoach); }
export async function getFeaturedCoaches(max = 6) { return (await localApi<any[]>(`/coaches?featured=true&limit=${max}`)).map(mapCoach); }
export async function getCoach(id: string) { return mapCoach(await localApi<any>(`/coaches/${id}`)); }
export async function getDojos(filters: { search?: string; category?: string; city?: string; limit?: number } = {}) {
  const query = new URLSearchParams({ limit: String(filters.limit || 48) });
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.category?.trim()) query.set("category", filters.category.trim());
  if (filters.city?.trim()) query.set("city", filters.city.trim());
  return (await localApi<any[]>(`/dojos?${query}`)).map(mapDojo);
}
export async function getFeaturedDojos(max = 6) { return (await localApi<any[]>(`/dojos?featured=true&limit=${max}`)).map(mapDojo); }
export async function getDojo(id: string) { return mapDojo(await localApi<any>(`/dojos/${id}`)); }
export async function getMyDojoStatus() { return localApi<{ id: string; name: string; status: "pending" | "approved" | "active" | "inactive" | "rejected" | "suspended"; approved: boolean; verified: boolean }>("/dojos/me"); }
export async function getBookings(_max = 50): Promise<Booking[]> { return localApi<Booking[]>("/bookings"); }
export async function getUserBookings(_userId: string, _max = 50) { return getBookings(_max); }
export async function getProviderBookings(_ownerId: string, _max = 50) { return getBookings(_max); }
export async function getReviews(_max = 50): Promise<Review[]> { return localApi<Review[]>("/reviews"); }

type LocalProduct = Product & { images?: Array<{ path: string }>; seller?: { id: string; ownerId?: string; storeName: string; trusted: boolean; verified: boolean } };
export function mapProduct(item: LocalProduct): Product {
  return { ...item, sellerOwnerId: item.sellerOwnerId || item.seller?.ownerId || "", sellerName: item.seller?.storeName, sellerStatus: item.seller?.trusted ? "trusted" : item.seller?.verified ? "verified" : "pending", imageUrls: item.images?.map(image => asset(image.path)!).filter(Boolean) || item.imageUrls || [], createdAt: item.createdAt ? String(item.createdAt) : undefined };
}

export async function getProducts(max = 48) { return rankProducts((await localApi<{ items: LocalProduct[] }>(`/products?limit=${max}`)).items.map(mapProduct)); }
export async function getProduct(id: string) { return mapProduct(await localApi<LocalProduct>(`/products/${id}`)); }
export async function getSellers(_max = 30): Promise<Seller[]> {
  return (await localApi<any[]>("/sellers")).map(item => ({ id: item.id, ownerId: item.ownerId, fullName: item.owner?.name || "", storeName: item.storeName, email: item.owner?.email, phoneNumber: item.phone, address: item.address, status: item.status, verified: item.verified, trusted: item.trusted, rating: item.rating, salesCount: item.salesCount, profileImage: asset(item.profilePath) }));
}
export async function getSeller(id: string): Promise<Seller | null> {
  const item = await localApi<any>(`/sellers/${id}`);
  return { id: item.id, ownerId: item.ownerId, fullName: item.owner?.name || "", storeName: item.storeName, email: item.owner?.email, phoneNumber: item.phone, address: item.address, status: item.status, verified: item.verified, trusted: item.trusted, rating: item.rating, salesCount: item.salesCount, profileImage: asset(item.profilePath) };
}
