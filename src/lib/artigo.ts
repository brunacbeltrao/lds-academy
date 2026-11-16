/**
 * Fluxo do mini-artigo: fases, prazos, atraso, próximo passo e pendências.
 * Sem acesso a dados: recebe as publicações já lidas e pode ser usado em qualquer componente.
 */
import { curta, diasAte, dia, quando } from "./datas";
import type { Producao } from "./producao-formato";

export type FaseArtigo = "tema" | "redacao" | "revisao" | "ajustes" | "decisao" | "conferencia" | "pronto" | "publicado";
export type ConclusaoParecer = "aprovado" | "aprovado_com_ajustes" | "reescrever";

/** Andamento do artigo: só chega a quem escreve, revisa, à diretoria e ao conselho (RLS). */
export type Andamento = {
  rascunho_link: string | null;
  rascunho_em: string | null;
  parecer_conclusao: ConclusaoParecer | null;
  parecer_texto: string | null;
  parecer_em: string | null;
  parecer_por: { id: string; nome: string } | null;
  ajustes_pedidos: boolean;
  ajustes_em: string | null;
  liberado_em: string | null;
  liberado_por: { id: string; nome: string } | null;
};

export const ROTULO_FASE: Record<FaseArtigo, string> = {
  tema: "Aguardando tema",
  redacao: "Em redação",
  revisao: "Em revisão",
  ajustes: "Em ajustes",
  decisao: "Aguardando decisão",
  conferencia: "Conferência final",
  pronto: "Pronto para publicar",
  publicado: "Publicado",
};

export const ROTULO_CONCLUSAO: Record<ConclusaoParecer, string> = {
  aprovado: "Aprovado",
  aprovado_com_ajustes: "Aprovado com ajustes",
  reescrever: "Reescrever",
};

/** As etapas que aparecem na linha do tempo do artigo, na ordem. */
export const ETAPAS: { id: string; rotulo: string; fases: FaseArtigo[] }[] = [
  { id: "tema", rotulo: "Tema", fases: ["tema"] },
  { id: "redacao", rotulo: "Redação", fases: ["redacao"] },
  { id: "revisao", rotulo: "Revisão", fases: ["revisao", "decisao"] },
  { id: "ajustes", rotulo: "Ajustes", fases: ["ajustes"] },
  { id: "conferencia", rotulo: "Conferência", fases: ["conferencia"] },
  { id: "publicacao", rotulo: "Publicação", fases: ["pronto", "publicado"] },
];

export function indiceDaEtapa(fase: FaseArtigo): number {
  return ETAPAS.findIndex((e) => e.fases.includes(fase));
}

/** Rascunho com mais de 2 dias de atraso perde a vaga (orientações da liga). */
export const TOLERANCIA_DE_ATRASO = 2;

