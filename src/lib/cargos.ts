/** Cargos da diretoria, na ordem oficial. Quem ocupa cada um fica só no banco (`membros.cargo_diretoria`). */
export type CargoDiretoria = "presidente" | "vice_presidente" | "academico" | "relacoes_institucionais";

export const CARGOS_DIRETORIA: { valor: CargoDiretoria; rotulo: string }[] = [
  { valor: "presidente", rotulo: "Diretor-presidente" },
  { valor: "vice_presidente", rotulo: "Diretor vice-presidente" },
  { valor: "academico", rotulo: "Diretor acadêmico" },
  { valor: "relacoes_institucionais", rotulo: "Diretor de relações institucionais" },
];

export const ROTULO_CARGO = Object.fromEntries(CARGOS_DIRETORIA.map((c) => [c.valor, c.rotulo])) as Record<CargoDiretoria, string>;

export function ehCargoDiretoria(valor: unknown): valor is CargoDiretoria {
  return CARGOS_DIRETORIA.some((c) => c.valor === valor);
}

const ROTULO_PAPEL = { ligante: "Ligante", diretoria: "Diretoria", conselheiro: "Conselho" } as const;

/** O que aparece ao lado do nome: o cargo na diretoria, quando há, ou o papel. */
export function rotuloDoMembro(papel: keyof typeof ROTULO_PAPEL, cargo: CargoDiretoria | null): string {
  return cargo ? ROTULO_CARGO[cargo] : ROTULO_PAPEL[papel];
}
