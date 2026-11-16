import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, FileText, MapPin, Presentation, UserCheck } from "lucide-react";
import { comLinks, TextoLivre } from "@/components/texto";
import { Lista, Pagina, Secao } from "@/components/ui";
import {
  aulaJaComecou,
  aulaJaPassou,
  formatarDataLonga,
  formatarHora,
  formatarTamanho,
  rotuloAula,
  type Aula,
} from "@/lib/ciclos";
import type { Papel } from "@/lib/membro";
import { MINHA_PRESENCA, type LinhaDaChamada, type StatusPresenca } from "@/lib/presenca-formato";
import { apagarMaterial } from "./actions";
import { Chamada } from "./chamada";
import { EnvioDeMateriais, FormularioAula } from "./edicao";

type Props = {
  aula: Aula;
  papel: Papel;
  /** Lista da chamada: só para diretoria e conselho. */
  chamada: LinhaDaChamada[] | null;
  /** Presença do próprio membro (ligantes e diretoria). */
  minhaPresenca: StatusPresenca | null;
  agora?: Date;
};

/** Link externo em cartão, no mesmo desenho dos anexos. */
function LinkExterno({ href, titulo, detalhe, icone }: { href: string; titulo: string; detalhe: string; icone: ReactNode }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cartao group flex items-center gap-3 p-3 transition-colors hover:border-linha-forte sm:gap-4 sm:p-4"
      >
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-vinho-suave text-vinho">
          {icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-tinta group-hover:text-vinho">{titulo}</span>
          <span className="block text-sm text-grafite">{detalhe}</span>
        </span>
        <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-linha-forte transition-colors group-hover:text-vinho" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </li>
  );
}

function origem(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("drive.google.com") || host.endsWith("docs.google.com")) return "Google Drive";
    if (host.endsWith("canva.com")) return "Canva";
    return host;
  } catch {
    return "Link externo";
  }
}

