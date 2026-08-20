# Quickstart — validar o Kanban de Leads

**Feature**: `001-kanban-leads`

Como rodar a feature e provar que ela funciona. Cada cenário aponta para o
requisito que valida. Detalhes de schema em [data-model.md](./data-model.md),
assinaturas em [contracts/server-actions.md](./contracts/server-actions.md).

---

## Pré-requisitos

```bash
# Postgres local (mesma imagem que o CLAUDE.md da raiz usa)
docker run -d --name ag-pg -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=autogestor \
  -p 55432:5432 postgres:16-alpine
```

```bash
cd admin
npm install                       # traz @dnd-kit/core e @dnd-kit/sortable

export DATABASE_URL="postgres://postgres:teste@localhost:55432/autogestor"
export ADMIN_SESSION_SECRET="qualquer-coisa-longa-para-dev"
export ADMIN_SEED_EMAIL="dev@local"
export ADMIN_SEED_SENHA="dev12345"

npm run dev                       # http://localhost:3000
```

> **Pegadinha herdada**: as variáveis precisam ser **exportadas**, não só
> estarem no `.env` — o código lê `process.env`. Está no CLAUDE.md da raiz.

Entre em `http://localhost:3000/entrar` com `dev@local` / `dev12345`.

O schema (incluindo a coluna nova `posicao`) é criado sozinho no primeiro
acesso pelo `ensure()` de `lib/db.ts`.

### Semear leads para ver o quadro cheio

```bash
psql "$DATABASE_URL" -c "
INSERT INTO crm_leads (pipeline, etapa, nome, telefone, origem, criado, metadata)
SELECT p, e, 'Lead ' || p || ' ' || e || ' ' || g,
       '5562' || lpad((900000000 + g)::text, 9, '0'),
       'seed', now() - (g || ' days')::interval,
       jsonb_build_object('contexto', 'seed ' || p)
FROM unnest(ARRAY['coopluz','seguro','viagens']) p,
     unnest(ARRAY['novo','contato','proposta','ganho','perdido']) e,
     generate_series(1, 3) g;"
```

---

## Testes automatizados

```bash
cd admin && npm test
```

Cobre `lib/quadro.mjs` — `posicaoEntre()` (topo, fundo, meio, coluna vazia) e
`agruparPorEtapa()` (5 chaves sempre, nenhum lead duplicado, nenhum sumido).
São as duas funções cujo erro é silencioso. Ver [research.md](./research.md) §R7.

---

## Cenários de validação manual

### V1 — O funil aparece inteiro (US1 · FR-001, FR-002, FR-005, FR-006, SC-005)

1. Abra `/leads`.
2. **Espere**: 5 colunas na ordem novo → contato → proposta → ganho → perdido.
3. Cada lead aparece **uma única vez**, na coluna da sua etapa.
4. A contagem no topo de cada coluna bate com o número de cartões nela.
5. Some as 5 contagens e compare com
   `psql "$DATABASE_URL" -c "SELECT count(*) FROM crm_leads;"` — devem bater.
6. Esvazie uma etapa (`UPDATE crm_leads SET etapa='novo' WHERE etapa='perdido';`)
   e recarregue: a coluna "perdido" continua visível, com contagem 0 e estado
   vazio escrito.

### V2 — O cartão diz o necessário (FR-003, FR-004, FR-013)

1. **Espere** em cada cartão: nome (link para `/leads/{id}`), vertical,
   contexto de origem, e "hoje" ou "há Nd".
2. Cartão com telefone tem link de WhatsApp; sem telefone, não tem.
3. Um lead com `criado` de 10 dias atrás em "novo" (limiar 1) mostra destaque
   de parado — **e o destaque não é só cor**: tem ícone ou rótulo. Confirme
   simulando escala de cinza no DevTools.
4. Clique no nome → chega no detalhe do lead.

### V3 — Arrastar muda a etapa e grava histórico (US2 · FR-007, FR-009, FR-012, SC-003)

1. Arraste um cartão de "contato" para "proposta".
2. **Espere**: o cartão muda de coluna em menos de 1 segundo; as duas contagens
   se ajustam.
3. Recarregue — o cartão continua em proposta.
4. Abra o detalhe do lead: a timeline traz o evento com etapa de origem,
   destino, seu nome como autor, e data/hora.
5. Confirme no banco:
   ```bash
   psql "$DATABASE_URL" -c "SELECT de, para, autor, nota FROM crm_eventos ORDER BY id DESC LIMIT 1;"
   ```
   `nota` deve ser `NULL` — o arraste não interrompe para pedir nota.

### V4 — Solturas que não devem fazer nada (US2 cenário 4 · FR-022)

1. Anote `SELECT count(*) FROM crm_eventos;`.
2. Arraste um cartão e solte **fora de qualquer coluna**. Depois arraste e
   solte **na mesma coluna de origem, mesma posição**.
3. **Espere**: nada muda visualmente e a contagem de eventos é a mesma.

### V5 — Falha de gravação reverte visivelmente (US2 cenário 5 · FR-012)

