import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-85450578-c18b-4445-9bbd-3ef36c46f826.space.z.ai',
    '.space.z.ai',
  ],
};

export default nextConfig;
