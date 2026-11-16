import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { EscolhaDeProfessor } from "@/components/escolha-de-professor";
import { AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Grade, Numero, Pagina, Recolhivel, Secao, Vazio } from "@/components/ui";
import { periodoDoCiclo, rotuloAula } from "@/lib/ciclos";
import { dia, hora, semana } from "@/lib/datas";
import { andamento, ROTULO_CONVITE, type CicloPlanejado, type EncontroPlanejado, type StatusConvite } from "@/lib/planejamento";
import type { OpcaoDeProfessor } from "@/lib/professores";
import {
  adicionarEncontro,
  iniciarCiclo,
  preencherQuartas,
  publicarCronograma,
  removerEncontro,
  salvarCiclo,
  salvarEncontro,
} from "../actions";

const OPCOES_CONVITE = Object.entries(ROTULO_CONVITE).map(([valor, rotulo]) => ({ valor, rotulo }));
const COR_CONVITE: Record<StatusConvite, string> = {
  a_convidar: "",
  convidado: "border border-linha-forte bg-superficie",
  confirmado: "selo-suave",
  recusou: "border border-vinho-borda bg-superficie text-vinho-escuro",
};

/** "20:00" no fuso de Recife, para o campo de hora. */
function horaDoCampo(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Editor do planejamento de um ciclo: andamento, cronograma em rascunho, publicação e início. */
export function EditorDoCiclo({
  ciclo,
  encontros,
  professores,
  diretoria,
}: {
  ciclo: CicloPlanejado;
  encontros: EncontroPlanejado[];
  professores: OpcaoDeProfessor[];
  diretoria: boolean;
}) {
  const resumo = andamento(encontros);
  const emPlanejamento = ciclo.status === "planejado";
  const editavel = diretoria && emPlanejamento;

  return (
    <Pagina larga>
      <Link href="/gestao/planejamento" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Planejamento do ciclo
      </Link>

      <CabecalhoDaPagina
        titulo={ciclo.titulo}
        descricao={ciclo.descricao ?? undefined}
        contexto={`Ciclo ${ciclo.codigo} · ${periodoDoCiclo(ciclo.inicio, ciclo.fim) ?? "período a definir"}`}
      >
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`selo ${ciclo.cronograma_publicado ? "selo-suave" : ""}`}>
            {ciclo.cronograma_publicado ? "Cronograma publicado para os ligantes" : "Rascunho: só a diretoria e o conselho veem"}
          </span>
          {!emPlanejamento ? <span className="selo">Ciclo {ciclo.status === "atual" ? "em curso" : "encerrado"}</span> : null}
        </div>
      </CabecalhoDaPagina>

      <Grade colunas={4}>
        <Numero rotulo="Aulas" valor={resumo.aulas} detalhe={resumo.eventos ? `e ${resumo.eventos} ${resumo.eventos === 1 ? "evento" : "eventos"}` : undefined} />
        <Numero rotulo="Professor confirmado" valor={`${resumo.confirmadas}/${resumo.aulas}`} />
        <Numero rotulo="Sem professor" valor={resumo.semProfessor} alerta={resumo.semProfessor > 0} />
        <Numero rotulo="Tema a definir" valor={resumo.semTema} alerta={resumo.semTema > 0} />
      </Grade>

      <Secao
        id="cronograma"
        titulo="Cronograma"
        descricao={editavel ? "Abra um encontro para definir tema, data, professor e convite. A numeração das aulas segue a data." : undefined}
      >
        {encontros.length === 0 ? (
          <Vazio
            titulo="Nenhum encontro ainda"
            texto={editavel ? "Use “Preencher as quartas-feiras” para criar uma aula por semana, ou adicione os encontros um a um." : undefined}
          />
        ) : (
          <ol className="flex flex-col gap-2.5">
            {encontros.map((e) => (
              <LinhaDoCronograma key={e.id} encontro={e} professores={professores} editavel={editavel} />
            ))}
          </ol>
        )}

        {editavel ? (
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_20rem]">
            <Recolhivel titulo="Adicionar encontro">
              <Formulario acao={adicionarEncontro} resetar className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="ciclo_id" value={ciclo.id} />
                <Escolha
                  nome="tipo"
                  rotulo="Tipo"
                  prefixo="novo"
                  opcoes={[
                    { valor: "aula", rotulo: "Aula do Grupo de Estudos" },
                    { valor: "evento", rotulo: "Evento (apresentação, rinha, palestra)" },
                  ]}
                />
                <Campo nome="titulo" rotulo="Tema ou nome" maxLength={300} prefixo="novo" placeholder="Em branco: Tema a definir" />
                <Campo nome="dia" rotulo="Data" tipo="date" obrigatorio prefixo="novo" />
                <Campo nome="hora" rotulo="Horário" tipo="time" obrigatorio padrao="20:00" prefixo="novo" />
                <Campo nome="local" rotulo="Local" maxLength={200} padrao="FDR" prefixo="novo" className="sm:col-span-2" />
                <BotaoEnviar className="justify-self-start">Adicionar</BotaoEnviar>
              </Formulario>
            </Recolhivel>
            <div className="cartao p-4 sm:p-5">
              <h3 className="font-semibold text-tinta">Preencher as quartas-feiras</h3>
              <p className="mt-1 text-[0.9375rem] text-grafite">
                Cria uma aula “Tema a definir” às 20h em cada quarta-feira entre o primeiro e o último encontro que ainda esteja livre.
              </p>
              <Formulario acao={preencherQuartas} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="ciclo_id" value={ciclo.id} />
                <BotaoEnviar variante="secundario" enviando="Criando…" className="self-start">
                  Preencher
                </BotaoEnviar>
              </Formulario>
            </div>
          </div>
        ) : null}
      </Secao>

      {editavel ? (
        <>
          <Secao id="publicacao" titulo="Publicação">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="cartao p-4 sm:p-5">
                <h3 className="font-semibold text-tinta">{ciclo.cronograma_publicado ? "Recolher o cronograma" : "Publicar o cronograma"}</h3>
                <p className="mt-1 text-[0.9375rem] text-grafite">
                  {ciclo.cronograma_publicado
                    ? "As aulas e os eventos voltam a ser rascunho e somem de Ciclos e aulas e do Calendário dos ligantes."
                    : "As aulas e os eventos aparecem para os ligantes na aba Próximo ciclo e no Calendário. Convites e notas continuam só da diretoria."}
                </p>
                <Formulario
                  acao={publicarCronograma}
                  confirmar={ciclo.cronograma_publicado ? "Recolher o cronograma? Os ligantes deixam de ver as aulas." : "Publicar o cronograma para os ligantes?"}
                  className="mt-3 flex flex-col gap-3"
                >
                  <input type="hidden" name="ciclo_id" value={ciclo.id} />
                  <input type="hidden" name="publicar" value={ciclo.cronograma_publicado ? "nao" : "sim"} />
                  <BotaoEnviar variante={ciclo.cronograma_publicado ? "secundario" : "principal"} enviando="Aguarde…" className="self-start">
                    {ciclo.cronograma_publicado ? "Recolher" : "Publicar para os ligantes"}
                  </BotaoEnviar>
                </Formulario>
              </div>
              <div className="cartao p-4 sm:p-5">
                <h3 className="font-semibold text-tinta">Iniciar o ciclo</h3>
                <p className="mt-1 text-[0.9375rem] text-grafite">
                  Quando o semestre começar: este ciclo vira o atual (Início, frequência e justificativas) e o ciclo em curso vai para o acervo.
                </p>
                <Formulario
                  acao={iniciarCiclo}
                  confirmar={`Iniciar o ciclo ${ciclo.codigo}? O ciclo em curso será encerrado e irá para o acervo.`}
                  className="mt-3 flex flex-col gap-3"
                >
                  <input type="hidden" name="ciclo_id" value={ciclo.id} />
                  <BotaoEnviar variante="secundario" enviando="Iniciando…" className="self-start">
                    Iniciar o ciclo {ciclo.codigo}
                  </BotaoEnviar>
                </Formulario>
                {!ciclo.cronograma_publicado ? <p className="mt-2 text-sm text-grafite">Disponível depois de publicar o cronograma.</p> : null}
              </div>
            </div>
          </Secao>

          <Secao id="dados" titulo="Dados do ciclo">
            <Formulario acao={salvarCiclo} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="ciclo_id" value={ciclo.id} />
              <Campo nome="titulo" rotulo="Tema do ciclo" obrigatorio maxLength={200} padrao={ciclo.titulo} prefixo="ciclo" className="sm:col-span-2" />
              <Campo nome="inicio" rotulo="Primeiro encontro" tipo="date" padrao={ciclo.inicio ?? undefined} prefixo="ciclo" />
              <Campo nome="fim" rotulo="Último encontro" tipo="date" padrao={ciclo.fim ?? undefined} prefixo="ciclo" />
              <AreaDeTexto nome="descricao" rotulo="Apresentação do ciclo" linhas={3} maxLength={2000} padrao={ciclo.descricao ?? undefined} prefixo="ciclo" className="sm:col-span-2" />
              <Campo
                nome="pasta_url"
                rotulo="Pasta do ciclo no Drive"
                tipo="url"
                maxLength={1000}
                padrao={ciclo.pasta_url ?? undefined}
                placeholder="https://drive.google.com/…"
                prefixo="ciclo"
                className="sm:col-span-2"
              />
              <BotaoEnviar className="justify-self-start">Salvar dados do ciclo</BotaoEnviar>
            </Formulario>
          </Secao>
        </>
      ) : null}
    </Pagina>
  );
}

