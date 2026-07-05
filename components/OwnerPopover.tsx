"use client";

import { Crown, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function OwnerPopover() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="owner-popover"
        className="inline-flex items-center gap-1.5 rounded-full border border-acid/30 bg-acid/[0.08] px-3 py-2 text-xs font-semibold text-acid shadow-[0_0_20px_rgba(0,255,136,0.08)] transition duration-200 hover:border-acid/60 hover:bg-acid/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:px-4 sm:text-sm"
      >
        <Crown className="h-3.5 w-3.5" aria-hidden="true" />
        Owner
      </button>

      <div
        id="owner-popover"
        role="dialog"
        aria-modal="false"
        aria-labelledby="owner-popover-title"
        aria-hidden={!open}
        className={`absolute right-0 top-full z-[60] mt-3 w-[min(18rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition duration-200 ease-out ${open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none"}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-acid/20 bg-acid/10 text-acid">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p id="owner-popover-title" className="text-xs font-semibold uppercase tracking-[0.18em] text-acid">Owner</p>
            <p className="mt-1 truncate text-base font-semibold text-white">priyanshuswain</p>
            <p className="mt-1 text-xs text-zinc-500">FitSaathi</p>
          </div>
        </div>
        <Link href="/admin/social" onClick={() => setOpen(false)} className="mt-4 block rounded-xl border border-acid/30 bg-acid/10 px-4 py-3 text-center text-sm font-semibold text-acid">
          Open owner dashboard
        </Link>
      </div>
    </div>
  );
}
