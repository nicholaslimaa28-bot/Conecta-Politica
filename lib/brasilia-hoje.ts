// Carrega o resumo "Brasília Hoje" de um dia/edição (usado pela página e pelo envio às 7h e 20h).
import { dadosDoDia } from "@/lib/consultas";
import { montarResumo, type Edicao, type Resumo } from "@/lib/resumo";
import { hojeBrasilia, somarDias, formatarData, formatarHora, FUSO } from "@/lib/tempo";

/** Edição vigente agora: das 7h às 19h59, a da manhã; a partir das 20h, a da noite; de madrugada, a da noite anterior. */
export function edicaoVigente(agora = new Date()): { dia: string; edicao: Edicao } {
  const hora = Number(new Intl.DateTimeFormat("en-GB", { timeZone: FUSO, hour: "2-digit", hourCycle: "h23" }).format(agora));
  const hoje = hojeBrasilia(agora);
  if (hora < 7) return { dia: somarDias(hoje, -1), edicao: "noite" };
  return { dia: hoje, edicao: hora < 20 ? "manha" : "noite" };
}

export async function carregarResumo(dia: string, edicao: Edicao): Promise<Resumo> {
  // Manhã: principal = ontem, agenda = hoje. Noite: principal = hoje, agenda = amanhã (e a agenda do Presidente de hoje).
  const [principal, agenda] = edicao === "manha"
    ? await Promise.all([dadosDoDia(somarDias(dia, -1)), dadosDoDia(dia)])
    : await Promise.all([dadosDoDia(dia), dadosDoDia(somarDias(dia, 1))]);
  return montarResumo(edicao, formatarData(dia, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), principal, agenda, formatarHora);
}
