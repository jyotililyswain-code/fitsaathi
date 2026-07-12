"use client";

import { useEffect, useRef, useState } from "react";
import { getBookings, getCoach, getCoaches, getCollectionCount, getDojo, getDojos, getFeaturedCoaches, getFeaturedDojos, getMyDojoStatus, getPlatformStats, getProduct, getProducts, getProviderBookings, getReviews, getSellers, getUserBookings } from "@/lib/data";
import type { Product, Seller } from "@/lib/marketplace";
import type { Booking, Coach, Dojo, PlatformStats, Review } from "@/lib/types";

type AsyncState<T> = { data: T; loading: boolean; error: string | null; reload: () => void };

function useAsync<T>(factory: () => Promise<T>, fallback: T, dependency?: unknown): AsyncState<T> {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<Omit<AsyncState<T>, "reload">>({ data: fallback, loading: true, error: null });
  const factoryRef = useRef(factory); const fallbackRef = useRef(fallback); factoryRef.current = factory; fallbackRef.current = fallback;
  useEffect(() => { let mounted = true; setState({ data: fallbackRef.current, loading: true, error: null }); factoryRef.current().then(data => mounted && setState({ data, loading: false, error: null })).catch((error: unknown) => mounted && setState({ data: fallbackRef.current, loading: false, error: error instanceof Error ? error.message : "Unable to load data" })); return () => { mounted = false; }; }, [dependency, reloadKey]);
  return { ...state, reload: () => setReloadKey((value) => value + 1) };
}

const zeroStats: PlatformStats = { coaches: 0, dojos: 0, sellers: 0, bookings: 0, users: 0 };
export function usePlatformStats() { return useAsync<PlatformStats>(getPlatformStats, zeroStats); }
export function useCoaches(featured = false) { return useAsync<Coach[]>(featured ? getFeaturedCoaches : getCoaches, [], featured); }
export function useCoach(id: string) { return useAsync<Coach | null>(() => getCoach(id), null, id); }
export function useDojos(featured = false, filters: { search?: string; category?: string; city?: string } = {}) {
  const dependency = `${featured}:${filters.search || ""}:${filters.category || ""}:${filters.city || ""}`;
  return useAsync<Dojo[]>(featured ? getFeaturedDojos : () => getDojos(filters), [], dependency);
}
export function useDojo(id: string) { return useAsync<Dojo | null>(() => getDojo(id), null, id); }
export function useMyDojoStatus(ownerId: string | null) { return useAsync(ownerId ? getMyDojoStatus : async () => null, null, ownerId); }
export function useBookings() { return useAsync<Booking[]>(getBookings, []); }
export function useUserBookings(userId: string | null) { return useAsync<Booking[]>(userId ? () => getUserBookings(userId) : async () => [], [], userId); }
export function useProviderBookings(ownerId: string | null) { return useAsync<Booking[]>(ownerId ? () => getProviderBookings(ownerId) : async () => [], [], ownerId); }
export function useReviews() { return useAsync<Review[]>(getReviews, []); }
export function useCollectionCount(name: string) { return useAsync<number>(() => getCollectionCount(name), 0, name); }
export function useProducts() { return useAsync<Product[]>(getProducts, []); }
export function useProduct(id: string) { return useAsync<Product | null>(() => getProduct(id), null, id); }
export function useSellers() { return useAsync<Seller[]>(getSellers, []); }
