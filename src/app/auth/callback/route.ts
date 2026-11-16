import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retorno dos links do e-mail (confirmação de conta e nova senha): troca o código pela sessão. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const proximo = searchParams.get("proximo");
  // Só caminhos internos, para o link não virar porta de redirecionamento para fora.
  const destino = proximo && proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/login?erro=link`);
}
