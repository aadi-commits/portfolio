import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev indicator (bottom-left logo). Dev-only overlay — it
  // never shows in production anyway; this just removes it while running `npm run dev`.
  devIndicators: false,
};

export default nextConfig;
