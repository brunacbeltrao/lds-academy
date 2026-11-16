/** Tipos e rótulos dos documentos da liga (sem acesso a dados). */

export type CategoriaDocumento = "estatuto" | "eleicoes" | "atas" | "registros" | "outros";

export type Documento = {
  id: string;
  titulo: string;
  categoria: CategoriaDocumento;
  descricao: string | null;
  data_documento: string | null;
  tamanho: number | null;
};

export const CATEGORIAS: { id: CategoriaDocumento; rotulo: string; descricao: string }[] = [
  { id: "estatuto", rotulo: "Estatuto e regimento", descricao: "Estatuto social, regimento interno e suas alterações." },
  { id: "eleicoes", rotulo: "Eleições", descricao: "Editais, propostas de candidatura e resultados." },
  { id: "atas", rotulo: "Atas e assembleias", descricao: "Atas de assembleias gerais e de reuniões da Diretoria." },
  { id: "registros", rotulo: "Registros e cadastros", descricao: "Registros em cartório, na universidade e em outros órgãos." },
  { id: "outros", rotulo: "Outros", descricao: "Demais documentos da liga." },
];

/** "2026-08-27" → "27/08/2026" */
export function formatarDataDoDocumento(data: string | null): string {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
