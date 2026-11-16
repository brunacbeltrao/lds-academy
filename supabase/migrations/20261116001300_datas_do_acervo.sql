-- Datas dos ciclos anteriores 2024.1, 2024.2 e 2025.1-2, a partir dos calendários oficiais.
-- Cada linha do calendário vira um evento do ciclo (horário padrão: 20h de Recife, 60 minutos).
-- Quando a linha corresponde a uma aula do acervo (identificada pelo número ou pelo título),
-- o evento aponta para ela e a aula recebe a data. Linhas sem correspondência ficam só no
-- cronograma; aulas do Drive sem linha no calendário seguem sem data.
-- Datas copiadas como estão nos calendários, mesmo as que não caem numa quarta-feira
-- (19/11/2024, 25/11/2024, 22/07/2025 e 30/07/2024); ver docs/decisoes.md.
-- Linhas sem conteúdo nos calendários (semanas sem encontro) não foram registradas.

update public.ciclos set inicio = '2024-11-13', fim = '2025-04-09' where codigo = '2024.2';

with cronograma (codigo, dia, tipo, titulo, aula_numero, aula_titulo) as (
  values
    -- 2024.1 · o calendário traz blocos de tema, sem correspondência com as aulas do Drive
    ('2024.1', '2024-04-24'::date, 'evento', 'Apresentação do Semestre', null::int, null::text),
    ('2024.1', '2024-05-08', 'aula',   'Disputas de M&A', null, null),
    ('2024.1', '2024-05-15', 'aula',   'Disputas de M&A', null, null),
    ('2024.1', '2024-05-22', 'aula',   'Sociedade Anônima de Futebol', null, null),
    ('2024.1', '2024-05-29', 'aula',   'Contencioso Societário e Mercado de Capitais', null, null),
    ('2024.1', '2024-06-05', 'aula',   'Fundos de Investimento', null, null),
    ('2024.1', '2024-06-12', 'aula',   'Fundos de Investimento', null, null),
    ('2024.1', '2024-06-19', 'aula',   'Sociedade Anônima de Futebol', null, null),
    ('2024.1', '2024-06-26', 'aula',   'Fundos de Investimento', null, null),
    ('2024.1', '2024-07-03', 'aula',   'Contencioso Societário e Mercado de Capitais', null, null),
    ('2024.1', '2024-07-10', 'aula',   'Contencioso Societário e Mercado de Capitais', null, null),
    ('2024.1', '2024-07-17', 'aula',   'ESG no Mercado de Capitais', null, null),
    ('2024.1', '2024-07-24', 'aula',   'M&A e Direito Concorrencial', null, null),
    ('2024.1', '2024-07-30', 'evento', 'Rinha dos Calouros', null, null),

    -- 2024.2 · Ciclo-base de Direito Societário
    ('2024.2', '2024-11-13', 'evento', 'Apresentação do Semestre', null, 'Apresentação Inaugural'),
    ('2024.2', '2024-11-19', 'aula',   'Sociedades Limitadas e Anônimas: Conceito, Natureza Jurídica e Classes', 1, null),
    ('2024.2', '2024-11-25', 'aula',   'Capital Social e Quotas/Ações como Participação Societária', 2, null),
    ('2024.2', '2024-12-04', 'aula',   'Obrigações e Direitos dos Sócios e Acionistas', 3, null),
    ('2024.2', '2024-12-11', 'aula',   'Aula prática: Atos Constitutivos (Contrato Social, Estatuto Social e Livros da Companhia)', 4, null),
    ('2024.2', '2025-01-29', 'aula',   'Valores Mobiliários (Ações, Partes Beneficiárias, Debêntures e Bônus de Subscrição): Parte 1', 5, null),
    ('2024.2', '2025-02-05', 'aula',   'Valores Mobiliários (Ações, Partes Beneficiárias, Debêntures e Bônus de Subscrição): Parte 2', 6, null),
    ('2024.2', '2025-02-12', 'aula',   'Estrutura da Companhia, Princípio Majoritário, Acionista Controlador e Proteção da Minoria', null, null),
    ('2024.2', '2025-02-19', 'aula',   'Órgãos Sociais: Reunião de Sócios (Ltda.) e Assembleia Geral (S.A.)', 8, null),
    ('2024.2', '2025-02-26', 'aula',   'Órgãos Sociais: Conselho de Administração, Diretoria e Conselho Fiscal (Deveres e Responsabilidades)', null, null),
    ('2024.2', '2025-03-12', 'aula',   'Aula prática: Financiamento da Companhia e Modificações do Capital Social', null, null),
    ('2024.2', '2025-03-19', 'aula',   'Reorganizações Societárias (Conceito e Espécies)', null, null),
    ('2024.2', '2025-03-26', 'aula',   'Dissolução, Liquidação e Extinção', null, null),
    ('2024.2', '2025-04-09', 'evento', 'Rinha dos Calouros e Encerramento do Semestre', null, null),

    -- 2025.1-2 · Fusões e Aquisições
    ('2025.1-2', '2025-05-07', 'evento', 'Apresentação do Semestre', null, null),
    ('2025.1-2', '2025-05-14', 'aula',   'Introdução ao M&A', 1, null),
    ('2025.1-2', '2025-05-28', 'aula',   'Planejamento Empresarial Pré-M&A', 2, null),
    ('2025.1-2', '2025-06-11', 'aula',   'Direito Societário para M&A', 3, null),
    ('2025.1-2', '2025-06-18', 'aula',   'Negociação e Contratos Preliminares', 4, null),
    ('2025.1-2', '2025-06-25', 'aula',   'Estrutura das Operações de M&A', 5, null),
    ('2025.1-2', '2025-07-09', 'aula',   'Share Purchase Agreement', 7, null),
    ('2025.1-2', '2025-07-22', 'aula',   'Ajuste de Preço, Earn-Out e Mecanismos de Retenção de Preço', 8, null),
    ('2025.1-2', '2025-07-30', 'aula',   'Declarações e Garantias (Parte 1)', 9, null),
    ('2025.1-2', '2025-08-06', 'aula',   'Declarações e Garantias (Parte 2)', 10, null),
    ('2025.1-2', '2025-08-13', 'aula',   'Indenizações (Parte 1)', 11, null),
    ('2025.1-2', '2025-09-03', 'aula',   'Indenizações (Parte 2)', 11, null),
    ('2025.1-2', '2025-09-10', 'aula',   'Acordo de Sócios e Governança Corporativa', 13, null),
    ('2025.1-2', '2025-09-17', 'aula',   'Superveniências Ativas', 14, null),
    ('2025.1-2', '2025-09-24', 'aula',   'Closing e Pós-Closing', 15, null),
    ('2025.1-2', '2025-10-01', 'aula',   'Financiamento a Operações de M&A (Acquisition Finance)', 16, null),
    ('2025.1-2', '2025-10-08', 'aula',   'Litígios Decorrentes das Operações de M&A', 17, null),
    ('2025.1-2', '2025-10-15', 'aula',   'Planejamento Tributário em M&A', 18, null),
    ('2025.1-2', '2025-10-22', 'aula',   'Ensaio sobre os Grupos de Subordinação, de Direito e de Fato, no Direito Societário Brasileiro', null, 'Aula extra: Grupos de Subordinação, de Direito e de Fato'),
    ('2025.1-2', '2025-10-29', 'aula',   'Venture Capital e M&A', null, 'Aula extra: Venture Capital e M&A'),
    ('2025.1-2', '2025-11-19', 'evento', 'Apresentação do Caso da Rinha dos Calouros', null, null),
    ('2025.1-2', '2025-12-10', 'evento', 'Rinha dos Calouros e Encerramento do Semestre', null, null)
),
ligado as (
  select c.*, ci.id as ciclo_id,
         (c.dia + time '20:00') at time zone 'America/Recife' as inicio,
         (select a.id from public.aulas a
           where a.ciclo_id = ci.id
             and ((c.aula_numero is not null and a.numero = c.aula_numero)
               or (c.aula_titulo is not null and a.titulo = c.aula_titulo))
           limit 1) as aula_id
  from cronograma c
  join public.ciclos ci on ci.codigo = c.codigo
),
datas as (
  -- a aula recebe a data do seu primeiro encontro (Indenizações tem dois)
  update public.aulas a set data = p.inicio
  from (select aula_id, min(inicio) as inicio from ligado where aula_id is not null group by aula_id) p
  where a.id = p.aula_id
  returning a.id
)
insert into public.eventos (titulo, tipo, inicio, fim, ciclo_id, aula_id)
select l.titulo, l.tipo::public.tipo_evento, l.inicio, l.inicio + interval '1 hour', l.ciclo_id, l.aula_id
from ligado l;
