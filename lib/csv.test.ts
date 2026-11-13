import { describe, it, expect } from "vitest";
import { linhasCsv, registrosCsv } from "./csv";

describe("leitor de CSV", () => {
  it("lida com aspas, aspas escapadas, separador e quebra de linha dentro do campo", () => {
    const t = '﻿"a";"b";c\r\n"1";"texto com ""aspas""; e ponto e vírgula";x\n"2";"linha 1\nlinha 2";\n';
    expect([...linhasCsv(t)]).toEqual([
      ["a", "b", "c"],
      ["1", 'texto com "aspas"; e ponto e vírgula', "x"],
      ["2", "linha 1\nlinha 2", ""],
    ]);
  });

  it("monta registros pelo cabeçalho", () => {
    expect([...registrosCsv('"id";"nome"\n"1";"Ana"\n')]).toEqual([{ id: "1", nome: "Ana" }]);
  });
});

import { gerarCsv } from "./csv";

describe("geração de CSV", () => {
  it("escapa, usa vírgula decimal, BOM e protege contra fórmulas", () => {
    const csv = gerarCsv(
      [{ chave: "a", titulo: "Texto" }, { chave: "b", titulo: "Valor" }],
      [{ a: 'Diz "olá"; tchau', b: 1234.5 }, { a: "=SOMA(A1)", b: 10 }, { a: null, b: null }],
    );
    expect(csv.startsWith("﻿Texto;Valor\r\n")).toBe(true);
    expect(csv).toContain('"Diz ""olá""; tchau";1234,50');
    expect(csv).toContain("'=SOMA(A1);10");
    expect(csv.endsWith(";\r\n")).toBe(true);
    // ida e volta com o leitor do próprio projeto
    const linhas = [...linhasCsv(csv)];
    expect(linhas[1]).toEqual(['Diz "olá"; tchau', "1234,50"]);
    // data em Brasília
    expect(gerarCsv([{ chave: "d", titulo: "d" }], [{ d: new Date("2026-11-12T23:29:28Z") }])).toContain("2026-11-12 20:29");
  });
});