function LinhaDoCronograma({ encontro: e, professores, editavel }: { encontro: EncontroPlanejado; professores: OpcaoDeProfessor[]; editavel: boolean }) {
  const aula = e.aula;
  const prefixo = `e-${e.id.slice(0, 8)}`;
  return (
    <li className="cartao">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="w-14 shrink-0 sm:w-16">
          <p className="numeral text-lg leading-tight font-bold text-tinta">{dia(e.inicio).slice(8, 10) + "/" + dia(e.inicio).slice(5, 7)}</p>
          <p className="text-xs text-grafite">
            {semana(e.inicio)} · {hora(e.inicio)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="selo">{aula ? rotuloAula(aula.numero) : "Evento"}</span>
            {aula ? <span className={`selo ${COR_CONVITE[aula.convite]}`}>{ROTULO_CONVITE[aula.convite]}</span> : null}
          </div>
          <h3 className={`h3 mt-1.5 ${/a definir/i.test(e.titulo) ? "text-grafite" : ""}`}>{e.titulo}</h3>
          {aula ? (
            <p className="mt-0.5 text-[0.9375rem] text-grafite">
              {aula.professor ? (
                <>
                  com <span className="font-medium text-tinta">{aula.professor}</span>
                </>
              ) : (
                "Professor a definir"
              )}
              {e.local ? ` · ${e.local}` : ""}
            </p>
          ) : e.local ? (
            <p className="mt-0.5 text-[0.9375rem] text-grafite">{e.local}</p>
          ) : null}
          {aula?.notas ? <p className="mt-1.5 text-sm whitespace-pre-line text-tinta">{aula.notas}</p> : null}
        </div>
      </div>

      {editavel ? (
        <details className="group border-t border-linha">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-vinho transition-colors hover:bg-sutil sm:px-5 [&::-webkit-details-marker]:hidden">
            Editar {aula ? "aula" : "evento"}
            <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-linha bg-sutil px-4 py-5 sm:px-5">
            <Formulario acao={salvarEncontro} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="evento_id" value={e.id} />
              <Campo nome="titulo" rotulo={aula ? "Tema da aula" : "Nome do evento"} obrigatorio maxLength={300} padrao={e.titulo} prefixo={prefixo} className="sm:col-span-2" />
              <Campo nome="dia" rotulo="Data" tipo="date" obrigatorio padrao={dia(e.inicio)} prefixo={prefixo} />
              <Campo nome="hora" rotulo="Horário" tipo="time" obrigatorio padrao={horaDoCampo(e.inicio)} prefixo={prefixo} />
              <Campo nome="local" rotulo="Local" maxLength={200} padrao={e.local ?? undefined} prefixo={prefixo} className="sm:col-span-2" />
              {aula ? (
                <>
                  <div className="sm:col-span-2">
                    <EscolhaDeProfessor professores={professores} padrao={aula.professorId} prefixo={prefixo} />
                  </div>
                  <Campo nome="professor" rotulo="Nome do professor na aula" maxLength={200} padrao={aula.professor ?? undefined} prefixo={prefixo} ajuda="Para dois professores, escreva os dois nomes." />
                  <Escolha nome="convite" rotulo="Convite" padrao={aula.convite} opcoes={OPCOES_CONVITE} prefixo={prefixo} />
                  <AreaDeTexto nome="professor_bio" rotulo="Apresentação do professor" linhas={3} maxLength={4000} padrao={aula.professorBio ?? undefined} prefixo={prefixo} className="sm:col-span-2" />
                  <AreaDeTexto
                    nome="notas"
                    rotulo="Notas da diretoria"
                    linhas={2}
                    maxLength={4000}
                    padrao={aula.notas ?? undefined}
                    placeholder="Quem fez o convite, alternativas, pendências"
                    ajuda="Só a diretoria e o conselho veem."
                    prefixo={prefixo}
                    className="sm:col-span-2"
                  />
                </>
              ) : (
                <AreaDeTexto nome="descricao" rotulo="Descrição" linhas={2} maxLength={1000} padrao={e.descricao ?? undefined} prefixo={prefixo} className="sm:col-span-2" />
              )}
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                <BotaoEnviar>Salvar</BotaoEnviar>
                {aula ? (
                  <Link href={`/ciclos/aulas/${aula.id}`} className="botao botao-secundario">
                    Bibliografia e anexos
                  </Link>
                ) : null}
              </div>
            </Formulario>
            <Formulario acao={removerEncontro} confirmar={`Remover “${e.titulo}” do cronograma?`} className="mt-4 flex flex-col gap-2 border-t border-linha-forte pt-4">
              <input type="hidden" name="evento_id" value={e.id} />
              <BotaoEnviar variante="discreto" enviando="Removendo…" className="self-start">
                Remover do cronograma
              </BotaoEnviar>
            </Formulario>
          </div>
        </details>
      ) : null}
    </li>
  );
}
