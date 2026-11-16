# Identidade visual

A plataforma usa uma versão própria, feita para tela, da identidade da LDS·FDR. O design system da liga (redes sociais e apostila: vinho, bege, Playfair Display e Raleway) continua valendo para essas peças; na plataforma, a diretoria pediu algo mais moderno e confortável de ler (novembro de 2026). Os tokens estão em `src/app/globals.css`.

**Caráter.** Calmo, claro e funcional. O vinho da liga é o único destaque; o resto são neutros.

## Cor

Estratégia contida: o bege da liga no fundo, superfícies brancas e um só acento.

| Token | Valor | Uso |
| --- | --- | --- |
| `vinho` | `#A7002E` | Ações principais, item ativo do menu, selos de destaque, painel do próximo encontro |
| `vinho-escuro` | `#8A0026` | Hover de botões; texto de erro |
| `vinho-suave` | `#FBEFF1` | Fundo de destaque (item ativo, próximo encontro, avisos) |
| `vinho-borda` | `#EFC9D1` | Borda dos destaques; sublinhado de links |
| `tinta` | `#231C1E` | Texto e títulos |
| `grafite` | `#635A5C` | Texto secundário (5,6:1 sobre o bege) |
| `fundo` | `#EBECE0` | Fundo da página: o bege da liga, mantido a pedido da diretoria |
| `superficie` | `#FFFFFF` | Cartões, campos e menu |
| `sutil` | `#F4F4EC` | Hover neutro, selos, painel de edição |
| `linha` / `linha-forte` | `#D9D9CB` / `#BDBCAB` | Bordas |

- O vinho cheio aparece em poucos lugares: botões, selos e o painel do próximo encontro, no Início. Nunca como fundo de menu ou de página.
- Texto sempre com contraste de pelo menos 4,5:1. Não usar cinza claro "por elegância".

## Tipografia

Uma só família: **Figtree**, em vários pesos. Sem serifa e sem itálico nos títulos.

- `.h1` (título da página, 28 a 36px, peso 700), `.h2` (22px, 700), `.h3` (17px, 600).
- Corpo em 16px, peso 400; textos longos com a classe `.prosa` (até 68 caracteres por linha).
- Sem rótulos em caixa alta acima das seções. Informação curta de apoio vai em selos (`.selo`).

## Forma

- Cantos arredondados: 10px em botões e campos, 14px em cartões, 16px em painéis. Selos em pílula.
- Bordas de 1px, sem sombra. Nunca faixa colorida na lateral de cartões ou avisos.
- Cartões só quando o item é clicável ou é um objeto (aula, anexo, publicação). Listas simples para o resto.
- Áreas ainda não construídas aparecem como uma lista discreta, "Em breve nesta área", e não como grade de cartões.
- Alvos de toque com pelo menos 44px de altura.
- Movimento curto (150 a 300ms, saída exponencial) e desligado para quem pede menos movimento.

## Componentes

`src/components/ui.tsx` (Pagina, CabecalhoDaPagina, Secao, Lista, Atalhos, Recolhivel) e as classes de `globals.css` (`.botao`, `.campo`, `.rotulo-campo`, `.selo`, `.cartao`, `.aviso`, `.link`). Ícones: `lucide-react`, traço 1.75.

## Marca

- Lockups em `public/marca/`: `lockup-vinho.png` (em uso, sobre fundo claro) e `lockup-branco.png`.
- Não existe versão vetorial nem brasão isolado. **Nunca** desenhar um brasão aproximado, recolorir, contornar ou sombrear o existente. Por isso o ícone da aba é um quadrado vinho liso.
- Pendência com a liga: obter o SVG do lockup e o brasão solto.

## Texto

Português do Brasil, claro e direto. Sem emoji. Títulos em caixa mista. Termos em latim e em inglês em itálico.
