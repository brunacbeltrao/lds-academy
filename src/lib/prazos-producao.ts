/** Prazos da produção para o Início (sem acesso a dados). */
import { prazoDoParecer } from "./artigo";
import type { Producao } from "./producao-formato";

export type PrazoDaProducao = {
  id: string;
  titulo: string;
  tema: string | null;
  data: string;
  rotulo: string;
};

function numero(p: Producao): string {
  return String(p.numero ?? "").padStart(2, "0");
}

/** O próximo prazo de uma publicação, visto por quem escreve, por quem revisa ou por quem acompanha. */
function prazoDe(p: Producao & { publicacao: string }, dataDeHoje: string, papel: "autor" | "revisor" | null): PrazoDaProducao {
  const base = { id: p.id, titulo: `${p.tipo === "artigo" ? "Artigo" : "Carrossel"} ${numero(p)}`, tema: p.tema };
  if (p.tipo === "carrossel") return { ...base, data: p.entrega ?? p.publicacao, rotulo: "entrega" };

  if (papel === "revisor") {
    const parecer = prazoDoParecer(p);
    const antesDoParecer = p.fase === "tema" || p.fase === "redacao" || p.fase === "revisao";
    if (antesDoParecer && parecer && parecer >= dataDeHoje) return { ...base, data: parecer, rotulo: "parecer" };
    return { ...base, data: p.publicacao, rotulo: "publicação" };
  }

  const rascunhoPela = (p.fase === "tema" || p.fase === "redacao") && p.entrega && p.entrega >= dataDeHoje;
  return rascunhoPela ? { ...base, data: p.entrega as string, rotulo: "rascunho" } : { ...base, data: p.publicacao, rotulo: "publicação" };
}

/**
 * Publicações ainda por sair, separadas em as do membro (como autor ou revisor) e as do resto da liga,
 * cada lista do prazo mais próximo para o mais distante.
 */
export function prazosDaProducao(producoes: Producao[], membroId: string, dataDeHoje: string, limite = 5) {
  const meus: PrazoDaProducao[] = [];
  const daLiga: PrazoDaProducao[] = [];
  for (const p of producoes) {
    if (p.status === "publicado" || !p.publicacao || p.publicacao < dataDeHoje) continue;
    const comData = p as Producao & { publicacao: string };
    const papel = p.participantes.find((x) => x.id === membroId)?.papel ?? null;
    if (papel) meus.push(prazoDe(comData, dataDeHoje, papel));
    else daLiga.push(prazoDe(comData, dataDeHoje, null));
  }
  const porData = (a: PrazoDaProducao, b: PrazoDaProducao) => a.data.localeCompare(b.data);
  return { meus: meus.sort(porData).slice(0, limite), daLiga: daLiga.sort(porData).slice(0, limite) };
}
