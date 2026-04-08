import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include prompts/ directory in serverless function bundles so
  // fs.readFile can load prompt files at runtime on Vercel.
  outputFileTracingIncludes: {
    "**": ["./prompts/**"],
  },
};

export default nextConfig;
