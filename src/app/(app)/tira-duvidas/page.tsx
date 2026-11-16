import type { Metadata } from "next";
import { AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario } from "@/components/formulario";
import { Abas, abaAtual, CabecalhoDaPagina, Cartao, Grade, nomeCurto, Pagina, Vazio, type Aba } from "@/components/ui";
import { curta } from "@/lib/datas";
import { getMembroAtual } from "@/lib/membro";
import { getPerguntas, type Pergunta } from "@/lib/tira-duvidas";
import { perguntar } from "./actions";

export const metadata: Metadata = { title: "Tira-dúvidas" };

export default async function TiraDuvidasPage({ searchParams }: PageProps<"/tira-duvidas">) {
  const [params, membro, perguntas] = await Promise.all([searchParams, getMembroAtual(), getPerguntas()]);
  const publicas = perguntas.filter((p) => p.visibilidade === "publica" && p.status !== "arquivada");
  const minhas = perguntas.filter((p) => p.autor?.id === membro.id);
  const podePerguntar = membro.papel !== "conselheiro";

  const abas: Aba[] = [
    { id: "feed", rotulo: "Perguntas da liga", contagem: publicas.length },
    { id: "minhas", rotulo: "Minhas perguntas", contagem: minhas.length },
    ...(podePerguntar ? [{ id: "perguntar", rotulo: "Perguntar" }] : []),
  ];
  const ativa = abaAtual(params.aba, abas);

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Tira-dúvidas"
        descricao="Pergunte em público ou em particular. Qualquer membro pode responder às públicas; a resposta aparece depois que a diretoria valida."
      />
      <Abas base="/tira-duvidas" atual={ativa} itens={abas} />

      {ativa === "feed" ? <ListaDePerguntas perguntas={publicas} vazio="Ninguém perguntou ainda. Seja a primeira pessoa." /> : null}
      {ativa === "minhas" ? <ListaDePerguntas perguntas={minhas} vazio="Você ainda não fez perguntas." /> : null}
      {ativa === "perguntar" ? (
        <div className="cartao max-w-2xl p-5 sm:p-6">
          <Formulario acao={perguntar} className="flex flex-col gap-4">
            <Campo nome="titulo" rotulo="Sua pergunta, em uma frase" obrigatorio maxLength={200} placeholder="Ex.: O acordo de acionistas vincula os administradores?" />
            <AreaDeTexto nome="corpo" rotulo="Contexto" obrigatorio linhas={6} maxLength={5000} ajuda="O que você já leu, onde travou, o artigo de lei ou o caso em questão." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Escolha
                nome="visibilidade"
                rotulo="Quem vê"
                opcoes={[
                  { valor: "publica", rotulo: "Todos os membros" },
                  { valor: "privada", rotulo: "Só a diretoria" },
                ]}
              />
              <Campo nome="tema" rotulo="Tema" maxLength={100} placeholder="Ex.: Acordo de acionistas" />
            </div>
            <BotaoEnviar enviando="Enviando…" className="self-start">
              Enviar pergunta
            </BotaoEnviar>
          </Formulario>
        </div>
      ) : null}
    </Pagina>
  );
}

const ROTULO_STATUS = { aberta: "Aberta", respondida: "Respondida", arquivada: "Arquivada" } as const;

function ListaDePerguntas({ perguntas, vazio }: { perguntas: Pergunta[]; vazio: string }) {
  if (perguntas.length === 0) return <Vazio titulo={vazio} />;
  return (
    <Grade colunas={2}>
      {perguntas.map((p) => {
        const validadas = p.respostas.filter((r) => r.status === "validada").length;
        return (
          <Cartao key={p.id} href={`/tira-duvidas/${p.id}`} className="min-h-40">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`selo ${p.status === "respondida" ? "selo-suave" : ""}`}>{ROTULO_STATUS[p.status]}</span>
              {p.visibilidade === "privada" ? <span className="selo">Privada</span> : null}
              {p.tema ? <span className="selo">{p.tema}</span> : null}
            </div>
            <h2 className="h3 mt-2">{p.titulo}</h2>
            <p className="mt-1 line-clamp-2 text-[0.9375rem] text-grafite">{p.corpo}</p>
            <p className="mt-auto pt-4 text-sm text-grafite">
              {p.autor ? nomeCurto(p.autor.nome) : "Membro"} · {curta(p.criado_em)} ·{" "}
              {validadas > 0 ? `${validadas} ${validadas === 1 ? "resposta" : "respostas"}` : "sem resposta"}
            </p>
          </Cartao>
        );
      })}
    </Grade>
  );
}
