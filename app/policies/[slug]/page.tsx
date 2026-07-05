import { notFound } from "next/navigation";
import { PolicyFooterLinks, PolicyLayout } from "@/components/PolicyLayout";
import { getPolicy, policies } from "@/lib/policies";

export function generateStaticParams() {
  return policies.map((policy) => ({ slug: policy.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  return {
    title: policy ? `${policy.title} | FitSaathi` : "Policy | FitSaathi",
    description: policy?.summary
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
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
