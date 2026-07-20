import { notFound } from "next/navigation";
import ProductProfileClient from "@/components/ProductProfileClient";
import type { Product } from "@/lib/marketplace";
import { getPublicProduct } from "@/lib/public-content";

function publicAsset(path: string) {
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `/${path}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getPublicProduct(id).catch(() => null);
  if (!product) notFound();

  const initialProduct: Product = {
    id,
    sellerId: product.sellerId,
    sellerOwnerId: "",
    sellerName: product.seller.storeName,
    sellerStatus: product.seller.trusted
      ? "trusted"
      : product.seller.verified
        ? "verified"
        : "pending",
    title: product.title,
    description: product.description,
    category: product.category,
    brand: product.brand,
    imageUrls: product.images.map((image) => publicAsset(image.path)),
    customerPrice: product.customerPrice,
    stock: product.stock,
    weight: product.weight || undefined,
    deliveryTime: product.deliveryTime || undefined,
    specifications: product.specifications || undefined,
    returnPolicy: product.returnPolicy || undefined,
    rating: product.rating,
    salesCount: product.salesCount,
    status: "approved",
    bestseller: product.bestseller,
    createdAt: product.createdAt.toISOString(),
  };

  return <ProductProfileClient id={id} initialProduct={initialProduct} />;
}
