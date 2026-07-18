import type { Metadata, Viewport } from "next";
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
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  ...generateSeoMetadata(),
  metadataBase: new URL(siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.defaultDescription,
  authors: [{ name: "TheFitSaathi", url: siteUrl }],
  creator: "TheFitSaathi",
  publisher: "TheFitSaathi",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#00ff88",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <body className="bg-ink font-sans antialiased">
        <a
          href="#main-content"
          className="focus-ring fixed left-3 top-3 z-[200] -translate-y-24 rounded-lg bg-acid px-4 py-3 font-semibold text-ink transition focus:translate-y-0"
        >
          Skip to main content
        </a>
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
            <ServiceWorkerRegistration />
            <Header />
            <div id="main-content" tabIndex={-1} className="min-w-0">
              {children}
            </div>
            <Footer />
          </NotificationProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
