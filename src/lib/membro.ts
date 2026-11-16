import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Papel = "ligante" | "diretoria";
export type Membro = { id: string; nome: string; email: string; papel: Papel };

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
    .select("id, nome, email, papel, ativo")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membro || !membro.ativo) redirect("/auth/sair?erro=inativo");
  return { id: membro.id, nome: membro.nome, email: membro.email, papel: membro.papel as Papel };
});

/** Barra quem não é da diretoria (a RLS também barra no banco). */
export async function exigirDiretoria(): Promise<Membro> {
  const membro = await getMembroAtual();
  if (membro.papel !== "diretoria") redirect("/");
  return membro;
}
