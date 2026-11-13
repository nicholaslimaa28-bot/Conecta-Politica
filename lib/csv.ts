// Leitor de CSV dos arquivos de dados abertos (separador ";", campos entre aspas,
// aspas escapadas como "" e quebras de linha dentro de campos). Ignora o BOM inicial.

export function* linhasCsv(texto: string, separador = ";"): Generator<string[]> {
  let i = texto.charCodeAt(0) === 0xfeff ? 1 : 0;
  const n = texto.length;
  while (i < n) {
    const campos: string[] = [];
    let campo = "";
    let fimDaLinha = false;
    while (!fimDaLinha) {
      if (texto[i] === '"') {
        // Campo entre aspas: vai até a aspa que não é seguida de outra aspa
        i++;
        let inicio = i;
        for (;;) {
          const j = texto.indexOf('"', i);
          if (j < 0) { campo += texto.slice(inicio); i = n; break; }
          if (texto[j + 1] === '"') { campo += texto.slice(inicio, j + 1); i = j + 2; inicio = i; continue; }
          campo += texto.slice(inicio, j);
          i = j + 1;
          break;
        }
      }
      // Restante do campo (sem aspas) até o separador ou o fim da linha
      while (i < n && texto[i] !== separador && texto[i] !== "\n" && texto[i] !== "\r") campo += texto[i++];
      campos.push(campo);
      campo = "";
      if (i >= n) fimDaLinha = true;
      else if (texto[i] === separador) i++;
      else {
        if (texto[i] === "\r" && texto[i + 1] === "\n") i += 2; else i++;
        fimDaLinha = true;
      }
    }
    if (!(campos.length === 1 && campos[0] === "")) yield campos;
  }
}

/** Converte em objetos usando a primeira linha como cabeçalho. */
export function* registrosCsv(texto: string, separador = ";"): Generator<Record<string, string>> {
  let cabecalho: string[] | null = null;
  for (const linha of linhasCsv(texto, separador)) {
    if (!cabecalho) { cabecalho = linha; continue; }
    const r: Record<string, string> = {};
    for (let k = 0; k < cabecalho.length; k++) r[cabecalho[k]] = linha[k] ?? "";
    yield r;
  }
}

// ---------- Geração de CSV (exportação) ----------

type Valor = string | number | boolean | Date | null | undefined;

/** Escapa um campo: aspas duplas, e o campo entre aspas se tiver separador, aspas ou quebra de linha. */
function campo(v: Valor, separador: string): string {
  if (v == null) return "";
  let s: string;
  // Datas no horário de Brasília, formato "AAAA-MM-DD HH:MM" (ordenável e legível no Excel)
  if (v instanceof Date) s = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(v);
  else if (typeof v === "number") s = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ","); // vírgula decimal (Excel em português)
  else s = String(v);
  // Evita que planilhas interpretem o texto como fórmula (=, +, -, @ no início)
  if (/^[=+\-@]/.test(s) && typeof v === "string") s = "'" + s;
  return /["\n\r]/.test(s) || s.includes(separador) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Monta um CSV com BOM (acentos corretos no Excel) e separador ";". */
export function gerarCsv(colunas: { chave: string; titulo: string }[], linhas: Record<string, Valor>[], separador = ";"): string {
  const cab = colunas.map((c) => campo(c.titulo, separador)).join(separador);
  const corpo = linhas.map((l) => colunas.map((c) => campo(l[c.chave], separador)).join(separador));
  return "﻿" + [cab, ...corpo].join("\r\n") + "\r\n";
}

export function respostaCsv(nomeArquivo: string, conteudo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo.replace(/[^a-z0-9._-]/gi, "_")}"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
