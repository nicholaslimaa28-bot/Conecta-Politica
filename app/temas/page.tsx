// Lista de temas que podem ser seguidos.
import type { Metadata } from "next";
import Link from "next/link";
import { TEMAS } from "@/lib/temas";

export const metadata: Metadata = { title: "Temas", description: "Acompanhe votações e novas leis por tema: saúde, educação, segurança pública e outros." };

export default function Temas() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Temas</h1>
      <p className="text-suave">Veja as votações e as novas leis de cada tema e, se quiser, receba avisos no celular. <Link href="/metodologia#temas">Como os temas são definidos</Link>.</p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TEMAS.map((t) => (
          <li key={t.id}><Link href={`/tema/${t.slug}`} className="block rounded border border-borda bg-superficie p-3 font-medium">{t.nome}</Link></li>
        ))}
      </ul>
    </div>
  );
}
