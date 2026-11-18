import { Check } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Formulario } from "@/components/formulario";
import { Numero } from "@/components/ui";
import { avaliarAula, marcarLeitura } from "@/app/(app)/ciclos/aulas/[id]/aproveitamento";
import type { MinhaAvaliacao, RetornoDaAula } from "@/lib/aproveitamento";
import { media, NOTAS, plural, porcento, ROTULO_NOTA } from "@/lib/avaliacao-formato";
import { curta } from "@/lib/datas";

/** Marcar (ou desmarcar) a leitura de uma aula como feita. */
export function BotaoDeLeitura({ aulaId, feita }: { aulaId: string; feita: boolean }) {
  if (feita) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="selo selo-suave">
          <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
          Leitura feita
        </span>
        <AcaoRapida acao={marcarLeitura}>
          <input type="hidden" name="aulaId" value={aulaId} />
          <input type="hidden" name="feita" value="nao" />
          <BotaoEnviar variante="discreto" enviando="Desmarcando…">
            Desmarcar
          </BotaoEnviar>
        </AcaoRapida>
      </div>
    );
  }
  return (
    <AcaoRapida acao={marcarLeitura}>
      <input type="hidden" name="aulaId" value={aulaId} />
      <input type="hidden" name="feita" value="sim" />
      <BotaoEnviar variante="secundario" enviando="Marcando…">
        <Check aria-hidden="true" className="size-4" strokeWidth={2} />
        Fiz a leitura
      </BotaoEnviar>
    </AcaoRapida>
  );
}

/** Nota de 1 a 5 e comentário opcional. O nome de quem avalia não aparece para a diretoria. */
export function FormularioDeAvaliacao({ aulaId, minha }: { aulaId: string; minha: MinhaAvaliacao | null }) {
  return (
    <Formulario acao={avaliarAula} className="prosa flex flex-col gap-4">
      <input type="hidden" name="aulaId" value={aulaId} />
      <fieldset>
        <legend className="rotulo-campo">Sua nota para a aula</legend>
        <div className="grid grid-cols-5 gap-1.5 sm:max-w-md">
          {NOTAS.map((n) => (
            <label
              key={n}
              className="flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-[0.625rem] border border-linha-forte bg-superficie px-1 text-tinta transition-colors hover:border-grafite has-checked:border-vinho has-checked:bg-vinho-suave has-checked:text-vinho has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-vinho"
            >
              <input type="radio" name="nota" value={n} defaultChecked={minha?.nota === n} required className="sr-only" />
              <span className="numeral text-lg leading-tight font-bold">{n}</span>
              <span className="text-[0.6875rem] leading-tight text-grafite sm:text-xs">{ROTULO_NOTA[n]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <AreaDeTexto
        nome="comentario"
        rotulo="Comentário"
        linhas={3}
        maxLength={1000}
        padrao={minha?.comentario ?? ""}
        placeholder="O que funcionou, o que faltou, sugestões para o professor ou para a diretoria."
        ajuda="A diretoria e o conselho veem a nota e o comentário sem o seu nome."
      />
      <BotaoEnviar variante={minha ? "secundario" : "principal"} enviando="Enviando…" className="self-start">
        {minha ? "Atualizar avaliação" : "Enviar avaliação"}
      </BotaoEnviar>
    </Formulario>
  );
}

/** Para a diretoria e o conselho: quantos fizeram a leitura, nota média e comentários, sem nomes. */
export function RetornoDaAulaPainel({ retorno, aulaComecou }: { retorno: RetornoDaAula; aulaComecou: boolean }) {
  const notas = retorno.avaliacoes.map((a) => a.nota);
  const mediaDasNotas = media(notas);
  const comentarios = retorno.avaliacoes.filter((a) => a.comentario);
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Numero
          rotulo="Leitura feita"
          valor={`${retorno.leituras} de ${retorno.participantes}`}
          detalhe={porcento(retorno.leituras, retorno.participantes) ? `${porcento(retorno.leituras, retorno.participantes)} dos membros marcaram` : undefined}
        />
        <Numero
          rotulo="Nota média"
          valor={mediaDasNotas ?? "—"}
          detalhe={
            notas.length > 0
              ? `${plural(notas.length, "avaliação", "avaliações")}, de 1 a 5`
              : aulaComecou
                ? "Ainda sem avaliações"
                : "A avaliação abre quando a aula começa"
          }
        />
      </div>
      {notas.length > 0 ? (
        <ul aria-label="Distribuição das notas" className="mt-4 flex flex-col gap-1.5">
          {[...NOTAS].reverse().map((n) => {
            const qtd = notas.filter((x) => x === n).length;
            return (
              <li key={n} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="text-grafite">
                  {n} · {ROTULO_NOTA[n]}
                </span>
                <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-linha">
                  <span className="block h-full rounded-full bg-vinho" style={{ width: `${(qtd / notas.length) * 100}%` }} />
                </span>
                <span className="numeral text-right font-semibold text-tinta">{qtd}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {comentarios.length > 0 ? (
        <>
          <h3 className="h3 mt-6">Comentários</h3>
          <ul className="mt-2 divide-y divide-linha-forte border-y border-linha-forte">
            {comentarios.map((a, i) => (
              <li key={i} className="py-3">
                <p className="text-sm text-grafite">
                  Nota {a.nota} · {curta(a.quando)}
                </p>
                <p className="prosa mt-0.5 whitespace-pre-line text-tinta">{a.comentario}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
