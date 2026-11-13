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
