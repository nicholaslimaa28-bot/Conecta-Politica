import { describe, it, expect } from "vitest";
import { montarResumo, type DadosResumo } from "./resumo";

const vazio: DadosResumo = { votacoes: [], leis: [], vetos: [], mpvs: [], sessoes: [], agendaPresidente: null };
const hora = (d: Date) => d.toISOString().slice(11, 16);
const pec = { sigla: "PEC", numero: 18, ano: 2025, slug: "pec-18-2025", apelido: "PEC da Segurança Pública" };

describe("resumo Brasília Hoje", () => {
  it("dia vazio tem textos claros, sem inventar nada", () => {
    const r = montarResumo("noite", "13/11/2026", vazio, vazio, hora);
    expect(r.chamada).toBe("Dia sem votações em Plenário.");
    expect(r.secoes.map((s) => s.itens.length)).toEqual([0, 0, 0, 0]);
    expect(r.secoes[2].vazio).toBe("A Presidência ainda não publicou a agenda.");
  });

  it("agrupa várias votações da mesma proposição e destaca a nominal", () => {
    const d: DadosResumo = {
      ...vazio,
      votacoes: [
        { id: 1, casa: "SF", descricao: "Requerimento", aprovada: true, nominal: false, placarSim: null, placarNao: null, proposicao: pec },
        { id: 2, casa: "SF", descricao: "Texto principal", aprovada: true, nominal: true, placarSim: 49, placarNao: 20, proposicao: pec },
        { id: 3, casa: "CD", descricao: "Aprovado o requerimento de urgência", aprovada: true, nominal: false, placarSim: null, placarNao: null, proposicao: null },
      ],
    };
    const r = montarResumo("noite", "13/11/2026", d, vazio, hora);
    const votado = r.secoes[0].itens;
    expect(votado).toHaveLength(2);
    expect(votado[0]).toEqual({ texto: "Senado: PEC 18/2025 — PEC da Segurança Pública", detalhe: "aprovado (Sim 49, Não 20) · 2 votações", url: "/proposicao/pec-18-2025" });
    expect(votado[1].url).toBe("/votacao/3");
    expect(r.chamada).toBe("2 matérias votadas hoje");
  });

  it("edição da manhã: pauta de hoje primeiro e chamada com contagens", () => {
    const agenda: DadosResumo = {
      ...vazio,
      sessoes: [
        { id: 9, casa: "SF", titulo: "Sessão Deliberativa Ordinária", inicio: new Date("2026-11-17T17:00:00Z"), status: "agendada", deliberativa: true, pautaTitulos: ["PL 1/2026", "PL 2/2026", "PL 3/2026", "PL 4/2026", "PL 5/2026"] },
        { id: 10, casa: "CD", titulo: "Sessão Solene", inicio: new Date("2026-11-17T13:00:00Z"), status: "agendada", deliberativa: false, pautaTitulos: [] },
      ],
      agendaPresidente: [{ titulo: "Reunião com ministros", inicioTexto: "10h00" }, { titulo: "Cúpula", inicioTexto: "14h00", horaLocal: true }],
    };
    const ontem: DadosResumo = { ...vazio, leis: [{ nome: "Lei nº 15.528 de 11/11/2026", ementa: "Autoriza…", url: "https://normas.leg.br/x", proposicao: { sigla: "PL", numero: 5649, ano: 2026, slug: "pl-5649-2026" } }] };
    const r = montarResumo("manha", "17/11/2026", ontem, agenda, hora);
    expect(r.titulo).toBe("Brasília Hoje — manhã");
    expect(r.secoes[0].titulo).toBe("Na pauta hoje");
    expect(r.secoes[0].itens).toHaveLength(1); // sessão solene (não deliberativa) fica de fora
    expect(r.secoes[0].itens[0].detalhe).toBe("Pauta: PL 1/2026, PL 2/2026, PL 3/2026, PL 4/2026 e mais 1");
    expect(r.secoes[1].itens[0].texto).toBe("10h00 · Reunião com ministros");
    expect(r.secoes[1].itens[1].texto).toBe("14h00 (hora local) · Cúpula");
    expect(r.secoes[3].itens[0]).toMatchObject({ texto: "Lei nº 15.528 de 11/11/2026 (PL 5649/2026)", url: "/proposicao/pl-5649-2026" });
    expect(r.chamada).toBe("1 lei publicada · 1 sessão hoje");
  });
});
