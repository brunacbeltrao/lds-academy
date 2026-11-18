/** Rótulos e contas das avaliações das aulas (sem acesso a dados). */

export const NOTAS = [1, 2, 3, 4, 5] as const;

export const ROTULO_NOTA: Record<number, string> = {
  1: "Fraca",
  2: "Regular",
  3: "Boa",
  4: "Muito boa",
  5: "Excelente",
};

/** Média com uma casa decimal, em português: 4,3. Null sem avaliações. */
export function media(notas: number[]): string | null {
  if (notas.length === 0) return null;
  const valor = notas.reduce((a, b) => a + b, 0) / notas.length;
  return valor.toFixed(1).replace(".", ",");
}

export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

/** Porcentagem inteira; null quando não há base. */
export function porcento(parte: number, total: number): string | null {
  if (total === 0) return null;
  return `${Math.round((parte / total) * 100)}%`;
}
