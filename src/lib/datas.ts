/** Datas no fuso da liga (Recife). Sem acesso a dados: pode ser usado em qualquer componente. */

export const FUSO = "America/Recife";

/** AAAA-MM-DD no fuso de Recife. */
export function dia(data: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(typeof data === "string" ? new Date(data) : data);
}

export function hoje(): string {
  return dia(new Date());
}

/** Diferença em dias de calendário entre hoje e a data (negativo = passou). */
export function diasAte(data: string): number {
  const alvo = data.length === 10 ? data : dia(data);
  return Math.round((Date.parse(alvo) - Date.parse(hoje())) / 86_400_000);
}

/** "hoje", "amanhã", "em 3 dias", "ontem", "há 4 dias". */
export function quando(data: string): string {
  const d = diasAte(data);
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d === -1) return "ontem";
  return d > 0 ? `em ${d} dias` : `há ${-d} dias`;
}

const fmt = (opcoes: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes });

/** Aceita AAAA-MM-DD (data pura) ou ISO com hora. */
function paraData(data: string): Date {
  return new Date(data.length === 10 ? `${data}T12:00:00-03:00` : data);
}

/** "16/11" ou "16/11/2027" quando de outro ano. */
export function curta(data: string): string {
  const d = paraData(data);
  const mesmoAno = dia(d).slice(0, 4) === hoje().slice(0, 4);
  return fmt(mesmoAno ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** "segunda-feira, 16 de novembro" */
export function longa(data: string): string {
  return fmt({ weekday: "long", day: "numeric", month: "long" }).format(paraData(data));
}

/** "16 de nov." */
export function diaMes(data: string): string {
  return fmt({ day: "numeric", month: "short" }).format(paraData(data));
}

export function semana(data: string): string {
  return fmt({ weekday: "short" }).format(paraData(data)).replace(".", "");
}

/** "20h" ou "20h30" */
export function hora(iso: string): string {
  const [h, m] = fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)).split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/** "16/11, 14h32" para registros (envios, respostas). */
export function registro(iso: string): string {
  return `${curta(iso)}, ${hora(iso)}`;
}

export function nomeDoMes(ano: number, mes: number): string {
  return fmt({ month: "long", year: "numeric" }).format(new Date(Date.UTC(ano, mes - 1, 15)));
}
