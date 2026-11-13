# Rumo à Praticagem

Diário de bordo visual da preparação do Artur para o **PSCPP 2027**, o processo seletivo para Praticante de Prático da Marinha (DPC). As 52 semanas do plano de estudos viram uma carta náutica: cada semana é uma boia, os marcos são faróis e a rota termina no Porto da Aprovação.

É um site estático, sem build e sem dependências: HTML, CSS e JavaScript puros que leem arquivos JSON.

## Estrutura

```
index.html          página
assets/style.css    visual (papel, nanquim, vermelho de selo)
assets/app.js       lê /data e desenha mapa, missões, fases, selos e rádio
data/semanas.json   as 52 semanas (fase, matérias, teste, meta, horas, notas, status)
data/marcos.json    faróis e selos (marque "feito": true quando cumprir)
data/tsf.json       índices e testes físicos mensais
data/noticias.json  notícias do concurso (o rádio do porto)
```

## Publicar no Cloudflare Pages

1. No painel da Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** e escolha este repositório.
2. Framework preset: **None**. Build command: deixe vazio. Build output directory: `/`.
3. Salve e publique. Cada `git push` na branch `main` publica de novo.

## Atualizar os dados

A fonte de verdade é a planilha **Controle semanal — PSCPP 2027**. Depois do fechamento de domingo, atualize `data/semanas.json` com `horas_feitas`, `quiz_pct` e `simulado_pct` (como fração: 0.75 = 75%) e `status` (`A fazer`, `Em andamento`, `Parcial`, `Concluída`), e mude `atualizado_em`.

Formato de um teste físico em `data/tsf.json`:

```json
{ "mes": "dez/2026", "barra_rep": 6, "natacao_50m": "1:12", "natacao_ok": true, "flutuacao_min": 20, "corrida_2400m": "11:40", "corrida_ok": true }
```

## Rodar localmente

```
npx serve .
```

Abrir o `index.html` direto do disco não funciona, porque o navegador bloqueia a leitura dos JSON.

## Observações

- As marcações da Missão do dia ficam só no navegador onde foram feitas (`localStorage`).
- Datas do concurso são o cronograma tentativo da Nota de Divulgação 01 da DPC (27/04/2026); valem as do edital quando sair.
- Os caracteres em caligrafia (引航, 航, 合格, 始 基 深 榜 决) são decorativos e foram escolhidos pelo significado; vale revisão de um falante nativo.
