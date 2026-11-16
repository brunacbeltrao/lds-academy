import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/membro";

export type MembroDaLista = { id: string; nome: string; papel: Papel; ativo: boolean; temConta: boolean; email: string | null };

export const ROTULO_PAPEL: Record<Papel, string> = { ligante: "Ligante", diretoria: "Diretoria", conselheiro: "Conselho" };

/** Lista oficial. O e-mail só vem para a diretoria e o conselho (RLS de membros_acesso). */
export async function getMembros(): Promise<MembroDaLista[]> {
  const supabase = await createClient();
  const [{ data: membros, error }, { data: acessos }] = await Promise.all([
    supabase.from("membros").select("id, nome, papel, ativo, user_id").order("nome"),
    supabase.from("membros_acesso").select("membro_id, email"),
  ]);
  if (error) throw new Error(`Falha ao ler os membros: ${error.message}`);
  const emails = new Map((acessos ?? []).map((a) => [a.membro_id as string, a.email as string]));
  return (membros ?? []).map((m) => ({
    id: m.id,
    nome: m.nome,
    papel: m.papel as Papel,
    ativo: m.ativo,
    temConta: Boolean(m.user_id),
    email: emails.get(m.id) ?? null,
  }));
}
