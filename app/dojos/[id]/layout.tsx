import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { resolveDojoImageUrl } from "@/lib/dojo-image";
import {
  breadcrumbJsonLd,
  generateSeoMetadata,
  sportsActivityLocationJsonLd,
} from "@/lib/seo";

export const revalidate = 0;

const getPublicDojo = cache((id: string) =>
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
    },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const dojo = await getPublicDojo(id);
    if (!dojo) notFound();
    return generateSeoMetadata({
      title: `${dojo.name} – ${dojo.category} Academy`,
      description: `View ${dojo.name}'s ${dojo.category} training details${dojo.city ? ` in ${dojo.city}` : ""} and booking options on TheFitSaathi.`,
      path: `/dojos/${id}`,
      image: dojo.imagePath ? resolveDojoImageUrl(dojo.imagePath, id) : undefined,
      keywords: [
        dojo.name,
        dojo.category,
        dojo.city ? `dojo in ${dojo.city}` : "dojo in India",
        "martial arts academy",
      ],
    });
  } catch {
    notFound();
  }
}

export default async function DojoProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let dojo;
  try {
    dojo = await getPublicDojo(id);
  } catch {
    notFound();
  }
  if (!dojo) notFound();
  const hasAccurateLocation = Boolean(
    dojo.address || dojo.city || dojo.state || dojo.pincode,
  );

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Dojos, Gyms and Academies", path: "/dojos" },
        { name: dojo.name, path: `/dojos/${id}` },
      ])} />
      {hasAccurateLocation ? (
        <JsonLd
          data={sportsActivityLocationJsonLd({
            id: dojo.id,
            name: dojo.name,
            category: dojo.category,
            description: dojo.description,
            image: dojo.imagePath
              ? resolveDojoImageUrl(dojo.imagePath, dojo.id)
              : null,
            address: dojo.address,
            city: dojo.city,
            state: dojo.state,
            pincode: dojo.pincode,
          })}
        />
      ) : null}
      {children}
    </>
  );
}
