-- Ciclo 2026.2 · Ciclo-base de Direito Societário
-- Fonte: "Cronograma do Grupo de Estudos - 2026.2". Datas conforme o cronograma oficial
-- (10/09 cai numa quinta e 16/11 numa segunda; confirmado pela diretoria).
-- Horário: 20h (horário de Recife), 60 minutos, nas salas da FDR.
with ciclo as (
  insert into public.ciclos (codigo, titulo, inicio, fim, status)
  values ('2026.2', 'Ciclo-base de Direito Societário', '2026-08-12', '2026-12-02', 'atual')
  returning id
),
cronograma (dia, numero, tipo, titulo) as (
  values
    ('2026-08-12'::date, null::int, 'evento', 'Apresentação do Semestre'),
    ('2026-08-19',  1, 'aula',   'Sociedades Limitadas e Anônimas: Conceito, Natureza Jurídica e Classes'),
    ('2026-08-26', null, 'evento', 'Lançamento de livro de Artigos'),
    ('2026-09-02',  2, 'aula',   'Capital Social e Quotas/Ações como Participação Societária'),
    ('2026-09-09',  3, 'aula',   'Obrigações e Direitos dos Sócios e Acionistas'),
    ('2026-09-10',  4, 'aula',   'Estruturas Societárias e Planejamento Tributário'),
    ('2026-09-16',  5, 'aula',   'Atos Constitutivos (Contrato Social, Estatuto Social e Livros da Companhia)'),
    ('2026-09-23',  6, 'aula',   'Acordo de Sócios e Acionistas'),
    ('2026-09-30',  7, 'aula',   'Valores Mobiliários (Ações, Partes Beneficiárias, Debêntures, Bônus de Subscrição)'),
    ('2026-10-07',  8, 'aula',   'Estrutura da Companhia, Princípio Majoritário, Acionista Controlador e Proteção da Minoria'),
    ('2026-10-14',  9, 'aula',   'Órgãos Sociais: Reunião de Sócios e Assembleias Gerais'),
    ('2026-10-21', 10, 'aula',   'Administração da Companhia (Deveres e Responsabilidades)'),
    ('2026-10-28', 11, 'aula',   'Lucros, Reservas e Dividendos'),
    ('2026-11-04', 12, 'aula',   'Reorganizações Societárias (Conceito e Espécies)'),
    ('2026-11-11', 13, 'aula',   'Financiamento da Companhia e Alterações de Capital Social'),
    ('2026-11-16', 14, 'aula',   'Dissolução, Liquidação e Extinção'),
    ('2026-12-02', null, 'evento', 'Rinha de Calouros')
),
novas_aulas as (
  insert into public.aulas (ciclo_id, numero, titulo, data, local, publicada)
  select ciclo.id, c.numero, c.titulo, (c.dia + time '20:00') at time zone 'America/Recife', 'FDR', true
  from cronograma c, ciclo where c.tipo = 'aula'
  returning id, numero
)
insert into public.eventos (titulo, tipo, inicio, fim, local, ciclo_id, aula_id)
select c.titulo, c.tipo::public.tipo_evento,
       (c.dia + time '20:00') at time zone 'America/Recife',
       (c.dia + time '21:00') at time zone 'America/Recife',
       'FDR', ciclo.id, a.id
from cronograma c
cross join ciclo
left join novas_aulas a on a.numero = c.numero;
