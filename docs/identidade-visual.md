# Identidade visual

Fonte: design system da LDS·FDR, padrão de novembro de 2026 (o mesmo das redes da liga). Os tokens estão em `src/app/globals.css`.

**Caráter.** Editorial e acadêmico, com calor: títulos em serifa itálica, texto em sans geométrica, vinho institucional sobre bege. Sem gradiente, sem sombra, sem foto de banco.

## Cores

| Token | Valor | Uso |
| --- | --- | --- |
| `vinho` | `#A7002E` | Marca, títulos, fundos escuros, botões |
| `vinho-profundo` | `#8E0027` | Hover; caixas sobre vinho |
| `vinho-press` | `#74001F` | Estado pressionado; texto de erro |
| `bege` | `#EBECE0` | Fundo da página; texto sobre vinho |
| `papel` | `#F6F6EE` | Quadros e campos sobre bege |
| `tinta` | `#2A2324` | Texto principal |
| `grafite` | `#6B6460` | Texto secundário |
| `rosa` | `#F5E3E4` | Fundo da caixa de destaque |
| `rosa-claro` | `#F2C9D2` | Rótulos sobre vinho |
| `filete` / `filete-forte` | `#CFCDBF` / `#B5B2A3` | Linhas de 1px sobre bege |
| `filete-vinho` | `#C9506C` | Linhas de 1px sobre vinho |

Contrastes aprovados: tinta sobre bege 12,9:1 · vinho sobre bege 6,6:1 · grafite sobre bege 4,9:1 · bege sobre vinho 6,6:1 · rosa claro sobre vinho 5,2:1. **Não usar em texto:** rosa médio `#D9708A` sobre vinho e ouro velho `#A9832E` sobre bege.

## Tipografia

- **Playfair Display**, itálico, peso 500: títulos, em caixa mista. Classe `.titulo`.
- **Raleway**: todo o resto. Corpo em 400, destaque em 700, rótulos em 600 caixa alta com rastreamento. Classe `.rotulo`.

## Forma

- Cantos retos e filete de 1px em caixas, quadros, campos e tabelas. Pílula só em etiquetas.
- Caixa de destaque: fundo rosa com filete vinho de 4px à esquerda.
- Texto alinhado à esquerda; nunca justificado.
- Escala de espaçamento: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.

## Marca

- Lockups em `public/marca/`: `lockup-vinho.png` (sobre fundo claro) e `lockup-branco.png` (sobre vinho).
- Não existe versão vetorial nem brasão isolado. **Nunca** desenhar um brasão aproximado, recolorir, contornar ou sombrear o existente. Por isso o ícone da aba é um quadrado vinho liso.
- Pendência com a liga: obter o SVG do lockup e o brasão solto.

## Texto

Português do Brasil, registro formal e impessoal. Sem emoji. Ponto médio (·) para separar metadados. Termos em latim e em inglês em itálico.
