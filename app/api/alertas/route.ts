// API dos alertas. O aparelho é identificado só pela assinatura de Web Push do navegador:
// não há conta, e-mail ou qualquer dado pessoal.
import { sql } from "@/lib/db";
import { validarAssinatura, validarAlvo, codigoAdminValido } from "@/lib/alertas";

const json = (dados: unknown, status = 200) => Response.json(dados, { status, headers: { "Cache-Control": "no-store" } });

type Corpo = { acao?: string; assinatura?: unknown; endpoint?: unknown; alvoTipo?: unknown; alvoId?: unknown; codigo?: unknown };

async function idAssinatura(endpoint: unknown): Promise<number | null> {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return null;
  const [r] = await sql<{ id: number }[]>`SELECT id FROM push_assinatura WHERE endpoint = ${endpoint}`;
  return r?.id ?? null;
}

export async function POST(req: Request) {
  let corpo: Corpo;
  try {
    const texto = await req.text();
    if (texto.length > 5000) return json({ erro: "requisição grande demais" }, 413);
    corpo = JSON.parse(texto);
  } catch {
    return json({ erro: "JSON inválido" }, 400);
  }

  switch (corpo.acao) {
    case "seguir": {
      const a = validarAssinatura(corpo.assinatura);
      const alvo = validarAlvo(corpo.alvoTipo, corpo.alvoId);
      if (!a || !alvo) return json({ erro: "assinatura ou alvo inválido" }, 400);
      // Avisos de falha das coletas: só com o código de administrador (ADMIN_ALERTAS_CODIGO na Vercel)
      if (alvo.tipo === "admin" && !codigoAdminValido(corpo.codigo, process.env.ADMIN_ALERTAS_CODIGO)) {
        return json({ erro: "código de administrador inválido" }, 403);
      }
      // O alvo precisa existir (o resumo diário e o admin já foram validados pelo id)
      if (alvo.tipo === "parlamentar" || alvo.tipo === "proposicao") {
        const tabela = alvo.tipo === "parlamentar" ? sql`parlamentar` : sql`proposicao`;
        const [existe] = await sql`SELECT 1 FROM ${tabela} WHERE id = ${alvo.id}`;
        if (!existe) return json({ erro: "alvo não encontrado" }, 404);
      }
      const [r] = await sql<{ id: number }[]>`
        INSERT INTO push_assinatura (endpoint, p256dh, auth) VALUES (${a.endpoint}, ${a.keys.p256dh}, ${a.keys.auth})
        ON CONFLICT (endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth RETURNING id`;
      const [{ n }] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM inscricao WHERE assinatura_id = ${r.id}`;
      if (n >= 200) return json({ erro: "limite de 200 itens seguidos por aparelho" }, 429);
      await sql`INSERT INTO inscricao (assinatura_id, alvo_tipo, alvo_id) VALUES (${r.id}, ${alvo.tipo}, ${alvo.id}) ON CONFLICT DO NOTHING`;
      return json({ ok: true });
    }
    case "deixar": {
      const id = await idAssinatura(corpo.endpoint);
      const alvo = validarAlvo(corpo.alvoTipo, corpo.alvoId);
      if (!id || !alvo) return json({ ok: true });
      await sql`DELETE FROM inscricao WHERE assinatura_id = ${id} AND alvo_tipo = ${alvo.tipo} AND alvo_id = ${alvo.id}`;
      return json({ ok: true });
    }
    case "listar": {
      const id = await idAssinatura(corpo.endpoint);
      if (!id) return json({ itens: [] });
      const itens = await sql<{ alvoTipo: string; alvoId: number; titulo: string; detalhe: string | null; url: string }[]>`
        SELECT i.alvo_tipo AS "alvoTipo", i.alvo_id AS "alvoId",
          CASE WHEN i.alvo_tipo = 'admin' THEN 'Avisos de falha das coletas'
               WHEN i.alvo_tipo = 'resumo' THEN 'Brasília Hoje — ' || CASE i.alvo_id WHEN 1 THEN 'manhã (7h)' ELSE 'noite (20h)' END
               ELSE coalesce(pa.nome_parlamentar, pr.sigla || ' ' || pr.numero || '/' || pr.ano) END AS titulo,
          CASE WHEN i.alvo_tipo = 'admin' THEN 'Administração do site'
               WHEN i.alvo_tipo = 'resumo' THEN 'Resumo diário dos três Poderes'
               WHEN pa.id IS NOT NULL THEN (CASE pa.casa WHEN 'CD' THEN 'Deputado(a) · ' ELSE 'Senador(a) · ' END) || coalesce(pa.partido, '') || '-' || coalesce(pa.uf, '')
               ELSE left(coalesce(pr.apelido, pr.ementa), 140) END AS detalhe,
          CASE WHEN i.alvo_tipo = 'admin' THEN '/status' WHEN i.alvo_tipo = 'resumo' THEN '/brasilia-hoje' WHEN pa.id IS NOT NULL THEN '/parlamentar/' || pa.slug ELSE '/proposicao/' || pr.slug END AS url
        FROM inscricao i
        LEFT JOIN parlamentar pa ON i.alvo_tipo = 'parlamentar' AND pa.id = i.alvo_id
        LEFT JOIN proposicao pr ON i.alvo_tipo = 'proposicao' AND pr.id = i.alvo_id
        WHERE i.assinatura_id = ${id} ORDER BY i.criado_em DESC`;
      return json({ itens });
    }
    case "cancelar_tudo": {
      const id = await idAssinatura(corpo.endpoint);
      if (id) await sql`DELETE FROM push_assinatura WHERE id = ${id}`; // inscrições e histórico caem em cascata
      return json({ ok: true });
    }
    default:
      return json({ erro: "ação desconhecida" }, 400);
  }
}
