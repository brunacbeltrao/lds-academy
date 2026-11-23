import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, Download, FileText, MapPin, Presentation } from "lucide-react";
import { BotaoDeLeitura, FormularioDeAvaliacao, RetornoDaAulaPainel } from "@/components/aproveitamento";
import { AreaDeTexto, BotaoEnviar, Formulario } from "@/components/formulario";
import { Lista, Pagina, Secao } from "@/components/ui";
import type { MinhaAvaliacao, RetornoDaAula } from "@/lib/aproveitamento";
import type { OpcaoDeProfessor } from "@/lib/professores";
import { dia, hoje } from "@/lib/datas";
import { formatarDataLonga, formatarHora, formatarTamanho, rotuloAula, rotuloDoCiclo, type Aula } from "@/lib/ciclos";
import { apagarMaterial, justificarFalta } from "./actions";
import { EnvioDeMateriais, FormularioAula } from "./edicao";

/** Transforma endereços https em links, mantendo o resto do texto. */
function comLinks(texto: string): ReactNode[] {
  return texto.split(/(https?:\/\/[^\s]+)/g).map((parte, i) =>
    /^https?:\/\//.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noopener noreferrer" className="link break-all">
        {parte}
      </a>
    ) : (
      parte
    ),
  );
}

/** Texto livre em parágrafos (linha em branco separa parágrafos), com links clicáveis. */
function Paragrafos({ texto }: { texto: string }) {
  const paragrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="prosa flex flex-col gap-3 text-tinta">
      {paragrafos.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {comLinks(p)}
        </p>
      ))}
    </div>
  );
}

/** De onde vem o link, para o membro saber o que vai abrir. */
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

/** Link externo em cartão, no mesmo desenho dos anexos. */
function LinkExterno({ href, titulo, icone }: { href: string; titulo: string; icone: ReactNode }) {
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
          <span className="block text-sm text-grafite">{origem(href)}</span>
        </span>
        <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-linha-forte transition-colors group-hover:text-vinho" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </li>
  );
}

/** Página da aula: professor, bibliografia, anexos e, para a diretoria, a edição. */
export type MinhaPresenca = {
  podeJustificar: boolean;
  presenca: "presente" | "falta" | "justificada" | null;
  justificativa: { motivo: string; status: "pendente" | "aceita" | "recusada" } | null;
};

const ROTULO_PRESENCA = { presente: "Presença registrada", falta: "Falta registrada", justificada: "Falta justificada" } as const;
const ROTULO_JUSTIFICATIVA = { pendente: "Em análise pela diretoria", aceita: "Aceita", recusada: "Recusada" } as const;

