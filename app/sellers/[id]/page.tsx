import { notFound } from "next/navigation";
import SellerProfileClient from "@/components/SellerProfileClient";
import type { Seller } from "@/lib/marketplace";
import { getPublicSeller } from "@/lib/public-content";

function publicAsset(path: string) {
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `/${path}`;
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getPublicSeller(id).catch(() => null);
  if (!seller) notFound();

  const initialSeller: Seller = {
    id,
    ownerId: "",
    fullName: "",
    storeName: seller.storeName,
    address: seller.address,
    profileImage: seller.profilePath
      ? publicAsset(seller.profilePath)
      : undefined,
    status: seller.status === "trusted" ? "trusted" : "verified",
    verified: seller.verified,
    trusted: seller.trusted,
    rating: seller.rating,
    salesCount: seller.salesCount,
  };

  return <SellerProfileClient id={id} initialSeller={initialSeller} />;
}
