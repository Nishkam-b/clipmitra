import type { NextConfig } from "next";

/**
 * The UI is a static site published at https://nishtek.in/clipmitra (GitHub Pages).
 * It talks to the ClipMitra engine running on the visitor's own computer (http://127.0.0.1:8000),
 * so there is no server-side code: `output: "export"` + basePath, query-string routes (?id=).
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/clipmitra",
  trailingSlash: true, // /clipmitra/job/ -> job/index.html, which GitHub Pages serves directly
  // cacheComponents / partialPrefetching (PPR) are not allowed with output: "export";
  // every page is client-rendered against the local engine anyway.
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
