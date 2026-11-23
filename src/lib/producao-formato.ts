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

export type PapelNaProducao = "autoria" | "revisao";

/** Próximo passo de um membro numa publicação: o que entregar e até quando. */
export type Entrega = {
  producao: Producao;
  papel: PapelNaProducao;
  etapa: string;
  prazo: string; // AAAA-MM-DD
};

const DIAS_DA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function emDias(data: string): number {
  const [ano, mes, dia] = data.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia) / 86_400_000;
}

/** "2026-11-30" → "segunda". */
export function diaDaSemana(data: string): string {
  return DIAS_DA_SEMANA[(((emDias(data) + 4) % 7) + 7) % 7];
}

/** Distância até o prazo: "hoje", "amanhã", "em 5 dias". */
export function quantoFalta(prazo: string, hoje: string): string {
  const dias = emDias(prazo) - emDias(hoje);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

/** A data ainda não passou (vale o próprio dia). */
function aindaVale(data: string | null, hoje: string): data is string {
  return data !== null && data >= hoje;
}

function proximaEtapa(p: Producao, papel: PapelNaProducao, hoje: string): Pick<Entrega, "etapa" | "prazo"> {
  if (p.tipo === "carrossel") {
    if (aindaVale(p.entrega, hoje)) return { etapa: "Entrega da arte, às 18h", prazo: p.entrega };
    return { etapa: "Publicação", prazo: p.publicacao };
  }
  if (papel === "autoria" && aindaVale(p.entrega, hoje)) return { etapa: "Entrega do rascunho", prazo: p.entrega };
  if (aindaVale(p.fim_revisao, hoje)) {
    return { etapa: papel === "revisao" ? "Fim da revisão" : "Versão final, depois da revisão", prazo: p.fim_revisao };
  }
  return { etapa: "Publicação", prazo: p.publicacao };
}

/**
 * Publicações ainda por sair em que o membro é autor ou revisor, com o próximo prazo de cada uma,
 * do mais próximo para o mais distante.
 */
export function minhasEntregas(producoes: Producao[], nome: string, hoje: string): Entrega[] {
  const entregas: Entrega[] = [];
  for (const p of producoes) {
    if (p.status === "publicado" || p.publicacao < hoje) continue;
    const papeis: PapelNaProducao[] = [];
    if (ehAutor(p.autores, nome)) papeis.push("autoria");
    if (ehAutor(p.revisor, nome)) papeis.push("revisao");
    for (const papel of papeis) entregas.push({ producao: p, papel, ...proximaEtapa(p, papel, hoje) });
  }
  return entregas.sort((a, b) => a.prazo.localeCompare(b.prazo) || a.producao.publicacao.localeCompare(b.producao.publicacao));
}
