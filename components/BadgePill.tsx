import { Award, CheckCircle2, Crown } from "lucide-react";
import { badgeLabel } from "@/lib/format";
import type { Badge } from "@/lib/types";

export function BadgePill({ badge }: { badge?: Badge }) {
  const label = badgeLabel(badge);
  const styles =
    badge === "legendary"
      ? "border-legendary/40 bg-legendary/10 text-legendary"
      : badge === "elite"
        ? "border-royal/40 bg-royal/10 text-royal"
        : badge === "verified"
          ? "border-verified/40 bg-verified/10 text-verified"
          : "border-white/10 bg-white/5 text-zinc-400";
  const Icon = badge === "legendary" ? Crown : badge === "elite" ? Award : CheckCircle2;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
