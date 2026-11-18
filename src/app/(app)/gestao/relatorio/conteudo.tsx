import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CabecalhoDaPagina, Grade, Numero, Pagina, Secao, Vazio } from "@/components/ui";
import { media, plural, porcento } from "@/lib/avaliacao-formato";
import { periodoDoCiclo, rotuloAula, rotuloDoCiclo } from "@/lib/ciclos";
import { curta, registro } from "@/lib/datas";
import { LIMITE_DE_FALTAS } from "@/lib/frequencia";
import type { AulaDoRelatorio, Relatorio } from "@/lib/relatorio";
import { BotaoImprimir } from "./imprimir";

/** Relatório do ciclo para a diretoria e o conselho. Recebe os dados prontos (ver lib/relatorio). */
export function ConteudoDoRelatorio({ relatorio, agora = new Date() }: { relatorio: Relatorio | null; agora?: Date }) {
  if (!relatorio) {
    return (
      <Pagina larga>
        <CabecalhoDaPagina titulo="Relatório do ciclo" />
        <Vazio titulo="Nenhum ciclo em curso ou encerrado" texto="O relatório aparece quando houver um ciclo iniciado." />
      </Pagina>
    );
  }

  const { ciclo, aulas, participantes } = relatorio;
  const realizadas = aulas.filter((a) => a.realizada);
  const presentes = realizadas.reduce((s, a) => s + a.presentes, 0);
  const registradas = realizadas.reduce((s, a) => s + a.registradas, 0);
  const leituras = realizadas.reduce((s, a) => s + a.leituras, 0);
  const notas = aulas.flatMap((a) => a.notas);
  const comComentarios = aulas.filter((a) => a.comentarios.length > 0);
  const semPosAula = realizadas.filter((a) => !a.temResumo && !a.temSlides).length;
  const periodo = periodoDoCiclo(ciclo.inicio, ciclo.fim);

  return (
    <Pagina larga>
      <Link href="/gestao" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho print:hidden">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Gestão
      </Link>

      <CabecalhoDaPagina
        titulo="Relatório do ciclo"
        descricao={[ciclo.titulo, `Ciclo ${rotuloDoCiclo(ciclo.codigo)}`, periodo, ciclo.status === "atual" ? "em curso" : "encerrado"].filter(Boolean).join(" · ")}
        acoes={
          <div className="flex flex-wrap items-end gap-2 print:hidden">
            {relatorio.ciclos.length > 1 ? (
              <form action="/gestao/relatorio" className="flex items-end gap-2">
                <div>
                  <label htmlFor="ciclo" className="rotulo-campo">
                    Ciclo
                  </label>
                  <select id="ciclo" name="ciclo" defaultValue={ciclo.codigo} className="campo min-w-36">
                    {relatorio.ciclos.map((c) => (
                      <option key={c.id} value={c.codigo}>
                        {rotuloDoCiclo(c.codigo)}
                        {c.status === "atual" ? " (atual)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="botao botao-secundario">
                  Ver
                </button>
              </form>
            ) : null}
            <BotaoImprimir />
          </div>
        }
      />

      <Grade colunas={4}>
        <Numero rotulo="Aulas realizadas" valor={`${realizadas.length}/${aulas.length}`} detalhe={semPosAula > 0 ? `${plural(semPosAula, "sem", "sem")} resumo nem slides` : "Todas com material pós-aula"} />
        <Numero rotulo="Presença média" valor={porcento(presentes, registradas) ?? "—"} detalhe={registradas > 0 ? `${presentes} presenças em ${registradas} registros` : "Nenhuma chamada registrada"} />
        <Numero
          rotulo="Leitura feita"
          valor={porcento(leituras, realizadas.length * participantes) ?? "—"}
          detalhe={realizadas.length > 0 ? "dos membros, por aula, em média" : undefined}
        />
        <Numero rotulo="Nota média das aulas" valor={media(notas) ?? "—"} detalhe={notas.length > 0 ? `${plural(notas.length, "avaliação", "avaliações")}, de 1 a 5` : "Ainda sem avaliações"} />
      </Grade>

      <Secao titulo="Aula por aula" descricao={`Presença sobre as chamadas registradas; leitura sobre os ${participantes} membros ativos.`}>
        {aulas.length === 0 ? (
          <Vazio titulo="Nenhuma aula neste ciclo" />
        ) : (
          <div className="cartao overflow-hidden">
            <div className="hidden grid-cols-[2.4fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-4 border-b border-linha bg-sutil px-4 py-2.5 text-xs font-semibold text-grafite md:grid">
              <span>Aula</span>
              <span>Presença</span>
              <span>Leitura</span>
              <span>Nota</span>
              <span>Depois da aula</span>
            </div>
            <ul className="divide-y divide-linha">
              {aulas.map((a) => (
                <LinhaDaAula key={a.id} aula={a} participantes={participantes} />
              ))}
            </ul>
          </div>
        )}
      </Secao>

      <Secao titulo="Frequência">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="h3">Perto do limite de faltas</h3>
            <p className="mt-1 text-sm text-grafite">Duas ou mais faltas sem justificativa. O limite é {LIMITE_DE_FALTAS}.</p>
            {relatorio.pertoDoLimite.length === 0 ? (
              <p className="mt-3 text-[0.9375rem] text-grafite">Ninguém perto do limite.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha border-y border-linha">
                {relatorio.pertoDoLimite.map((m) => (
                  <li key={m.nome} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate text-tinta">{m.nome}</span>
                    <span className={`selo shrink-0 ${m.faltas >= LIMITE_DE_FALTAS ? "selo-vinho" : "selo-suave"}`}>
                      {plural(m.faltas, "falta", "faltas")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="h3">Justificativas</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {[
                { rotulo: "Recebidas", valor: relatorio.justificativas.recebidas },
                { rotulo: "Aceitas", valor: relatorio.justificativas.aceitas },
                { rotulo: "Recusadas", valor: relatorio.justificativas.recusadas },
                { rotulo: "Em análise", valor: relatorio.justificativas.pendentes },
              ].map((j) => (
                <div key={j.rotulo} className="cartao p-3">
                  <dt className="text-sm text-grafite">{j.rotulo}</dt>
                  <dd className="numeral text-xl font-bold text-tinta">{j.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Secao>

      <Secao titulo="Produção, tira-dúvidas e oportunidades">
        <Grade colunas={4}>
          {relatorio.producao.map((p) => (
            <Numero
              key={p.tipo}
              rotulo={p.tipo === "artigo" ? "Mini-artigos publicados" : "Carrosséis publicados"}
              valor={`${p.publicadas}/${p.previstas}`}
              detalhe={p.previstas > 0 ? `${porcento(p.publicadas, p.previstas)} do previsto no ciclo` : "Nada previsto no ciclo"}
            />
          ))}
          <Numero
            rotulo="Perguntas no tira-dúvidas"
            valor={relatorio.perguntas ? relatorio.perguntas.feitas : "—"}
            detalhe={
              relatorio.perguntas
                ? `${relatorio.perguntas.respondidas} respondidas · ${relatorio.perguntas.privadas} privadas`
                : "O ciclo não tem datas de início e fim"
            }
          />
          <Numero
            rotulo="Oportunidades divulgadas"
            valor={relatorio.oportunidades ?? "—"}
            detalhe={relatorio.oportunidades === null ? "O ciclo não tem datas de início e fim" : "publicadas no mural durante o ciclo"}
          />
        </Grade>
      </Secao>

      <Secao titulo="Comentários sobre as aulas" descricao="Como os membros escreveram, sem os nomes.">
        {comComentarios.length === 0 ? (
          <Vazio titulo="Nenhum comentário ainda" texto="Os membros avaliam cada aula na página dela, a partir do horário de início." />
        ) : (
          <div className="flex flex-col gap-6">
            {comComentarios.map((a) => (
              <div key={a.id} className="break-inside-avoid">
                <h3 className="h3">
                  {rotuloAula(a.numero)} · {a.titulo}
                </h3>
                <ul className="mt-2 divide-y divide-linha border-y border-linha">
                  {a.comentarios.map((c, i) => (
                    <li key={i} className="py-2.5">
                      <p className="text-sm text-grafite">Nota {c.nota}</p>
                      <p className="prosa whitespace-pre-line text-tinta">{c.texto}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <p className="mt-2 text-sm text-grafite">
        Gerado em {registro(agora.toISOString())}. Leitura e frequência usam a lista atual de membros ativos ({participantes}), sem o conselho.
      </p>
    </Pagina>
  );
}

function LinhaDaAula({ aula: a, participantes }: { aula: AulaDoRelatorio; participantes: number }) {
  const presenca = !a.realizada ? "—" : a.registradas === 0 ? "Sem chamada" : `${a.presentes}/${a.registradas}`;
  const leitura = a.realizada || a.leituras > 0 ? `${a.leituras}/${participantes}` : "—";
  const nota = a.notas.length > 0 ? `${media(a.notas)} (${a.notas.length})` : "—";
  return (
    <li className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3.5 md:grid-cols-[2.4fr_0.9fr_0.9fr_0.9fr_1.1fr] md:items-center">
      <div className="col-span-2 min-w-0 md:col-span-1">
        <Link href={`/ciclos/aulas/${a.id}`} className="font-medium text-tinta hover:text-vinho">
          {a.titulo}
        </Link>
        <p className="text-sm text-grafite">
          {[rotuloAula(a.numero), a.data ? curta(a.data) : "sem data", a.professor].filter(Boolean).join(" · ")}
        </p>
      </div>
      <Celula rotulo="Presença" valor={presenca} />
      <Celula rotulo="Leitura" valor={leitura} />
      <Celula rotulo="Nota" valor={nota} />
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-sm text-grafite md:hidden">Depois da aula: </span>
        {a.temResumo ? <span className="selo selo-suave">Resumo</span> : null}
        {a.temSlides ? <span className="selo selo-suave">Slides</span> : null}
        {!a.temResumo && !a.temSlides ? <span className="text-sm text-grafite">{a.realizada ? "Pendente" : "—"}</span> : null}
      </div>
    </li>
  );
}

function Celula({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p className="text-[0.9375rem]">
      <span className="text-sm text-grafite md:hidden">{rotulo}: </span>
      <span className="numeral text-tinta">{valor}</span>
    </p>
  );
}
