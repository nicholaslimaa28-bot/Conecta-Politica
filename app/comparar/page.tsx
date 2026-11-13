// Comparador: dois parlamentares lado a lado, só com dados oficiais — sem nota, ranking ou juízo de valor.
import type { Metadata } from "next";
import Link from "next/link";
import {
  parlamentarPorSlug, presencaResumo, presencaSenadoPorMes, totalGastoNoAno, totalProposicoesDoAutor, votosEmComum, type Parlamentar,
} from "@/lib/consultas";
import { hojeBrasilia, formatarData } from "@/lib/tempo";
import { EscolherParlamentar } from "@/components/EscolherParlamentar";
import { Compartilhar } from "@/components/Compartilhar";
import { rotuloVoto } from "@/components/Selos";

export const metadata: Metadata = { title: "Comparar parlamentares", description: "Compare dois parlamentares lado a lado: presença, gastos, proposições e votos em comum, com dados oficiais." };
type Props = { searchParams: Promise<{ a?: string; b?: string }> };

const reais = (v: number | null) => (v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }));

async function resumo(p: Parlamentar, ano: number) {
  const [gasto, props] = await Promise.all([totalGastoNoAno(p.id, ano), totalProposicoesDoAutor(p.id)]);
  let presenca: string;
  if (p.casa === "CD") {
    const r = (await presencaResumo(p.id)).find((x) => x.ano === ano && x.ambito === "plenario");
    presenca = r ? `${r.presencas} dias presente · ${r.ausenciasJustificadas} faltas justificadas · ${r.ausenciasNaoJustificadas} não justificadas (sessões deliberativas)` : "dado indisponível";
  } else {
    const m = await presencaSenadoPorMes(p.id, ano);
    const s = m.reduce((a, x) => ({ p: a.p + x.presente, j: a.j + x.justificada, n: a.n + x.naoJustificada, t: a.t + x.total }), { p: 0, j: 0, n: 0, t: 0 });
    presenca = s.t ? `presente em ${s.p} de ${s.t} votações nominais · ${s.j} ausências justificadas · ${s.n} não justificadas` : "dado indisponível";
  }
  return { gasto, props, presenca };
}

function Cartao({ p, r, ano }: { p: Parlamentar; r: Awaited<ReturnType<typeof resumo>>; ano: number }) {
  return (
    <div className="rounded-lg border border-borda bg-superficie p-4">
      <p className="text-sm text-suave">{p.casa === "CD" ? "Deputado(a) federal" : "Senador(a)"}</p>
      <h2 className="text-xl font-bold"><Link href={`/parlamentar/${p.slug}`}>{p.nome}</Link></h2>
      <p>{p.partido ?? "Sem partido"} · {p.uf}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div><dt className="text-suave">Presença em {ano}</dt><dd>{r.presenca}</dd></div>
        <div><dt className="text-suave">Gastos da cota parlamentar em {ano}</dt><dd className="tabular">{reais(r.gasto)}</dd></div>
        <div><dt className="text-suave">Proposições de autoria (desde 2023)</dt><dd className="tabular">{r.props}</dd></div>
      </dl>
    </div>
  );
}

export default async function Comparar({ searchParams }: Props) {
  const { a: sa, b: sb } = await searchParams;
  const [a, b] = await Promise.all([sa ? parlamentarPorSlug(sa) : null, sb ? parlamentarPorSlug(sb) : null]);
  const ano = Number(hojeBrasilia().slice(0, 4));
  const [ra, rb] = await Promise.all([a ? resumo(a, ano) : null, b ? resumo(b, ano) : null]);
  const comum = a && b && a.casa === b.casa ? await votosEmComum(a.id, b.id) : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Comparar parlamentares</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          {a && ra ? <Cartao p={a} r={ra} ano={ano} /> : null}
          <EscolherParlamentar posicao="a" outro={b?.slug} rotulo={a ? "Trocar o primeiro parlamentar" : "Primeiro parlamentar"} />
        </div>
        <div className="space-y-3">
          {b && rb ? <Cartao p={b} r={rb} ano={ano} /> : null}
          <EscolherParlamentar posicao="b" outro={a?.slug} rotulo={b ? "Trocar o segundo parlamentar" : "Segundo parlamentar"} />
        </div>
      </div>

      {a && b && a.casa !== b.casa && (
        <p className="rounded border border-alerta p-3 text-sm">
          Um é deputado(a) e o outro senador(a): as Casas medem a presença de formas diferentes (dias de sessão na Câmara, votações nominais no Senado)
          e eles não votam nas mesmas votações. Por isso não há votos em comum, e os números de presença não devem ser comparados diretamente.
        </p>
      )}

      {comum && a && b && (
        <section className="rounded-lg border border-borda bg-superficie p-4">
          <h2 className="mb-1 text-lg font-semibold">Votos em comum</h2>
          {comum.total ? (
            <>
              <p className="text-sm">Nas <strong>{comum.total}</strong> votações nominais coletadas em que os dois votaram, votaram igual em <strong>{comum.iguais}</strong> e diferente em <strong>{comum.total - comum.iguais}</strong>.</p>
              <ul className="mt-3 space-y-2 text-sm">
                {comum.recentes.map((v) => (
                  <li key={v.votacaoId} className="border-t border-borda pt-2">
                    <p><span className="text-suave">{formatarData(v.dataHora)}</span> {v.proposicao ? <Link href={`/proposicao/${v.proposicao.slug}`} className="font-medium">{v.proposicao.sigla} {v.proposicao.numero}/{v.proposicao.ano}</Link> : null} <Link href={`/votacao/${v.votacaoId}`} className="text-xs">ver votação</Link></p>
                    <p className="text-suave">{v.descricao.length > 150 ? v.descricao.slice(0, 147) + "…" : v.descricao}</p>
                    <p>{a.nome}: <strong>{rotuloVoto(v.votoA)}</strong> · {b.nome}: <strong>{rotuloVoto(v.votoB)}</strong></p>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-sm text-suave">Nenhuma votação nominal coletada em que os dois tenham registrado voto.</p>}
        </section>
      )}

      {a && b && <Compartilhar titulo={`${a.nome} × ${b.nome}`} texto={`Compare ${a.nome} e ${b.nome}: presença, gastos e votos em comum`} />}
      <p className="text-xs text-suave">
        A comparação mostra só dados oficiais, sem nota nem ranking. Ausências e votos dependem de licenças, missões e cargos de cada um — veja os detalhes na página de cada parlamentar e na <Link href="/metodologia">Metodologia</Link>.
      </p>
    </div>
  );
}
