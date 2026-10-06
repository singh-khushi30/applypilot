import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // three.js and React Three Fiber run in the browser. Keep scenes in
  // src/components/three and load them with ssr: false.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
