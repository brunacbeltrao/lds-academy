import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AulaDoProfessor = {
  id: string;
  numero: number | null;
  titulo: string;
  data: string | null;
  ciclo: { codigo: string; titulo: string } | null;
  /** Notas dadas pelos membros (1 a 5), sem quem deu. */
  notas: number[];
};

export type Professor = {
  id: string;
  nome: string;
  apresentacao: string | null;
  instituicao: string | null;
  temas: string | null;
  email: string | null;
  telefone: string | null;
  linkedin: string | null;
  observacoes: string | null;
  disponivel: boolean;
  aulas: AulaDoProfessor[];
};

/** Opção de professor para listas de escolha (planejamento, edição da aula). */
export type OpcaoDeProfessor = { id: string; nome: string; apresentacao: string | null; disponivel: boolean };

const CAMPOS = "id, nome, apresentacao, instituicao, temas, email, telefone, linkedin, observacoes, disponivel";
const AULAS = "aulas(id, numero, titulo, data, ciclo:ciclos(codigo, titulo), avaliacoes_aula(nota))";

function um<T>(valor: unknown): T | null {
  if (Array.isArray(valor)) return (valor[0] as T) ?? null;
  return (valor as T) ?? null;
}

type Linha = Omit<Professor, "aulas"> & {
  aulas: (Omit<AulaDoProfessor, "ciclo" | "notas"> & { ciclo: unknown; avaliacoes_aula?: { nota: number }[] | null })[] | null;
};

function montar(linha: Linha): Professor {
  const aulas = (linha.aulas ?? [])
    .map(({ avaliacoes_aula, ...a }) => ({ ...a, ciclo: um<AulaDoProfessor["ciclo"]>(a.ciclo), notas: (avaliacoes_aula ?? []).map((x) => x.nota) }))
    // Mais recentes primeiro; sem data, pelo código do ciclo.
    .sort((a, b) => (b.data ?? b.ciclo?.codigo ?? "").localeCompare(a.data ?? a.ciclo?.codigo ?? ""));
  return { ...linha, aulas };
}

/** O banco inteiro, em ordem alfabética, com as aulas de cada um. Só diretoria e conselho (RLS). */
export async function getProfessores(): Promise<Professor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("professores").select(`${CAMPOS}, ${AULAS}`).order("nome");
  if (error) throw new Error(`Falha ao ler os professores: ${error.message}`);
  return ((data ?? []) as unknown as Linha[]).map(montar);
}

export async function getProfessor(id: string): Promise<Professor | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("professores").select(`${CAMPOS}, ${AULAS}`).eq("id", id).maybeSingle();
  if (error) throw new Error(`Falha ao ler o professor: ${error.message}`);
  return data ? montar(data as unknown as Linha) : null;
}

/** Nomes para escolher numa aula. Vazio para quem não é da gestão (a RLS não devolve nada). */
export async function getOpcoesDeProfessores(): Promise<OpcaoDeProfessor[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("professores").select("id, nome, apresentacao, disponivel").order("nome");
  return (data ?? []) as OpcaoDeProfessor[];
}

/** Normaliza para busca: sem acento e em minúsculas. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Link do WhatsApp a partir de um telefone brasileiro; null se não parecer um número. */
export function linkDoWhatsapp(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  return digitos.length >= 12 && digitos.length <= 13 ? `https://wa.me/${digitos}` : null;
}
