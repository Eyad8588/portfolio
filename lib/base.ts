/** Base path for GitHub Pages project sites (set NEXT_PUBLIC_BASE_PATH at build time). */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
/** Prefix a public/ asset path with the base path. External URLs pass through. */
export const asset = (p: string) => (!p || /^https?:/.test(p) ? p : `${BASE}${p}`);
