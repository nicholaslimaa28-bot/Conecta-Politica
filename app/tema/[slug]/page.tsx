// Página de um tema: votações em Plenário e leis recentes cujas ementas são do tema.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMAS, temaPorSlug } from "@/lib/temas";
import { atividadeDoTema } from "@/lib/consultas";
import { formatarData } from "@/lib/tempo";
import { BotaoSeguir } from "@/components/BotaoSeguir";
import { Compartilhar } from "@/components/Compartilhar";
import { Placar } from "@/components/Placar";
import { SeloCasa } from "@/components/Selos";

export const revalidate = 1800;
export function generateStaticParams() { return TEMAS.map((t) => ({ slug: t.slug })); }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = temaPorSlug((await params).slug);
  return t ? { title: `Tema: ${t.nome}`, description: `Votações em Plenário e novas leis sobre ${t.nome.toLowerCase()}.` } : {};
}

export default async function PaginaTema({ params }: Props) {
  const t = temaPorSlug((await params).slug);
  if (!t) notFound();
  let dados;
  try { dados = await atividadeDoTema(t.id); } catch { dados = null; }
  return (
    <article className="space-y-5">
      <header>
        <p className="text-sm text-suave"><Link href="/temas">Temas</Link></p>
        <h1 className="text-2xl font-bold">{t.nome}</h1>
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <BotaoSeguir alvoTipo="tema" alvoId={t.id} nome={`o tema ${t.nome}`} />
          <Compartilhar titulo={`Tema: ${t.nome}`} texto={`Votações e novas leis sobre ${t.nome.toLowerCase()}`} />
        </div>
        <p className="mt-2 text-xs text-suave">Quem segue recebe um aviso quando uma proposição do tema é votada em Plenário ou vira lei. <Link href="/metodologia#temas">Como os temas são definidos</Link>.</p>
      </header>
      {!dados ? <p className="text-suave">Dado indisponível no momento.</p> : (
        <>
          <section className="rounded-lg border border-borda bg-superficie p-4">
            <h2 className="mb-2 text-lg font-semibold">Votado em Plenário nos últimos 60 dias ({dados.votadas.length})</h2>
            {dados.votadas.length ? (
              <ul className="space-y-3">
                {dados.votadas.map((v) => (
                  <li key={v.id} className="border-t border-borda pt-2 text-sm first:border-0 first:pt-0">
                    <p><SeloCasa casa={v.casa} /> <span className="text-suave">{formatarData(v.dataHora)}</span> <Link href={`/proposicao/${v.proposicao!.slug}`} className="font-medium">{v.proposicao!.sigla} {v.proposicao!.numero}/{v.proposicao!.ano}</Link>{v.proposicao!.apelido ? ` — ${v.proposicao!.apelido}` : ""}</p>
                    <p className="text-suave">{v.ementa && v.ementa.length > 200 ? v.ementa.slice(0, 197) + "…" : v.ementa}</p>
                    <Placar v={v} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-suave">Nenhuma votação em Plenário deste tema nos últimos 60 dias.</p>}
          </section>
          <section className="rounded-lg border border-borda bg-superficie p-4">
            <h2 className="mb-2 text-lg font-semibold">Leis publicadas nos últimos 4 meses ({dados.leis.length})</h2>
            {dados.leis.length ? (
              <ul className="space-y-2 text-sm">
                {dados.leis.map((l) => (
                  <li key={l.nome}>
                    <a href={l.url} target="_blank" rel="noopener" className="font-medium">{l.nome}</a>
                    {l.proposicao && <> · <Link href={`/proposicao/${l.proposicao.slug}`}>{l.proposicao.sigla} {l.proposicao.numero}/{l.proposicao.ano}</Link></>}
                    {l.ementa && <span className="block text-suave">{l.ementa.length > 200 ? l.ementa.slice(0, 197) + "…" : l.ementa}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-suave">Nenhuma lei deste tema nos últimos 4 meses.</p>}
          </section>
        </>
      )}
    </article>
  );
}