export function ConteudoDaAula({
  aula,
  diretoria,
  minha,
  professores = [],
  aproveitamento = null,
  retorno = null,
}: {
  aula: Aula;
  diretoria: boolean;
  minha: MinhaPresenca | null;
  professores?: OpcaoDeProfessor[];
  /** Leitura e avaliação do próprio membro (ligantes e diretoria, aulas do ciclo em curso). */
  aproveitamento?: { leituraFeita: boolean; avaliacao: MinhaAvaliacao | null } | null;
  /** Leituras e avaliações de todos, sem nomes (diretoria e conselho). */
  retorno?: RetornoDaAula | null;
}) {
  const leituras = (aula.bibliografia ?? "").split("\n").filter((linha) => linha.trim());
  const temPosAula = Boolean(aula.resumo || aula.slidesUrl || aula.apostilaUrl);
  const aulaPassou = aula.data !== null && dia(aula.data) < hoje();
  const aulaComecou = aula.data !== null && new Date(aula.data) <= new Date();
  const temLeitura = leituras.length > 0 || aula.materiais.length > 0;

  return (
    <Pagina>
      <Link
        href={aula.ciclo ? `/ciclos/acervo/${aula.ciclo.codigo}` : "/ciclos"}
        className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {aula.ciclo ? `Ciclo ${rotuloDoCiclo(aula.ciclo.codigo)}` : "Ciclos e aulas"}
      </Link>

      <header className="mt-4 mb-8 sm:mb-10">
        <div className="flex flex-wrap gap-1.5">
          <span className="selo selo-suave">{rotuloAula(aula.numero)}</span>
          {aula.ciclo ? <span className="selo">Ciclo {rotuloDoCiclo(aula.ciclo.codigo)}</span> : null}
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
        </ul>
        {aula.pastaUrl ? (
          <a href={aula.pastaUrl} target="_blank" rel="noopener noreferrer" className="botao botao-secundario mt-5">
            Materiais no Drive
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        ) : null}
      </header>

      {minha ? (
        <section id="justificativa" aria-labelledby="minha-presenca" className="cartao mb-8 scroll-mt-24 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="minha-presenca" className="h3">
              Minha presença
            </h2>
            <span className={`selo ${minha.presenca === "falta" ? "selo-suave" : ""}`}>
              {minha.presenca ? ROTULO_PRESENCA[minha.presenca] : "Ainda sem registro"}
            </span>
          </div>
          {minha.justificativa ? (
            <div className="mt-3 text-[0.9375rem]">
              <p className="text-grafite">
                Justificativa enviada: <span className="font-semibold text-tinta">{ROTULO_JUSTIFICATIVA[minha.justificativa.status]}</span>
              </p>
              <p className="prosa mt-1 whitespace-pre-line text-tinta">{minha.justificativa.motivo}</p>
            </div>
          ) : minha.podeJustificar && minha.presenca !== "presente" ? (
            <Formulario acao={justificarFalta} className="prosa mt-3 flex flex-col gap-3">
              <input type="hidden" name="aulaId" value={aula.id} />
              <AreaDeTexto
                nome="motivo"
                rotulo="Justificar falta"
                obrigatorio
                linhas={3}
                maxLength={2000}
                ajuda="Pode ser antes ou depois da aula. O limite é de três faltas sem justificativa por ciclo."
              />
              <BotaoEnviar enviando="Enviando…" variante="secundario" className="self-start">
                Enviar justificativa
              </BotaoEnviar>
            </Formulario>
          ) : null}
        </section>
      ) : null}

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

      <Secao
        id="bibliografia"
        titulo="Bibliografia"
        acao={aproveitamento && temLeitura ? <BotaoDeLeitura aulaId={aula.id} feita={aproveitamento.leituraFeita} /> : undefined}
      >
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
                  <Link href={`/materiais/${m.id}/ler`} className="block font-medium break-words text-tinta underline-offset-4 hover:text-vinho hover:underline">
                    {m.titulo}
                  </Link>
                  <p className="text-sm text-grafite">PDF{m.tamanho ? ` · ${formatarTamanho(m.tamanho)}` : ""}</p>
                </div>
                <a
                  href={`/materiais/${m.id}`}
                  aria-label={`Baixar ${m.titulo}`}
                  title="Baixar"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-grafite transition-colors hover:bg-sutil hover:text-vinho"
                >
                  <Download aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />
                </a>
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

      {temPosAula || aulaPassou ? (
        <Secao titulo="Depois da aula">
          {aula.resumo ? <Paragrafos texto={aula.resumo} /> : null}
          {aula.slidesUrl || aula.apostilaUrl ? (
            <ul className={`flex flex-col gap-2 ${aula.resumo ? "mt-6" : ""}`}>
              {aula.slidesUrl ? (
                <LinkExterno href={aula.slidesUrl} titulo="Slides da aula" icone={<Presentation className="size-5" strokeWidth={1.75} />} />
              ) : null}
              {aula.apostilaUrl ? (
                <LinkExterno href={aula.apostilaUrl} titulo="Apostila" icone={<BookOpen className="size-5" strokeWidth={1.75} />} />
              ) : null}
            </ul>
          ) : null}
          {!temPosAula ? <p className="text-grafite">Slides e resumo ainda não publicados.</p> : null}
        </Secao>
      ) : null}

      {aproveitamento && aulaComecou ? (
        <Secao
          id="avaliacao"
          titulo="Avaliar a aula"
          descricao={aproveitamento.avaliacao ? "Você já avaliou esta aula. Pode corrigir a nota ou o comentário." : "Leva menos de um minuto e ajuda a diretoria a planejar os próximos ciclos."}
        >
          <FormularioDeAvaliacao aulaId={aula.id} minha={aproveitamento.avaliacao} />
        </Secao>
      ) : null}

      {retorno ? (
        <section aria-labelledby="retorno-da-aula" className="mb-6 rounded-2xl bg-sutil p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="retorno-da-aula" className="h2">
              Retorno da aula
            </h2>
            <span className="selo border border-linha-forte bg-superficie">Diretoria e conselho</span>
          </div>
          <p className="prosa mt-1.5 text-grafite">Leituras marcadas e avaliações dos membros. Os nomes de quem avaliou não aparecem.</p>
          <div className="mt-5">
            <RetornoDaAulaPainel retorno={retorno} aulaComecou={aulaComecou} />
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
              professores={professores}
              aulaId={aula.id}
              valores={{
                professor: aula.professor ?? "",
                professorId: aula.professorId ?? "",
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
