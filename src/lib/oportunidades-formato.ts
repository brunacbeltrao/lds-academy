/** Tipos e textos do mural de oportunidades (sem acesso a dados: serve a qualquer componente). */
import { curta, diasAte, hora, quando as relativo } from "@/lib/datas";

export type TipoOportunidade = "estagio" | "curso" | "evento" | "concurso" | "conteudo" | "outro";

export const ROTULO_TIPO: Record<TipoOportunidade, string> = {
  estagio: "Estágio e vagas",
  curso: "Curso",
  evento: "Evento",
  concurso: "Concurso e prêmio",
  conteudo: "Conteúdo",
  outro: "Outro",
};

/** Rótulo curto para o selo do cartão. */
export const SELO_TIPO: Record<TipoOportunidade, string> = {
  estagio: "Estágio",
  curso: "Curso",
  evento: "Evento",
  concurso: "Concurso",
  conteudo: "Conteúdo",
  outro: "Oportunidade",
};

export type Interessado = { id: string; nome: string; desde: string };

export type Oportunidade = {
  id: string;
  tipo: TipoOportunidade;
  titulo: string;
  organizacao: string | null;
  descricao: string;
  link: string | null;
  contato: string | null;
  local: string | null;
  quando: string | null;
  prazo: string | null;
  pede_lista: boolean;
  vagas: number | null;
  fixada: boolean;
  criado_em: string;
  /** Parte do nome do arquivo do cartaz, para o endereço da imagem mudar quando o cartaz muda. */
  cartazVersao: string | null;
  aberta: boolean;
  interessados: Interessado[];
  euVou: boolean;
};

/** "Inscrições até 30/09 · em 3 dias", "Encerrada em 30/09" ou o dia do evento. */
export function textoDoPrazo(o: Pick<Oportunidade, "prazo" | "quando" | "aberta" | "tipo">): string | null {
  if (o.prazo) {
    const verbo = o.tipo === "estagio" ? "Candidaturas" : o.tipo === "concurso" ? "Envio" : "Inscrições";
    return o.aberta ? `${verbo} até ${curta(o.prazo)} · ${relativo(o.prazo)}` : `Encerrada em ${curta(o.prazo)}`;
  }
  if (o.quando) return `${curta(o.quando)}, ${hora(o.quando)}`;
  return null;
}

/** Endereço da imagem do cartaz (passa pela checagem de membro). */
export function enderecoDoCartaz(o: Pick<Oportunidade, "id" | "cartazVersao">): string | null {
  return o.cartazVersao ? `/oportunidades/${o.id}/cartaz?v=${o.cartazVersao}` : null;
}

/** Prazo nos próximos 3 dias: o selo fica em destaque. */
export function prazoProximo(o: Pick<Oportunidade, "prazo" | "aberta">): boolean {
  return Boolean(o.aberta && o.prazo && diasAte(o.prazo) <= 3);
}

/** Vagas que sobram na lista; null quando não há limite. */
export function vagasRestantes(o: Pick<Oportunidade, "vagas" | "interessados">): number | null {
  return o.vagas === null ? null : Math.max(0, o.vagas - o.interessados.length);
}
