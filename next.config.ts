import type { NextConfig } from "next";

// Deployment timestamp: 2026-04-29T20:57:13-06:00 - Force Vercel rebuild

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wtczfdkldixaptrskjwb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
