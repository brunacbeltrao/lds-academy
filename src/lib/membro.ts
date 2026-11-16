import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Papel = "ligante" | "diretoria" | "conselheiro";
/**
 * `papel` é o papel efetivo, que decide as permissões: quem tem acesso de diretoria
 * conta como diretoria. `cargo` é o que aparece na tela (o papel registrado).
 */
export type Membro = { id: string; nome: string; papel: Papel; cargo: Papel; diretorAcademico: boolean };

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
    .select("id, nome, papel, ativo, acesso_diretoria, diretor_academico")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membro || !membro.ativo) redirect("/auth/sair?erro=inativo");
  const cargo = membro.papel as Papel;
  const papel: Papel = membro.acesso_diretoria && cargo !== "conselheiro" ? "diretoria" : cargo;
  // Diretor acadêmico só vale com permissões de diretoria (a função do banco repete a regra).
  return { id: membro.id, nome: membro.nome, papel, cargo, diretorAcademico: papel === "diretoria" && Boolean(membro.diretor_academico) };
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
