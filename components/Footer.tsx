"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { CustomerCareButton } from "@/components/CustomerCareModal";
import { ReportProblemButton } from "@/components/ReportProblem";

const exploreLinks = [
  ["Find Coach", "/find-coach"],
  ["Dojos and Gyms", "/dojos"],
  ["Shop", "/shop"],
  ["Become a Coach", "/become-a-coach"],
  ["Register Dojo / Gym", "/register-dojo"],
  ["Register Seller", "/register-seller"],
] as const;

const companyLinks = [
  ["About FitSaathi", "/about"],
  ["FitSaathi Owner", "/fitsaathi-owner"],
  ["Contact Us", "/contact"],
  ["Privacy Policy", "/privacy"],
  ["Terms and Conditions", "/terms"],
] as const;

const footerLinkClass =
  "inline-flex min-h-11 items-center text-sm text-zinc-400 transition hover:text-acid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid";

export function Footer() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1.15fr] lg:px-8">
        <div>
          <Link href="/" className="text-lg font-bold text-white">
            Fit<span className="text-acid">Saathi</span>
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
            Fitness support, safety, and trusted connections.
          </p>
        </div>

        <nav aria-label="Explore FitSaathi">
          <p className="text-sm font-semibold text-white">Explore</p>
          <div className="mt-2 grid content-start">
            {exploreLinks.map(([label, href]) => (
              <Link key={href} href={href} className={footerLinkClass}>
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="FitSaathi company information">
          <p className="text-sm font-semibold text-white">Company</p>
          <div className="mt-2 grid content-start">
            {companyLinks.map(([label, href]) => (
              <Link key={href} href={href} className={footerLinkClass}>
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div>
          <address className="not-italic">
            <p className="text-sm font-semibold text-white">FitSaathi support</p>
            <a
              href="mailto:priyanshuswain2000@gmail.com"
              className="mt-2 flex min-h-11 items-center gap-2 break-all text-sm text-zinc-400 transition hover:text-acid"
            >
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              priyanshuswain2000@gmail.com
            </a>
            <a
              href="tel:8447640449"
              className="flex min-h-11 items-center gap-2 text-sm text-zinc-400 transition hover:text-acid"
            >
              <Phone className="h-4 w-4" />
              8447640449
            </a>
          </address>
          <div className="mt-2 grid content-start justify-items-start">
            <CustomerCareButton />
            <ReportProblemButton />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-7xl text-sm leading-6 text-zinc-500">
          FitSaathi is owned and founded by Priyanshu Swain and administered by
          Parthsaarthi.
        </p>
      </div>
    </footer>
  );
}
