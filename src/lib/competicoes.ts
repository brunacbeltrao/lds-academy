import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Equipe = { id: string; nome: string; membros: { id: string; nome: string }[] };
export type Competicao = {
  id: string;
  nome: string;
  edicao: string | null;
  descricao: string | null;
  edital_url: string | null;
  pasta_url: string | null;
  inicio: string | null;
  fim: string | null;
  equipes: Equipe[];
};

type Linha<T> = T | T[] | null;
const um = <T,>(v: Linha<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Competições com as equipes que o membro pode ver (as suas; a diretoria e o conselho veem todas). */
export async function getCompeticoes(): Promise<Competicao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competicoes")
    .select("id, nome, edicao, descricao, edital_url, pasta_url, inicio, fim, equipes(id, nome, equipe_membros(membro:membros(id, nome)))")
    .order("inicio", { ascending: false, nullsFirst: false })
    .order("edicao", { ascending: false });
  if (error) throw new Error(`Falha ao ler as competições: ${error.message}`);
  return (data ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    edicao: c.edicao,
    descricao: c.descricao,
    edital_url: c.edital_url,
    pasta_url: c.pasta_url,
    inicio: c.inicio,
    fim: c.fim,
    equipes: ((c.equipes as unknown as { id: string; nome: string; equipe_membros: { membro: Linha<{ id: string; nome: string }> }[] }[]) ?? []).map(
      (e) => ({
        id: e.id,
        nome: e.nome,
        membros: (e.equipe_membros ?? [])
          .map((em) => um(em.membro))
          .filter((m): m is { id: string; nome: string } => Boolean(m))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      }),
    ),
  }));
}
