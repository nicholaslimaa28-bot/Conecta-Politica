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
