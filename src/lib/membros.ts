import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/membro";
import { CARGOS_DIRETORIA, ehCargoDiretoria, type CargoDiretoria } from "@/lib/cargos";

export type MembroDaLista = {
  id: string;
  nome: string;
  papel: Papel;
  ativo: boolean;
  acessoDiretoria: boolean;
  /** Cargo na diretoria (só para o papel diretoria). */
  cargoDiretoria: CargoDiretoria | null;
  /** Decorre do cargo de diretor acadêmico. Designa revisores e faz a conferência final dos mini-artigos (só vale com permissões de diretoria). */
  diretorAcademico: boolean;
  temConta: boolean;
  email: string | null;
};

export const ROTULO_PAPEL: Record<Papel, string> = { ligante: "Ligante", diretoria: "Diretoria", conselheiro: "Conselho" };

/** Lista oficial. O e-mail só vem para a diretoria e o conselho (RLS de membros_acesso). */
export async function getMembros(): Promise<MembroDaLista[]> {
  const supabase = await createClient();
  const [{ data: membros, error }, { data: acessos }] = await Promise.all([
    supabase.from("membros").select("id, nome, papel, ativo, acesso_diretoria, cargo_diretoria, diretor_academico, user_id").order("nome"),
    supabase.from("membros_acesso").select("membro_id, email"),
  ]);
  if (error) throw new Error(`Falha ao ler os membros: ${error.message}`);
  const emails = new Map((acessos ?? []).map((a) => [a.membro_id as string, a.email as string]));
  return (membros ?? []).map((m) => {
    const acessoDiretoria = Boolean(m.acesso_diretoria);
    const diretoria = m.papel === "diretoria" || (acessoDiretoria && m.papel !== "conselheiro");
    return {
      id: m.id,
      nome: m.nome,
      papel: m.papel as Papel,
      ativo: m.ativo,
      acessoDiretoria,
      cargoDiretoria: ehCargoDiretoria(m.cargo_diretoria) ? m.cargo_diretoria : null,
      diretorAcademico: diretoria && Boolean(m.diretor_academico),
      temConta: Boolean(m.user_id),
      email: emails.get(m.id) ?? null,
    };
  });
}

export type OcupanteDeCargo = { cargo: CargoDiretoria; rotulo: string; membro: { id: string; nome: string } | null };

/** Diretoria atual, na ordem oficial dos cargos. Cargo sem ocupante ativo vem com `membro: null`. */
export async function getDiretoriaAtual(): Promise<OcupanteDeCargo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("membros").select("id, nome, cargo_diretoria").eq("ativo", true).not("cargo_diretoria", "is", null);
  if (error) throw new Error(`Falha ao ler a diretoria: ${error.message}`);
  const porCargo = new Map((data ?? []).map((m) => [m.cargo_diretoria as string, { id: m.id as string, nome: m.nome as string }]));
  return CARGOS_DIRETORIA.map((c) => ({ cargo: c.valor, rotulo: c.rotulo, membro: porCargo.get(c.valor) ?? null }));
}
