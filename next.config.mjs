/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for olive_host_deploy runtime='static'.
  // Yields a `out/` directory with prerendered HTML — no Node server needed at runtime.
  // The Firebase Admin SDK is used only at build time (or in user-added Server Actions that
  // the worker layer will route to a separate function, not the static host).
  output: "export",
  reactStrictMode: true,
  // Static export disables image optimization; pass through unoptimized.
  images: {
    unoptimized: true,
  },
  // Trailing slashes keep static hosts happy.
  trailingSlash: true,
};

export default nextConfig;
