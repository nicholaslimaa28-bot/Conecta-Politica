"use client";
// Funções do navegador para os alertas (Web Push). Só rodam no cliente.

export const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type Suporte = "ok" | "sem-chave" | "nao-suportado" | "ios-instalar" | "bloqueado";

export function verificarSuporte(): Suporte {
  if (!CHAVE_PUBLICA) return "sem-chave";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  // No iPhone, notificações só funcionam com o site adicionado à Tela de Início
  if (ios && !instalado) return "ios-instalar";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "nao-suportado";
  return "ok";
}

/** Estado da permissão de notificações. Prefere a API de permissões (mais confiável em alguns navegadores). */
export async function permissaoNotificacao(): Promise<NotificationPermission> {
  try {
    const r = await navigator.permissions.query({ name: "notifications" as PermissionName });
    return r.state === "prompt" ? "default" : (r.state as NotificationPermission);
  } catch {
    return Notification.permission;
  }
}

function base64ParaBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const saida = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) saida[i] = bruto.charCodeAt(i);
  return saida;
}

async function registro() {
  await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  return navigator.serviceWorker.ready;
}

/** Assinatura atual deste navegador, sem pedir permissão. */
export async function assinaturaAtual(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Pede permissão (se preciso) e devolve a assinatura deste navegador. */
export async function assinar(): Promise<PushSubscription> {
  const permissao = (await permissaoNotificacao()) === "granted" ? "granted" : await Notification.requestPermission();
  if (permissao !== "granted") throw new Error("permissao-negada");
  const reg = await registro();
  return (await reg.pushManager.getSubscription()) ??
    reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ParaBytes(CHAVE_PUBLICA) });
}

export async function chamarApi<T = { ok?: boolean; erro?: string }>(corpo: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/alertas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados.erro ?? `HTTP ${r.status}`);
  return dados;
}
