import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, ChevronRight } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Pagina, Recolhivel, Vazio } from "@/components/ui";
import { rotuloAula, rotuloDoCiclo } from "@/lib/ciclos";
import type { MaterialDaTrilha, ParteDaTrilha, TopicoDaTrilha } from "@/lib/trilha";
import { apagarParte, apagarTopico, marcarTopico, salvarParte, salvarTopico } from "./actions";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function Barra({ feitos, total, rotulo }: { feitos: number; total: number; rotulo: string }) {
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  return (
    <div>
      <p className="text-sm text-grafite">
        <span className="numeral font-semibold text-tinta">{feitos}</span> de <span className="numeral">{total}</span> {rotulo}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos} aria-label={rotulo}>
        <div className="h-full rounded-full bg-vinho transition-[width] duration-300 ease-saida" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Materiais em texto, para o formulário de edição: "Rótulo | link", um por linha. */
function materiaisEmTexto(materiais: MaterialDaTrilha[]): string {
  return materiais
    .map((m) => {
      const link = m.aula ? `/ciclos/aulas/${m.aula.id}` : (m.url ?? "");
      return m.rotulo ? `${m.rotulo} | ${link}` : link;
    })
    .join("\n");
}

function Material({ m }: { m: MaterialDaTrilha }) {
  if (m.aula) {
    return (
      <li>
        <Link href={`/ciclos/aulas/${m.aula.id}`} className="group flex min-h-11 items-center gap-2 rounded-lg border border-linha bg-superficie px-3 py-2 text-sm transition-colors hover:border-linha-forte">
          <span className="min-w-0">
            <span className="block font-semibold text-tinta group-hover:text-vinho">
              {m.rotulo ?? `${m.aula.ciclo ? `Ciclo ${rotuloDoCiclo(m.aula.ciclo)} · ` : ""}${rotuloAula(m.aula.numero)}`}
            </span>
            <span className="block truncate text-grafite">{m.aula.titulo}</span>
          </span>
          <ChevronRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-linha-forte group-hover:text-vinho" />
        </Link>
      </li>
    );
  }
  return (
    <li>
      <a
        href={m.url ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex min-h-11 items-center gap-2 rounded-lg border border-linha bg-superficie px-3 py-2 text-sm transition-colors hover:border-linha-forte"
      >
        <span className="font-semibold text-tinta group-hover:text-vinho">{m.rotulo ?? "Material no Drive"}</span>
        <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-linha-forte group-hover:text-vinho" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </li>
  );
}

function FormularioTopico({ parteId, topico, proximaOrdem }: { parteId: string; topico?: TopicoDaTrilha; proximaOrdem: number }) {
  const prefixo = topico ? `topico-${topico.id}` : `novo-${parteId}`;
  return (
    <Formulario acao={salvarTopico} resetar={!topico} className="prosa flex flex-col gap-4">
      {topico ? <input type="hidden" name="topicoId" value={topico.id} /> : <input type="hidden" name="parteId" value={parteId} />}
      <div className="grid grid-cols-[5rem_1fr] gap-3">
        <Campo prefixo={prefixo} nome="ordem" rotulo="Posição" tipo="number" min="1" max="999" obrigatorio padrao={topico?.ordem ?? proximaOrdem} />
        <Campo prefixo={prefixo} nome="titulo" rotulo="Tópico" obrigatorio maxLength={200} padrao={topico?.titulo} />
      </div>
      <AreaDeTexto
        prefixo={prefixo}
        nome="leitura"
        rotulo="Leitura no livro"
        linhas={3}
        maxLength={2000}
        padrao={topico?.leitura ?? ""}
        placeholder="Título, capítulo, parágrafos e páginas. Uma referência por linha."
      />
      <AreaDeTexto prefixo={prefixo} nome="observacao" rotulo="Orientação" linhas={2} maxLength={1000} padrao={topico?.observacao ?? ""} placeholder="Dica curta para quem vai estudar o tópico." />
      <AreaDeTexto
        prefixo={prefixo}
        nome="materiais"
        rotulo="Aulas e materiais"
        linhas={4}
        maxLength={6000}
        padrao={topico ? materiaisEmTexto(topico.materiais) : ""}
        ajuda="Um por linha, no formato Rótulo | link. Para uma aula da plataforma, cole o endereço da página da aula (o rótulo é opcional). Para o Drive, o link da pasta."
      />
      <BotaoEnviar className="self-start">{topico ? "Salvar tópico" : "Adicionar tópico"}</BotaoEnviar>
    </Formulario>
  );
}

function Topico({ topico, parteId, participa, diretoria }: { topico: TopicoDaTrilha; parteId: string; participa: boolean; diretoria: boolean }) {
  return (
    <li id={`topico-${topico.id}`} className={`cartao scroll-mt-24 p-4 sm:p-5 ${topico.concluido ? "border-vinho-borda" : ""}`}>
      <div className="flex gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className={`numeral flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            topico.concluido ? "bg-vinho text-white" : "bg-sutil text-tinta ring-1 ring-linha-forte"
          }`}
        >
          {topico.concluido ? <Check className="size-4" strokeWidth={2.5} /> : topico.ordem}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <h3 className="h3 pt-1.5">
              <span className="sr-only">{topico.ordem}. </span>
              {topico.titulo}
            </h3>
            {participa ? (
              <AcaoRapida acao={marcarTopico}>
                <input type="hidden" name="topicoId" value={topico.id} />
                <input type="hidden" name="feito" value={topico.concluido ? "nao" : "sim"} />
                {topico.concluido ? (
                  <BotaoEnviar variante="discreto" enviando="Salvando…">
                    Estudado · desmarcar
                  </BotaoEnviar>
                ) : (
                  <BotaoEnviar variante="secundario" enviando="Salvando…">
                    <Check aria-hidden="true" className="size-4" strokeWidth={2} />
                    Marcar como estudado
                  </BotaoEnviar>
                )}
              </AcaoRapida>
            ) : null}
          </div>

          {topico.leitura ? (
            <div className="mt-3 flex gap-2.5 rounded-lg bg-sutil p-3 text-[0.9375rem]">
              <BookOpen aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vinho" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-tinta">Leitura no livro</p>
                <p className="mt-0.5 whitespace-pre-line text-tinta">{topico.leitura}</p>
              </div>
            </div>
          ) : null}

          {topico.observacao ? <p className="prosa mt-3 text-[0.9375rem] whitespace-pre-line text-grafite">{topico.observacao}</p> : null}

          {topico.materiais.length > 0 ? (
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {topico.materiais.map((m) => (
                <Material key={m.id} m={m} />
              ))}
            </ul>
          ) : null}

          {topico.concluidoPor !== null ? (
            <p className="mt-3 text-sm text-grafite">
              {topico.concluidoPor === 0 ? "Nenhum membro marcou como estudado" : `${topico.concluidoPor} ${topico.concluidoPor === 1 ? "membro marcou" : "membros marcaram"} como estudado`}
            </p>
          ) : null}

          {diretoria ? (
            <div className="mt-4">
              <Recolhivel titulo="Editar tópico">
                <FormularioTopico parteId={parteId} topico={topico} proximaOrdem={topico.ordem} />
                <AcaoRapida acao={apagarTopico} confirmar={`Remover o tópico "${topico.titulo}"? O progresso dos membros nele também some.`} className="mt-4">
                  <input type="hidden" name="topicoId" value={topico.id} />
                  <BotaoEnviar variante="discreto" enviando="Removendo…">
                    Remover tópico
                  </BotaoEnviar>
                </AcaoRapida>
              </Recolhivel>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Trilha de estudos: a ordem de aprendizado da liga, com o progresso de cada membro. */
export function ConteudoDaTrilha({ partes, participa, diretoria }: { partes: ParteDaTrilha[]; participa: boolean; diretoria: boolean }) {
  const topicos = partes.flatMap((p) => p.topicos);
  const estudados = topicos.filter((t) => t.concluido).length;

  return (
    <Pagina>
      <CabecalhoDaPagina
        titulo="Trilha de estudos"
        descricao="A ordem dos temas para estudar, do básico ao avançado, seguindo o livro Direito das Companhias (2ª edição, Forense, 2017). Cada tópico traz a leitura no livro, as aulas da liga sobre o tema e os materiais no Drive."
      />

      {participa && topicos.length > 0 ? (
        <div className="cartao mb-8 p-4 sm:p-5">
          <Barra feitos={estudados} total={topicos.length} rotulo="tópicos estudados" />
          <p className="mt-2 text-sm text-grafite">Marque cada tópico quando terminar a leitura e as aulas. O progresso aparece também na sua trajetória.</p>
        </div>
      ) : null}

      {partes.length === 0 ? <Vazio titulo="A trilha ainda não foi montada" /> : null}

      <div className="flex flex-col gap-12">
        {partes.map((p, i) => {
          const feitos = p.topicos.filter((t) => t.concluido).length;
          const proxima = (p.topicos.at(-1)?.ordem ?? 0) + 1;
          return (
            <section key={p.id} aria-labelledby={`parte-${p.id}`}>
              <p className="text-sm font-semibold text-vinho">Parte {ROMANOS[i] ?? i + 1}</p>
              <h2 id={`parte-${p.id}`} className="h2 mt-0.5">
                {p.titulo}
              </h2>
              {p.descricao ? <p className="prosa mt-1.5 text-grafite">{p.descricao}</p> : null}
              {participa && p.topicos.length > 0 ? (
                <div className="mt-3 max-w-xs">
                  <Barra feitos={feitos} total={p.topicos.length} rotulo="nesta parte" />
                </div>
              ) : null}

              {p.topicos.length === 0 ? (
                <div className="mt-4">
                  <Vazio titulo="Em preparação" texto="Os tópicos desta parte aparecem aqui quando a diretoria publicar." />
                </div>
              ) : (
                <ol className="mt-5 flex flex-col gap-3">
                  {p.topicos.map((t) => (
                    <Topico key={t.id} topico={t} parteId={p.id} participa={participa} diretoria={diretoria} />
                  ))}
                </ol>
              )}

              {diretoria ? (
                <div className="mt-4 flex flex-col gap-3">
                  <Recolhivel titulo={`Adicionar tópico à Parte ${ROMANOS[i] ?? i + 1}`}>
                    <FormularioTopico parteId={p.id} proximaOrdem={proxima} />
                  </Recolhivel>
                  <Recolhivel titulo="Editar esta parte">
                    <Formulario acao={salvarParte} className="prosa flex flex-col gap-4">
                      <input type="hidden" name="parteId" value={p.id} />
                      <div className="grid grid-cols-[5rem_1fr] gap-3">
                        <Campo prefixo={`parte-${p.id}`} nome="ordem" rotulo="Posição" tipo="number" min="1" max="999" obrigatorio padrao={p.ordem} />
                        <Campo prefixo={`parte-${p.id}`} nome="titulo" rotulo="Título" obrigatorio maxLength={120} padrao={p.titulo} />
                      </div>
                      <AreaDeTexto prefixo={`parte-${p.id}`} nome="descricao" rotulo="Descrição" linhas={2} maxLength={500} padrao={p.descricao ?? ""} />
                      <BotaoEnviar className="self-start">Salvar parte</BotaoEnviar>
                    </Formulario>
                    {p.topicos.length === 0 ? (
                      <AcaoRapida acao={apagarParte} confirmar={`Remover a parte "${p.titulo}"?`} className="mt-4">
                        <input type="hidden" name="parteId" value={p.id} />
                        <BotaoEnviar variante="discreto" enviando="Removendo…">
                          Remover parte
                        </BotaoEnviar>
                      </AcaoRapida>
                    ) : null}
                  </Recolhivel>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {diretoria ? (
        <div className="mt-12">
          <Recolhivel titulo="Adicionar parte">
            <Formulario acao={salvarParte} resetar className="prosa flex flex-col gap-4">
              <div className="grid grid-cols-[5rem_1fr] gap-3">
                <Campo prefixo="parte-nova" nome="ordem" rotulo="Posição" tipo="number" min="1" max="999" obrigatorio padrao={(partes.at(-1)?.ordem ?? 0) + 1} />
                <Campo prefixo="parte-nova" nome="titulo" rotulo="Título" obrigatorio maxLength={120} />
              </div>
              <AreaDeTexto prefixo="parte-nova" nome="descricao" rotulo="Descrição" linhas={2} maxLength={500} />
              <BotaoEnviar className="self-start">Adicionar parte</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </div>
      ) : null}
    </Pagina>
  );
}
