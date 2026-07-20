import { notFound } from "next/navigation";
import CoachProfileClient from "@/components/CoachProfileClient";
import { getPublicCoach } from "@/lib/public-content";
import type { Badge, Coach } from "@/lib/types";

const badges: Badge[] = ["verified", "elite", "legendary", "none"];

export default async function CoachProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await getPublicCoach(id).catch(() => null);
  if (!coach) notFound();

  const publicId = encodeURIComponent(id);
  const initialCoach: Coach = {
    id,
    name: coach.name,
    category: coach.category,
    city: coach.city || undefined,
    bio: coach.bio || undefined,
    photoUrl: coach.photoPath
      ? `/api/coaches/${publicId}/photo`
      : undefined,
    rating: coach.rating,
    badge: badges.includes(coach.badge as Badge)
      ? (coach.badge as Badge)
      : "none",
    attendancePercent: coach.attendancePercent,
    cancellations: coach.cancellations,
    verified: coach.verified,
    status: "approved",
  };

  return <CoachProfileClient id={id} initialCoach={initialCoach} />;
}
