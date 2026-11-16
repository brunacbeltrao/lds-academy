import Link from "next/link";
import { Search } from "lucide-react";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Cartao, DestinoDoCartao, Grade, Numero, Pagina, Recolhivel, Vazio } from "@/components/ui";
import type { Professor } from "@/lib/professores";
import { cadastrarProfessor } from "./actions";
import { CamposDoProfessor } from "./campos";

/** Banco de professores: busca, contagens e um cartão por professor. A diretoria cadastra. */
export function ConteudoDosProfessores({
  professores,
  total,
  busca,
  diretoria,
}: {
  professores: Professor[];
  total: { professores: number; disponiveis: number; comAulas: number };
  busca: string;
  diretoria: boolean;
}) {
  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Professores"
        descricao="Quem já deu ou pode dar aula na liga, com contato, temas e as aulas de cada um. Acesso da diretoria e do conselho."
        acoes={
          <Link href="/gestao/planejamento" className="botao botao-secundario">
            Planejamento do ciclo
          </Link>
        }
      />

      <Grade colunas={3}>
        <Numero rotulo="No banco" valor={total.professores} />
        <Numero rotulo="Disponíveis para convite" valor={total.disponiveis} />
        <Numero rotulo="Já deram aula na liga" valor={total.comAulas} />
      </Grade>

      {diretoria ? (
        <div className="mt-6">
          <Recolhivel titulo="Cadastrar professor">
            <Formulario acao={cadastrarProfessor} className="flex flex-col gap-5">
              <CamposDoProfessor prefixo="novo" />
              <BotaoEnviar className="self-start">Cadastrar</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </div>
      ) : null}

      <form role="search" action="/professores" className="mt-8 mb-5 flex gap-2">
        <label htmlFor="busca" className="sr-only">
          Buscar professor
        </label>
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-grafite" strokeWidth={1.75} />
          <input id="busca" name="q" type="search" defaultValue={busca} placeholder="Nome, tema ou escritório" className="campo pl-10" />
        </div>
        <button type="submit" className="botao botao-secundario">
          Buscar
        </button>
      </form>

      {professores.length === 0 ? (
        busca ? (
          <Vazio titulo="Ninguém encontrado" texto={`Nenhum professor com “${busca}” no nome, nos temas ou na instituição.`}>
            <Link href="/professores" className="link">
              Ver todos
            </Link>
          </Vazio>
        ) : (
          <Vazio titulo="Banco vazio" texto={diretoria ? "Cadastre o primeiro professor em “Cadastrar professor”." : "A diretoria ainda não cadastrou professores."} />
        )
      ) : (
        <Grade colunas={3}>
          {professores.map((p) => {
            const ultima = p.aulas[0];
            return (
              <Cartao key={p.id} href={`/professores/${p.id}`}>
                <div className="flex flex-wrap gap-1.5">
                  {p.aulas.length > 0 ? (
                    <span className="selo selo-suave">
                      {p.aulas.length} {p.aulas.length === 1 ? "aula" : "aulas"}
                    </span>
                  ) : (
                    <span className="selo">Ainda sem aula</span>
                  )}
                  {!p.disponivel ? <span className="selo">Não convidar por ora</span> : null}
                </div>
                <h2 className="h3 mt-2.5">{p.nome}</h2>
                {p.instituicao ? <p className="text-[0.9375rem] text-grafite">{p.instituicao}</p> : null}
                {p.temas ? <p className="mt-2 line-clamp-2 text-sm text-tinta">{p.temas}</p> : null}
                {ultima ? (
                  <p className="mt-2 text-sm text-grafite">
                    Última: {ultima.ciclo ? `${ultima.ciclo.codigo} · ` : ""}
                    {ultima.titulo}
                  </p>
                ) : null}
                <DestinoDoCartao rotulo="Ver ficha" />
              </Cartao>
            );
          })}
        </Grade>
      )}
    </Pagina>
  );
}
