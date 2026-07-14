import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AuthSessionProvider } from "@/lib/auth-client";
import { JsonLd } from "@/components/JsonLd";
import {
  generateSeoMetadata,
  organizationJsonLd,
  seoConfig,
  siteUrl,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

export const metadata: Metadata = {
  ...generateSeoMetadata(),
  metadataBase: new URL(siteUrl),
  title: seoConfig.defaultTitle,
  description: seoConfig.defaultDescription,
  authors: [{ name: "FitSaathi", url: siteUrl }],
  creator: "FitSaathi",
  publisher: "FitSaathi",
  icons: {
    icon: [{ url: "/fitsaathi-logo.svg", type: "image/svg+xml" }],
    shortcut: "/fitsaathi-logo.svg",
    apple: "/fitsaathi-logo.svg",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <body className="bg-ink font-sans antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [organizationJsonLd, websiteJsonLd],
          }}
        />
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}
        <AuthSessionProvider>
          <NotificationProvider>
            <Header />
            {children}
            <Footer />
          </NotificationProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
