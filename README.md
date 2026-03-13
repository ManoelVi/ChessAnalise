# ♟ Chess Analyzer — Instruções para o Claude Code

Aplicação web de análise de partidas de xadrez usando o **Stockfish via API do Lichess**, sem necessidade de backend ou instalação de engine.

---

## Visão Geral

O `chess-analyzer.html` é um arquivo HTML único (frontend puro) que:

- Aceita partidas no formato **PGN** como entrada
- Importa a partida na API do Lichess para obter os dados da partida
- Consulta a **Lichess Cloud Eval API** (`/api/cloud-eval`) para análise por Stockfish em cada posição
- Renderiza o tabuleiro de xadrez interativo em HTML/CSS puro
- Classifica cada lance (Brilhante, Ótimo, Bom, Imprecisão, Erro, Blunder)
- Exibe barra de avaliação, melhor lance sugerido e estatísticas de precisão

---

## Estrutura do Projeto

```
chess-analyzer.html   # Arquivo principal — tudo em um único arquivo HTML
README.md             # Este arquivo
```

Não há dependências externas, bundler, nem servidor necessário. Basta abrir o HTML no navegador.

---

## APIs Utilizadas

### 1. Lichess Import API
```
POST https://lichess.org/api/import
Content-Type: application/x-www-form-urlencoded
Body: pgn=<PGN codificado>
```
Retorna o `id` da partida importada.

### 2. Lichess Cloud Eval API
```
GET https://lichess.org/api/cloud-eval?fen=<FEN>&multiPv=<1|2|3>
```
Retorna avaliação do Stockfish para a posição dada. **Gratuita, sem chave de API.** Funciona apenas para posições que já foram analisadas na nuvem do Lichess — posições de partidas pouco conhecidas podem retornar sem avaliação.

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Input PGN | Cola a partida em texto no formato padrão PGN |
| Profundidade | Escolha entre 10 (rápido), 15 (padrão) ou 20 (detalhado) |
| Variantes | 1 a 3 linhas alternativas por posição |
| Tabuleiro interativo | Clica em qualquer lance para navegar para aquela posição |
| Classificação de lances | Brilliant / Great / Good / Inaccuracy / Mistake / Blunder |
| Barra de avaliação | Barra visual mostrando vantagem de Brancas vs Pretas |
| Melhor lance | Exibe o melhor lance sugerido pelo Stockfish |
| Estatísticas | Contagem de blunders, erros e imprecisões por partida |
| Precisão | Percentual de lances bons por cor |

---

## Motor de Xadrez Interno (JavaScript puro)

Para converter o PGN em sequência de FENs sem backend, o arquivo inclui um **motor de xadrez minimalista em JavaScript** que:

- Faz parsing de FEN e SAN (notação algébrica padrão)
- Suporta todos os movimentos: peões, cavalos, bispos, torres, damas, reis
- Suporta roque (kingside e queenside)
- Suporta en passant
- Suporta promoção de peões
- Gera UCI (notação de 4 letras, ex: `e2e4`) para cada lance

> **Atenção:** O motor interno não valida xeques nem xeques-mate — ele apenas replica os movimentos do PGN. Casos extremamente incomuns de PGNs mal formatados podem causar falha no parsing.

---

## Como Modificar

### Trocar a fonte de análise (ex: rodar Stockfish local)

No arquivo `chess-analyzer.html`, localize a função `analyzePosition`:

```javascript
async function analyzePosition(fen, depth, multiPv) {
  const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=${multiPv}`;
  const res = await fetch(url);
  ...
}
```

Para usar um backend próprio com Stockfish, substitua a URL pela sua API local. O retorno esperado é o mesmo formato do Lichess Cloud Eval:

```json
{
  "pvs": [
    {
      "moves": "e2e4 e7e5 g1f3",
      "cp": 30
    }
  ]
}
```

Para mate, use `"mate": 3` em vez de `"cp"`.

### Adicionar suporte a FEN direto (sem PGN)

Na função `analyzeGame`, adicione detecção de FEN:

```javascript
const pgn = document.getElementById('pgn-input').value.trim();
const isFen = /^[rnbqkpRNBQKP1-8\/]+ [wb]/.test(pgn);

if (isFen) {
  // Analisar posição única
  const evalData = await analyzePosition(pgn, depth, multiPv);
  renderBoard(pgn, null, evalData?.pvs?.[0]?.moves?.split(' ')?.[0]);
} else {
  // Fluxo normal de PGN
}
```

### Adicionar navegação por teclado

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' && currentMoveIdx < analysisData.length - 1)
    goToMove(currentMoveIdx + 1);
  if (e.key === 'ArrowLeft' && currentMoveIdx > 0)
    goToMove(currentMoveIdx - 1);
});
```

---

## Limitações Conhecidas

- **Posições não analisadas:** A Cloud Eval API do Lichess só retorna avaliação para posições que já foram analisadas. Partidas com aberturas muito raras podem ter vários lances sem avaliação (`?`).
- **Rate limiting:** O Lichess pode limitar requisições em sequências rápidas. O código já inclui um delay de 80ms entre chamadas.
- **PGNs com variações:** O parser descarta variações e comentários `{...}` e `(...)` — apenas a linha principal é analisada.
- **Sem validação de xeque:** O motor interno não verifica se o rei está em xeque, o que pode causar falhas em PGNs com notação incorreta.

---

## Possíveis Melhorias

- [ ] Navegação por teclado (←/→)
- [ ] Suporte a entrada por FEN
- [ ] Flip do tabuleiro (ver pela perspectiva das Pretas)
- [ ] Exibição de linhas alternativas (multi-PV) no tabuleiro
- [ ] Backend com Stockfish local via `python-chess` para análise sem limitações
- [ ] Exportar análise em PDF ou PGN anotado
- [ ] Suporte a múltiplas partidas em sequência

---

## Referências

- [Lichess API — Cloud Eval](https://lichess.org/api#tag/Analysis/operation/apiCloudEval)
- [Lichess API — Import Game](https://lichess.org/api#tag/Games/operation/gameImport)
- [Formato PGN](https://www.chessclub.com/help/PGN-spec)
- [Protocolo UCI](https://www.shredderchess.com/download/div/uci.zip)
- [python-chess](https://python-chess.readthedocs.io/) — alternativa para backend com Stockfish local