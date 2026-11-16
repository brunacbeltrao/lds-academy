import { NextResponse, type NextRequest } from "next/server";
import { getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

/** Download de um anexo: confere o membro e redireciona para um link temporário (60 s) do Storage. */
export async function GET(_: NextRequest, ctx: RouteContext<"/materiais/[id]">) {
  await getMembroAtual();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Anexo não encontrado.", { status: 404 });

  const supabase = await createClient();
  const { data: material } = await supabase.from("aula_materiais").select("titulo, arquivo").eq("id", id).maybeSingle();
  if (!material) return new NextResponse("Anexo não encontrado.", { status: 404 });

  const { data, error } = await supabase.storage
    .from("materiais")
    .createSignedUrl(material.arquivo, 60, { download: `${material.titulo}.pdf` });
  if (error || !data) return new NextResponse("Não foi possível abrir o anexo.", { status: 502 });

  return NextResponse.redirect(data.signedUrl);
}
