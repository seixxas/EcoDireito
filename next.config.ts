import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Processos virou Projetos: favoritos e links já enviados continuam funcionando.
  async redirects() {
    return [{ source: '/processos/:caminho*', destination: '/projetos/:caminho*', permanent: false }]
  },
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
