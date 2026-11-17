// Static export: `npm run build` writes the whole site to out/.
// For GitHub Pages project sites set NEXT_PUBLIC_BASE_PATH=/<repo-name>.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  webpack: (config) => {
    // transformers.js: never bundle the Node-only backends into the browser build
    config.resolve.alias = { ...config.resolve.alias, "onnxruntime-node$": false, "sharp$": false };
    return config;
  },
};
export default nextConfig;
