"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { CustomerCareButton } from "@/components/CustomerCareModal";
import { ReportProblemButton } from "@/components/ReportProblem";

const footerLinks = [
  ["Home", "/home"],
  ["Find Coach", "/find-coach"],
  ["Become a Coach", "/become-a-coach"],
  ["Register Seller", "/register-seller"],
  ["Dojos", "/dojos"],
  ["Booking", "/booking"],
  ["Shop", "/shop"],
  ["Contact", "/contact"],
  ["FAQ", "/faq"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
] as const;

export function Footer() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/super-admin-dashboard")) return null;

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.5fr_1fr] lg:px-8">
        <div>
          <Link href="/home" className="text-lg font-bold text-white">
            Fit<span className="text-acid">Saathi</span>
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
            Fitness support, safety, and trusted connections.
          </p>
        </div>

        <nav
          className="flex flex-wrap content-start gap-x-5 gap-y-3"
          aria-label="Footer navigation"
        >
          {footerLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-zinc-400 transition hover:text-acid"
            >
              {label}
            </Link>
          ))}
          <CustomerCareButton />
          <ReportProblemButton />
        </nav>

        <address className="not-italic">
          <p className="text-sm font-semibold text-white">FitSaathi support</p>
          <a
            href="mailto:priyanshuswain2000@gmail.com"
            className="mt-3 flex items-start gap-2 break-all text-sm text-zinc-400 transition hover:text-acid"
          >
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            priyanshuswain2000@gmail.com
          </a>
          <a
            href="tel:8447640449"
            className="mt-3 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-acid"
          >
            <Phone className="h-4 w-4" />
            8447640449
          </a>
        </address>
      </div>
    </footer>
  );
}
