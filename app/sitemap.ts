// Sitemap: cada parlamentar e proposição tem página própria indexável.
import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  let parl: { slug: string; t: Date }[] = [];
  let props: { slug: string; t: Date }[] = [];
  try {
    parl = await sql<{ slug: string; t: Date }[]>`SELECT slug, coletado_em AS t FROM parlamentar WHERE em_exercicio`;
    props = await sql<{ slug: string; t: Date }[]>`SELECT slug, atualizado_em AS t FROM proposicao ORDER BY atualizado_em DESC LIMIT 40000`;
  } catch (e) {
    console.error("Sitemap: banco indisponível, gerando só as páginas fixas", e); // refeito na próxima revalidação
  }
  return [
    { url: `${base}/`, changeFrequency: "hourly" },
    { url: `${base}/parlamentares`, changeFrequency: "daily" },
    ...parl.map((p) => ({ url: `${base}/parlamentar/${p.slug}`, lastModified: p.t })),
    ...props.map((p) => ({ url: `${base}/proposicao/${p.slug}`, lastModified: p.t })),
  ];
}
