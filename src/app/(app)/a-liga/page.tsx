import type { Metadata } from "next";
import { Atalhos, CabecalhoDaPagina, Lista, Pagina, Secao } from "@/components/ui";

export const metadata: Metadata = { title: "A Liga" };

const SECOES = [
  { id: "sobre", rotulo: "Sobre" },
  { id: "cargos", rotulo: "Cargos" },
  { id: "grupo-de-estudos", rotulo: "Grupo de Estudos" },
  { id: "eventos", rotulo: "Eventos" },
  { id: "codigo-de-conduta", rotulo: "Código de Conduta" },
];

const PILARES: [string, string][] = [
  ["Missão", "Estimular ações colaborativas entre os alunos da FDR com interesse em direito empresarial e no mercado financeiro, e auxiliá-los em seu desenvolvimento profissional."],
  ["Visão", "Ser uma liga referência no mercado jurídico, garantindo maior competitividade e orientação aos seus membros na área de direito societário e mercado de capitais."],
  ["Princípios e finalidades", "O ensino, a pesquisa e a assistência no desenvolvimento acadêmico dos estudantes de Direito no campo do Direito Empresarial; e a organização e o incentivo de atividades de caráter educacional, cultural, científico, político e social que aprimorem a formação universitária dos membros."],
];

const CARGOS: [string, string][] = [
  ["Associados acadêmicos", "Alunos matriculados na graduação em Direito, aprovados no processo seletivo."],
  ["Associados diretores", "Associados acadêmicos eleitos pela Assembleia Geral para exercer os cargos da Diretoria."],
  ["Associados conselheiros", "Ex-associados acadêmicos, a partir do 9º período, que por deliberação da Diretoria exercem papel consultor e supervisor."],
];

export default function ALigaPage() {
  return (
    <Pagina>
      <CabecalhoDaPagina titulo="A Liga" descricao="O que é a LDS·FDR, como se organiza e o que se espera de cada membro.">
        <Atalhos itens={SECOES} />
      </CabecalhoDaPagina>

      <Secao id="sobre" titulo="O que é a LDS·FDR">
        <p className="prosa">
          A Liga de Direito Societário e Mercado de Capitais da Faculdade de Direito do Recife é uma liga
          universitária dedicada a debater as áreas do direito empresarial e do mercado financeiro e a
          desenvolver a prática com a participação de profissionais renomados do Brasil.
        </p>
        <dl className="prosa mt-6 flex flex-col gap-5">
          {PILARES.map(([nome, texto]) => (
            <div key={nome}>
              <dt className="font-semibold text-tinta">{nome}</dt>
              <dd className="mt-0.5 text-grafite">{texto}</dd>
            </div>
          ))}
        </dl>
      </Secao>

      <Secao id="cargos" titulo="Cargos da liga">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {CARGOS.map(([cargo, descricao]) => (
            <div key={cargo}>
              <dt className="font-semibold text-tinta">{cargo}</dt>
              <dd className="mt-1 text-[0.9375rem] text-grafite">{descricao}</dd>
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
        <div className="prosa mt-6 rounded-[0.875rem] bg-vinho-suave p-5">
          <p className="font-semibold text-vinho">Limite de faltas</p>
          <p className="mt-1 text-tinta">
            São permitidas, no máximo, <strong>três faltas sem justificativa plausível</strong>. Ao atingir esse
            número, o membro é excluído do quadro da liga. A justificativa pode ser enviada antes ou depois da
            aula e é analisada pela Diretoria.
          </p>
        </div>
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

      <Secao
        id="codigo-de-conduta"
        titulo="Código de Conduta"
        descricao="Existe para fomentar o convívio entre os membros da liga e estabelecer um padrão de comportamento também fora dela."
      >
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
    </Pagina>
  );
}
