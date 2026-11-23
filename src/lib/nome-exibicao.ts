/** Nome de exibição: como o membro quer que o nome apareça na plataforma. */
export const LIMITE_NOME_EXIBICAO = 80;

/** Valida o nome de exibição já aparado. Devolve a mensagem de erro, ou null se estiver certo. */
export function problemaNoNomeDeExibicao(nome: string | null): string | null {
  if (!nome) return null;
  if (nome.length < 2) return "O nome de exibição precisa ter pelo menos 2 letras.";
  if (!/\p{L}/u.test(nome)) return "O nome de exibição precisa ter letras.";
  return null;
}
