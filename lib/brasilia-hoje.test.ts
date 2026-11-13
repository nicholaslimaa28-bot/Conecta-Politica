import { describe, it, expect } from "vitest";
import { edicaoVigente } from "./brasilia-hoje";

describe("edição vigente", () => {
  it.each([
    ["2026-11-13T09:59:00Z", "2026-11-12", "noite"], // 06h59 em Brasília
    ["2026-11-13T10:00:00Z", "2026-11-13", "manha"], // 07h00
    ["2026-11-13T22:59:00Z", "2026-11-13", "manha"], // 19h59
    ["2026-11-13T23:00:00Z", "2026-11-13", "noite"], // 20h00
    ["2026-11-14T02:30:00Z", "2026-11-13", "noite"], // 23h30
  ])("%s → %s %s", (iso, dia, edicao) => expect(edicaoVigente(new Date(iso))).toEqual({ dia, edicao }));
});
