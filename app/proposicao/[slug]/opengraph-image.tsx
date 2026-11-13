// Prévia da proposição: número, apelido/ementa e situação atual nas duas Casas
import { proposicaoPorSlug } from "@/lib/consultas";
import { cartaoOG, TAMANHO_OG } from "@/lib/og";

export const alt = "Proposição no Conecta Política";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Imagem({ params }: { params: Promise<{ slug: string }> }) {
  const p = await proposicaoPorSlug((await params).slug).catch(() => null);
  if (!p) return cartaoOG({ rotulo: "Proposição", titulo: "Conecta Política", subtitulo: "Página não encontrada." });
  const linhas: string[] = [];
  if (p.normaGerada) linhas.push(`Virou ${p.normaGerada}`);
  else {
    if (p.situacaoCamara) linhas.push(`Câmara: ${p.situacaoCamara}`);
    if (p.situacaoSenado) linhas.push(`Senado: ${p.situacaoSenado}`);
  }
  return cartaoOG({
    rotulo: p.sigla === "MPV" ? "Medida provisória" : "Proposição",
    titulo: `${p.sigla} ${p.numero}/${p.ano}${p.apelido ? ` — ${p.apelido}` : ""}`,
    subtitulo: p.apelido ? null : p.ementa,
    linhas,
    poder: p.sigla === "MPV" ? "executivo" : "legislativo",
    rodape: "Fonte: Câmara dos Deputados e Senado Federal — dados abertos",
  });
}
