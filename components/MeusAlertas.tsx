"use client";
// Lista o que este aparelho segue, com opção de deixar de seguir ou desligar tudo.
import { useEffect, useState } from "react";
import Link from "next/link";
import { verificarSuporte, assinaturaAtual, chamarApi, type Suporte } from "@/lib/push-cliente";

type Item = { alvoTipo: string; alvoId: number; titulo: string; detalhe: string | null; url: string };

export function MeusAlertas() {
  const [suporte, setSuporte] = useState<Suporte | null>(null);
  const [itens, setItens] = useState<Item[] | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  useEffect(() => {
    const s = verificarSuporte();
    setSuporte(s);
    assinaturaAtual().then(async (sub) => {
      if (!sub) { setItens([]); return; }
      setEndpoint(sub.endpoint);
      const r = await chamarApi<{ itens: Item[] }>({ acao: "listar", endpoint: sub.endpoint });
      setItens(r.itens);
    }).catch(() => setItens([]));
  }, []);

  async function deixar(i: Item) {
    if (!endpoint) return;
    await chamarApi({ acao: "deixar", endpoint, alvoTipo: i.alvoTipo, alvoId: i.alvoId });
    setItens((xs) => (xs ?? []).filter((x) => !(x.alvoTipo === i.alvoTipo && x.alvoId === i.alvoId)));
  }

  async function desligarTudo() {
    if (!endpoint || !confirm("Parar de receber todos os alertas neste aparelho?")) return;
    await chamarApi({ acao: "cancelar_tudo", endpoint });
    const sub = await assinaturaAtual();
    await sub?.unsubscribe();
    setItens([]);
    setEndpoint(null);
  }

  if (suporte === "sem-chave") return <p className="text-suave">Os alertas ainda estão sendo configurados. Volte em breve.</p>;
  if (itens === null) return <p className="text-suave">Carregando…</p>;
  if (!itens.length) {
    return (
      <p>Você ainda não segue nada neste aparelho. Abra a página de um <Link href="/parlamentares">parlamentar</Link> ou de uma proposição e toque em <strong>🔔 Seguir</strong>.</p>
    );
  }
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-borda rounded-lg border border-borda bg-superficie">
        {itens.map((i) => (
          <li key={`${i.alvoTipo}-${i.alvoId}`} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <Link href={i.url} className="font-medium">{i.titulo}</Link>
              {i.detalhe && <p className="truncate text-sm text-suave">{i.detalhe}</p>}
            </div>
            <button type="button" onClick={() => deixar(i)} className="shrink-0 rounded border border-borda px-2 py-1 text-sm">Deixar de seguir</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={desligarTudo} className="text-sm text-erro underline">Desligar todos os alertas deste aparelho</button>
    </div>
  );
}
