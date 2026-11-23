import type { Metadata } from "next";
import { AcaoRapida, BotaoEnviar, Campo, Formulario } from "@/components/formulario";
import { InstalarApp } from "@/components/instalar-app";
import { CabecalhoDaPagina, Pagina } from "@/components/ui";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { rotuloDoMembro } from "@/lib/cargos";
import { getMinhasNotificacoes } from "@/lib/notificacoes";
import { CATEGORIAS_NOTIFICACAO } from "@/lib/notificacoes-formato";
import { registro } from "@/lib/datas";
import { LIMITE_NOME_EXIBICAO } from "@/lib/nome-exibicao";
import { salvarNomeDeExibicao } from "./actions";
import { AtivarNotificacoes } from "./notificacoes";
import { removerAparelho, salvarPreferencias } from "./notificacoes-actions";
import { FormularioSenha } from "./senha/formulario";
import { EnvioDeFoto } from "./foto";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ContaPage() {
  const [membro, fotos] = await Promise.all([getMembroAtual(), getFotos()]);
  const participa = membro.papel !== "conselheiro";
  const notificacoes = participa ? await getMinhasNotificacoes(membro.id) : null;
  const categorias = CATEGORIAS_NOTIFICACAO.filter((c) => !c.soDiretoria || membro.papel === "diretoria");
  return (
    <Pagina>
      <CabecalhoDaPagina titulo="Meu perfil" descricao={`${membro.nome} · ${rotuloDoMembro(membro.papel, membro.cargoDiretoria)}`} />
      <section aria-labelledby="foto" className="cartao p-5 sm:p-6">
        <h2 id="foto" className="h3 mb-4">
          Foto de perfil
        </h2>
        <EnvioDeFoto membroId={membro.id} nome={membro.nome} foto={fotos[membro.id] ?? null} />
      </section>
      <section id="nome" aria-labelledby="nome-titulo" className="cartao mt-3 scroll-mt-24 p-5 sm:p-6">
        <h2 id="nome-titulo" className="h3">
          Como seu nome aparece
        </h2>
        <p className="prosa mt-1 mb-4 text-[0.9375rem] text-grafite">
          É o nome que os colegas veem no menu, nas equipes, na produção e no tira-dúvidas. Use o nome com que você se apresenta na liga.
          Em branco, aparece o nome da lista oficial.
        </p>
        <Formulario acao={salvarNomeDeExibicao} className="flex flex-col gap-4">
          <Campo
            nome="nome_exibicao"
            rotulo="Nome de exibição"
            padrao={membro.nomeExibicao ?? ""}
            placeholder={membro.nomeCompleto}
            maxLength={LIMITE_NOME_EXIBICAO}
            ajuda={`Na lista oficial: ${membro.nomeCompleto}. Esse continua registrado e só a diretoria altera.`}
          />
          <BotaoEnviar variante="secundario" className="self-start">
            Salvar nome
          </BotaoEnviar>
        </Formulario>
      </section>
      <section id="notificacoes" aria-labelledby="notificacoes-titulo" className="cartao mt-3 scroll-mt-24 p-5 sm:p-6">
        <h2 id="notificacoes-titulo" className="h3">
          Notificações no celular
        </h2>
        {notificacoes ? (
          <>
            <p className="prosa mt-1 mb-4 text-[0.9375rem] text-grafite">
              Avisos, lembretes da aula e dos prazos e respostas no tira-dúvidas, direto no celular ou no computador. Ative em cada aparelho que
              você usa.
            </p>
            <AtivarNotificacoes />

            <h3 className="h3 mt-7">O que você quer receber</h3>
            <Formulario acao={salvarPreferencias} className="mt-2 flex flex-col gap-1">
              {categorias.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-lg py-2">
                  <input
                    type="checkbox"
                    name={c.id}
                    value="sim"
                    defaultChecked={notificacoes.preferencias[c.id]}
                    className="mt-1 size-[1.125rem] shrink-0 accent-vinho"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-tinta">{c.rotulo}</span>
                    <span className="block text-sm text-grafite">{c.descricao}</span>
                  </span>
                </label>
              ))}
              <BotaoEnviar variante="secundario" className="mt-2 self-start">
                Salvar preferências
              </BotaoEnviar>
            </Formulario>

            {notificacoes.aparelhos.length > 0 ? (
              <>
                <h3 className="h3 mt-7">Aparelhos com notificações</h3>
                <ul className="mt-2 divide-y divide-linha border-y border-linha">
                  {notificacoes.aparelhos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-tinta">{a.aparelho ?? "Aparelho"}</span>
                        <span className="block text-sm text-grafite">desde {registro(a.criadoEm)}</span>
                      </span>
                      <AcaoRapida acao={removerAparelho}>
                        <input type="hidden" name="aparelhoId" value={a.id} />
                        <BotaoEnviar variante="discreto" enviando="Removendo…">
                          Remover
                        </BotaoEnviar>
                      </AcaoRapida>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {notificacoes.recentes.length > 0 ? (
              <>
                <h3 className="h3 mt-7">Últimas notificações</h3>
                <ul className="mt-2 divide-y divide-linha border-y border-linha">
                  {notificacoes.recentes.map((n) => (
                    <li key={n.id} className="py-2.5">
                      <a href={n.url} className="group block">
                        <span className="block font-medium text-tinta group-hover:text-vinho">{n.titulo}</span>
                        {n.corpo ? <span className="block truncate text-sm text-grafite">{n.corpo}</span> : null}
                        <span className="block text-xs text-grafite">
                          {registro(n.criadaEm)}
                          {n.enviada ? "" : " · aguardando envio"}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-[0.9375rem] text-grafite">O conselho acompanha a plataforma em modo leitura e não recebe notificações.</p>
        )}
      </section>

      <section aria-labelledby="senha" className="cartao mt-3 p-5 sm:p-6">
        <h2 id="senha" className="h3 mb-4">
          Trocar a senha
        </h2>
        <FormularioSenha />
      </section>
      <div className="mt-3">
        <InstalarApp />
      </div>
    </Pagina>
  );
}
