/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" }
    ];
  },
  async redirects() {
    return [
      { source: "/marketplace", destination: "/shop", permanent: true },
      { source: "/policies/privacy", destination: "/privacy", permanent: true },
      { source: "/policies/terms", destination: "/terms", permanent: true }
    ];
  }
};

export default nextConfig;
