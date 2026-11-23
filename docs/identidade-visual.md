# Identidade visual

A plataforma usa uma versão própria, feita para tela, da identidade da LDS·FDR. O design system da liga (redes sociais e apostila: vinho, bege, Playfair Display e Raleway) continua valendo para essas peças; na plataforma, a diretoria pediu algo mais moderno e confortável de ler (novembro de 2026). Os tokens estão em `src/app/globals.css`.

**Caráter.** Calmo, claro e funcional. O vinho da liga é o único destaque; o resto são neutros.

## Cor

Estratégia contida: o bege da liga no fundo, superfícies num creme claro da mesma família (branco puro destoa do bege, que puxa para o amarelo-esverdeado) e um só acento.

| Token | Valor | Uso |
| --- | --- | --- |
| `vinho` | `#A7002E` | Ações principais, item ativo do menu, selos de destaque, aba ativa |
| `vinho-escuro` | `#8A0026` | Hover de botões; texto de erro |
| `vinho-suave` | `#F2E5E1` | Fundo de destaque (item ativo, próximo encontro, avisos) |
| `vinho-borda` | `#E7C2C6` | Borda dos destaques; sublinhado de links |
| `tinta` | `#231C1E` | Texto e títulos |
| `grafite` | `#635A5C` | Texto secundário (5,6:1 sobre o bege) |
| `fundo` | `#EBECE0` | Fundo da página: o bege da liga, mantido a pedido da diretoria |
| `superficie` | `#F9F9F1` | Cartões, campos e menu: creme no mesmo matiz do bege, nunca branco puro |
| `sutil` | `#F1F2E6` | Hover neutro, selos, painel de edição |
| `linha` / `linha-forte` | `#DCDECF` / `#BDBCAB` | Bordas |

- O vinho cheio aparece em poucos lugares: botões, selos e o traço da aba ativa. Nunca como fundo de painel, de menu ou de página. Sem gradientes, brilhos ou pontos pulsando.
- Texto sempre com contraste de pelo menos 4,5:1. Não usar cinza claro "por elegância".

## Tipografia

Uma só família: **Figtree**, em vários pesos. Sem serifa e sem itálico nos títulos.

- `.h1` (título da página, 28 a 36px, peso 700), `.h2` (22px, 700), `.h3` (17px, 600).
- Corpo em 16px, peso 400; textos longos com a classe `.prosa` (até 68 caracteres por linha).
- Sem rótulos em caixa alta acima das seções. Informação curta de apoio vai em selos (`.selo`).

## Forma

- Cantos arredondados: 10px em botões e campos, 14px em cartões, 16px em painéis. Selos em pílula.
- Bordas de 1px e, nos cartões, uma sombra mínima (`--lds-sombra`) só para separar o branco do bege. Cartão clicável (`.cartao-link`) sobe 1px no hover. Nunca faixa colorida na lateral de cartões ou avisos.
- Objetos de mesma natureza (aulas, publicações, livros, competições, perguntas) aparecem em cartões lado a lado (`Grade`): três colunas no computador, uma no celular. Registros em sequência (frequência, entregas, avisos) ficam em lista dentro de um cartão.
- Páginas com mais de um assunto usam abas (`Abas`), uma por endereço (`?aba=`), e não uma página longa de rolagem.
- Estado vazio (`Vazio`): contorno tracejado, dizendo o que falta e, quando houver, o que fazer.
- Alvos de toque com pelo menos 44px de altura.
- Movimento curto e desligado para quem pede menos movimento. Ver a seção Movimento.

## Movimento

Receitas adaptadas de transitions.dev. Tokens em `globals.css`: `--duracao-rapida` (150ms), `--duracao-media` (240ms), `--duracao-lenta` (420ms), `--curva-saida` e `--curva-entra-sai`. Só `transform` e `opacity` animam; nunca `transition: all`.

- Entrada da página (`.entrada`, aplicada em `Pagina`): os blocos sobem 8px em sequência, 50ms entre eles.
- Troca de página: o conteúdo cruza com fade e sobe 6px (View Transitions do React); o menu fica parado.
- Menu: uma pílula vinho suave desliza até o item ativo. No computador, o menu recolhe para uma coluna de ícones (preferência guardada no cookie `lds-menu`); recolhido, cada ícone mostra uma dica que espera 400ms para abrir e fecha na hora.
- Recolhível: altura anima por `grid-template-rows` e a seta gira.
- Botões comprimem para 97% ao clicar; setas avançam 3px no hover (`.seta`); avisos surgem com `.surgir`.

## Datas

Datas são o objeto central da liga: numeral em peso 700, algarismos tabulares (`.numeral`).

- Próximo encontro (Início): cartão creme com "Hoje" ou "em N dias" em vinho, título grande, horário e local, e uma régua com um traço por encontro do ciclo.
- Cartões de aula e de publicação começam pela data (dia/mês · dia da semana).

## Componentes

`src/components/ui.tsx` (Pagina, CabecalhoDaPagina, Abas, Grade, Cartao, Painel, Numero, Vazio, Secao, Lista, Avatar, Recolhivel), `src/components/formulario.tsx` (Formulario, AcaoRapida, Campo, AreaDeTexto, Escolha, Marcar, BotaoEnviar) e as classes de `globals.css` (`.botao`, `.campo`, `.rotulo-campo`, `.selo`, `.cartao`, `.aviso`, `.link`). Ícones: `lucide-react`, traço 1.75.

## Marca

- Lockups em `public/marca/`: `lockup-vinho.png` (em uso, sobre fundo claro) e `lockup-branco.png`.
- Ícones (novembro de 2026, arquivos enviados pela diretoria): o brasão vinho com fundo transparente é o ícone da aba do navegador (`src/app/icon.png`); a arte de fundo vinho com o lockup branco é o ícone do app no iPhone (`src/app/apple-icon.png`) e no Android (`public/icones/`).
- **Nunca** desenhar um brasão aproximado, recolorir, contornar ou sombrear o existente. Os ícones só são recortados e reduzidos a partir dos arquivos originais.
- Pendência com a liga: obter o SVG do lockup.

## Texto

Português do Brasil, claro e direto. Sem emoji. Títulos em caixa mista. Termos em latim e em inglês em itálico.
