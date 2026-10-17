import type { NextConfig } from "next";

/**
 * `npm run build:static` gera um site 100% estático em `out/` (sem servidor Node), servível por
 * qualquer hospedagem de arquivos. O npm define `npm_lifecycle_event` com o nome do script em
 * qualquer sistema operacional. A exportação estática não aceita Cache Components (PPR), então
 * eles ficam desligados só nesse modo: lá, sair de /play desmonta a partida em vez de preservá-la.
 */
const staticExport = process.env.npm_lifecycle_event === "build:static";

const nextConfig: NextConfig = {
  output: staticExport ? "export" : undefined,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
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
