import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyFooterLinks, PolicyLayout } from "@/components/PolicyLayout";
import { JsonLd } from "@/components/JsonLd";
import { getPolicy, policies } from "@/lib/policies";
import { breadcrumbJsonLd, generateSeoMetadata } from "@/lib/seo";

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();
  const path =
    slug === "privacy"
      ? "/privacy"
      : slug === "terms"
        ? "/terms"
        : `/policies/${slug}`;
  return generateSeoMetadata({
    title: policy.title,
    description: policy.summary,
    path,
    noIndex: slug === "privacy" || slug === "terms",
  });
}

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();
  const path =
    slug === "privacy"
      ? "/privacy"
      : slug === "terms"
        ? "/terms"
        : `/policies/${slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Policies", path: "/policies" },
          { name: policy.title, path },
        ])}
      />
      <PolicyLayout policy={policy} />
      <PolicyFooterLinks />
    </>
  );
}
