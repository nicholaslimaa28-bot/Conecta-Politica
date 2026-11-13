// CSV: voto de cada parlamentar numa votação nominal.
import { votosDaVotacao } from "@/lib/consultas";
import { gerarCsv, respostaCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return new Response("Parâmetro inválido", { status: 400 });
  const votos = await votosDaVotacao(id);
  if (!votos.length) return new Response("Votação sem votos individuais publicados", { status: 404 });
  const csv = gerarCsv(
    [{ chave: "nome", titulo: "parlamentar" }, { chave: "partido", titulo: "partido" }, { chave: "uf", titulo: "uf" }, { chave: "tipoVotoOriginal", titulo: "voto" }],
    votos,
  );
  return respostaCsv(`votacao-${id}.csv`, csv);
}
