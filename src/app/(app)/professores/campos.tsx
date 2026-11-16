import { AreaDeTexto, Campo, Marcar } from "@/components/formulario";
import type { Professor } from "@/lib/professores";

/** Campos da ficha do professor, usados no cadastro e na edição. */
export function CamposDoProfessor({ professor, prefixo }: { professor?: Professor; prefixo: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo nome="nome" rotulo="Nome" obrigatorio maxLength={200} padrao={professor?.nome} prefixo={prefixo} className="sm:col-span-2" />
      <Campo nome="instituicao" rotulo="Escritório, universidade ou órgão" maxLength={200} padrao={professor?.instituicao ?? undefined} prefixo={prefixo} />
      <Campo
        nome="temas"
        rotulo="Temas"
        maxLength={1000}
        padrao={professor?.temas ?? undefined}
        placeholder="Ex.: M&A, governança, mercado de capitais"
        prefixo={prefixo}
      />
      <AreaDeTexto
        nome="apresentacao"
        rotulo="Apresentação"
        linhas={4}
        maxLength={4000}
        padrao={professor?.apresentacao ?? undefined}
        placeholder="Formação e atuação"
        ajuda="É o texto que aparece na página da aula quando ele for escolhido como professor."
        prefixo={prefixo}
        className="sm:col-span-2"
      />
      <Campo nome="email" rotulo="E-mail" tipo="email" maxLength={200} padrao={professor?.email ?? undefined} prefixo={prefixo} />
      <Campo nome="telefone" rotulo="Telefone ou WhatsApp" tipo="tel" maxLength={40} padrao={professor?.telefone ?? undefined} placeholder="(81) 9 0000-0000" prefixo={prefixo} />
      <Campo
        nome="linkedin"
        rotulo="LinkedIn"
        tipo="url"
        maxLength={1000}
        padrao={professor?.linkedin ?? undefined}
        placeholder="https://www.linkedin.com/in/…"
        prefixo={prefixo}
        className="sm:col-span-2"
      />
      <AreaDeTexto
        nome="observacoes"
        rotulo="Observações da diretoria"
        linhas={3}
        maxLength={4000}
        padrao={professor?.observacoes ?? undefined}
        placeholder="Quem fez o contato, preferências de data, como foi a aula"
        prefixo={prefixo}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <Marcar nome="disponivel" rotulo="Disponível para novos convites" padrao={professor?.disponivel ?? true} />
      </div>
    </div>
  );
}
