# Quickstart: validar o site próprio da Coopluz

Guia de verificação end-to-end depois da implementação (`/speckit-implement`).
Não é um passo a passo de deploy — é como provar que a feature funciona
antes de declarar pronto (Portão de Conclusão da constituição do hub).

## Pré-requisitos

- Repositório `C:\dev\coopluz` criado com a estrutura de `plan.md`.
- `DATABASE_URL` **igual ao do hub** exportado no shell antes de rodar
  `npm run dev` (Astro só expõe `.env` como `import.meta.env`, o código lê
  `process.env` — mesma pegadinha documentada em `CLAUDE.md`/`README.md` do
  hub).
- Acesso ao painel administrativo do hub (`admin/`) já em execução, para
  conferir a User Story 4.

```powershell
cd C:\dev\coopluz
npm install
$env:DATABASE_URL = "<mesma connection string do hub>"
npm run dev
```

## 1. Testes automatizados (lógica pura)

```powershell
npm test
```

Esperado: `test/lead.test.mjs` e `test/tabela.test.mjs` passam sem alteração
— é a mesma lógica do hub, só copiada.

## 2. Home (User Story 1)

1. Abrir `http://localhost:4321/` — deve renderizar o conteúdo hoje em
   `/coopluz` do hub (promessa, como funciona, elegibilidade, números,
   "quem está por trás"), sem nenhuma referência a "hub" ou às outras 5
   verticais.
2. Ver a fonte da página (Ctrl+U) e confirmar que o texto principal está no
   HTML — não depende de JavaScript (SC-004).
3. Preencher o formulário do topo com um WhatsApp de teste e enviar.
   Confirmar: aviso de recebimento aparece sem recarregar a página (JS
   ligado).
4. Repetir o envio com JavaScript desabilitado no navegador — confirmar que
   o POST tradicional funciona e redireciona para `/obrigado`.
5. Selecionar "Até R$ 250" no campo de valor da conta — confirmar que o
   aviso de "não compensa" aparece antes do envio (Edge Case da spec).

## 3. Parceiro (User Story 2)

1. A partir da Home, seguir o link para `/parceiro`.
2. Ver a fonte da página (Ctrl+U) e confirmar que o conteúdo principal está
   no HTML — não depende de JavaScript (SC-004).
3. Confirmar que a remuneração (comissão de ativação + recorrente) está
   explicada e que o formulário pede cidade de atuação numa lista fechada
   com "Outra cidade de Goiás" como opção de fuga.
4. Enviar o formulário e confirmar recebimento.

## 4. Blog (User Story 3)

1. Abrir `/blog` — confirmar que aparecem exatamente os 2 posts migrados,
   nenhum conteúdo de outra vertical.
2. Abrir cada post diretamente pela URL (sem navegar a partir da Home) —
   confirmar que o conteúdo completo está no HTML e que há uma chamada de
   volta para a Home da Coopluz.

## 5. Lead cai no painel administrativo (User Story 4)

1. Depois de qualquer envio acima, abrir o painel administrativo do hub já
   em produção (ou local, apontando para o mesmo `DATABASE_URL`).
2. Confirmar que o lead aparece na coluna "Novo" do pipeline **Coopluz** (ou
   **Programa de parceiros** para o envio de `/parceiro`), sem nenhuma
   configuração adicional no admin.

## 6. Falha honesta (Edge Case)

1. Rodar `npm run dev` **sem** `DATABASE_URL` exportado.
2. Enviar o formulário — confirmar resposta 503 / redirect para
   `/obrigado?erro=1` mostrando o link de WhatsApp, nunca uma confirmação
   de sucesso falsa.

## 7. Páginas institucionais e legíveis por máquina

1. `/sobre`, `/privacidade`, `/termos` carregam sem referência às outras 5
   verticais nem ao registro SUSEP.
2. `/llms.txt` lista só a solução Coopluz e os 2 posts.
3. `/robots.txt` aponta para `/sitemap-index.xml` do domínio
   `coopluz.roilabs.com.br` (conferir com `SITE_URL` exportado, ou rodar
   `npm run build` e checar `dist/sitemap-index.xml`).
4. Ver código-fonte de qualquer página: `<link rel="canonical">` e
   `og:url` apontam para `coopluz.roilabs.com.br`, nunca para
   `autogestor.roilabs.com.br` (FR-016).

## 8. Peso de JavaScript (SC-005)

```powershell
npm run build
```

Conferir no relatório de build (ou no painel de rede do navegador, aba
Network, filtro JS) que o total de JavaScript por página não passa
perceptivelmente do ~1 KB já praticado no hub.

## 9. Verificação de UI antes de declarar pronto

Rodar a skill `ui-verification` (Playwright) sobre Home, `/parceiro` e um
post de blog: árvore de acessibilidade, passagem de teclado nas três larguras
(mobile/tablet/desktop), console limpo, screenshot antes/depois. É o portão
que a constituição do hub exige para toda tela nova ou alterada — não pular
mesmo em conteúdo majoritariamente herdado, porque `Header`/`Footer`/`Base`
foram editados.

## 10. Domínio e deploy (fora do código, checklist operacional)

- [ ] Projeto Vercel novo criado, apontando para `C:\dev\coopluz`.
- [ ] Variáveis de ambiente do projeto: `DATABASE_URL` (mesma do hub),
      `SITE_URL=https://coopluz.roilabs.com.br`.
- [ ] Domínio `coopluz.roilabs.com.br` adicionado ao projeto Vercel e DNS
      apontado (passo manual, fora do escopo desta feature — spec
      Assumptions).
