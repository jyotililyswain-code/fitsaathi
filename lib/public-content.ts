import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getPublicCoach = cache((id: string) =>
  prisma.coach.findFirst({
    where: {
      id,
      verified: true,
      status: "approved",
      owner: { accountStatus: "active" },
    },
    select: {
      id: true,
      name: true,
      category: true,
      city: true,
      bio: true,
      photoPath: true,
      rating: true,
      badge: true,
      attendancePercent: true,
      cancellations: true,
      verified: true,
    },
  }),
);

export const getPublicDojo = cache((id: string) =>
  prisma.dojo.findFirst({
    where: {
      id,
      approved: true,
      status: "active",
      owner: { accountStatus: "active" },
    },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      establishmentType: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      imagePath: true,
      imageFit: true,
      imagePosition: true,
      rating: true,
      verified: true,
    },
  }),
);

export const getPublicProduct = cache((id: string) =>
  prisma.product.findFirst({
    where: {
      id,
      status: "approved",
      seller: {
        status: { in: ["verified", "trusted"] },
        owner: { accountStatus: "active" },
      },
    },
    select: {
      id: true,
      sellerId: true,
      title: true,
      description: true,
      category: true,
      brand: true,
      customerPrice: true,
      stock: true,
      weight: true,
      deliveryTime: true,
      specifications: true,
      returnPolicy: true,
      rating: true,
      salesCount: true,
      bestseller: true,
      createdAt: true,
      images: {
        select: { path: true },
        orderBy: { sortOrder: "asc" },
        take: 3,
      },
      seller: {
        select: {
          storeName: true,
          verified: true,
          trusted: true,
        },
      },
    },
  }),
);

export const getPublicSeller = cache((id: string) =>
  prisma.seller.findFirst({
    where: {
      id,
      status: { in: ["verified", "trusted"] },
      owner: { accountStatus: "active" },
    },
    select: {
      id: true,
      storeName: true,
      address: true,
      profilePath: true,
      status: true,
      verified: true,
      trusted: true,
      rating: true,
      salesCount: true,
    },
  }),
);
