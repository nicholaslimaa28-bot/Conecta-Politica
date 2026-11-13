// Prévia padrão do site (home e páginas sem prévia própria)
import { cartaoOG, TAMANHO_OG } from "@/lib/og";

export const alt = "Conecta Política — o que acontece hoje nos três Poderes";
export const size = TAMANHO_OG;
export const contentType = "image/png";

export default function Imagem() {
  return cartaoOG({
    rotulo: "Hoje nos três Poderes",
    titulo: "O que acontece hoje em Brasília",
    subtitulo: "Sessões, votações, presença, gastos, leis e vetos — com fonte e horário em cada dado.",
    linhas: ["Câmara · Senado · Congresso · Presidência"],
  });
}
