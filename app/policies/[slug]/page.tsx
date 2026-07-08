import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyFooterLinks, PolicyLayout } from "@/components/PolicyLayout";
import { getPolicy, policies } from "@/lib/policies";
import { generateSeoMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy)
    return generateSeoMetadata({
      title: "Policy Not Found - FitSaathi",
      path: `/policies/${slug}`,
      noIndex: true,
    });
  const path =
    slug === "privacy"
      ? "/privacy"
      : slug === "terms"
        ? "/terms"
        : `/policies/${slug}`;
  return generateSeoMetadata({
    title: `${policy.title} - FitSaathi`,
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

  return (
    <>
      <PolicyLayout policy={policy} />
      <PolicyFooterLinks />
    </>
  );
}
