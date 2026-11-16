import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { BotaoEnviar, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Pagina, Recolhivel, Secao, Vazio } from "@/components/ui";
import { rotuloAula } from "@/lib/ciclos";
import { curta } from "@/lib/datas";
import { linkDoWhatsapp, type Professor } from "@/lib/professores";
import { removerProfessor, salvarProfessor } from "../actions";
import { CamposDoProfessor } from "../campos";

/** Ficha de um professor: contato, apresentação, observações, aulas dadas e, para a diretoria, a edição. */
export function FichaDoProfessor({ professor, diretoria }: { professor: Professor; diretoria: boolean }) {
  const whatsapp = professor.telefone ? linkDoWhatsapp(professor.telefone) : null;
  const contatos = [
    professor.email ? { href: `mailto:${professor.email}`, rotulo: professor.email, Icone: Mail, externo: false } : null,
    professor.telefone
      ? whatsapp
        ? { href: whatsapp, rotulo: `${professor.telefone} (WhatsApp)`, Icone: MessageCircle, externo: true }
        : { href: `tel:${professor.telefone.replace(/[^\d+]/g, "")}`, rotulo: professor.telefone, Icone: Phone, externo: false }
      : null,
    professor.linkedin ? { href: professor.linkedin, rotulo: "LinkedIn", Icone: ArrowUpRight, externo: true } : null,
  ].filter((c) => c !== null);

  return (
    <Pagina>
      <Link href="/professores" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Professores
      </Link>

      <CabecalhoDaPagina titulo={professor.nome} descricao={[professor.instituicao, professor.temas].filter(Boolean).join(" · ") || undefined}>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`selo ${professor.disponivel ? "selo-suave" : ""}`}>{professor.disponivel ? "Disponível para convite" : "Não convidar por ora"}</span>
          <span className="selo">
            {professor.aulas.length === 0 ? "Ainda sem aula na liga" : `${professor.aulas.length} ${professor.aulas.length === 1 ? "aula" : "aulas"} na liga`}
          </span>
        </div>
      </CabecalhoDaPagina>

      <Secao titulo="Contato">
        {contatos.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {contatos.map(({ href, rotulo, Icone, externo }) => (
              <li key={href}>
                <a
                  href={href}
                  {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex min-h-11 items-center gap-2.5 font-medium break-all text-tinta hover:text-vinho"
                >
                  <Icone aria-hidden="true" className="size-[1.125rem] shrink-0 text-grafite" strokeWidth={1.75} />
                  {rotulo}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-grafite">Nenhum contato registrado.</p>
        )}
      </Secao>

      <Secao titulo="Apresentação" descricao="Vai para a página da aula quando ele é escolhido como professor.">
        {professor.apresentacao ? <p className="prosa whitespace-pre-line">{professor.apresentacao}</p> : <p className="text-grafite">Sem apresentação ainda.</p>}
      </Secao>

      {professor.observacoes ? (
        <Secao titulo="Observações da diretoria">
          <p className="prosa whitespace-pre-line">{professor.observacoes}</p>
        </Secao>
      ) : null}

      <Secao titulo="Aulas na liga">
        {professor.aulas.length === 0 ? (
          <Vazio titulo="Nenhuma aula ligada a este professor" texto="Escolha o professor no planejamento do ciclo ou na edição da aula para ligar a aula à ficha." />
        ) : (
          <ul className="flex flex-col gap-2">
            {professor.aulas.map((a) => (
              <li key={a.id}>
                <Link href={`/ciclos/aulas/${a.id}`} className="cartao cartao-link flex flex-col gap-0.5 p-4">
                  <span className="text-sm text-grafite">
                    {[a.ciclo ? `Ciclo ${a.ciclo.codigo}` : null, rotuloAula(a.numero), a.data ? curta(a.data) : null].filter(Boolean).join(" · ")}
                  </span>
                  <span className="font-medium text-tinta">{a.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {diretoria ? (
        <section aria-labelledby="editar-professor" className="mt-2 rounded-2xl bg-sutil p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="editar-professor" className="h2">
              Editar a ficha
            </h2>
            <span className="selo border border-linha-forte bg-superficie">Só diretoria</span>
          </div>
          <Formulario acao={salvarProfessor} className="mt-6 flex flex-col gap-5">
            <input type="hidden" name="id" value={professor.id} />
            <CamposDoProfessor professor={professor} prefixo="ficha" />
            <BotaoEnviar className="self-start">Salvar ficha</BotaoEnviar>
          </Formulario>
          <div className="mt-8 border-t border-linha-forte pt-6">
            <Recolhivel titulo="Remover do banco">
              <p className="prosa text-[0.9375rem] text-grafite">
                As aulas que ele deu continuam com o nome e a apresentação; só deixam de apontar para esta ficha.
              </p>
              <Formulario acao={removerProfessor} confirmar={`Remover ${professor.nome} do banco de professores?`} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="id" value={professor.id} />
                <BotaoEnviar variante="secundario" enviando="Removendo…" className="self-start">
                  Remover professor
                </BotaoEnviar>
              </Formulario>
            </Recolhivel>
          </div>
        </section>
      ) : null}
    </Pagina>
  );
}
