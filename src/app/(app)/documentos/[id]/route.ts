import { NextResponse, type NextRequest } from "next/server";
import { exigirGestao } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

/** Download de um documento da liga: só diretoria e conselho, por link temporário (60 s). */
export async function GET(_: NextRequest, ctx: RouteContext<"/documentos/[id]">) {
  await exigirGestao();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Documento não encontrado.", { status: 404 });

  const supabase = await createClient();
  const { data: documento } = await supabase.from("documentos").select("titulo, arquivo").eq("id", id).maybeSingle();
  if (!documento) return new NextResponse("Documento não encontrado.", { status: 404 });

  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(documento.arquivo, 60, { download: `${documento.titulo}.pdf` });
  if (error || !data) return new NextResponse("Não foi possível abrir o documento.", { status: 502 });

  return NextResponse.redirect(data.signedUrl);
}
