import path from "node:path";
import type { NextConfig } from "next";

// GitHub project Pages: set NEXT_PUBLIC_BASE_PATH="/oscar-rode-portfolio" at build
// (workflow uses actions/configure-pages, which is "" for user/org sites).
// Leave unset so local `next dev` still serves at "/".
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    // Static export / GitHub Pages has no `/_next/image` optimizer.
    // Tradeoff: files from `public/` are served as-is (no AVIF/WebP rewrite,
    // no q=80). Required in `next dev` too — `output: 'export'` disables the
    // optimizer there as well.
    unoptimized: true,
  },
};

export default nextConfig;
