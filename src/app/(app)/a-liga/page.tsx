import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getBiblioteca } from "@/lib/biblioteca";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getDiretoriaAtual } from "@/lib/membros";
import { ListaDaDiretoria } from "./diretoria";
import { Abas, abaAtual, CabecalhoDaPagina, Lista, Pagina, type Aba } from "@/components/ui";

export const metadata: Metadata = { title: "A Liga" };

const SECOES: Aba[] = [
  { id: "sobre", rotulo: "Sobre" },
  { id: "cargos", rotulo: "Cargos" },
  { id: "grupo-de-estudos", rotulo: "Grupo de Estudos" },
  { id: "eventos", rotulo: "Eventos" },
  { id: "codigo-de-conduta", rotulo: "Código de Conduta" },
];

function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="cartao p-5 sm:p-8">
      <h2 className="h2">{titulo}</h2>
      {descricao ? <p className="prosa mt-1.5 text-grafite">{descricao}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const PILARES: [string, string][] = [
  [
    "Missão",
    "Estimular ações colaborativas entre os alunos da FDR com interesse em direito empresarial e no mercado financeiro, e auxiliá-los em seu desenvolvimento profissional.",
  ],
  [
    "Visão",
    "Ser uma liga referência no mercado jurídico, garantindo maior competitividade e orientação aos seus membros na área de direito societário e mercado de capitais.",
  ],
  [
    "Princípios e finalidades",
    "O ensino, a pesquisa e a assistência no desenvolvimento acadêmico dos estudantes de Direito no campo do Direito Empresarial; e a organização e o incentivo de atividades de caráter educacional, cultural, científico, político e social que aprimorem a formação universitária dos membros.",
  ],
];

const CARGOS: [string, string][] = [
  ["Associados acadêmicos", "Alunos matriculados na graduação em Direito, aprovados no processo seletivo."],
  ["Associados diretores", "Associados acadêmicos eleitos pela Assembleia Geral para exercer os cargos da Diretoria."],
  [
    "Associados conselheiros",
    "Ex-associados acadêmicos, a partir do 9º período, que por deliberação da Diretoria exercem papel consultor e supervisor.",
  ],
];

export default async function ALigaPage({ searchParams }: PageProps<"/a-liga">) {
  const ativa = abaAtual((await searchParams).aba, SECOES);
  return (
    <Pagina>
      <CabecalhoDaPagina titulo="A Liga" descricao="O que é a LDS·FDR, como se organiza e o que se espera de cada membro." />
      <Abas base="/a-liga" atual={ativa} itens={SECOES} />

      {ativa === "sobre" ? (
        <Bloco titulo="O que é a LDS·FDR">
          <p className="prosa">
            A Liga de Direito Societário e Mercado de Capitais da Faculdade de Direito do Recife é uma liga universitária dedicada a debater
            as áreas do direito empresarial e do mercado financeiro e a desenvolver a prática com a participação de profissionais renomados
            do Brasil.
          </p>
          <dl className="prosa mt-6 flex flex-col gap-5">
            {PILARES.map(([nome, texto]) => (
              <div key={nome}>
                <dt className="font-semibold text-tinta">{nome}</dt>
                <dd className="mt-0.5 text-grafite">{texto}</dd>
              </div>
            ))}
          </dl>
        </Bloco>
      ) : null}

      {ativa === "cargos" ? (
        <Bloco titulo="Cargos da liga">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CARGOS.map(([cargo, descricao]) => (
              <div key={cargo} className="rounded-xl bg-sutil p-4">
                <dt className="font-semibold text-tinta">{cargo}</dt>
                <dd className="mt-1 text-[0.9375rem] text-grafite">{descricao}</dd>
              </div>
            ))}
          </dl>
        </Bloco>
      ) : null}
      {ativa === "cargos" ? <DiretoriaAtual /> : null}

      {ativa === "grupo-de-estudos" ? (
        <Bloco titulo="Regras do Grupo de Estudos">
          <Lista
            itens={[
              <>
                As reuniões ocorrem às <strong>quartas-feiras, às 20h</strong>, nas salas da Faculdade de Direito do Recife.
              </>,
              <>
                Todos os membros devem <strong>comparecer aos encontros</strong> e justificar as faltas, de preferência com antecedência.
              </>,
              <>As aulas são conduzidas pelos professores designados pela Diretoria.</>,
              <>
                Cabe aos membros o <strong>estudo prévio do assunto</strong>, para ampliar o debate em sala.
              </>,
              <>No último encontro do semestre realiza-se a Rinha de Calouros, sobre caso estabelecido pela Diretoria.</>,
            ]}
          />
          <div className="prosa mt-6 rounded-[0.875rem] bg-vinho-suave p-5">
            <p className="font-semibold text-vinho">Limite de faltas</p>
            <p className="mt-1 text-tinta">
              São permitidas, no máximo, <strong>três faltas sem justificativa plausível</strong>. Ao atingir esse número, o membro é
              excluído do quadro da liga. A justificativa pode ser enviada antes ou depois da aula e é analisada pela Diretoria.
            </p>
          </div>
        </Bloco>
      ) : null}

      {ativa === "eventos" ? (
        <Bloco titulo="Eventos">
          <Lista
            itens={[
              <>
                A liga promove <strong>encontros com profissionais</strong> de diversas áreas (advogados, empresários, membros de órgãos
                reguladores) para discutir temas atuais do direito societário e do mercado de capitais.
              </>,
              <>
                Também organiza <strong>cursos e congressos externos</strong>, com possibilidade de público de fora da liga.
              </>,
              <>
                O objetivo é promover a colaboração e o <em>networking</em> com quem atua nas áreas estudadas, aproximando os membros do
                mundo corporativo.
              </>,
            ]}
          />
          <EventosRealizados />
        </Bloco>
      ) : null}

      {ativa === "codigo-de-conduta" ? (
        <Bloco
          titulo="Código de Conduta"
          descricao="Existe para fomentar o convívio entre os membros da liga e estabelecer um padrão de comportamento também fora dela."
        >
          <Lista
            itens={[
              <>
                Todos os membros devem <strong>tratar seus pares e superiores com respeito</strong>.
              </>,
              <>Fora das reuniões, os membros devem se comportar com honestidade.</>,
              <>
                Não se admite <strong>descaso com a propriedade</strong> privada dos membros e da LDS·FDR, nem com a propriedade pública da
                Universidade.
              </>,
              <>
                Desavenças ou infortúnios devem ser <strong>tratados com a Diretoria ou o Conselho</strong>, que têm poder para decidir em
                nome da liga e resolvem as disputas de forma imparcial.
              </>,
              <>
                Os membros devem apresentar <strong>aptidão acadêmica</strong> e sobriedade quanto aos assuntos universitários.
              </>,
              <>Nas reuniões e eventos da LDS·FDR, os membros devem se comportar com temperança e interesse.</>,
              <>
                Nas reuniões e eventos, deve-se seguir um <strong>padrão de vestimenta apropriado à ocasião</strong>.
              </>,
              <>
                É dever dos membros comparecer às reuniões no <strong>horário marcado, com pontualidade</strong>.
              </>,
            ]}
          />
        </Bloco>
      ) : null}
    </Pagina>
  );
}

async function EventosRealizados() {
  const membro = await getMembroAtual();
  const eventos = (await getBiblioteca(membro.id)).filter((i) => i.tema === "Eventos e palestras");
  if (eventos.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="h3 mb-3">Eventos já realizados</h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {eventos.map((e) => (
          <li key={e.id}>
            <a
              href={e.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl bg-sutil p-4 hover:bg-linha/50"
            >
              <span>
                <span className="block font-semibold text-tinta">{e.titulo}</span>
                {e.autor ? <span className="block text-sm text-grafite">com {e.autor}</span> : null}
              </span>
              <ArrowUpRight aria-hidden="true" className="seta size-4 shrink-0 text-vinho" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function DiretoriaAtual() {
  const [diretoria, fotos] = await Promise.all([getDiretoriaAtual(), getFotos()]);
  return <ListaDaDiretoria diretoria={diretoria} fotos={fotos} />;
}
