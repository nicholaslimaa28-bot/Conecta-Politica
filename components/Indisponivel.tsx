// Mostrado quando o banco de dados não responde (ex.: durante um deploy).
// A página é refeita automaticamente no próximo ciclo de revalidação.
export function Indisponivel({ titulo }: { titulo: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p role="status" className="rounded border border-alerta p-3">
        Dado indisponível no momento: não foi possível consultar a base de dados. A página será atualizada automaticamente em alguns minutos.
      </p>
    </div>
  );
}
