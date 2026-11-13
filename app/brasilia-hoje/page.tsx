// Resumo "Brasília Hoje": edição da manhã (7h) e da noite (20h).
import type { Metadata } from "next";
import Link from "next/link";
import { carregarResumo, edicaoVigente } from "@/lib/brasilia-hoje";
import { hojeBrasilia, somarDias } from "@/lib/tempo";
import { BotaoSeguir } from "@/components/BotaoSeguir";
import { Indisponivel } from "@/components/Indisponivel";
import type { Edicao } from "@/lib/resumo";

export const metadata: Metadata = {
  title: "Brasília Hoje",
  description: "Resumo diário do que foi votado, publicado e pautado nos três Poderes — às 7h e às 20h.",
};
export const revalidate = 300;
type Props = { searchParams: Promise<{ data?: string; edicao?: string }> };

export default async function BrasiliaHoje({ searchParams }: Props) {
  const sp = await searchParams;
  const vigente = edicaoVigente();
  const dia = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) && sp.data <= hojeBrasilia() ? sp.data : vigente.dia;
  const edicao: Edicao = sp.edicao === "manha" || sp.edicao === "noite" ? sp.edicao : dia === vigente.dia ? vigente.edicao : "noite";
  let r;
  try {
    r = await carregarResumo(dia, edicao);
  } catch (e) {
    console.error("Brasília Hoje: falha ao consultar o banco", e);
    return <Indisponivel titulo="Brasília Hoje" />;
  }
  // Navegação: edição anterior / seguinte
  const anterior = edicao === "noite" ? { data: dia, edicao: "manha" } : { data: somarDias(dia, -1), edicao: "noite" };
  const seguinte = edicao === "manha" ? { data: dia, edicao: "noite" } : { data: somarDias(dia, 1), edicao: "manha" };
  const temSeguinte = !(seguinte.data > vigente.dia || (seguinte.data === vigente.dia && seguinte.edicao === "noite" && vigente.edicao === "manha"));
  const link = (x: { data: string; edicao: string }) => `/brasilia-hoje?data=${x.data}&edicao=${x.edicao}`;

  return (
    <article className="max-w-3xl space-y-5">
      <header>
        <p className="text-sm text-suave">Edição {edicao === "manha" ? "da manhã (7h)" : "da noite (20h)"}</p>
        <h1 className="text-2xl font-bold">Brasília Hoje</h1>
        <p className="text-suave first-letter:uppercase">{r.subtitulo}</p>
        <p className="mt-2 font-medium">{r.chamada}</p>
        <nav aria-label="Outras edições" className="mt-2 flex gap-4 text-sm">
          <Link href={link(anterior)}>← Edição anterior</Link>
          {temSeguinte && <Link href={link(seguinte)}>Próxima edição →</Link>}
        </nav>
      </header>

      {r.secoes.map((s) => (
        <section key={s.titulo} className="rounded-lg border border-borda bg-superficie p-4" aria-label={s.titulo}>
          <h2 className="mb-2 text-lg font-semibold">{s.titulo}</h2>
          {s.itens.length ? (
            <ul className="space-y-2 text-sm">
              {s.itens.map((i, n) => (
                <li key={n}>
                  {i.url ? (i.url.startsWith("http") ? <a href={i.url} target="_blank" rel="noopener" className="font-medium">{i.texto}</a> : <Link href={i.url} className="font-medium">{i.texto}</Link>) : <span className="font-medium">{i.texto}</span>}
                  {i.detalhe && <span className="block text-suave">{i.detalhe}</span>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-suave">{s.vazio}</p>}
        </section>
      ))}

      <section className="space-y-2 rounded-lg border border-borda bg-superficie p-4 text-sm">
        <h2 className="text-lg font-semibold">Receber o resumo no celular</h2>
        <div className="flex flex-wrap gap-4">
          <div><p className="mb-1">Manhã (7h)</p><BotaoSeguir alvoTipo="resumo" alvoId={1} nome="o resumo da manhã" /></div>
          <div><p className="mb-1">Noite (20h)</p><BotaoSeguir alvoTipo="resumo" alvoId={2} nome="o resumo da noite" /></div>
        </div>
      </section>

      <p className="text-xs text-suave">
        Resumo montado automaticamente a partir das fontes oficiais (Câmara, Senado e Presidência), sem seleção editorial: entram todas as votações em Plenário,
        leis, vetos e medidas provisórias do período. Detalhes e fontes em cada página. <Link href="/metodologia">Metodologia</Link>.
      </p>
    </article>
  );
}
