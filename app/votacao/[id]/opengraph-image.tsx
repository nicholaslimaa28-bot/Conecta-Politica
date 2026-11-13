// Prévia da votação: proposição, resultado e placar
import { sql } from "@/lib/db";
import { cartaoOG, TAMANHO_OG } from "@/lib/og";
import { formatarData } from "@/lib/tempo";

export const alt = "Resultado de votação no Conecta Política";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Imagem({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [v] = Number.isInteger(id)
    ? await sql<{ casa: string; dataHora: Date; descricao: string; aprovada: boolean | null; nominal: boolean; sim: number | null; nao: number | null; abs: number | null; sigla: string | null; numero: number | null; ano: number | null; apelido: string | null }[]>`
        SELECT v.casa, v.data_hora AS "dataHora", v.descricao, v.aprovada, v.nominal, v.placar_sim AS sim, v.placar_nao AS nao, v.placar_abstencao AS abs,
          p.sigla, p.numero, p.ano, p.apelido
        FROM votacao v LEFT JOIN proposicao p ON p.id = v.proposicao_id WHERE v.id = ${id}`.catch(() => [])
    : [];
  if (!v) return cartaoOG({ rotulo: "Votação", titulo: "Conecta Política", subtitulo: "Página não encontrada." });
  const casa = v.casa === "CD" ? "Câmara" : v.casa === "SF" ? "Senado" : "Congresso";
  const resultado = v.aprovada == null ? null : v.aprovada ? "Aprovado" : "Rejeitado";
  return cartaoOG({
    rotulo: `Votação · ${casa} · ${formatarData(v.dataHora)}`,
    titulo: v.sigla ? `${v.sigla} ${v.numero}/${v.ano}${v.apelido ? ` — ${v.apelido}` : ""}` : v.descricao,
    subtitulo: v.sigla ? v.descricao : null,
    linhas: resultado ? [resultado] : [],
    placar: v.nominal && v.sim != null ? { sim: v.sim, nao: v.nao ?? 0, abstencao: v.abs ?? 0 } : null,
    rodape: `Fonte: ${v.casa === "CD" ? "Câmara dos Deputados" : "Senado Federal"} — dados abertos`,
  });
}
