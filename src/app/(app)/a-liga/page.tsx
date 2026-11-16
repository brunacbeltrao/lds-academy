import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "A Liga" };

const SECOES = [
  { id: "sobre", rotulo: "Sobre" },
  { id: "cargos", rotulo: "Cargos" },
  { id: "grupo-de-estudos", rotulo: "Grupo de Estudos" },
  { id: "eventos", rotulo: "Eventos" },
  { id: "codigo-de-conduta", rotulo: "Código de Conduta" },
];

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-24 border-t border-filete py-10">
      <h2 id={`${id}-titulo`} className="titulo text-3xl">
        {titulo}
      </h2>
      <div className="mt-5 max-w-3xl">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {itens.map((item, i) => (
        <li key={i} className="border-l border-filete-forte pl-4 text-tinta">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Destaque({ children }: { children: ReactNode }) {
  return <div className="mt-6 border-l-4 border-vinho bg-rosa px-5 py-4 text-tinta">{children}</div>;
}

export default function ALigaPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-14">
      <header className="pb-8">
        <p className="rotulo text-grafite">A Liga</p>
        <h1 className="titulo mt-2 text-4xl sm:text-5xl">A Liga</h1>
        <p className="mt-4 max-w-2xl text-lg text-grafite">
          O que é a LDS·FDR, como se organiza e o que se espera de cada membro.
        </p>
        <nav aria-label="Seções desta página" className="mt-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="rotulo text-vinho underline-offset-4 hover:underline">
                  {s.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Secao id="sobre" titulo="O que é a LDS·FDR">
        <p>
          A Liga de Direito Societário e Mercado de Capitais da Faculdade de Direito do Recife é uma liga
          universitária dedicada a debater as áreas do direito empresarial e do mercado financeiro e a
          desenvolver a prática com a participação de profissionais renomados do Brasil.
        </p>
        <dl className="mt-6 flex flex-col gap-5">
          <div>
            <dt className="rotulo text-vinho">Missão</dt>
            <dd className="mt-1">
              Estimular ações colaborativas entre os alunos da FDR com interesse em direito empresarial e no
              mercado financeiro, e auxiliá-los em seu desenvolvimento profissional.
            </dd>
          </div>
          <div>
            <dt className="rotulo text-vinho">Visão</dt>
            <dd className="mt-1">
              Ser uma liga referência no mercado jurídico, garantindo maior competitividade e orientação aos
              seus membros na área de direito societário e mercado de capitais.
            </dd>
          </div>
          <div>
            <dt className="rotulo text-vinho">Princípios e finalidades</dt>
            <dd className="mt-1">
              O ensino, a pesquisa e a assistência no desenvolvimento acadêmico dos estudantes de Direito no
              campo do Direito Empresarial e suas áreas de atuação; e a organização e o incentivo de
              atividades de caráter educacional, cultural, científico, político e social que aprimorem a
              formação universitária dos membros.
            </dd>
          </div>
        </dl>
      </Secao>

      <Secao id="cargos" titulo="Cargos da liga">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            ["Associados acadêmicos", "Alunos matriculados na graduação em Direito, aprovados no processo seletivo."],
            ["Associados diretores", "Associados acadêmicos eleitos pela Assembleia Geral para exercer os cargos da Diretoria."],
            ["Associados conselheiros", "Ex-associados acadêmicos, a partir do 9º período, que por deliberação da Diretoria exercem papel consultor e supervisor."],
          ].map(([cargo, descricao]) => (
            <div key={cargo} className="border border-filete bg-papel p-5">
              <dt className="font-bold text-vinho">{cargo}</dt>
              <dd className="mt-2 text-grafite">{descricao}</dd>
            </div>
          ))}
        </dl>
      </Secao>

      <Secao id="grupo-de-estudos" titulo="Regras do Grupo de Estudos">
        <Lista
          itens={[
            <>As reuniões ocorrem às <strong>quartas-feiras, às 20h</strong>, nas salas da Faculdade de Direito do Recife.</>,
            <>Todos os membros devem <strong>comparecer aos encontros</strong> e justificar as faltas, de preferência com antecedência.</>,
            <>As aulas são conduzidas pelos professores designados pela Diretoria.</>,
            <>Cabe aos membros o <strong>estudo prévio do assunto</strong>, para ampliar o debate em sala.</>,
            <>No último encontro do semestre realiza-se a Rinha de Calouros, sobre caso estabelecido pela Diretoria.</>,
          ]}
        />
        <Destaque>
          <p className="rotulo text-vinho">Limite de faltas</p>
          <p className="mt-1">
            São permitidas, no máximo, <strong>três faltas sem justificativa plausível</strong>. Ao atingir esse
            número, o membro é excluído do quadro da liga. A justificativa pode ser enviada antes ou depois da
            aula e é analisada pela Diretoria.
          </p>
        </Destaque>
      </Secao>

      <Secao id="eventos" titulo="Eventos">
        <Lista
          itens={[
            <>A liga promove <strong>encontros com profissionais</strong> de diversas áreas (advogados, empresários, membros de órgãos reguladores) para discutir temas atuais do direito societário e do mercado de capitais.</>,
            <>Também organiza <strong>cursos e congressos externos</strong>, com possibilidade de público de fora da liga.</>,
            <>O objetivo é promover a colaboração e o <em>networking</em> com quem atua nas áreas estudadas, aproximando os membros do mundo corporativo.</>,
          ]}
        />
      </Secao>

      <Secao id="codigo-de-conduta" titulo="Código de Conduta">
        <p className="mb-5">
          O Código de Conduta existe para fomentar o convívio entre os membros da liga e estabelecer um padrão
          de comportamento também fora dela.
        </p>
        <Lista
          itens={[
            <>Todos os membros devem <strong>tratar seus pares e superiores com respeito</strong>.</>,
            <>Fora das reuniões, os membros devem se comportar com honestidade.</>,
            <>Não se admite <strong>descaso com a propriedade</strong> privada dos membros e da LDS·FDR, nem com a propriedade pública da Universidade.</>,
            <>Desavenças ou infortúnios devem ser <strong>tratados com a Diretoria ou o Conselho</strong>, que têm poder para decidir em nome da liga e resolvem as disputas de forma imparcial.</>,
            <>Os membros devem apresentar <strong>aptidão acadêmica</strong> e sobriedade quanto aos assuntos universitários.</>,
            <>Nas reuniões e eventos da LDS·FDR, os membros devem se comportar com temperança e interesse.</>,
            <>Nas reuniões e eventos, deve-se seguir um <strong>padrão de vestimenta apropriado à ocasião</strong>.</>,
            <>É dever dos membros comparecer às reuniões no <strong>horário marcado, com pontualidade</strong>.</>,
          ]}
        />
      </Secao>
    </div>
  );
}
