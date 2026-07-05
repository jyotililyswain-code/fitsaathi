import { getAttendanceRisk } from "@/lib/format";

export function AttendancePill({ percent, cancellations }: { percent?: number; cancellations?: number }) {
  const risk = getAttendanceRisk(percent);
  const styles = {
    green: "border-acid/40 bg-acid/10 text-acid",
    yellow: "border-yellow-300/40 bg-yellow-300/10 text-yellow-200",
    red: "border-red-400/40 bg-red-400/10 text-red-300",
    unknown: "border-white/10 bg-white/5 text-zinc-400"
  }[risk];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {typeof percent === "number" ? `${percent}% attendance` : "Attendance not recorded"}
      {typeof cancellations === "number" ? `, ${cancellations} cancellations` : ""}
    </span>
  );
}
