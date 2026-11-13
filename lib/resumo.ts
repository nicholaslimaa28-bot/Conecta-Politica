// Resumo "Brasília Hoje" — montagem do texto a partir dos dados do dia (função pura, testada).
// Edição da manhã (7h): o que vem hoje + o que aconteceu ontem. Edição da noite (20h): o dia + amanhã.

export type Edicao = "manha" | "noite";

export type DadosResumo = {
  votacoes: { id: number; casa: string; descricao: string; aprovada: boolean | null; nominal: boolean; placarSim: number | null; placarNao: number | null; proposicao: { sigla: string; numero: number; ano: number; slug: string; apelido: string | null } | null }[];
  leis: { nome: string; ementa: string | null; url: string; proposicao: { sigla: string; numero: number; ano: number; slug: string } | null }[];
  vetos: { numero: number; ano: number; total: boolean | null; assunto: string | null; proposicao: { sigla: string; numero: number; ano: number; slug: string } | null }[];
  mpvs: { numero: number; ano: number; slug: string; ementa: string | null }[];
  sessoes: { id: number; casa: string; titulo: string; inicio: Date; status: string; deliberativa: boolean | null; pautaTitulos: string[] }[];
  agendaPresidente: { titulo: string; inicioTexto: string | null; horaLocal?: boolean }[] | null; // null = agenda não publicada
};

export type Item = { texto: string; detalhe?: string; url?: string };
export type Secao = { titulo: string; itens: Item[]; vazio: string };
export type Resumo = { titulo: string; subtitulo: string; secoes: Secao[]; chamada: string };

const CASA: Record<string, string> = { CD: "Câmara", SF: "Senado", CN: "Congresso" };
const corta = (s: string | null | undefined, n = 160) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s ?? "");
const nomeProp = (p: { sigla: string; numero: number; ano: number }) => `${p.sigla} ${p.numero}/${p.ano}`;

function itensVotacoes(v: DadosResumo["votacoes"]): Item[] {
  // Uma linha por proposição (várias votações da mesma matéria viram uma), destacando as nominais
  const porChave = new Map<string, DadosResumo["votacoes"]>();
  for (const x of v) {
    const chave = x.proposicao ? x.proposicao.slug : `v${x.id}`;
    porChave.set(chave, [...(porChave.get(chave) ?? []), x]);
  }
  return [...porChave.values()].map((grupo) => {
    const principal = grupo.find((g) => g.nominal) ?? grupo[0];
    const p = principal.proposicao;
    const resultado = principal.aprovada == null ? "" : principal.aprovada ? "aprovado" : "rejeitado";
    const placar = principal.nominal && principal.placarSim != null ? ` (Sim ${principal.placarSim}, Não ${principal.placarNao ?? 0})` : "";
    const mais = grupo.length > 1 ? ` · ${grupo.length} votações` : "";
    return {
      texto: `${CASA[principal.casa] ?? principal.casa}: ${p ? nomeProp(p) + (p.apelido ? ` — ${p.apelido}` : "") : corta(principal.descricao, 90)}`,
      detalhe: `${resultado}${placar}${mais}`.replace(/^ · /, "") || undefined,
      url: p ? `/proposicao/${p.slug}` : `/votacao/${principal.id}`,
    };
  });
}

function itensAtos(d: DadosResumo): Item[] {
  return [
    ...d.leis.map((l) => ({ texto: l.nome + (l.proposicao ? ` (${nomeProp(l.proposicao)})` : ""), detalhe: corta(l.ementa), url: l.proposicao ? `/proposicao/${l.proposicao.slug}` : l.url })),
    ...d.vetos.map((v) => ({ texto: `Veto ${v.total ? "total" : "parcial"} nº ${v.numero}/${v.ano}${v.proposicao ? ` ao ${nomeProp(v.proposicao)}` : ""}`, detalhe: v.assunto ?? undefined, url: v.proposicao ? `/proposicao/${v.proposicao.slug}` : "/executivo#vetos" })),
    ...d.mpvs.map((m) => ({ texto: `Medida provisória ${m.numero}/${m.ano}`, detalhe: corta(m.ementa), url: `/proposicao/${m.slug}` })),
  ];
}

