"use client";
// Botão Compartilhar: menu nativo do celular quando existe; senão, WhatsApp, X e copiar link.
import { useState } from "react";

export function Compartilhar({ titulo, texto }: { titulo: string; texto?: string }) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const url = () => window.location.href.split("#")[0];
  const mensagem = () => `${texto ?? titulo} — ${url()}`;

  async function compartilhar() {
    if (navigator.share) {
      try { await navigator.share({ title: titulo, text: texto ?? titulo, url: url() }); } catch { /* cancelado */ }
      return;
    }
    setAberto((a) => !a);
  }

  async function copiar() {
    try { await navigator.clipboard.writeText(url()); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem permissão */ }
  }

  const link = "rounded border border-borda px-2 py-1 text-sm hover:bg-borda/40";
  return (
    <div className="relative inline-block">
      <button type="button" onClick={compartilhar} aria-expanded={aberto} className="rounded border border-borda bg-superficie px-3 py-1.5 text-sm font-medium">
        ↗ Compartilhar
      </button>
      {aberto && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Opções de compartilhamento">
          <a className={link} href={`https://wa.me/?text=${encodeURIComponent(mensagem())}`} target="_blank" rel="noopener">WhatsApp</a>
          <a className={link} href={`https://x.com/intent/post?text=${encodeURIComponent(mensagem())}`} target="_blank" rel="noopener">X</a>
          <button type="button" className={link} onClick={copiar}>{copiado ? "✓ Copiado" : "Copiar link"}</button>
        </div>
      )}
    </div>
  );
}
