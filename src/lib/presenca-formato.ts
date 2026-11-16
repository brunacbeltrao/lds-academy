/** Tipos e rótulos da chamada (sem acesso a dados). */

export type StatusPresenca = "presente" | "falta" | "justificada";

export const STATUS_PRESENCA: { id: StatusPresenca; rotulo: string }[] = [
  { id: "presente", rotulo: "Presente" },
  { id: "falta", rotulo: "Falta" },
  { id: "justificada", rotulo: "Justificada" },
];

/** Como a presença aparece para o próprio membro. */
export const MINHA_PRESENCA: Record<StatusPresenca, string> = {
  presente: "Presença registrada",
  falta: "Falta registrada",
  justificada: "Falta justificada",
};

export type LinhaDaChamada = {
  membroId: string;
  nome: string;
  papel: "ligante" | "diretoria";
  status: StatusPresenca | null;
};

export function ehStatusPresenca(valor: unknown): valor is StatusPresenca {
  return valor === "presente" || valor === "falta" || valor === "justificada";
}
