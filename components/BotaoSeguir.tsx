"use client";
// Botão "Seguir": recebe avisos no celular/computador sobre um parlamentar ou proposição. Sem conta.
import { useEffect, useState } from "react";
import Link from "next/link";
import { verificarSuporte, permissaoNotificacao, assinaturaAtual, assinar, chamarApi, type Suporte } from "@/lib/push-cliente";

type Props = { alvoTipo: "parlamentar" | "proposicao" | "resumo" | "admin" | "tema"; alvoId: number; nome: string; codigo?: string };

const AJUDA: Record<Exclude<Suporte, "ok" | "sem-chave">, string> = {
  "ios-instalar": "No iPhone, os alertas funcionam com o site na Tela de Início: toque em Compartilhar → Adicionar à Tela de Início e abra por lá.",
  "nao-suportado": "Este navegador não recebe notificações. Tente o Chrome, Firefox, Edge ou Safari atualizados.",
  "bloqueado": "As notificações deste site estão bloqueadas. Libere nas configurações do navegador (ícone de cadeado ao lado do endereço).",
};

export function BotaoSeguir({ alvoTipo, alvoId, nome, codigo }: Props) {
  const [suporte, setSuporte] = useState<Suporte | null>(null);
  const [seguindo, setSeguindo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    const s = verificarSuporte();
    setSuporte(s);
    if (s !== "ok") return;
    permissaoNotificacao().then((p) => { if (p === "denied") setSuporte("bloqueado"); });
    // Já segue? Consulta pela assinatura existente (não pede permissão)
    assinaturaAtual().then(async (sub) => {
      if (!sub) return;
      const { itens } = await chamarApi<{ itens: { alvoTipo: string; alvoId: number }[] }>({ acao: "listar", endpoint: sub.endpoint });
      setSeguindo(itens.some((i) => i.alvoTipo === alvoTipo && i.alvoId === alvoId));
    }).catch(() => {});
  }, [alvoTipo, alvoId]);

  if (!suporte || suporte === "sem-chave") return null; // alertas ainda não configurados no servidor

  async function alternar() {
    setOcupado(true);
    setMensagem(null);
    try {
      if (seguindo) {
        const sub = await assinaturaAtual();
        if (sub) await chamarApi({ acao: "deixar", endpoint: sub.endpoint, alvoTipo, alvoId });
        setSeguindo(false);
        setMensagem(alvoTipo === "resumo" || alvoTipo === "admin" ? `Você não vai mais receber ${nome}.` : `Você deixou de seguir ${nome}.`);
      } else {
        const sub = await assinar();
        await chamarApi({ acao: "seguir", assinatura: sub.toJSON(), alvoTipo, alvoId, codigo });
        setSeguindo(true);
        setMensagem(alvoTipo === "resumo" || alvoTipo === "admin" ? `Pronto! Você vai receber ${nome} neste aparelho.` : `Pronto! Você vai receber avisos sobre ${nome} neste aparelho.`);
      }
    } catch (e) {
      const msg = (e as Error).message;
      setMensagem(msg === "permissao-negada"
        ? "Sem permissão para notificações, não conseguimos avisar. Você pode liberar nas configurações do navegador."
        : msg.includes("código") ? "Código de administrador inválido."
        : "Não foi possível concluir agora. Tente de novo em instantes.");
      if ((await permissaoNotificacao()) === "denied") setSuporte("bloqueado");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="text-sm">
      {suporte === "ok" ? (
        <button type="button" onClick={alternar} disabled={ocupado} aria-pressed={seguindo}
          className={`rounded border px-3 py-1.5 font-medium ${seguindo ? "border-legislativo bg-legislativo/10 text-legislativo" : "border-borda bg-superficie"}`}>
          {ocupado ? "Aguarde…" : alvoTipo === "resumo" || alvoTipo === "admin" ? (seguindo ? "✓ Recebendo" : "🔔 Receber") : seguindo ? "✓ Seguindo" : "🔔 Seguir"}
        </button>
      ) : (
        <p className="max-w-md text-suave">🔔 {AJUDA[suporte]}</p>
      )}
      {mensagem && <p role="status" className="mt-1 text-suave">{mensagem} <Link href="/alertas">Meus alertas</Link></p>}
    </div>
  );
}
