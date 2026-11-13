// Cartão de prévia (Open Graph, 1200×630) para WhatsApp, redes sociais e buscadores.
// Visual sóbrio, sem cores partidárias; fonte e horário da informação sempre no rodapé.
import { ImageResponse } from "next/og";

export const TAMANHO_OG = { width: 1200, height: 630 };

const COR = { fundo: "#f7f7f5", texto: "#1c1c1a", suave: "#55554f", borda: "#dcdcd6", legislativo: "#0f6b63", executivo: "#8a5a00" };

/** Busca a foto oficial e devolve como data URL (falha silenciosa: o cartão sai sem foto). */
export async function fotoComoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const tipo = r.headers.get("content-type") ?? "image/jpeg";
    if (!tipo.startsWith("image/")) return null;
    return `data:${tipo};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

export type Cartao = {
  rotulo: string;          // ex.: "Senador(a)", "Proposição", "Votação no Senado"
  titulo: string;
  subtitulo?: string | null;
  linhas?: string[];       // até 3 linhas de dados
  placar?: { sim: number; nao: number; abstencao: number } | null;
  foto?: string | null;    // data URL
  rodape?: string;         // fonte
  poder?: "legislativo" | "executivo";
};

const corta = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function cartaoOG(c: Cartao) {
  const destaque = c.poder === "executivo" ? COR.executivo : COR.legislativo;
  const total = c.placar ? c.placar.sim + c.placar.nao + c.placar.abstencao || 1 : 1;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: COR.fundo, color: COR.texto, fontFamily: "sans-serif", padding: "56px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 44, height: 44, background: destaque, borderRadius: 8, alignItems: "flex-end", justifyContent: "center", gap: 5, paddingBottom: 9 }}>
            <div style={{ width: 7, height: 17, background: "#fff", borderRadius: 2 }} />
            <div style={{ width: 7, height: 24, background: "#fff", borderRadius: 2 }} />
            <div style={{ width: 7, height: 17, background: "#fff", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Conecta Política</div>
          <div style={{ marginLeft: "auto", fontSize: 24, color: destaque, border: `2px solid ${destaque}`, borderRadius: 8, padding: "4px 14px" }}>{c.rotulo}</div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48, marginTop: 24, marginBottom: 20 }}>
          {c.foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.foto} width={240} height={320} style={{ objectFit: "cover", borderRadius: 12, border: `1px solid ${COR.borda}` }} alt="" />
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
            <div style={{ fontSize: c.titulo.length > 40 ? 52 : 64, fontWeight: 700, lineHeight: 1.1 }}>{corta(c.titulo, 90)}</div>
            {c.subtitulo && <div style={{ fontSize: c.placar ? 26 : 30, color: COR.suave, lineHeight: 1.3 }}>{corta(c.subtitulo, c.placar ? 110 : 150)}</div>}
            {(c.linhas ?? []).slice(0, 3).map((l, i) => (
              <div key={i} style={{ fontSize: 30, lineHeight: 1.3 }}>{corta(l, 90)}</div>
            ))}
            {c.placar && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 28, fontSize: 34, fontWeight: 700 }}>
                  <span>Sim {c.placar.sim}</span><span>Não {c.placar.nao}</span><span style={{ color: COR.suave, fontWeight: 400 }}>Abstenção {c.placar.abstencao}</span>
                </div>
                <div style={{ display: "flex", width: "100%", height: 18, borderRadius: 9, overflow: "hidden", background: COR.borda }}>
                  <div style={{ width: `${(c.placar.sim / total) * 100}%`, background: "#3a3a36" }} />
                  <div style={{ width: `${(c.placar.nao / total) * 100}%`, background: "#9a9a92" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: COR.suave, borderTop: `2px solid ${COR.borda}`, paddingTop: 18 }}>
          <span>{c.rodape ?? "Dados oficiais da Câmara, do Senado e da Presidência"}</span>
          <span>conecta-politica.vercel.app</span>
        </div>
      </div>
    ),
    TAMANHO_OG,
  );
}
