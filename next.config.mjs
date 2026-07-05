/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" }
    ];
  }
};

export default nextConfig;
