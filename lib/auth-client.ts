"use client";

import { useCallback, useEffect, useState } from "react";
import { localApi, notifyAuthChanged, onLocalSessionChange, type LocalUser } from "@/lib/local-api";

export function useSessionUser() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [checking, setChecking] = useState(true);

  const sync = useCallback(async () => {
    try { setUser(await localApi<LocalUser>("/auth/me", {}, false)); }
    catch { setUser(null); }
    finally { setChecking(false); }
  }, []);

  useEffect(() => {
    void sync();
    return onLocalSessionChange(() => { setChecking(true); void sync(); });
  }, [sync]);

  return { user, checking, reload: sync };
}

export async function logoutSession() {
  try { await localApi("/auth/logout", { method: "POST" }, false); }
  finally { notifyAuthChanged(); }
}
