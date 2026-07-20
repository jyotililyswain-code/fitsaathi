import { notFound } from "next/navigation";
import DojoProfileClient from "@/components/DojoProfileClient";
import { resolveDojoImageUrl } from "@/lib/dojo-image";
import { getPublicDojo } from "@/lib/public-content";
import type { Dojo } from "@/lib/types";

export default async function DojoProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dojo = await getPublicDojo(id).catch(() => null);
  if (!dojo) notFound();

  const initialDojo: Dojo = {
    id,
    name: dojo.name,
    category: dojo.category,
    address: dojo.address || undefined,
    city: dojo.city || undefined,
    state: dojo.state || undefined,
    pincode: dojo.pincode || undefined,
    description: dojo.description || undefined,
    imageUrl: dojo.imagePath
      ? resolveDojoImageUrl(dojo.imagePath, id)
      : undefined,
    imageFit: dojo.imageFit === "cover" ? "cover" : "contain",
    imagePosition:
      dojo.imagePosition === "top" || dojo.imagePosition === "bottom"
        ? dojo.imagePosition
        : "center",
    rating: dojo.rating,
    approved: true,
    verified: dojo.verified,
    approvalStatus: "active",
  };

  return <DojoProfileClient id={id} initialDojo={initialDojo} />;
}
