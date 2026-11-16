/** Tipos e formatação do calendário de produção (sem acesso a dados). */

export type StatusProducao = "a_definir" | "em_redacao" | "em_revisao" | "pronto" | "publicado" | "atrasado";
export type Producao = {
  id: string;
  tipo: "carrossel" | "artigo";
  numero: number | null;
  tema: string | null;
  autores: string | null;
  revisor: string | null;
  inicio_redacao: string | null;
  entrega: string | null;
  fim_revisao: string | null;
  publicacao: string;
  status: StatusProducao;
  link_publicado: string | null;
  observacoes: string | null;
  participantes: { id: string; nome: string; papel: "autor" | "revisor" }[];
  entregas: Entrega[];
};

export type Entrega = {
  id: string;
  etapa: "rascunho" | "revisao" | "final";
  link: string;
  nota: string | null;
  criado_em: string;
  autor: { id: string; nome: string } | null;
};

export const ROTULO_ETAPA: Record<Entrega["etapa"], string> = {
  rascunho: "Rascunho",
  revisao: "Parecer da revisão",
  final: "Versão final",
};

export const ROTULO_STATUS: Record<StatusProducao, string> = {
  a_definir: "A definir",
  em_redacao: "Em redação",
  em_revisao: "Em revisão",
  pronto: "Pronto para publicar",
  publicado: "Publicado",
  atrasado: "Atrasado",
};

/** Hoje em Recife, como AAAA-MM-DD (mesmo formato das colunas de data). */
export function hojeEmRecife(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(new Date());
}

/** "2026-10-26" → "26/10"; com o ano quando não é o ano de referência. */
export function formatarData(data: string | null, anoDeReferencia: string): string {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return ano === anoDeReferencia ? `${dia}/${mes}` : `${dia}/${mes}/${ano}`;
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** O membro é autor? Compara primeiro e último nome, sem acentos. */
export function ehAutor(autores: string | null, nomeDoMembro: string): boolean {
  if (!autores) return false;
  const partes = semAcento(nomeDoMembro).split(/\s+/).filter(Boolean);
  if (partes.length < 2) return false;
  return semAcento(autores).includes(`${partes[0]} ${partes[partes.length - 1]}`);
}
