import Link from "next/link";
import { ArrowLeft, Download, Maximize2 } from "lucide-react";

/**
 * Leitura de um PDF dentro do site. O arquivo vem de um link temporário do Storage,
 * servido para exibição (sem forçar o download). Baixar continua disponível.
 */
export function LeitorPdf({
  titulo,
  contexto,
  voltar,
  url,
  download,
}: {
  titulo: string;
  contexto: string;
  voltar: { href: string; rotulo: string };
  url: string;
  download: string;
}) {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
      <header className="flex flex-col gap-3 border-b border-linha bg-superficie px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <Link href={voltar.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-grafite hover:text-vinho">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {voltar.rotulo}
          </Link>
          <h1 className="mt-0.5 truncate text-lg font-bold tracking-[-0.01em] text-tinta" title={titulo}>
            {titulo}
          </h1>
          <p className="text-sm text-grafite">{contexto}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="botao botao-secundario">
            <Maximize2 aria-hidden="true" className="size-4" />
            Tela cheia
          </a>
          <a href={download} className="botao">
            <Download aria-hidden="true" className="size-4" />
            Baixar
          </a>
        </div>
      </header>
      <iframe src={url} title={titulo} className="min-h-0 w-full flex-1 bg-sutil" />
    </div>
  );
}
