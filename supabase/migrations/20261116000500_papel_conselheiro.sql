-- Terceiro papel: conselheiro (ex-associado com papel consultor e supervisor).
-- Em migração separada porque um valor novo de enum não pode ser usado na mesma transação.
alter type public.papel_membro add value if not exists 'conselheiro';
