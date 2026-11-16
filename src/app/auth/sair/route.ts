import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function sair(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const erro = request.nextUrl.searchParams.get("erro");
  const destino = new URL("/login", request.nextUrl.origin);
  if (erro) destino.searchParams.set("erro", erro);
  return NextResponse.redirect(destino, { status: 303 });
}

export const GET = sair;
export const POST = sair;
