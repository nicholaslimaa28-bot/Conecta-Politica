"use client";
// Campo para escolher um parlamentar (autocompletar pela busca do site) e montar a comparação.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { tipo: string; titulo: string; detalhe: string; url: string };

export function EscolherParlamentar({ outro, posicao, rotulo }: { outro?: string; posicao: "a" | "b"; rotulo: string }) {
  const [q, setQ] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) { setItens([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/busca?q=${encodeURIComponent(q)}&limite=8`).catch(() => null);
      if (r?.ok) setItens(((await r.json()) as Item[]).filter((i) => i.tipo === "parlamentar"));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function escolher(url: string) {
    const slug = url.split("/").pop()!;
    const p = new URLSearchParams();
    if (posicao === "a") { p.set("a", slug); if (outro) p.set("b", outro); } else { if (outro) p.set("a", outro); p.set("b", slug); }
    router.push(`/comparar?${p.toString()}`);
  }

  return (
    <div className="relative">
      <label className="block text-sm">{rotulo}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite um nome" autoComplete="off"
          className="mt-1 block w-full rounded border border-borda bg-superficie px-2 py-1.5" />
      </label>
      {itens.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded border border-borda bg-superficie shadow-lg">
          {itens.map((i) => (
            <li key={i.url}>
              <button type="button" onClick={() => escolher(i.url)} className="block w-full px-3 py-2 text-left text-sm hover:bg-borda/40">
                <span className="font-medium">{i.titulo}</span> <span className="text-suave">{i.detalhe}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
