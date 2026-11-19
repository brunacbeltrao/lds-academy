/** Notificações no celular: chave pública e categorias (sem acesso a dados). */

/**
 * Chave pública VAPID. É pública por definição (o navegador precisa dela para inscrever o
 * aparelho); a privada fica só no segredo VAPID_PRIVATE_KEY da Edge Function enviar-notificacoes.
 */
export const VAPID_PUBLICA = "BIRVWVGmqDMynT3dIKYWs3xpvGQ7-A-Ao6VrX6t5fztUYFAMkNyWOMSsivmRMxIg_euQVyGpVCKeMAYD_c-KsxE";

export type CategoriaNotificacao = "avisos" | "lembretes" | "respostas" | "oportunidades" | "fila";

export const CATEGORIAS_NOTIFICACAO: { id: CategoriaNotificacao; rotulo: string; descricao: string; soDiretoria?: boolean }[] = [
  { id: "avisos", rotulo: "Avisos da diretoria", descricao: "Quando a diretoria publica um aviso." },
  {
    id: "lembretes",
    rotulo: "Lembretes",
    descricao: "Na véspera da aula (e da leitura), no dia seguinte para avaliar e na véspera dos prazos da Produção.",
  },
  { id: "respostas", rotulo: "Respostas e justificativas", descricao: "Sua pergunta respondida, sua resposta validada e a decisão sobre suas justificativas." },
  { id: "oportunidades", rotulo: "Oportunidades", descricao: "Novas vagas e eventos no mural e a véspera do prazo das que você marcou." },
  { id: "fila", rotulo: "Fila da diretoria", descricao: "Perguntas privadas, respostas e justificativas esperando decisão.", soDiretoria: true },
];

export type Preferencias = Record<CategoriaNotificacao, boolean>;

export const PREFERENCIAS_PADRAO: Preferencias = { avisos: true, lembretes: true, respostas: true, oportunidades: true, fila: true };
