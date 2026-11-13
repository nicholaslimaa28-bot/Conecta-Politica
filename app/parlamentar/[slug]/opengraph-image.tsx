// Prévia da página do parlamentar: foto, nome, partido-UF e o que a página mostra (sem juízo de valor)
import { parlamentarPorSlug, presencaResumo } from "@/lib/consultas";
import { cartaoOG, fotoComoDataUrl, TAMANHO_OG } from "@/lib/og";
import { hojeBrasilia } from "@/lib/tempo";

export const alt = "Página do parlamentar no Conecta Política";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const revalidate = 86400;

export default async function Imagem({ params }: { params: Promise<{ slug: string }> }) {
  const p = await parlamentarPorSlug((await params).slug).catch(() => null);
  if (!p) return cartaoOG({ rotulo: "Parlamentar", titulo: "Conecta Política", subtitulo: "Página não encontrada." });
  const cargo = p.casa === "CD" ? "Deputado(a) federal" : "Senador(a)";
  const linhas = [`${p.partido ?? "Sem partido"} · ${p.uf ?? ""}`];
  if (p.casa === "CD") {
    const ano = Number(hojeBrasilia().slice(0, 4));
    const pl = (await presencaResumo(p.id).catch(() => [])).find((r) => r.ano === ano && r.ambito === "plenario");
    if (pl && pl.presencas != null) linhas.push(`Plenário em ${ano}: ${pl.presencas} dias presente · ${pl.ausenciasJustificadas ?? 0} faltas justificadas · ${pl.ausenciasNaoJustificadas ?? 0} não justificadas`);
  }
  linhas.push("Presença, votos, proposições e gastos");
  return cartaoOG({
    rotulo: cargo, titulo: p.nome, linhas, foto: await fotoComoDataUrl(p.urlFoto),
    rodape: p.casa === "CD" ? "Fonte: Câmara dos Deputados — dados abertos" : "Fonte: Senado Federal — dados abertos",
  });
}
