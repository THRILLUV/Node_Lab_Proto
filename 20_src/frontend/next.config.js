const path = require("path");

/** @type {import('next').NextConfig} */
const backend = String(process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      { source: "/api/be/:path*", destination: `${backend}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