1. Com a página aberta, derrube o banco: `docker stop ag-pg`.
2. Arraste um cartão para outra coluna.
3. **Espere**: o cartão vai, volta visivelmente para a coluna de origem, e
   aparece uma mensagem dizendo que a mudança não foi salva.
4. `docker start ag-pg` para continuar.

### V6 — Sessão expirada durante o arraste (edge case · FR-011)

1. Com `/leads` aberta, apague o cookie de sessão no DevTools.
2. Arraste um cartão.
3. **Espere**: nada grava, o cartão volta, e você é levado para `/entrar`.

### V7 — Só com teclado (US2 cenário 3, US4 cenário 5 · FR-008, FR-021, SC-004)

Sem tocar no mouse, com um leitor de tela ligado (NVDA no Windows):

1. `Tab` até um cartão. **Espere**: anel de foco visível.
2. `Espaço` para pegar. **Espere**: anúncio "Cartão {nome} pego, etapa {etapa},
   posição i de n".
3. Setas ← → para mudar de coluna, ↑ ↓ para mudar de posição. **Espere**:
   anúncio a cada movimento.
4. `Espaço` para soltar. **Espere**: anúncio de confirmação, e o mesmo efeito
   no banco que o arraste com mouse (etapa + evento com autor).
5. Repita pegando um cartão e apertando `Esc`: anúncio de cancelamento, cartão
   volta, nada grava.

**Critério de aprovação (SC-004)**: 100% do que V3 e V8 fazem com mouse foi
feito aqui só com teclado.

### V8 — Reordenar dentro da coluna (US4 · FR-019, FR-020, SC-008, SC-009)

1. Anote `SELECT count(*) FROM crm_eventos;`.
2. Numa coluna com 3+ cartões, arraste o terceiro para o topo.
3. **Espere**: a nova ordem aparece na hora.
4. Recarregue — a ordem se manteve.
5. Abra o detalhe do lead movido: **nenhum evento novo** de mudança de etapa.
   A contagem do passo 1 não mudou.
6. Abra o mesmo endereço em outra janela anônima (logando de novo): mesma
   ordem, mesma sequência.
7. Arraste um cartão para o **meio** de outra coluna. **Espere**: ele para
   exatamente onde foi solto, não no topo nem no fundo (FR-020).

### V9 — Filtros recortam o quadro inteiro (US3 · FR-014, FR-015, FR-018)

1. Filtre por uma vertical. **Espere**: todas as colunas mostram só leads dela;
   as contagens acompanham; a soma continua igual ao total filtrado (SC-005).
2. Copie o endereço, abra em outra aba. **Espere**: o mesmo recorte.
3. Busque por algo inexistente (`?q=zzzzz`). **Espere**: as 5 colunas vazias,
   uma mensagem explicando que o filtro não retornou nada, e um jeito de limpar
   o filtro em um clique.
4. **Espere**: o campo "Etapa" **não existe mais** na barra de filtros.
5. Abra `/leads?etapa=proposta` (endereço antigo). **Espere**: o quadro abre
   normal, ignorando o parâmetro, sem erro e sem redirect.

### V10 — Sem banco configurado (FR-017)

```bash
unset DATABASE_URL && npm run dev
```

**Espere**: o banner vermelho de "Leads sem persistência" continua aparecendo,
o quadro renderiza as 5 colunas vazias, e nada quebra.

### V11 — Volume acima do teto (edge case)

```bash
psql "$DATABASE_URL" -c "
INSERT INTO crm_leads (pipeline, etapa, nome, origem)
SELECT 'geral','novo','Volume ' || g, 'seed' FROM generate_series(1, 600) g;"
```

**Espere**: o quadro avisa explicitamente que está mostrando os 500 primeiros e
que é preciso refinar o filtro. Nenhuma omissão silenciosa.

### V12 — Tela estreita e movimento reduzido (edge cases · responsive, motion)

1. DevTools em 360px de largura. **Espere**: nenhuma coluna inalcançável; é
   possível mudar a etapa de um lead sem arrastar entre colunas fora da tela
   (controle de etapa no próprio cartão).
2. Coluna com muitos cartões: **cada coluna rola sozinha**, o cabeçalho da
   coluna (nome + contagem) continua visível, e a página inteira não estica.
3. Área de toque de qualquer controle do cartão ≥ 44×44 px.
4. Ligue "Reduzir movimento" no SO (ou DevTools → Rendering →
   `prefers-reduced-motion: reduce`). **Espere**: o arraste continua
   funcionando, sem as transições animadas.

### V13 — Verificação no navegador antes de dizer "pronto"

Rode a skill `ui-verification` contra `http://localhost:3000/leads`:
árvore de acessibilidade, passagem de teclado, três larguras (360 / 768 /
1440), console limpo e LCP. Screenshot antes/depois. Sem isso, a feature não
está pronta.

---

## Checklist de saída

- [ ] `npm test` passa
- [ ] V1–V12 conferidos manualmente
- [ ] V13: screenshots nas três larguras, console sem erros
- [ ] `SELECT count(*) FROM crm_eventos` cresceu **exatamente** o número de
      mudanças reais de etapa feitas durante o teste (SC-009)
- [ ] A tabela de leads não existe mais em `/leads` (FR-018)
