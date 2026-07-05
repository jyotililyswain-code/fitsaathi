export const PRODUCT_CUSTOMER_MARKUP = 100;
export const SELLER_INCENTIVE = 50;

export type ProductPricing = {
  sellerPrice: number;
  customerPrice: number;
  sellerPayout: number;
  platformFee: number;
};

export function getProductPricing(value: number): ProductPricing {
  const sellerPrice = Math.max(0, Math.round(Number(value) || 0));
  const customerPrice = sellerPrice + PRODUCT_CUSTOMER_MARKUP;
  const sellerPayout = sellerPrice + SELLER_INCENTIVE;
  return { sellerPrice, customerPrice, sellerPayout, platformFee: customerPrice - sellerPayout };
}

export type SellerStatus = "pending" | "verified" | "rejected" | "trusted";

export type Seller = {
  id: string;
  ownerId: string;
  fullName: string;
  storeName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  profileImage?: string;
  status: SellerStatus;
  verified?: boolean;
  trusted?: boolean;
  rating?: number;
  salesCount?: number;
  lastActiveAt?: string;
};

export type Product = {
  id: string;
  sellerId: string;
  sellerOwnerId: string;
  sellerName?: string;
  sellerStatus?: SellerStatus;
  title: string;
  category: string;
  brand: string;
  description: string;
  imageUrls: string[];
  sellerPrice?: number;
  customerPrice?: number;
  sellerPayout?: number;
  platformFee?: number;
  price?: number;
  stock: number;
  weight?: string;
  deliveryTime?: string;
  specifications?: string;
  returnPolicy?: string;
  rating?: number;
  salesCount?: number;
  views?: number;
  status?: "pending" | "approved" | "rejected";
  bestseller?: boolean;
  createdAt?: string;
};

export type CartItem = { productId: string; quantity: number; product?: Product };

export function rankProducts(products: Product[]) {
  const priority = (status?: SellerStatus) => status === "trusted" ? 2 : status === "verified" ? 1 : 0;
  return [...products].sort((a, b) =>
    priority(b.sellerStatus) - priority(a.sellerStatus) ||
    (b.rating || 0) - (a.rating || 0) ||
    (b.salesCount || 0) - (a.salesCount || 0) ||
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
}

export function customerProductPrice(product: Product) {
  return Number(product.customerPrice ?? getProductPricing(Number(product.sellerPrice ?? product.price ?? 0)).customerPrice);
}
