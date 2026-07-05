"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionUser } from "@/lib/auth-client";
import { mapProduct } from "@/lib/data";
import { localApi } from "@/lib/local-api";
import type { CartItem, Product } from "@/lib/marketplace";

export function useCart() {
  const { user, checking } = useSessionUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(checking); return; }
    setLoading(true); setError(null);
    try { const rows = await localApi<any[]>("/cart"); setItems(rows.map((row) => ({ productId: row.productId, quantity: row.quantity, product: mapProduct(row.product) }))); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load your cart."); }
    finally { setLoading(false); }
  }, [checking, user]);
  useEffect(() => { void load(); }, [load]);
  const run = useCallback(async (operation: () => Promise<unknown>) => { setError(null); try { await operation(); await load(); } catch (operationError) { setError(operationError instanceof Error ? operationError.message : "Cart update failed."); throw operationError; } }, [load]);
  const add = useCallback((product: Product, quantity = 1) => user ? run(() => localApi("/cart", { method: "POST", body: JSON.stringify({ productId: product.id, quantity }) })) : Promise.reject(new Error("Please sign in to add products to your cart.")), [run, user]);
  const update = useCallback((productId: string, quantity: number) => run(() => localApi(`/cart/${productId}`, { method: "PATCH", body: JSON.stringify({ quantity: Math.max(1, quantity) }) })), [run]);
  const remove = useCallback((productId: string) => run(() => localApi(`/cart/${productId}`, { method: "DELETE" })), [run]);
  const clear = useCallback(async () => { await run(() => localApi("/cart", { method: "DELETE" })); setItems([]); }, [run]);
  return { items, loading, error, add, update, remove, clear, reload: load };
}
