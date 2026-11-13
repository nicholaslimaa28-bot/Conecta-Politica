// Disparador de alertas (Fase 4A): lê as mudanças ainda não processadas, descobre quem segue
// cada parlamentar/proposição afetado e envia notificações Web Push. Roda depois de cada coleta.
import webpush from "web-push";
import { sql } from "@/lib/db";
import { executarTarefa } from "../comum";
import {
  avisoVotacaoProposicao, avisoVotoParlamentar, avisoSituacao, avisoNorma, avisoVeto, avisoFalha, agrupar, type Aviso,
} from "@/lib/alertas";

type Mudanca = { id: number; tipo: string; entidade: string; entidadeId: number; dados: Record<string, unknown>; detectadoEm: Date };
type Prop = { sigla: string; numero: number; ano: number; slug: string };
type Destino = { assinaturaId: number; mudancaId: number; aviso: Aviso };

/** Mudanças mais antigas que isso não geram aviso (ex.: as da carga inicial). */
const IDADE_MAXIMA_H = 48;

async function seguidores(tipo: "parlamentar" | "proposicao" | "admin", id: number | null): Promise<number[]> {
  if (!id) return [];
  const r = await sql<{ a: number }[]>`SELECT assinatura_id AS a FROM inscricao WHERE alvo_tipo = ${tipo} AND alvo_id = ${id}`;
  return r.map((x) => x.a);
}

async function proposicao(id: number | null): Promise<Prop | null> {
  if (!id) return null;
  const [p] = await sql<Prop[]>`SELECT sigla, numero, ano, slug FROM proposicao WHERE id = ${id}`;
  return p ?? null;
}

/** Monta os avisos de uma mudança para cada aparelho interessado. */
async function destinosDe(m: Mudanca): Promise<Destino[]> {
  const out: Destino[] = [];
  const para = (ids: number[], aviso: Aviso) => ids.forEach((a) => out.push({ assinaturaId: a, mudancaId: m.id, aviso }));

  if (m.tipo === "nova_votacao") {
    const [v] = await sql<{ id: number; casa: string; descricao: string; aprovada: boolean | null; placarSim: number | null; placarNao: number | null; proposicaoId: number | null; nominal: boolean }[]>`
      SELECT id, casa, descricao, aprovada, placar_sim AS "placarSim", placar_nao AS "placarNao", proposicao_id AS "proposicaoId", nominal
      FROM votacao WHERE id = ${m.entidadeId}`;
    if (!v) return out;
    const p = await proposicao(v.proposicaoId);
    if (p) para(await seguidores("proposicao", v.proposicaoId), avisoVotacaoProposicao(v, p));
    if (v.nominal) {
      // Quem segue um parlamentar recebe o voto dele (inclusive ausência registrada pela Casa)
      const votos = await sql<{ assinaturaId: number; nome: string; tipoVoto: string }[]>`
        SELECT i.assinatura_id AS "assinaturaId", pa.nome_parlamentar AS nome, vo.tipo_voto AS "tipoVoto"
        FROM voto vo JOIN inscricao i ON i.alvo_tipo = 'parlamentar' AND i.alvo_id = vo.parlamentar_id
        JOIN parlamentar pa ON pa.id = vo.parlamentar_id WHERE vo.votacao_id = ${v.id}`;
      for (const x of votos) out.push({ assinaturaId: x.assinaturaId, mudancaId: m.id, aviso: avisoVotoParlamentar(x.nome, x.tipoVoto, v, p) });
    }
  } else if (m.tipo === "mudou_status" && m.entidade === "proposicao") {
    const p = await proposicao(m.entidadeId);
    if (p) para(await seguidores("proposicao", m.entidadeId), avisoSituacao(p, String(m.dados.casa), String(m.dados.depois)));
  } else if (m.tipo === "virou_norma") {
    const p = await proposicao(m.entidadeId);
    if (p) para(await seguidores("proposicao", m.entidadeId), avisoNorma(p, String(m.dados.norma)));
  } else if (m.tipo === "novo_veto" || m.tipo === "veto_mudou") {
    const [v] = await sql<{ numero: number; ano: number; total: boolean | null; resultado: string; proposicaoId: number | null }[]>`
      SELECT numero, ano, total, resultado, proposicao_id AS "proposicaoId" FROM veto WHERE id = ${m.entidadeId}`;
    const p = v ? await proposicao(v.proposicaoId) : null;
    if (v && p) para(await seguidores("proposicao", v.proposicaoId), avisoVeto(p, v, m.tipo === "novo_veto"));
  } else if (m.tipo === "fonte_falhou" || m.tipo === "fonte_recuperada") {
    para(await seguidores("admin", 1), avisoFalha(m.tipo, m.dados as { fonte: string; tarefa: string; falhas: number; erro: string | null }));
  }
  // novo_evento / evento_mudou: não geram aviso nesta fase (seriam dezenas por dia)
  return out;
}

