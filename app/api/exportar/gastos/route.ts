// CSV: documentos da cota parlamentar de um parlamentar num ano.
import { parlamentarPorSlug, despesasDoAno } from "@/lib/consultas";
import { gerarCsv, respostaCsv } from "@/lib/csv";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = await parlamentarPorSlug((u.searchParams.get("parlamentar") ?? "").slice(0, 120));
  const ano = Number(u.searchParams.get("ano"));
  if (!p || !Number.isInteger(ano) || ano < 2019 || ano > 2100) return new Response("Parâmetros inválidos", { status: 400 });
  const linhas = await despesasDoAno(p.id, ano);
  const csv = gerarCsv(
    [
      { chave: "data", titulo: "data_documento" }, { chave: "mes", titulo: "mes" }, { chave: "categoria", titulo: "categoria" },
      { chave: "fornecedor", titulo: "fornecedor" }, { chave: "cnpj", titulo: "cnpj" }, { chave: "valor", titulo: "valor_reais" }, { chave: "url", titulo: "comprovante" },
    ],
    linhas.map((l) => ({ ...l, valor: Number(l.valor) })),
  );
  return respostaCsv(`gastos-${p.slug}-${ano}.csv`, csv);
}
