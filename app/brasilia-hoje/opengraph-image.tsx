// Prévia do resumo "Brasília Hoje" (edição vigente)
import { carregarResumo, edicaoVigente } from "@/lib/brasilia-hoje";
import { cartaoOG, TAMANHO_OG } from "@/lib/og";

export const alt = "Brasília Hoje — resumo diário dos três Poderes";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const revalidate = 1800;

export default async function Imagem() {
  const { dia, edicao } = edicaoVigente();
  const r = await carregarResumo(dia, edicao).catch(() => null);
  return cartaoOG({
    rotulo: edicao === "manha" ? "Edição da manhã" : "Edição da noite",
    titulo: "Brasília Hoje",
    subtitulo: r ? r.subtitulo.charAt(0).toUpperCase() + r.subtitulo.slice(1) : null,
    linhas: r ? [r.chamada] : ["Resumo diário dos três Poderes, às 7h e às 20h"],
  });
}
