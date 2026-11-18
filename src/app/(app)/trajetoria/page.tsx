import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoDaPagina, Cartao, Grade, Numero, nomeCurto, Pagina, Secao, Vazio } from "@/components/ui";
import { getMinhasMarcacoes } from "@/lib/aproveitamento";
import { rotuloAula } from "@/lib/ciclos";
import { getCompeticoes } from "@/lib/competicoes";
import { curta } from "@/lib/datas";
import { ROTULO_FASE } from "@/lib/artigo";
import { getFrequencia, LIMITE_DE_FALTAS, resumo, type LinhaDeFrequencia } from "@/lib/frequencia";
import { getMembroAtual } from "@/lib/membro";
import { getProducoes } from "@/lib/producao";
import { ROTULO_STATUS } from "@/lib/producao-formato";
import { getPerguntas } from "@/lib/tira-duvidas";

export const metadata: Metadata = { title: "Minha trajetória" };

export default async function TrajetoriaPage() {
  const membro = await getMembroAtual();
  const [frequencia, perguntas, competicoes, producoes, marcacoes] = await Promise.all([
    getFrequencia(membro.id),
    getPerguntas(),
    getCompeticoes(),
    getProducoes(),
    getMinhasMarcacoes(membro.id),
  ]);
  const leiturasFeitas = frequencia.filter((l) => marcacoes.leituras.has(l.aulaId)).length;
  const r = resumo(frequencia);
  const minhasPerguntas = perguntas.filter((p) => p.autor?.id === membro.id);
  const minhasRespostas = perguntas.flatMap((p) => p.respostas.filter((x) => x.autor?.id === membro.id).map((x) => ({ ...x, pergunta: p })));
  const equipes = competicoes.flatMap((c) => c.equipes.filter((e) => e.membros.some((m) => m.id === membro.id)).map((e) => ({ ...e, competicao: c })));
  const minhasProducoes = producoes.filter((p) => p.participantes.some((x) => x.id === membro.id));

  return (
    <Pagina larga>
      <CabecalhoDaPagina titulo="Minha trajetória" descricao="Sua frequência no ciclo, o que você perguntou e respondeu, suas equipes e suas publicações." />

      <Grade colunas={4}>
        <Numero rotulo="Faltas sem justificativa" valor={`${r.faltas}/${LIMITE_DE_FALTAS}`} alerta={r.faltas >= LIMITE_DE_FALTAS - 1} detalhe={r.faltas >= LIMITE_DE_FALTAS ? "Limite atingido. Fale com a diretoria." : "Três faltas sem justificativa levam ao desligamento."} />
        <Numero rotulo="Presenças" valor={r.presencas} detalhe={`em ${r.total} aulas até hoje`} />
        <Numero rotulo="Faltas justificadas" valor={r.justificadas} />
        <Numero rotulo="Respostas validadas" valor={minhasRespostas.filter((x) => x.status === "validada").length} detalhe={`${minhasPerguntas.length} perguntas feitas`} />
      </Grade>

      <Secao
        titulo="Aulas do ciclo"
        descricao={`O registro de presença é feito pela diretoria depois de cada encontro. Leituras marcadas como feitas: ${leiturasFeitas} de ${frequencia.length}.`}
      >
        {frequencia.length === 0 ? (
          <Vazio titulo="Nenhuma aula realizada ainda" />
        ) : (
          <ul className="cartao divide-y divide-linha">
            {frequencia.map((l) => (
              <li key={l.aulaId}>
                <Link href={`/ciclos/aulas/${l.aulaId}#justificativa`} className="flex items-center gap-4 p-4 hover:bg-sutil/60">
                  <span className="numeral w-12 shrink-0 text-sm font-semibold text-grafite">{curta(l.data)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-vinho">{rotuloAula(l.numero)}</span>
                    <span className="block truncate text-tinta">{l.titulo}</span>
                    <span className="block text-sm text-grafite">
                      {[marcacoes.leituras.has(l.aulaId) ? "Leitura feita" : "Leitura não marcada", marcacoes.avaliadas.has(l.aulaId) ? "aula avaliada" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <SeloPresenca linha={l} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao titulo="Minhas publicações">
        {minhasProducoes.length === 0 ? (
          <Vazio titulo="Nenhuma publicação no seu nome" />
        ) : (
          <Grade>
            {minhasProducoes.map((p) => (
              <Cartao key={p.id} href={`/producao/${p.id}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-vinho">
                    {p.tipo === "artigo" ? "Artigo" : "Carrossel"} {String(p.numero ?? "").padStart(2, "0")}
                  </p>
                  <span className="selo">{p.fase ? ROTULO_FASE[p.fase] : ROTULO_STATUS[p.status]}</span>
                </div>
                <p className="mt-2 font-semibold text-tinta">{p.tema ?? "Tema a definir"}</p>
                <p className="numeral mt-auto pt-3 text-sm text-grafite">{p.publicacao ? `Publicação ${curta(p.publicacao)}` : "Reserva, sem data marcada"}</p>
              </Cartao>
            ))}
          </Grade>
        )}
      </Secao>

      <Secao titulo="Minhas equipes">
        {equipes.length === 0 ? (
          <Vazio titulo="Você ainda não está em uma equipe de competição" texto="As equipes são montadas pela diretoria a cada edição." />
        ) : (
          <Grade>
            {equipes.map((e) => (
              <Cartao key={e.id} href="/competicoes">
                <p className="text-sm font-semibold text-vinho">
                  {e.competicao.nome} {e.competicao.edicao ?? ""}
                </p>
                <p className="mt-1 font-semibold text-tinta">{e.nome}</p>
                <p className="mt-1 text-sm text-grafite">{e.membros.map((m) => nomeCurto(m.nome)).join(", ")}</p>
              </Cartao>
            ))}
          </Grade>
        )}
      </Secao>

      <Secao titulo="Minhas perguntas e respostas">
        {minhasPerguntas.length + minhasRespostas.length === 0 ? (
          <Vazio titulo="Nada por aqui ainda">
            <Link href="/tira-duvidas?aba=perguntar" className="botao botao-secundario">
              Fazer uma pergunta
            </Link>
          </Vazio>
        ) : (
          <ul className="cartao divide-y divide-linha">
            {minhasPerguntas.map((p) => (
              <li key={p.id}>
                <Link href={`/tira-duvidas/${p.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-sutil/60">
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-grafite">Pergunta · {curta(p.criado_em)}</span>
                    <span className="block truncate text-tinta">{p.titulo}</span>
                  </span>
                  <span className="selo shrink-0">{p.status === "respondida" ? "Respondida" : p.status === "arquivada" ? "Arquivada" : "Aberta"}</span>
                </Link>
              </li>
            ))}
            {minhasRespostas.map((x) => (
              <li key={x.id}>
                <Link href={`/tira-duvidas/${x.pergunta.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-sutil/60">
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-grafite">Resposta · {curta(x.criado_em)}</span>
                    <span className="block truncate text-tinta">{x.pergunta.titulo}</span>
                  </span>
                  <span className={`selo shrink-0 ${x.status === "validada" ? "selo-suave" : ""}`}>
                    {x.status === "validada" ? "Validada" : x.status === "recusada" ? "Recusada" : "Em análise"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </Pagina>
  );
}

function SeloPresenca({ linha: l }: { linha: LinhaDeFrequencia }) {
  if (l.justificativa?.status === "pendente") return <span className="selo shrink-0">Justificativa em análise</span>;
  if (l.presenca === "presente") return <span className="selo selo-suave shrink-0">Presente</span>;
  if (l.presenca === "justificada" || l.justificativa?.status === "aceita") return <span className="selo shrink-0">Justificada</span>;
  if (l.presenca === "falta") return <span className="selo selo-vinho shrink-0">Falta</span>;
  return <span className="selo shrink-0">Sem registro</span>;
}
