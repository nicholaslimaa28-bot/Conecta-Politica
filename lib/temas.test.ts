import { describe, it, expect } from "vitest";
import { TEMAS, temasDoTexto, temaPorSlug } from "./temas";

const nomes = (texto: string) => temasDoTexto(texto).map((id) => TEMAS.find((t) => t.id === id)!.slug);

describe("temas", () => {
  it("ids e slugs são únicos", () => {
    expect(new Set(TEMAS.map((t) => t.id)).size).toBe(TEMAS.length);
    expect(new Set(TEMAS.map((t) => t.slug)).size).toBe(TEMAS.length);
    expect(temaPorSlug("saude")?.nome).toBe("Saúde");
  });

  it.each([
    ["Dispõe sobre a obrigatoriedade de vacinação no Sistema Único de Saúde (SUS).", ["saude"]],
    ["Altera a Lei de Execução Penal e o Código Penal.", ["seguranca-publica"]],
    ["Institui o Exame Nacional de Avaliação da Formação Médica", ["saude"]],
    ["Concede apoio financeiro aos produtores independentes de cana-de-açúcar da Região Nordeste", ["economia-e-tributos"]],
    ["Altera a Consolidação das Leis do Trabalho para dispor sobre jornada", ["trabalho-e-previdencia"]],
    ["Dispõe sobre a proteção de dados pessoais de crianças e adolescentes na internet", ["tecnologia", "direitos-e-cidadania"]],
    ["Denomina viaduto localizado no Município de Itu", []],
  ])("%s", (texto, esperado) => expect(nomes(texto)).toEqual(esperado));

  it("palavra-chave só no início de palavra (evita falsos positivos)", () => {
    expect(nomes("Dispõe sobre o assustador caso")).toEqual([]); // "sus" dentro de "assustador" não conta
    expect(nomes("texto vazio")).toEqual([]);
    expect(temasDoTexto(null)).toEqual([]);
  });
});