const somar = (data: string, dias: number) => {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

/**
 * Datas de um artigo a partir da segunda-feira de publicação: início da redação 3 semanas antes,
 * rascunho no domingo 8 dias antes, revisão até o domingo da véspera.
 */
export function datasDoArtigo(publicacao: string) {
  return {
    inicio_redacao: somar(publicacao, -21),
    entrega: somar(publicacao, -8),
    fim_revisao: somar(publicacao, -1),
    publicacao,
  };
}

/** Prazo sugerido do parecer: quinta-feira depois da entrega do rascunho. */
export function prazoDoParecer(p: Pick<Producao, "entrega">): string | null {
  return p.entrega ? somar(p.entrega, 4) : null;
}

/** Fim da primeira semana de redação: até aqui a dupla registra o tema. */
export function prazoDoTema(p: Pick<Producao, "inicio_redacao" | "entrega">): string | null {
  if (p.inicio_redacao) return somar(p.inicio_redacao, 6);
  return p.entrega ? somar(p.entrega, -7) : null;
}

/** Dias de atraso do rascunho (0 quando no prazo ou já entregue). */
export function diasDeAtraso(p: Producao): number {
  if (p.tipo !== "artigo" || !p.entrega || (p.fase !== "tema" && p.fase !== "redacao")) return 0;
  return Math.max(0, -diasAte(p.entrega));
}

/** Como foi a entrega do rascunho: "no prazo" ou "com 3 dias de atraso". */
export function situacaoDaEntrega(entrega: string | null, rascunhoEm: string): string {
  if (!entrega) return "sem prazo marcado";
  const atraso = Math.round((Date.parse(dia(rascunhoEm)) - Date.parse(entrega)) / 86_400_000);
  if (atraso <= 0) return "no prazo";
  return atraso === 1 ? "com 1 dia de atraso" : `com ${atraso} dias de atraso`;
}

export function temRevisor(p: Producao): boolean {
  return Boolean(p.revisor) || p.participantes.some((x) => x.papel === "revisor");
}

export function nomeDoRevisor(p: Producao): string | null {
  return p.participantes.find((x) => x.papel === "revisor")?.nome ?? p.revisor;
}

export function rotuloDoArtigo(p: Pick<Producao, "numero">): string {
  return `Artigo ${String(p.numero ?? "").padStart(2, "0")}`;
}

/** Selo do artigo na lista: a fase, ou o atraso quando houver. */
export function seloDoArtigo(p: Producao): { texto: string; tom: "neutro" | "suave" | "forte" } {
  const atraso = diasDeAtraso(p);
  if (atraso > 0) return { texto: atraso === 1 ? "1 dia de atraso" : `${atraso} dias de atraso`, tom: "forte" };
  if (!p.fase) return { texto: "", tom: "neutro" };
  if (p.fase === "publicado") return { texto: ROTULO_FASE.publicado, tom: "suave" };
  if (p.fase === "revisao" && !temRevisor(p)) return { texto: "Sem revisor", tom: "forte" };
  return { texto: ROTULO_FASE[p.fase], tom: p.fase === "pronto" ? "suave" : "neutro" };
}

/**
 * Próximo espaço livre no calendário quinzenal: a primeira segunda-feira da grade
 * (a cada 14 dias a partir de uma publicação existente) sem outro artigo marcado e
 * com ao menos uma semana pela frente para a revisão.
 */
export function proximoEspacoLivre(artigos: Producao[], ignorar?: string): string | null {
  const datas = artigos.filter((a) => a.publicacao).map((a) => a.publicacao as string);
  if (datas.length === 0) return null;
  const ocupadas = new Set(artigos.filter((a) => a.id !== ignorar && a.publicacao).map((a) => a.publicacao as string));
  const minimo = somar(dia(new Date()), 8);
  let data = datas.sort()[0];
  for (let i = 0; i < 200; i++) {
    if (data >= minimo && !ocupadas.has(data)) return data;
    data = somar(data, 14);
  }
  return null;
}

/** Quem é a pessoa em relação ao artigo. */
export type Visao = {
  membroId: string;
  autor: boolean;
  revisor: boolean;
  diretoria: boolean;
  academico: boolean;
  conselho: boolean;
};

export function visaoDoArtigo(p: Producao, eu: { id: string; papel: string; diretorAcademico: boolean }): Visao {
  return {
    membroId: eu.id,
    autor: p.participantes.some((x) => x.id === eu.id && x.papel === "autor"),
    revisor: p.participantes.some((x) => x.id === eu.id && x.papel === "revisor"),
    diretoria: eu.papel === "diretoria",
    academico: eu.papel === "diretoria" && eu.diretorAcademico,
    conselho: eu.papel === "conselheiro",
  };
}

export type Pendencia = { href: string; texto: string; detalhe: string; urgente?: boolean; prazo?: string | null };

const prazoTexto = (data: string | null | undefined) => (data ? `Prazo ${quando(data)} (${curta(data)})` : "Sem data marcada");
const urgente = (data: string | null | undefined, dias = 2) => (data ? diasAte(data) <= dias : false);

/**
 * Pendências de mini-artigo de uma pessoa, para "Minhas pendências" (Início) e a fila da Produção.
 * Enquanto não houver envio de e-mail, é aqui que cada um fica sabendo o que fazer.
 */
export function pendenciasDeArtigos(artigos: Producao[], eu: { id: string; papel: string; diretorAcademico: boolean }, todos: Producao[] = artigos): Pendencia[] {
  const lista: Pendencia[] = [];
  for (const p of artigos) {
    if (p.tipo !== "artigo" || !p.fase || p.fase === "publicado") continue;
    const v = visaoDoArtigo(p, eu);
    const href = `/producao/${p.id}`;
    const nome = rotuloDoArtigo(p);
    const atraso = diasDeAtraso(p);

    if (v.autor && !v.conselho) {
      if (p.fase === "tema") {
        const prazo = prazoDoTema(p);
        if (!prazo || diasAte(prazo) <= 21)
          lista.push({ href, texto: p.tema_recusado ? `Registrar outro tema: ${nome}` : `Registrar o tema: ${nome}`, detalhe: p.tema_recusado ? "O tema anterior foi recusado" : prazoTexto(prazo), urgente: Boolean(p.tema_recusado) || urgente(prazo), prazo });
      }
      if (p.fase === "redacao" && p.entrega && diasAte(p.entrega) <= 14)
        lista.push({ href, texto: `Enviar o rascunho: ${nome}`, detalhe: atraso > 0 ? `Atrasado há ${atraso} ${atraso === 1 ? "dia" : "dias"}` : prazoTexto(p.entrega), urgente: urgente(p.entrega), prazo: p.entrega });
      if (p.fase === "ajustes")
        lista.push({ href, texto: `Concluir os ajustes: ${nome}`, detalhe: prazoTexto(p.fim_revisao), urgente: urgente(p.fim_revisao, 1), prazo: p.fim_revisao });
    }

    if (v.revisor && p.fase === "revisao") {
      const prazo = prazoDoParecer(p);
      lista.push({ href, texto: `Dar o parecer: ${nome}`, detalhe: prazoTexto(prazo), urgente: urgente(prazo, 1), prazo });
    }

    if (v.academico) {
      const semRevisor = !temRevisor(p) && !["pronto", "decisao", "conferencia", "ajustes"].includes(p.fase);
      if (semRevisor && (p.fase === "revisao" || (p.entrega && diasAte(p.entrega) <= 10)))
        lista.push({ href, texto: `Designar o revisor: ${nome}`, detalhe: p.fase === "revisao" ? "O rascunho já chegou" : prazoTexto(p.entrega), urgente: p.fase === "revisao" || urgente(p.entrega, 3), prazo: p.entrega });
      if (p.fase === "revisao" && p.revisor && !p.participantes.some((x) => x.papel === "revisor"))
        lista.push({ href, texto: `Registrar o parecer de ${p.revisor}: ${nome}`, detalhe: prazoTexto(prazoDoParecer(p)), urgente: urgente(prazoDoParecer(p), 1), prazo: prazoDoParecer(p) });
      if (p.fase === "decisao") lista.push({ href, texto: `Decidir sobre a reescrita: ${nome}`, detalhe: "O parecer pediu para reescrever", urgente: true, prazo: p.fim_revisao });
      if (p.fase === "conferencia") lista.push({ href, texto: `Fazer a conferência final: ${nome}`, detalhe: prazoTexto(p.publicacao), urgente: urgente(p.publicacao, 1), prazo: p.publicacao });
      if (atraso > TOLERANCIA_DE_ATRASO && p.publicacao) {
        const livre = proximoEspacoLivre(todos.filter((a) => a.tipo === "artigo"), p.id);
        lista.push({ href, texto: `${nome} perdeu a vaga`, detalhe: livre ? `Confirme a nova data: sugestão ${curta(livre)}` : "Confirme a nova data", urgente: true, prazo: null });
      }
    }

    if (v.diretoria && p.fase === "pronto" && p.publicacao && diasAte(p.publicacao) <= 1)
      lista.push({ href, texto: `Publicar no LinkedIn: ${nome}`, detalhe: prazoTexto(p.publicacao), urgente: true, prazo: p.publicacao });
  }
  return lista.sort((a, b) => Number(Boolean(b.urgente)) - Number(Boolean(a.urgente)) || (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));
}

/** Palavras que não ajudam a comparar temas. */
const VAZIAS = new Set(
  "a o as os e de da do das dos em no na nos nas um uma para por com sem sobre entre ao aos à às seu sua seus suas lei art arts".split(" "),
);

function palavras(texto: string): Set<string> {
  return new Set(
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !VAZIAS.has(w))
      .map((w) => w.replace(/(oes|aes|s)$/, "")),
  );
}

/** Temas já usados ou reservados que se parecem com o informado (palavras em comum). */
export function temasParecidos(tema: string, outros: { rotulo: string; tema: string }[]): { rotulo: string; tema: string }[] {
  const a = palavras(tema);
  if (a.size === 0) return [];
  return outros.filter((o) => {
    const b = palavras(o.tema);
    if (b.size === 0) return false;
    const comuns = [...a].filter((w) => b.has(w)).length;
    return comuns >= 2 || comuns / Math.min(a.size, b.size) >= 0.6;
  });
}
