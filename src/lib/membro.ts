import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehCargoDiretoria, type CargoDiretoria } from "@/lib/cargos";

export type Papel = "ligante" | "diretoria" | "conselheiro";
/**
 * `papel` decide as permissões. `cargoDiretoria` é o cargo na diretoria
 * (diretor-presidente etc.), quando há. O diretor acadêmico decorre desse cargo.
 */
export type Membro = { id: string; nome: string; papel: Papel; cargoDiretoria: CargoDiretoria | null; diretorAcademico: boolean };

/**
 * Membro logado, conferido no servidor a cada requisição.
 * Sem sessão → /login. Com sessão mas fora da lista (ou inativo) → /login?erro=inativo.
 */
export const getMembroAtual = cache(async (): Promise<Membro> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membro } = await supabase
    .from("membros")
    .select("id, nome, papel, ativo, cargo_diretoria, diretor_academico")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membro || !membro.ativo) redirect("/auth/sair?erro=inativo");
  const papel = membro.papel as Papel;
  // Diretor acadêmico só vale com o papel diretoria (a função do banco repete a regra).
  const cargoDiretoria = ehCargoDiretoria(membro.cargo_diretoria) ? membro.cargo_diretoria : null;
  return { id: membro.id, nome: membro.nome, papel, cargoDiretoria, diretorAcademico: papel === "diretoria" && Boolean(membro.diretor_academico) };
});

/** Gestão: a diretoria gere e o conselho acompanha em modo leitura. Ligantes não entram. */
export async function exigirGestao(): Promise<Membro> {
  const membro = await getMembroAtual();
  if (membro.papel === "ligante") redirect("/");
  return membro;
}

/** Só a diretoria escreve. Use em toda ação que altera dados de gestão (a RLS repete a regra). */
export async function exigirDiretoria(): Promise<Membro> {
  const membro = await getMembroAtual();
  if (membro.papel !== "diretoria") redirect("/");
  return membro;
}
