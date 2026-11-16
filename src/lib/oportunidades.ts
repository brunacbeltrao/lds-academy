import "server-only";
import { hoje } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";
import { ROTULO_TIPO, type Oportunidade, type TipoOportunidade } from "@/lib/oportunidades-formato";

export { ROTULO_TIPO, type Oportunidade, type TipoOportunidade };

const CAMPOS =
  "id, tipo, titulo, organizacao, descricao, link, contato, local, quando, prazo, cartaz, pede_lista, vagas, fixada, criado_em, interessados:oportunidade_interessados(membro_id, criado_em, membro:membros(nome))";

type Linha = Omit<Oportunidade, "aberta" | "interessados" | "euVou" | "cartazVersao"> & {
  cartaz: string | null;
  interessados: { membro_id: string; criado_em: string; membro: { nome: string } | { nome: string }[] | null }[] | null;
};

/** Aberta enquanto o prazo (ou a data do evento) não passou. Sem data, fica aberta até a diretoria remover. */
function estaAberta(prazo: string | null, quando: string | null, dataDeHoje: string): boolean {
  const limite = prazo ?? (quando ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(new Date(quando)) : null);
  return !limite || limite >= dataDeHoje;
}

function montar(linha: Linha, membroId: string, dataDeHoje: string): Oportunidade {
  const { cartaz, interessados, ...resto } = linha;
  const lista = (interessados ?? [])
    .map((i) => ({ id: i.membro_id, nome: (Array.isArray(i.membro) ? i.membro[0]?.nome : i.membro?.nome) ?? "Membro", desde: i.criado_em }))
    .sort((a, b) => a.desde.localeCompare(b.desde));
  return {
    ...resto,
    cartazVersao: cartaz ? cartaz.slice(0, 8) : null,
    aberta: estaAberta(linha.prazo, linha.quando, dataDeHoje),
    interessados: lista,
    euVou: lista.some((i) => i.id === membroId),
  };
}

/** Ordem do mural: fixadas, depois o prazo mais próximo, depois as mais recentes. */
function ordenar(a: Oportunidade, b: Oportunidade): number {
  if (a.fixada !== b.fixada) return a.fixada ? -1 : 1;
  const pa = a.prazo ?? a.quando?.slice(0, 10) ?? null;
  const pb = b.prazo ?? b.quando?.slice(0, 10) ?? null;
  if (a.aberta && b.aberta && pa !== pb) {
    if (!pa) return 1;
    if (!pb) return -1;
    return pa.localeCompare(pb);
  }
  if (!a.aberta && !b.aberta && pa && pb && pa !== pb) return pb.localeCompare(pa);
  return b.criado_em.localeCompare(a.criado_em);
}

export async function getOportunidades(membroId: string): Promise<Oportunidade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("oportunidades").select(CAMPOS).order("criado_em", { ascending: false }).limit(300);
  if (error) throw new Error(`Falha ao ler o mural: ${error.message}`);
  const dataDeHoje = hoje();
  return ((data ?? []) as unknown as Linha[]).map((l) => montar(l, membroId, dataDeHoje)).sort(ordenar);
}

export async function getOportunidade(id: string, membroId: string): Promise<Oportunidade | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("oportunidades").select(CAMPOS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao ler a oportunidade: ${error.message}`);
  return data ? montar(data as unknown as Linha, membroId, hoje()) : null;
}

/** As que estão abertas, para o Início. */
export async function getOportunidadesAbertas(membroId: string, limite = 3): Promise<Oportunidade[]> {
  return (await getOportunidades(membroId)).filter((o) => o.aberta).slice(0, limite);
}