export function configurarVapid(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  // O "subject" precisa ser mailto: ou https: (o serviço de push usa para contato em caso de abuso)
  const site = process.env.SITE_URL?.startsWith("https://") ? process.env.SITE_URL : "https://conecta-politica.vercel.app";
  webpush.setVapidDetails(process.env.COLETOR_EMAIL_CONTATO ? `mailto:${process.env.COLETOR_EMAIL_CONTATO}` : site, pub, priv);
  return true;
}

/** Envia um aviso a uma assinatura. Assinaturas expiradas (404/410) são apagadas. */
export async function enviarAviso(a: { id: number; endpoint: string; p256dh: string; auth: string }, aviso: Aviso): Promise<"ok" | "expirada" | string> {
  try {
    await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, JSON.stringify(aviso), { TTL: 86_400, urgency: "normal" });
    await sql`UPDATE push_assinatura SET ultimo_envio = now() WHERE id = ${a.id}`;
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await sql`DELETE FROM push_assinatura WHERE id = ${a.id}`; // inscrições caem em cascata
      return "expirada";
    }
    return `HTTP ${status ?? "?"}`;
  }
}

export const enviar = () =>
  executarTarefa("alertas", "enviar", async (c) => {
    if (!configurarVapid()) {
      console.log("[alertas] chaves VAPID não configuradas: nenhum aviso enviado (mudanças continuam pendentes)");
      return;
    }
    // Mudanças antigas são marcadas como processadas sem aviso
    await sql`UPDATE mudanca SET processado_em = now() WHERE processado_em IS NULL AND detectado_em < now() - make_interval(hours => ${IDADE_MAXIMA_H})`;
    const pendentes = await sql<Mudanca[]>`
      SELECT id, tipo, entidade, entidade_id AS "entidadeId", dados, detectado_em AS "detectadoEm"
      FROM mudanca WHERE processado_em IS NULL ORDER BY id LIMIT 5000`;
    if (!pendentes.length) return;

    // Agrupa por aparelho, sem repetir o que já foi enviado
    const porAparelho = new Map<number, Destino[]>();
    for (const m of pendentes) {
      for (const d of await destinosDe(m)) porAparelho.set(d.assinaturaId, [...(porAparelho.get(d.assinaturaId) ?? []), d]);
    }
    for (const [assinaturaId, destinos] of porAparelho) {
      const ja = new Set((await sql<{ m: number }[]>`SELECT mudanca_id AS m FROM notificacao WHERE assinatura_id = ${assinaturaId} AND mudanca_id IN ${sql(destinos.map((d) => d.mudancaId))}`).map((x) => x.m));
      const novos = destinos.filter((d) => !ja.has(d.mudancaId));
      if (!novos.length) continue;
      const [a] = await sql<{ id: number; endpoint: string; p256dh: string; auth: string }[]>`SELECT id, endpoint, p256dh, auth FROM push_assinatura WHERE id = ${assinaturaId}`;
      if (!a) continue;
      let erro: string | null = null;
      for (const aviso of agrupar(novos.map((d) => d.aviso))) {
        const r = await enviarAviso(a, aviso);
        if (r === "ok") c.alterados++;
        else { erro = r; break; }
      }
      if (erro === "expirada") continue;
      await sql`INSERT INTO notificacao ${sql(novos.map((d) => ({ assinatura_id: assinaturaId, mudanca_id: d.mudancaId, enviado_em: erro ? null : new Date(), erro })))} ON CONFLICT DO NOTHING`;
    }
    await sql`UPDATE mudanca SET processado_em = now() WHERE id IN ${sql(pendentes.map((m) => m.id))}`;
    c.lidos = pendentes.length;
  });
