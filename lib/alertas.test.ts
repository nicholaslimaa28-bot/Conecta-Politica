import { describe, it, expect } from "vitest";
import { avisoTema, codigoAdminValido, avisoFalha, validarAssinatura, validarAlvo, avisoVotacaoProposicao, avisoVotoParlamentar, avisoSituacao, avisoNorma, avisoVeto, agrupar } from "./alertas";

const chaves = { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" };

describe("validação de assinaturas", () => {
  it("aceita serviços de push conhecidos", () => {
    for (const e of ["https://fcm.googleapis.com/fcm/send/abc", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://web.push.apple.com/QG", "https://wns2-bl2p.notify.windows.com/w/?token=1"]) {
      expect(validarAssinatura({ endpoint: e, keys: chaves })).not.toBeNull();
    }
  });

  it("recusa endereços arbitrários, http e chaves inválidas", () => {
    expect(validarAssinatura({ endpoint: "https://exemplo.com/hook", keys: chaves })).toBeNull();
    expect(validarAssinatura({ endpoint: "http://fcm.googleapis.com/fcm/send/abc", keys: chaves })).toBeNull();
    expect(validarAssinatura({ endpoint: "https://fcm.googleapis.com.evil.com/x", keys: chaves })).toBeNull();
    expect(validarAssinatura({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "<script>", auth: "a" } })).toBeNull();
    expect(validarAssinatura(null)).toBeNull();
  });

  it("valida o alvo", () => {
    expect(validarAlvo("parlamentar", "12")).toEqual({ tipo: "parlamentar", id: 12 });
    expect(validarAlvo("assunto", 1)).toBeNull();
    expect(validarAlvo("resumo", 2)).toEqual({ tipo: "resumo", id: 2 });
    expect(validarAlvo("resumo", 3)).toBeNull();
    expect(validarAlvo("proposicao", -1)).toBeNull();
    expect(validarAlvo("proposicao", "1.5")).toBeNull();
  });
});

describe("texto dos avisos", () => {
  const p = { sigla: "PEC", numero: 18, ano: 2025, slug: "pec-18-2025" };
  const v = { id: 7, casa: "SF", descricao: "Votação nominal do requerimento", aprovada: true, placarSim: 38, placarNao: 36 };

  it("votação de proposição seguida", () => {
    expect(avisoVotacaoProposicao(v, p)).toEqual({ titulo: "PEC 18/2025: votação no Senado", corpo: "Aprovado (Sim 38, Não 36) — Votação nominal do requerimento", url: "/proposicao/pec-18-2025" });
  });

  it("voto de parlamentar seguido", () => {
    expect(avisoVotoParlamentar("Alan Rick", "nao", v, p)).toMatchObject({ titulo: "Alan Rick: Não", url: "/votacao/7" });
    expect(avisoVotoParlamentar("Alan Rick", "ausente", v, null).titulo).toBe("Alan Rick: ausente");
  });

  it("situação, lei e veto", () => {
    expect(avisoSituacao(p, "CD", "Aguardando Envio ao Senado Federal").titulo).toBe("PEC 18/2025: nova situação na Câmara");
    expect(avisoNorma(p, "Lei nº 15.528 de 11/11/2026")).toMatchObject({ titulo: "PEC 18/2025 virou lei", corpo: "Lei nº 15.528 de 11/11/2026" });
    expect(avisoVeto(p, { numero: 3, ano: 2026, total: true, resultado: "aguardando" }, true).titulo).toBe("PEC 18/2025: veto total publicado");
    expect(avisoVeto(p, { numero: 3, ano: 2026, total: true, resultado: "derrubado" }, false).titulo).toBe("PEC 18/2025: veto derrubado pelo Congresso");
  });

  it("agrupa muitos avisos num resumo", () => {
    const a = { titulo: "x", corpo: "y", url: "/z" };
    expect(agrupar([a, a])).toHaveLength(2);
    expect(agrupar([a, a, a, a])).toEqual([{ titulo: "4 novidades sobre o que você segue", corpo: "x · x · x", url: "/alertas" }]);
  });
});

describe("avisos ao administrador", () => {
  it("texto de falha e de recuperação", () => {
    expect(avisoFalha("fonte_falhou", { fonte: "senado", tarefa: "votacoes", falhas: 3, erro: "HTTP 503 em https://legis.senado.leg.br/x" }))
      .toEqual({ titulo: "⚠️ Coleta com falha: Senado", corpo: "3 falhas seguidas em votacoes — HTTP 503 em https://legis.senado.leg.br/x", url: "/status" });
    expect(avisoFalha("fonte_recuperada", { fonte: "camara", tarefa: "agenda", falhas: 5, erro: null }).titulo).toBe("✅ Coleta normalizada: Câmara");
  });

  it("código de administrador", () => {
    const certo = "a".repeat(32);
    expect(codigoAdminValido(certo, certo)).toBe(true);
    expect(codigoAdminValido("a".repeat(31), certo)).toBe(false);
    expect(codigoAdminValido("b".repeat(32), certo)).toBe(false);
    expect(codigoAdminValido(certo, undefined)).toBe(false);   // sem código configurado: ninguém entra
    expect(codigoAdminValido("curto", "curto")).toBe(false);    // código fraco não vale
    expect(codigoAdminValido(123, certo)).toBe(false);
  });

  it("alvo admin só com id 1", () => {
    expect(validarAlvo("admin", 1)).toEqual({ tipo: "admin", id: 1 });
    expect(validarAlvo("admin", 2)).toBeNull();
  });
});

describe("temas nos alertas", () => {
  const p = { sigla: "PL", numero: 1, ano: 2026, slug: "pl-1-2026" };
  it("valida o tema", () => {
    expect(validarAlvo("tema", 1)).toEqual({ tipo: "tema", id: 1 });
    expect(validarAlvo("tema", 999)).toBeNull();
  });
  it("texto dos avisos de tema", () => {
    expect(avisoTema("Saúde", p, { tipo: "votacao", casa: "CD", aprovada: true }).titulo).toBe("Saúde: PL 1/2026 aprovado na Câmara");
    expect(avisoTema("Saúde", p, { tipo: "lei", norma: "Lei nº 1" })).toMatchObject({ titulo: "Saúde: PL 1/2026 virou lei", url: "/proposicao/pl-1-2026" });
  });
});
