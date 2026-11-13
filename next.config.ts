import type { NextConfig } from "next";

const config: NextConfig = {
  // Service worker dos alertas: nunca em cache e só scripts do próprio site
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  images: {
    // Fotos oficiais vêm direto dos servidores da Câmara e do Senado
    remotePatterns: [
      { protocol: "https", hostname: "www.camara.leg.br" },
      { protocol: "http", hostname: "www.senado.leg.br" },
      { protocol: "https", hostname: "www.senado.leg.br" },
    ],
  },
};
export default config;
