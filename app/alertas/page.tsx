// Meus alertas: o que este aparelho segue e como funcionam os avisos.
import type { Metadata } from "next";
import { MeusAlertas } from "@/components/MeusAlertas";

export const metadata: Metadata = { title: "Meus alertas", description: "Siga parlamentares e proposições e receba avisos no celular, sem cadastro." };

export default function Alertas() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Meus alertas</h1>
      <MeusAlertas />
      <section className="space-y-2 text-sm">
        <h2 className="text-lg font-semibold">Como funciona</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Seguindo um parlamentar</strong>, você recebe o voto dele em cada votação nominal (inclusive ausência registrada pela Casa).</li>
          <li><strong>Seguindo uma proposição</strong>, você recebe votações, mudanças de situação na Câmara ou no Senado, vetos e quando ela vira lei.</li>
          <li>Os avisos chegam logo depois de cada coleta (a cada 15 minutos em dias úteis). Várias novidades juntas viram um resumo.</li>
          <li><strong>Sem cadastro:</strong> não pedimos nome, e-mail ou telefone. O aparelho é identificado só pelo código de notificação que o próprio navegador gera. Desligar os alertas apaga esse código e o que você segue.</li>
        </ul>
      </section>
    </div>
  );
}
