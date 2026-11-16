import type { Metadata } from "next";
import { ArrowUpRight, Trash2, Users } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Formulario } from "@/components/formulario";
import { Avatar, CabecalhoDaPagina, Grade, nomeCurto, Pagina, Recolhivel, Secao, Vazio } from "@/components/ui";
import { getCompeticoes } from "@/lib/competicoes";
import { curta } from "@/lib/datas";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getMembros } from "@/lib/membros";
import { apagarCompeticao, apagarEquipe, criarCompeticao, criarEquipe } from "./actions";

export const metadata: Metadata = { title: "Competições" };

export default async function CompeticoesPage() {
  const membro = await getMembroAtual();
  const diretoria = membro.papel === "diretoria";
  const [competicoes, membros, fotos] = await Promise.all([getCompeticoes(), diretoria ? getMembros() : Promise.resolve([]), getFotos()]);
  const minhasEquipes = competicoes.flatMap((c) => c.equipes.filter((e) => e.membros.some((m) => m.id === membro.id)).map((e) => ({ ...e, competicao: c })));

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Competições"
        descricao="Competições de que a liga participa, com edital, casos e peças das edições anteriores. Os materiais de cada equipe ficam visíveis só para a equipe e a diretoria."
      />

      {minhasEquipes.length > 0 ? (
        <Secao titulo="Minhas equipes">
          <Grade colunas={2}>
            {minhasEquipes.map((e) => (
              <div key={e.id} className="cartao border-vinho-borda bg-vinho-suave p-5">
                <p className="text-sm font-semibold text-vinho">
                  {e.competicao.nome}
                  {e.competicao.edicao ? ` ${e.competicao.edicao}` : ""}
                </p>
                <h3 className="h3 mt-1">{e.nome}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {e.membros.map((m) => (
                    <li key={m.id} className="flex items-center gap-1.5 text-sm text-tinta">
                      <Avatar nome={m.nome} foto={fotos[m.id]} tamanho="sm" />
                      {nomeCurto(m.nome)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Grade>
        </Secao>
      ) : null}

      <Secao titulo="Edições">
        {competicoes.length === 0 ? (
          <Vazio titulo="Nenhuma competição cadastrada" />
        ) : (
          <Grade>
            {competicoes.map((c) => (
              <article key={c.id} className="cartao flex flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="numeral text-sm font-semibold text-vinho">{c.edicao ?? "Edição única"}</p>
                  {diretoria ? (
                    <AcaoRapida acao={apagarCompeticao} confirmar={`Apagar ${c.nome} e todas as equipes?`}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" aria-label={`Apagar ${c.nome}`} className="-mt-1.5 -mr-2 flex size-9 items-center justify-center rounded-lg text-grafite hover:bg-sutil hover:text-vinho-escuro">
                        <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
                      </button>
                    </AcaoRapida>
                  ) : null}
                </div>
                <h2 className="h3 mt-1">{c.nome}</h2>
                {c.inicio ? (
                  <p className="numeral mt-0.5 text-sm text-grafite">
                    {curta(c.inicio)}
                    {c.fim ? ` a ${curta(c.fim)}` : ""}
                  </p>
                ) : null}
                {c.descricao ? <p className="mt-1.5 text-[0.9375rem] text-grafite">{c.descricao}</p> : null}

                {c.equipes.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-2 border-t border-linha pt-3">
                    {c.equipes.map((e) => (
                      <li key={e.id} className="flex items-start justify-between gap-2 text-sm">
                        <span>
                          <span className="flex items-center gap-1.5 font-semibold text-tinta">
                            <Users aria-hidden="true" className="size-3.5 text-grafite" />
                            {e.nome}
                          </span>
                          <span className="text-grafite">{e.membros.map((m) => nomeCurto(m.nome)).join(", ") || "Sem membros"}</span>
                        </span>
                        {diretoria ? (
                          <AcaoRapida acao={apagarEquipe} confirmar={`Apagar a equipe ${e.nome}?`}>
                            <input type="hidden" name="id" value={e.id} />
                            <button type="submit" aria-label={`Apagar a equipe ${e.nome}`} className="flex size-8 items-center justify-center rounded-lg text-grafite hover:bg-sutil hover:text-vinho-escuro">
                              <Trash2 aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                            </button>
                          </AcaoRapida>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4">
                  {c.pasta_url ? (
                    <a href={c.pasta_url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-sm font-semibold text-vinho">
                      Materiais
                      <ArrowUpRight aria-hidden="true" className="seta size-4" />
                    </a>
                  ) : null}
                  {c.edital_url ? (
                    <a href={c.edital_url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-sm font-semibold text-vinho">
                      Edital
                      <ArrowUpRight aria-hidden="true" className="seta size-4" />
                    </a>
                  ) : null}
                </div>

                {diretoria ? (
                  <details className="group/eq mt-4 border-t border-linha pt-3">
                    <summary className="cursor-pointer list-none text-sm font-medium text-grafite hover:text-tinta [&::-webkit-details-marker]:hidden">
                      Montar equipe
                    </summary>
                    <Formulario acao={criarEquipe} resetar className="mt-3 flex flex-col gap-3">
                      <input type="hidden" name="competicao_id" value={c.id} />
                      <Campo prefixo={c.id} nome="nome" rotulo="Nome da equipe" obrigatorio maxLength={100} />
                      <fieldset>
                        <legend className="rotulo-campo">Membros</legend>
                        <div className="max-h-48 overflow-y-auto rounded-[0.625rem] border border-linha-forte bg-superficie px-3 py-1">
                          {membros
                            .filter((m) => m.ativo)
                            .map((m) => (
                              <label key={m.id} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-tinta">
                                <input type="checkbox" name="membros" value={m.id} className="size-4 accent-vinho" />
                                {m.nome}
                              </label>
                            ))}
                        </div>
                      </fieldset>
                      <BotaoEnviar variante="secundario" className="self-start">
                        Criar equipe
                      </BotaoEnviar>
                    </Formulario>
                  </details>
                ) : null}
              </article>
            ))}
          </Grade>
        )}
      </Secao>

      {diretoria ? (
        <Recolhivel titulo="Nova competição ou edição">
          <Formulario acao={criarCompeticao} resetar className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo nome="nome" rotulo="Nome" obrigatorio maxLength={200} placeholder="Ex.: Sociecap" />
            <Campo nome="edicao" rotulo="Edição" maxLength={50} placeholder="Ex.: 2027" />
            <Campo nome="inicio" rotulo="Início" tipo="date" />
            <Campo nome="fim" rotulo="Fim" tipo="date" />
            <Campo nome="pasta_url" rotulo="Pasta de materiais" tipo="url" placeholder="https://drive.google.com/..." />
            <Campo nome="edital_url" rotulo="Edital" tipo="url" placeholder="https://..." />
            <AreaDeTexto nome="descricao" rotulo="Descrição" linhas={3} className="sm:col-span-2" />
            <BotaoEnviar className="justify-self-start">Criar</BotaoEnviar>
          </Formulario>
        </Recolhivel>
      ) : null}
    </Pagina>
  );
}
