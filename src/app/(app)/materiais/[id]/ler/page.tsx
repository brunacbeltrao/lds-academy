import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeitorPdf } from "@/components/leitor-pdf";
import { rotuloAula } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Leitura" };

type Linha<T> = T | T[] | null;
const um = <T,>(v: Linha<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export default async function LerMaterialPage({ params }: PageProps<"/materiais/[id]/ler">) {
  await getMembroAtual();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: material } = await supabase
    .from("aula_materiais")
    .select("titulo, arquivo, aula:aulas(id, numero, titulo)")
    .eq("id", id)
    .maybeSingle();
  if (!material) notFound();

  // Link de leitura válido por 1 hora; sem a opção de download, o navegador exibe o PDF.
  const { data } = await supabase.storage.from("materiais").createSignedUrl(material.arquivo, 3600);
  if (!data) notFound();
  const aula = um(material.aula as Linha<{ id: string; numero: number | null; titulo: string }>);

  return (
    <LeitorPdf
      titulo={material.titulo}
      contexto={aula ? `${rotuloAula(aula.numero)} · ${aula.titulo}` : "Anexo de aula"}
      voltar={{ href: aula ? `/ciclos/aulas/${aula.id}` : "/ciclos", rotulo: aula ? "Voltar à aula" : "Ciclos e aulas" }}
      url={data.signedUrl}
      download={`/materiais/${id}`}
    />
  );
}
