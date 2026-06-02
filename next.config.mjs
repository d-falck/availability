/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // self-contained server build for the Docker/Fly image
  experimental: {
    instrumentationHook: true, // run src/instrumentation.ts on boot (refresh timer)
  },
};

export default nextConfig;
