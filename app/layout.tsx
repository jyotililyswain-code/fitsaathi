import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "FitSaathi | Fitness Coaches, Dojos, and Training",
  description: "A premium Indian fitness marketplace for coaches, dojos, martial arts, yoga, and personal training.",
  keywords: [
    "fitness trainers India",
    "karate classes",
    "MMA coaching",
    "yoga instructors",
    "home fitness trainer",
    "martial arts academy",
    "personal trainer India"
  ],
  openGraph: {
    title: "FitSaathi",
    description: "Find trusted fitness coaches and dojos with honest availability, attendance, and empty-state data.",
    type: "website",
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: "FitSaathi",
    description: "Find trusted fitness coaches, yoga instructors, martial arts trainers, and dojos across India."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <body className="bg-ink font-sans antialiased">
        <Script id="fitsaathi-schema" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "FitSaathi",
            url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            description: "Indian fitness marketplace for coaches, dojos, yoga, martial arts, and personal training."
          })}
        </Script>
        {gaId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
