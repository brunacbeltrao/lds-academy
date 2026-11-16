import type { Metadata } from "next";
import { exigirGestao } from "@/lib/membro";
import { getCiclosParaPlanejar } from "@/lib/planejamento";
import { createClient } from "@/lib/supabase/server";
import { ConteudoDoPlanejamento, proximoCodigo } from "./conteudo";

export const metadata: Metadata = { title: "Planejamento do ciclo" };

export default async function PlanejamentoPage() {
  const membro = await exigirGestao();
  const supabase = await createClient();
  const [ciclos, { data: codigos }] = await Promise.all([getCiclosParaPlanejar(), supabase.from("ciclos").select("codigo")]);
  return (
    <ConteudoDoPlanejamento
      ciclos={ciclos}
      sugestao={proximoCodigo((codigos ?? []).map((c) => c.codigo))}
      diretoria={membro.papel === "diretoria"}
    />
  );
}
