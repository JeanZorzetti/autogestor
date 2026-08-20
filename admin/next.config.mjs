/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sem output: "standalone" — isso é para Docker/self-hosted. Na Vercel
  // quebra o onBuildComplete (ENOENT em .next/next-server.js.nft.json)
  // porque o pipeline dela já empacota as functions do próprio jeito.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
