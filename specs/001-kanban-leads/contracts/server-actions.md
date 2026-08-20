# Contract — Server Actions do quadro

**Feature**: `001-kanban-leads`

O admin não expõe API REST. A superfície que o cliente chama são **React Server
Actions** em [admin/app/leads/actions.ts](../../../admin/app/leads/actions.ts).
Este é o contrato delas.

Toda action aqui:

- roda com `"use server"` — a validação abaixo é a **única** fronteira de
  confiança; o cliente é entrada de usuário como qualquer outra;
- retorna cedo, sem gravar, se `dbOn()` for falso (FR-017);
- exige `usuarioAtual()` não-nulo (FR-011);
- valida `etapa` contra `ETAPAS` via `etapaValida()`, nunca contra o payload
  (FR-010);
- chama `revalidatePath("/leads")`, `revalidatePath("/")` e
  `revalidatePath("/leads/{id}")` em caso de sucesso.

---

## Tipo de retorno comum

```ts
type Resultado =
  | { ok: true }
  | { ok: false; erro: "sessao" | "db" | "invalido" | "falhou" };
```

| `erro` | Quando | O que o cliente faz |
|---|---|---|
| `"sessao"` | `usuarioAtual()` é `null` | reverte o cartão, mostra "sua sessão expirou" e navega para `/entrar` |
| `"db"` | `dbOn()` falso | reverte; o banner de "sem persistência" já está na tela |
| `"invalido"` | etapa fora de `ETAPAS`, id não-inteiro, posição não-finita | reverte, mostra "não foi possível mover este lead" |
| `"falhou"` | erro do Postgres | reverte, mostra "a mudança não foi salva" |

O cliente **sempre** reverte visivelmente em qualquer `ok: false` — FR-012,
cenário 5 da US2.

---

## `mover(entrada: MoverEntrada): Promise<Resultado>`

Muda a etapa de um lead **e** o posiciona no ponto de soltura.

```ts
type MoverEntrada = {
  id: number;         // inteiro; lead existente
  etapa: string;      // deve pertencer a ETAPAS
  antes: number | null;   // id do lead imediatamente ACIMA do ponto de soltura
  depois: number | null;  // id do lead imediatamente ABAIXO do ponto de soltura
  nota?: string | null;   // sempre null no arraste; até 300 chars
};
```

**Pré-condições**

- `Number.isInteger(id)`, senão `{ ok: false, erro: "invalido" }`
- `etapaValida(etapa)`, senão `{ ok: false, erro: "invalido" }`
- `antes` e `depois`, quando não-nulos, são ids de leads **que estão na `etapa`
  de destino**. Ids fora da coluna de destino são ignorados (tratados como
  `null`) — o cliente pode estar com uma visão obsoleta.

**Efeitos**

| Situação | `crm_leads` | `crm_eventos` |
|---|---|---|
| etapa atual ≠ `etapa` | `UPDATE etapa, posicao, atualizado` | `INSERT` com `de`, `para`, `nota`, `autor` |
| etapa atual = `etapa` | `UPDATE posicao, atualizado` | **nada** (FR-022, cenário 4 da US2) |
| lead não existe | nada | nada; `{ ok: false, erro: "invalido" }` |

As duas escritas rodam **na mesma transação** (`BEGIN … COMMIT`): um lead nunca
fica com etapa nova e histórico sem o evento.

`posicao` é `posicaoEntre()` calculada **no servidor**, a partir dos `posicao`
lidos das linhas `antes`/`depois`. O cliente nunca envia um número de posição.

**Concorrência**: última gravação vence (edge case do spec). Sem `SELECT … FOR
UPDATE`, sem versionamento otimista. Os dois eventos ficam no histórico na
ordem em que ocorreram, que é o que o spec pede.

**Compatibilidade**: a assinatura atual `mover(fd: FormData)` continua existindo
para o fallback sem JS / toque (o `<select>` de etapa por cartão), delegando
para esta. Ela extrai `id`/`etapa`/`nota` do `FormData` e passa `antes: null,
depois: null` — o lead cai no fim da coluna de destino, que é o comportamento
previsível para quem não arrastou.

---

## `reposicionar(entrada: ReposicionarEntrada): Promise<Resultado>`

Reordena um cartão **dentro da coluna em que já está**. Nunca toca `etapa`,
nunca grava evento.

```ts
type ReposicionarEntrada = {
  id: number;
  antes: number | null;
  depois: number | null;
};
```

**Pré-condições**: `Number.isInteger(id)`; `antes`/`depois` na mesma etapa do
lead (ids de outra etapa são ignorados).

**Efeitos**: `UPDATE crm_leads SET posicao = $2, atualizado = now() WHERE id =
$1`. Uma linha, sempre. Nenhuma outra linha da coluna é escrita — é o que
garante o edge case "nenhum outro cartão troca de lugar por consequência".

**Invariante verificável (SC-009)**: chamar `reposicionar` N vezes não altera
`count(*) FROM crm_eventos`.

---

## `definirValor(fd: FormData)` — inalterada

Continua exatamente como está. Fora do escopo desta feature.

---

## Contrato de leitura — `listarLeads(filtro)`

```ts
type FiltroLeads = { pipeline?: string; q?: string };  // `etapa` REMOVIDO — FR-018
```

- `etapa` sai do filtro: cada etapa já é uma coluna. Parâmetro `?etapa=` em
  endereços antigos é **ignorado sem erro** (premissa do spec), não redireciona.
- `ORDER BY l.posicao ASC, l.id ASC` (era `atualizado DESC, id DESC`).
- `LIMIT 501`. A 501ª linha é o sinal de truncamento; o quadro renderiza 500 e
  avisa (edge case "volume acima do teto de leitura").
- Retorna `Lead[]` com o campo derivado `desde` — inalterado.

---

## Contrato de URL da tela

`/leads?pipeline={slug}&q={texto}`

- Ambos opcionais; ausência = tudo.
- É a **única** fonte do recorte (FR-015): recarregar e compartilhar reproduzem
  o mesmo quadro. Nenhum filtro vive em estado de cliente.
- `pipeline` inválido → tratado como ausente, sem erro.

---

## Contrato de acessibilidade (é requisito, não detalhe de UI)

Anúncios do `@dnd-kit` traduzidos, em uma região `aria-live="assertive"` única:

| Evento | Anúncio |
|---|---|
| `onDragStart` | `"Cartão {nome} pego, etapa {etapa}, posição {i} de {n}."` |
| `onDragOver` | `"{nome} sobre {etapa}, posição {i} de {n}."` |
| `onDragEnd` | `"{nome} movido para {etapa}, posição {i} de {n}."` |
| `onDragCancel` | `"Movimentação de {nome} cancelada. Cartão voltou para {etapa}."` |
| falha da action | `"A mudança de {nome} não foi salva."` |

Teclado: `Tab` chega ao cartão, `Espaço` pega/solta, setas movem entre colunas e
posições, `Esc` cancela (FR-008, FR-021, cenário 3 da US2, cenário 5 da US4).
