import { NextResponse, type NextRequest } from "next/server";
import { getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

/** Cartaz de uma oportunidade: só membros, por link temporário do Storage (10 min). */
export async function GET(_: NextRequest, ctx: RouteContext<"/oportunidades/[id]/cartaz">) {
  await getMembroAtual();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Cartaz não encontrado.", { status: 404 });

  const supabase = await createClient();
  const { data: oportunidade } = await supabase.from("oportunidades").select("cartaz").eq("id", id).maybeSingle();
  if (!oportunidade?.cartaz) return new NextResponse("Cartaz não encontrado.", { status: 404 });

  const { data, error } = await supabase.storage.from("mural").createSignedUrl(oportunidade.cartaz, 600);
  if (error || !data) return new NextResponse("Não foi possível abrir o cartaz.", { status: 502 });

  const resposta = NextResponse.redirect(data.signedUrl);
  // O navegador pode reaproveitar o redirecionamento por alguns minutos, sem compartilhar com outros.
  resposta.headers.set("Cache-Control", "private, max-age=300");
  return resposta;
}
