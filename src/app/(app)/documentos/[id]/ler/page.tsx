import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeitorPdf } from "@/components/leitor-pdf";
import { CATEGORIAS } from "@/lib/documentos";
import { exigirGestao } from "@/lib/membro";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Leitura" };

export default async function LerDocumentoPage({ params }: PageProps<"/documentos/[id]/ler">) {
  await exigirGestao();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: documento } = await supabase.from("documentos").select("titulo, arquivo, categoria").eq("id", id).maybeSingle();
  if (!documento) notFound();

  const { data } = await supabase.storage.from("documentos").createSignedUrl(documento.arquivo, 3600);
  if (!data) notFound();

  return (
    <LeitorPdf
      titulo={documento.titulo}
      contexto={CATEGORIAS.find((c) => c.id === documento.categoria)?.rotulo ?? "Documento da liga"}
      voltar={{ href: "/regularizacao", rotulo: "Regularização" }}
      url={data.signedUrl}
      download={`/documentos/${id}`}
    />
  );
}
