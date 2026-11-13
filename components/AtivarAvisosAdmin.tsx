"use client";
// Ativação dos avisos de falha das coletas: pede o código de administrador (não é guardado no navegador).
import { useState } from "react";
import { BotaoSeguir } from "./BotaoSeguir";

export function AtivarAvisosAdmin() {
  const [codigo, setCodigo] = useState("");
  return (
    <div className="space-y-3">
      <label className="block text-sm">Código de administrador
        <input type="password" autoComplete="off" value={codigo} onChange={(e) => setCodigo(e.target.value.trim())}
          className="mt-1 block w-full max-w-sm rounded border border-borda bg-superficie px-2 py-1" />
      </label>
      {codigo.length >= 16 ? (
        <BotaoSeguir alvoTipo="admin" alvoId={1} nome="os avisos de falha das coletas" codigo={codigo} />
      ) : <p className="text-sm text-suave">Cole o código para liberar o botão.</p>}
    </div>
  );
}