function itensSessoes(s: DadosResumo["sessoes"], hora: (d: Date) => string): Item[] {
  return s.map((x) => ({
    texto: `${hora(x.inicio)} · ${CASA[x.casa] ?? x.casa}: ${x.titulo}${x.status === "cancelada" ? " (cancelada)" : ""}`,
    detalhe: x.pautaTitulos.length ? `Pauta: ${x.pautaTitulos.slice(0, 4).join(", ")}${x.pautaTitulos.length > 4 ? ` e mais ${x.pautaTitulos.length - 4}` : ""}` : undefined,
    url: `/sessao/${x.id}`,
  }));
}

/**
 * Monta o resumo. `principal` = dados do período principal (manhã: ontem; noite: hoje);
 * `agenda` = sessões do período seguinte (manhã: hoje; noite: amanhã) e a agenda do Presidente.
 */
export function montarResumo(edicao: Edicao, rotuloDia: string, principal: DadosResumo, agenda: DadosResumo, hora: (d: Date) => string): Resumo {
  const votos = itensVotacoes(principal.votacoes);
  const atos = itensAtos(principal);
  const sessoes = itensSessoes(agenda.sessoes.filter((s) => s.deliberativa !== false), hora);
  const presidente = (edicao === "manha" ? agenda.agendaPresidente : principal.agendaPresidente);
  const secaoPresidente: Secao = {
    titulo: "Agenda do Presidente hoje",
    itens: (presidente ?? []).map((c) => ({ texto: `${c.inicioTexto ?? "—"}${c.horaLocal ? " (hora local)" : ""} · ${c.titulo}` })),
    vazio: presidente === null ? "A Presidência ainda não publicou a agenda." : "Sem compromissos oficiais publicados.",
  };
  const quandoPrincipal = edicao === "manha" ? "ontem" : "hoje";
  const secoes: Secao[] = edicao === "manha"
    ? [
        { titulo: "Na pauta hoje", itens: sessoes, vazio: "Nenhuma sessão deliberativa nos Plenários hoje." },
        secaoPresidente,
        { titulo: "Votado ontem", itens: votos, vazio: "Nenhuma votação em Plenário ontem." },
        { titulo: "Publicado ontem (leis, vetos e MPs)", itens: atos, vazio: "Nenhuma lei, veto ou medida provisória publicada ontem." },
      ]
    : [
        { titulo: "Votado hoje", itens: votos, vazio: "Nenhuma votação em Plenário hoje." },
        { titulo: "Publicado hoje (leis, vetos e MPs)", itens: atos, vazio: "Nenhuma lei, veto ou medida provisória publicada hoje." },
        secaoPresidente,
        { titulo: "Na pauta amanhã", itens: sessoes, vazio: "Nenhuma sessão deliberativa publicada para amanhã até agora." },
      ];

  // Chamada curta para a notificação: só fatos e contagens
  const partes: string[] = [];
  if (votos.length) partes.push(`${votos.length} ${votos.length === 1 ? "matéria votada" : "matérias votadas"} ${quandoPrincipal}`);
  if (principal.leis.length) partes.push(`${principal.leis.length} ${principal.leis.length === 1 ? "lei publicada" : "leis publicadas"}`);
  if (principal.vetos.length) partes.push(`${principal.vetos.length} ${principal.vetos.length === 1 ? "veto" : "vetos"}`);
  if (sessoes.length) partes.push(`${sessoes.length} ${sessoes.length === 1 ? "sessão" : "sessões"} ${edicao === "manha" ? "hoje" : "amanhã"}`);
  const chamada = partes.length ? partes.join(" · ") : edicao === "manha" ? "Dia sem sessões deliberativas nos Plenários." : "Dia sem votações em Plenário.";

  return {
    titulo: `Brasília Hoje — ${edicao === "manha" ? "manhã" : "noite"}`,
    subtitulo: rotuloDia,
    secoes,
    chamada,
  };
}
