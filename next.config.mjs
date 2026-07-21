const canonicalOrigin = "https://thefitsaathi.com";
const productionVercelHost = "fitsaathi.vercel.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Resolve metadata before streaming so dynamic notFound() decisions produce
  // a real HTTP 404 for browsers and crawlers alike.
  htmlLimitedBots: /.*/,
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" }
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: productionVercelHost }],
        destination: `${canonicalOrigin}/:path*`,
        permanent: true
      },
      { source: "/home", destination: "/", permanent: true },
      { source: "/marketplace", destination: "/shop", permanent: true },
      { source: "/seller/register", destination: "/register-seller", permanent: true },
      { source: "/policies/privacy", destination: "/privacy", permanent: true },
      { source: "/policies/terms", destination: "/terms", permanent: true }
    ];
  }
};

export default nextConfig;
