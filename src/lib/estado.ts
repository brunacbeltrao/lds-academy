/** Resultado de uma ação de formulário, exibido abaixo do formulário. */
export type Estado = { ok: boolean; mensagem: string } | null;

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Texto de um campo, aparado e limitado; null se vazio. */
export function texto(formData: FormData, campo: string, limite = 500): string | null {
  const valor = String(formData.get(campo) ?? "").trim();
  return valor ? valor.slice(0, limite) : null;
}

/** Link https de um campo; null se vazio; "invalido" se não for https. */
export function link(formData: FormData, campo: string): string | null | "invalido" {
  const valor = texto(formData, campo, 1000);
  if (!valor) return null;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" ? url.toString() : "invalido";
  } catch {
    return "invalido";
  }
}

export function id(formData: FormData, campo = "id"): string | null {
  const valor = String(formData.get(campo) ?? "");
  return UUID.test(valor) ? valor : null;
}

export const ok = (mensagem: string): Estado => ({ ok: true, mensagem });
export const erro = (mensagem: string): Estado => ({ ok: false, mensagem });
