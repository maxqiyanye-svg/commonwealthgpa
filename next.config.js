/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Always refetch pages on navigation so Back never shows stale or empty data.
    staleTimes: { dynamic: 0 },
  },
};

module.exports = nextConfig;
