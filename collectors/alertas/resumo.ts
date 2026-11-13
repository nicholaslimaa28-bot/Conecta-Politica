// Envio do resumo "Brasília Hoje" às 7h (manhã) e às 20h (noite) para quem pediu.
import { sql } from "@/lib/db";
import { executarTarefa } from "../comum";
import { configurarVapid, enviarAviso } from "./enviar";
import { carregarResumo } from "@/lib/brasilia-hoje";
import { RESUMO_MANHA, RESUMO_NOITE } from "@/lib/alertas";
import type { Edicao } from "@/lib/resumo";
import { hojeBrasilia } from "@/lib/tempo";

export const resumo = (edicao: Edicao) =>
  executarTarefa("alertas", `resumo_${edicao}`, async (c) => {
    if (edicao !== "manha" && edicao !== "noite") throw new Error(`edição inválida: ${edicao}`);
    if (!configurarVapid()) { console.log("[resumo] chaves VAPID não configuradas"); return; }
    const dia = hojeBrasilia();
    const r = await carregarResumo(dia, edicao);
    const destinos = await sql<{ id: number; endpoint: string; p256dh: string; auth: string }[]>`
      SELECT a.id, a.endpoint, a.p256dh, a.auth FROM inscricao i JOIN push_assinatura a ON a.id = i.assinatura_id
      WHERE i.alvo_tipo = 'resumo' AND i.alvo_id = ${edicao === "manha" ? RESUMO_MANHA : RESUMO_NOITE}`;
    const aviso = { titulo: r.titulo, corpo: r.chamada, url: `/brasilia-hoje?data=${dia}&edicao=${edicao}` };
    for (const d of destinos) {
      if ((await enviarAviso(d, aviso)) === "ok") c.alterados++;
    }
    c.lidos = destinos.length;
    console.log(`[resumo ${edicao}] "${r.chamada}" → ${c.alterados} de ${destinos.length} aparelhos`);
  });
