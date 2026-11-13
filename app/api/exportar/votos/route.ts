// CSV: votos nominais de um parlamentar, com a orientação do partido e do Governo.
import { parlamentarPorSlug, votosDoParlamentar } from "@/lib/consultas";
import { gerarCsv, respostaCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("parlamentar") ?? "";
  const p = await parlamentarPorSlug(slug.slice(0, 120));
  if (!p) return new Response("Parlamentar não encontrado", { status: 404 });
  const votos = await votosDoParlamentar(p.id, 100_000);
  const csv = gerarCsv(
    [
      { chave: "data", titulo: "data_hora_brasilia" }, { chave: "proposicao", titulo: "proposicao" }, { chave: "descricao", titulo: "descricao_votacao" },
      { chave: "voto", titulo: "voto" }, { chave: "partido", titulo: "partido_na_data" }, { chave: "orientacaoPartido", titulo: "orientacao_partido" },
      { chave: "orientacaoGoverno", titulo: "orientacao_governo" }, { chave: "aprovada", titulo: "resultado" }, { chave: "url", titulo: "pagina" },
    ],
    votos.map((v) => ({
      data: v.dataHora, proposicao: v.proposicao ? `${v.proposicao.sigla} ${v.proposicao.numero}/${v.proposicao.ano}` : null, descricao: v.descricao,
      voto: v.tipoVotoOriginal, partido: v.partido, orientacaoPartido: v.orientacaoPartido, orientacaoGoverno: v.orientacaoGoverno,
      aprovada: v.aprovada == null ? null : v.aprovada ? "aprovado" : "rejeitado", url: `https://conecta-politica.vercel.app/votacao/${v.votacaoId}`,
    })),
  );
  return respostaCsv(`votos-${p.slug}.csv`, csv);
}