/** Página da aula: professor, bibliografia, anexos, depois da aula e, para a gestão, chamada e edição. */
export function ConteudoDaAula({ aula, papel, chamada, minhaPresenca, agora = new Date() }: Props) {
  const diretoria = papel === "diretoria";
  const leituras = (aula.bibliografia ?? "").split("\n").filter((linha) => linha.trim());
  const temPosAula = Boolean(aula.resumo || aula.slidesUrl || aula.apostilaUrl);
  const passou = aulaJaPassou(aula.data, agora);
  const chamadaAberta = aulaJaComecou(aula.data, agora);

  return (
    <Pagina>
      <Link href="/ciclos" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Ciclos e aulas
      </Link>

      <header className="mt-4 mb-8 sm:mb-10">
        <div className="flex flex-wrap gap-1.5">
          <span className="selo selo-suave">{rotuloAula(aula.numero)}</span>
          {aula.ciclo ? <span className="selo">Ciclo {aula.ciclo.codigo}</span> : null}
        </div>
        <h1 className="h1 mt-3">{aula.titulo}</h1>
        <ul className="mt-4 flex flex-col gap-2 text-grafite sm:flex-row sm:flex-wrap sm:gap-x-6">
          <li className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
            {aula.data ? (
              <span>
                <span className="inline-block first-letter:uppercase">{formatarDataLonga(aula.data)}</span>, às{" "}
                {formatarHora(aula.data)}
              </span>
            ) : (
              "Data a definir"
            )}
          </li>
          {aula.local ? (
            <li className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              {aula.local}
            </li>
          ) : null}
          {minhaPresenca ? (
            <li className="flex items-center gap-2">
              <UserCheck aria-hidden="true" className="size-[1.125rem] shrink-0" strokeWidth={1.75} />
              <span className="font-medium text-tinta">{MINHA_PRESENCA[minhaPresenca]}</span>
            </li>
          ) : null}
        </ul>
      </header>

      <Secao titulo="Professor">
        {aula.professor ? (
          <div className="prosa">
            <p className="text-lg font-semibold text-tinta">{aula.professor}</p>
            {aula.professorBio ? <p className="mt-1.5 whitespace-pre-line text-tinta">{aula.professorBio}</p> : null}
          </div>
        ) : (
          <p className="text-grafite">Professor ainda não informado.</p>
        )}
      </Secao>

      <Secao titulo="Bibliografia">
        {leituras.length > 0 ? (
          <Lista itens={leituras.map((linha) => comLinks(linha))} />
        ) : (
          <p className="text-grafite">Nenhuma leitura indicada ainda.</p>
        )}

        <h3 className="h3 mt-8">Anexos</h3>
        {aula.materiais.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {aula.materiais.map((m) => (
              <li key={m.id} className="cartao flex items-center gap-3 p-3 pr-2 sm:gap-4 sm:p-4 sm:pr-3">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-vinho-suave text-vinho">
                  <FileText className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <a href={`/materiais/${m.id}`} className="block font-medium break-words text-tinta underline-offset-4 hover:text-vinho hover:underline">
                    {m.titulo}
                  </a>
                  <p className="text-sm text-grafite">PDF{m.tamanho ? ` · ${formatarTamanho(m.tamanho)}` : ""}</p>
                </div>
                {diretoria ? (
                  <form action={apagarMaterial}>
                    <input type="hidden" name="materialId" value={m.id} />
                    <button
                      type="submit"
                      aria-label={`Remover o anexo ${m.titulo}`}
                      className="min-h-10 rounded-lg px-3 text-sm font-medium text-grafite transition-colors hover:bg-sutil hover:text-vinho-escuro"
                    >
                      Remover
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-grafite">Nenhum anexo ainda.</p>
        )}
      </Secao>

      {temPosAula || passou ? (
        <Secao titulo="Depois da aula">
          {aula.resumo ? <TextoLivre texto={aula.resumo} className="text-tinta" /> : null}
          {aula.slidesUrl || aula.apostilaUrl ? (
            <ul className={`flex flex-col gap-2 ${aula.resumo ? "mt-6" : ""}`}>
              {aula.slidesUrl ? (
                <LinkExterno
                  href={aula.slidesUrl}
                  titulo="Slides da aula"
                  detalhe={origem(aula.slidesUrl)}
                  icone={<Presentation className="size-5" strokeWidth={1.75} />}
                />
              ) : null}
              {aula.apostilaUrl ? (
                <LinkExterno
                  href={aula.apostilaUrl}
                  titulo="Apostila"
                  detalhe={origem(aula.apostilaUrl)}
                  icone={<BookOpen className="size-5" strokeWidth={1.75} />}
                />
              ) : null}
            </ul>
          ) : null}
          {!temPosAula ? <p className="text-grafite">Slides e resumo ainda não publicados.</p> : null}
        </Secao>
      ) : null}

      {chamada ? (
        <section aria-labelledby="chamada" className="mb-6 rounded-2xl bg-sutil p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="chamada" className="h2">
              Chamada
            </h2>
            <span className="selo border border-linha-forte bg-superficie">{diretoria ? "Só diretoria" : "Modo leitura"}</span>
          </div>
          <div className="mt-5">
            {chamadaAberta ? (
              <Chamada aulaId={aula.id} linhas={chamada} editavel={diretoria} />
            ) : (
              <p className="text-grafite">
                {aula.data ? "A chamada abre no dia da aula." : "A chamada abre quando a aula tiver data."}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {diretoria ? (
        <section aria-labelledby="editar-aula" className="mt-2 rounded-2xl bg-sutil p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="editar-aula" className="h2">
              Editar esta aula
            </h2>
            <span className="selo border border-linha-forte bg-superficie">Só diretoria</span>
          </div>
          <div className="prosa mt-6">
            <FormularioAula
              aulaId={aula.id}
              valores={{
                professor: aula.professor ?? "",
                professorBio: aula.professorBio ?? "",
                local: aula.local ?? "",
                bibliografia: aula.bibliografia ?? "",
                resumo: aula.resumo ?? "",
                slidesUrl: aula.slidesUrl ?? "",
                apostilaUrl: aula.apostilaUrl ?? "",
              }}
            />
            <div className="mt-8 border-t border-linha-forte pt-8">
              <EnvioDeMateriais aulaId={aula.id} />
            </div>
          </div>
        </section>
      ) : null}
    </Pagina>
  );
}
