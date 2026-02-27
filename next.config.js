/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // ISR: pages revalidate every 15 min globally
  // Per-page revalidation is set in each route
};

module.exports = nextConfig;
