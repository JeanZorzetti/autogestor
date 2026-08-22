# Contrato: `POST /api/lead`

Único endpoint dinâmico do site (junto com `/obrigado`, que só lê query
string). Contrato **idêntico** ao já existente no hub — copiado, não
redesenhado. Documentado aqui para a fase de tasks/testes ter algo a
verificar contra, sem precisar reler `api/lead.ts` do hub.

## Request

Aceita as duas formas (progressive enhancement — FR-007 da spec):

**Sem JavaScript** — `Content-Type: application/x-www-form-urlencoded` (POST
de formulário nativo).

**Com JavaScript** — `Content-Type: application/json`.

Campos, em ambos os casos:

| Campo | Obrigatório | Regra |
|---|---|---|
| `solucao` | sim | deve ser `"coopluz"` ou `"parceiro-coopluz"` — qualquer outro valor é rejeitado (a lista de slugs aceitos é reduzida às 2 soluções deste site) |
| `nome` | sim | mínimo 2 caracteres após normalização |
| `whatsapp` | sim | celular brasileiro válido (DDD + 9 dígitos); normalizado para E.164 |
| `contexto` | condicional | obrigatório quando a solução tem `campo.opcoes` (as duas soluções deste site têm) — valor médio da conta (Home) ou cidade de atuação (parceiro) |
| `origem` | não | string livre, default `"site"` |
| `empresa` | não (honeypot) | preenchido ⇒ tratado como robô, resposta de sucesso simulada, nada é gravado |

## Response

**Sucesso, requisição JSON**: `200`, `{ "ok": true, "duplicado": boolean }`.

**Sucesso, requisição de formulário (sem JS)**: `303` para `/obrigado`.

**Erro de validação, requisição JSON**: `400`,
`{ "erro": string, "campo": string }`.

**Erro de validação, requisição de formulário**: `303` para
`/obrigado?erro={campo}`.

**Banco indisponível (`DATABASE_URL` ausente)**: `503` — JSON com `erro`
orientando WhatsApp, ou redirect para `/obrigado?erro=1`. Nunca finge
sucesso (FR-006, Princípio IV da constituição).

**Rate limit excedido** (mais de 5 tentativas/hora pelo mesmo IP): `429`
(JSON) ou redirect `/obrigado?erro=1` (formulário).

**Falha ao gravar** (erro do Postgres após passar na validação): `500`
(JSON) ou redirect `/obrigado?erro=1` (formulário).

## O que muda em relação ao contrato do hub

Nada na forma. A única diferença é a **lista de slugs aceitos**: o hub aceita
8 (`SOLUCOES` + `PARCEIRO` + `PARCEIRO_COOPLUZ` + `GERAL`); este site aceita
2 (`coopluz` + `parceiro-coopluz`). Enviar qualquer outro slug para este
endpoint é rejeitado com o mesmo erro `"Escolha uma das soluções."` que o
hub já usa para slug inválido — comportamento herdado de `parseLead()`
(`lib/lead.mjs`), copiado sem alteração.

## Como verificar (sem escrever teste novo de integração)

A lógica pura já tem teste (`test/lead.test.mjs`, copiado verbatim — cobre
`normalizarWhatsapp` e `parseLead`). O comportamento de rede (rate limit,
grava no Postgres, redireciona) é o mesmo código do endpoint já em produção
no hub — a verificação end-to-end desta feature é funcional, via
`quickstart.md`, não um novo teste automatizado de HTTP.
