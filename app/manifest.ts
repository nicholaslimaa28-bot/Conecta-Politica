// Manifest do aplicativo (PWA): permite instalar o site na tela inicial — no iPhone, é o que
// libera as notificações.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conecta Política",
    short_name: "Conecta Política",
    description: "O que acontece hoje na Câmara, no Senado e na Presidência, com fonte e horário.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#0f6b63",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
