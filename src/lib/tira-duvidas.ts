import "server-only";
import { createClient } from "@/lib/supabase/server";

export type StatusResposta = "rascunho" | "pendente" | "validada" | "recusada";
export type Resposta = {
  id: string;
  corpo: string;
  status: StatusResposta;
  origem: "ligante" | "diretoria" | "ia";
  criado_em: string;
  autor: { id: string; nome: string } | null;
};
export type Pergunta = {
  id: string;
  titulo: string;
  corpo: string;
  visibilidade: "publica" | "privada";
  status: "aberta" | "respondida" | "arquivada";
  tema: string | null;
  criado_em: string;
  autor: { id: string; nome: string } | null;
  respostas: Resposta[];
};

type Linha<T> = T | T[] | null;
const um = <T,>(v: Linha<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

const CAMPOS =
  "id, titulo, corpo, visibilidade, status, tema, criado_em, autor:membros!perguntas_autor_id_fkey(id, nome), respostas(id, corpo, status, origem, criado_em, autor:membros!respostas_autor_id_fkey(id, nome))";

function montar(p: Record<string, unknown>): Pergunta {
  const respostas = ((p.respostas as Record<string, unknown>[]) ?? [])
    .map((r) => ({ ...(r as Omit<Resposta, "autor">), autor: um(r.autor as Linha<{ id: string; nome: string }>) }))
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  return { ...(p as Omit<Pergunta, "autor" | "respostas">), autor: um(p.autor as Linha<{ id: string; nome: string }>), respostas };
}

/** Perguntas que o membro pode ver, das mais recentes para as mais antigas. A RLS filtra. */
export async function getPerguntas(limite = 100): Promise<Pergunta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("perguntas").select(CAMPOS).order("criado_em", { ascending: false }).limit(limite);
  if (error) throw new Error(`Falha ao ler o tira-dúvidas: ${error.message}`);
  return (data ?? []).map((p) => montar(p as Record<string, unknown>));
}

export async function getPergunta(id: string): Promise<Pergunta | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("perguntas").select(CAMPOS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao ler a pergunta: ${error.message}`);
  return data ? montar(data as Record<string, unknown>) : null;
}

/** Respostas aguardando validação, para a fila da diretoria. */
export async function getRespostasPendentes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("respostas")
    .select("id, corpo, criado_em, autor:membros!respostas_autor_id_fkey(nome), pergunta:perguntas(id, titulo)")
    .eq("status", "pendente")
    .order("criado_em");
  if (error) throw new Error(`Falha ao ler a fila: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    corpo: r.corpo as string,
    criado_em: r.criado_em as string,
    autor: um(r.autor as Linha<{ nome: string }>)?.nome ?? null,
    pergunta: um(r.pergunta as Linha<{ id: string; titulo: string }>),
  }));
}
