// Minimal Next.js config for the @lyra-ds/react App Router scratch-app smoke test.
// @lyra-ds/react ships prebuilt dual ESM+CJS with the `"use client"` directive baked
// into every dist entry, so no `transpilePackages` is needed — Next resolves it through
// the package exports map exactly as a real consumer would.
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
