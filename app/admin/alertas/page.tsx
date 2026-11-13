// Página do administrador: receber no celular os avisos de falha das coletas.
import type { Metadata } from "next";
import Link from "next/link";
import { AtivarAvisosAdmin } from "@/components/AtivarAvisosAdmin";

export const metadata: Metadata = { title: "Avisos de falha (administração)", robots: { index: false, follow: false } };

export default function AdminAlertas() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Avisos de falha das coletas</h1>
      <p>Receba uma notificação neste aparelho quando uma fonte oficial falhar 3 vezes seguidas, e outra quando ela voltar a funcionar. O estado completo fica em <Link href="/status">/status</Link>.</p>
      <AtivarAvisosAdmin />
    </div>
  );
}
