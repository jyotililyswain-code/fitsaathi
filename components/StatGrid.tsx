import type { PlatformStats } from "@/lib/types";

const labels: Array<[keyof PlatformStats, string]> = [
  ["coaches", "Registered coaches"],
  ["dojos", "Registered dojos"],
  ["sellers", "Registered sellers"],
  ["bookings", "Bookings tracked"],
  ["users", "Users registered"]
];

export function StatGrid({ stats }: { stats: PlatformStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {labels.map(([key, label]) => (
        <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-3xl font-semibold text-white">{stats[key]}</p>
          <p className="mt-1 text-sm text-zinc-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
