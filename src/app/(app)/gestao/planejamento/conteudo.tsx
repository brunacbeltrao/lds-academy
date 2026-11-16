import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AreaDeTexto, BotaoEnviar, Campo, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Cartao, DestinoDoCartao, Grade, Pagina, Recolhivel, Vazio } from "@/components/ui";
import { periodoDoCiclo } from "@/lib/ciclos";
import type { CicloPlanejado } from "@/lib/planejamento";
import { criarCiclo } from "./actions";

/** Próximo código de ciclo a partir dos existentes: 2026.2 → 2027.1. */
export function proximoCodigo(codigos: string[]): string {
  const ultimo = [...codigos].sort().pop();
  const [ano, semestre] = (ultimo ?? "2027.0").split(/[.-]/).map(Number);
  return semestre >= 2 ? `${ano + 1}.1` : `${ano}.2`;
}

/** Lista dos ciclos em planejamento e o cadastro de um novo. */
export function ConteudoDoPlanejamento({
  ciclos,
  sugestao,
  diretoria,
}: {
  ciclos: (CicloPlanejado & { encontros: number })[];
  sugestao: string;
  diretoria: boolean;
}) {
  const planejados = ciclos.filter((c) => c.status === "planejado");
  const atual = ciclos.find((c) => c.status === "atual");

  return (
    <Pagina larga>
      <Link href="/gestao" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Gestão
      </Link>
      <CabecalhoDaPagina
        titulo="Planejamento do ciclo"
        descricao="Monte o cronograma do próximo ciclo em rascunho: aulas, eventos, professores e convites. Os ligantes só veem depois da publicação."
        acoes={
          <Link href="/professores" className="botao botao-secundario">
            Banco de professores
          </Link>
        }
      />

      {planejados.length === 0 ? (
        <Vazio titulo="Nenhum ciclo em planejamento" texto={diretoria ? "Crie o próximo ciclo logo abaixo." : "A diretoria ainda não começou o planejamento."} />
      ) : (
        <Grade colunas={2}>
          {planejados.map((c) => (
            <Cartao key={c.id} href={`/gestao/planejamento/${c.codigo}`}>
              <div className="flex flex-wrap gap-1.5">
                <span className="selo">Ciclo {c.codigo}</span>
                <span className={`selo ${c.cronograma_publicado ? "selo-suave" : ""}`}>{c.cronograma_publicado ? "Cronograma publicado" : "Rascunho"}</span>
              </div>
              <h2 className="mt-2.5 text-xl font-bold tracking-[-0.015em] text-tinta">{c.titulo}</h2>
              <p className="mt-1 text-[0.9375rem] text-grafite">
                {[periodoDoCiclo(c.inicio, c.fim) ?? "Período a definir", `${c.encontros} ${c.encontros === 1 ? "encontro" : "encontros"}`].join(" · ")}
              </p>
              <DestinoDoCartao rotulo={diretoria ? "Planejar" : "Ver planejamento"} />
            </Cartao>
          ))}
        </Grade>
      )}

      {atual ? (
        <p className="mt-6 text-[0.9375rem] text-grafite">
          O ciclo em curso ({atual.codigo}, {atual.titulo}) é editado aula a aula em{" "}
          <Link href="/ciclos" className="link">
            Ciclos e aulas
          </Link>
          .
        </p>
      ) : null}

      {diretoria ? (
        <div className="mt-8">
          <Recolhivel titulo="Criar ciclo" abertoInicial={planejados.length === 0}>
            <Formulario acao={criarCiclo} className="grid gap-4 sm:grid-cols-2">
              <Campo nome="codigo" rotulo="Código" obrigatorio padrao={sugestao} maxLength={12} ajuda="Ano e semestre, como 2027.1." />
              <Campo nome="titulo" rotulo="Tema do ciclo" obrigatorio maxLength={200} placeholder="Ex.: Fusões e Aquisições" />
              <Campo nome="inicio" rotulo="Primeiro encontro" tipo="date" />
              <Campo nome="fim" rotulo="Último encontro" tipo="date" />
              <AreaDeTexto nome="descricao" rotulo="Apresentação do ciclo" linhas={3} maxLength={2000} className="sm:col-span-2" placeholder="O que o ciclo cobre e para quem" />
              <BotaoEnviar className="justify-self-start">Criar e planejar</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </div>
      ) : null}
    </Pagina>
  );
}
