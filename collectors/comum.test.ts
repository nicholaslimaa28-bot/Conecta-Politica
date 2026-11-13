import { describe, it, expect } from "vitest";
import { eventoDeFalha } from "./comum";

describe("aviso de falhas da coleta", () => {
  it.each([
    [0, 1, null], [1, 2, null],
    [2, 3, "fonte_falhou"],        // atingiu 3 falhas seguidas: avisa uma vez
    [3, 4, null], [9, 10, null],   // continua falhando: não repete
    [5, 0, "fonte_recuperada"],    // voltou depois de ter avisado
    [2, 0, null],                  // voltou antes do limite: nada a avisar
  ])("%i → %i = %s", (antes, agora, esperado) => expect(eventoDeFalha(antes, agora)).toBe(esperado));
});
