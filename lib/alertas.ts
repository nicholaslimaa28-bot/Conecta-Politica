// Regras dos alertas (Fase 4A): validação das assinaturas de Web Push e texto de cada aviso.
// Funções puras, testadas em lib/alertas.test.ts. Os avisos são neutros: só fatos, com link.

export const TIPOS_ALVO = ["parlamentar", "proposicao", "resumo"] as const;
/** Resumo "Brasília Hoje": alvoId 1 = edição da manhã (7h), 2 = edição da noite (20h). */
export const RESUMO_MANHA = 1, RESUMO_NOITE = 2;
export type TipoAlvo = (typeof TIPOS_ALVO)[number];

/**
 * Só aceitamos endpoints dos serviços de push dos navegadores. Isso impede que alguém cadastre
 * um endereço qualquer e faça o disparador enviar requisições para ele.
 */
const HOSTS_PUSH = [
  /^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/,
  /\.push\.apple\.com$/, /\.notify\.windows\.com$/, /^push\.services\.mozilla\.com$/,
];

export type AssinaturaPush = { endpoint: string; keys: { p256dh: string; auth: string } };

export function validarAssinatura(x: unknown): AssinaturaPush | null {
  if (!x || typeof x !== "object") return null;
  const a = x as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof a.endpoint !== "string" || a.endpoint.length > 1000) return null;
  let url: URL;
  try { url = new URL(a.endpoint); } catch { return null; }
  if (url.protocol !== "https:" || !HOSTS_PUSH.some((h) => h.test(url.hostname))) return null;
  const { p256dh, auth } = a.keys ?? {};
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return null;
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(p256dh) || !/^[A-Za-z0-9_-]+={0,2}$/.test(auth)) return null;
  return { endpoint: a.endpoint, keys: { p256dh, auth } };
}

export function validarAlvo(tipo: unknown, id: unknown): { tipo: TipoAlvo; id: number } | null {
  if (!TIPOS_ALVO.includes(tipo as TipoAlvo)) return null;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  if (tipo === "resumo" && n !== RESUMO_MANHA && n !== RESUMO_NOITE) return null;
  return { tipo: tipo as TipoAlvo, id: n };
}

// ---------------- Texto dos avisos ----------------

export type Aviso = { titulo: string; corpo: string; url: string };

const NA_CASA: Record<string, string> = { CD: "na Câmara", SF: "no Senado", CN: "no Congresso" };
const VOTO: Record<string, string> = {
  sim: "Sim", nao: "Não", abstencao: "Abstenção", obstrucao: "Obstrução", presidente: "presidiu a sessão",
  presente_sem_voto: "presente, sem registrar voto", ausente: "ausente",
};
const RESULTADO_VETO: Record<string, string> = {
  mantido: "veto mantido pelo Congresso", derrubado: "veto derrubado pelo Congresso",
  derrubado_em_parte: "veto derrubado em parte pelo Congresso", em_deliberacao: "em deliberação no Congresso",
};

type Prop = { sigla: string; numero: number; ano: number; slug: string } | null;
const nomeProp = (p: NonNullable<Prop>) => `${p.sigla} ${p.numero}/${p.ano}`;
const corta = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function avisoVotacaoProposicao(v: { id: number; casa: string; descricao: string; aprovada: boolean | null; placarSim: number | null; placarNao: number | null }, p: NonNullable<Prop>): Aviso {
  const resultado = v.aprovada == null ? "" : v.aprovada ? "Aprovado" : "Rejeitado";
  const placar = v.placarSim != null ? ` (Sim ${v.placarSim}, Não ${v.placarNao ?? 0})` : "";
  return {
    titulo: `${nomeProp(p)}: votação ${NA_CASA[v.casa] ?? v.casa}`,
    corpo: corta(`${resultado}${placar}${resultado || placar ? " — " : ""}${v.descricao}`),
    url: `/proposicao/${p.slug}`,
  };
}

export function avisoVotoParlamentar(nome: string, tipoVoto: string, v: { id: number; casa: string; descricao: string }, p: Prop): Aviso {
  return {
    titulo: `${nome}: ${VOTO[tipoVoto] ?? tipoVoto}`,
    corpo: corta(`${p ? nomeProp(p) + " — " : ""}${v.descricao}`),
    url: `/votacao/${v.id}`,
  };
}

export function avisoSituacao(p: NonNullable<Prop>, casa: string, depois: string): Aviso {
  return { titulo: `${nomeProp(p)}: nova situação ${NA_CASA[casa] ?? casa}`, corpo: corta(depois), url: `/proposicao/${p.slug}` };
}

export function avisoNorma(p: NonNullable<Prop>, norma: string): Aviso {
  return { titulo: `${nomeProp(p)} virou lei`, corpo: corta(norma), url: `/proposicao/${p.slug}` };
}

export function avisoVeto(p: NonNullable<Prop>, veto: { numero: number; ano: number; total: boolean | null; resultado: string }, novo: boolean): Aviso {
  const tipo = veto.total ? "total" : "parcial";
  return {
    titulo: novo ? `${nomeProp(p)}: veto ${tipo} publicado` : `${nomeProp(p)}: ${RESULTADO_VETO[veto.resultado] ?? "veto atualizado"}`,
    corpo: `Veto ${tipo} nº ${veto.numero}/${veto.ano}`,
    url: `/proposicao/${p.slug}`,
  };
}

/** Muitos avisos para o mesmo aparelho numa rodada viram um resumo, para não encher o celular. */
export function agrupar(avisos: Aviso[], limite = 3): Aviso[] {
  if (avisos.length <= limite) return avisos;
  return [{ titulo: `${avisos.length} novidades sobre o que você segue`, corpo: corta(avisos.slice(0, 3).map((a) => a.titulo).join(" · ")), url: "/alertas" }];
}
