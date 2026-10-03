# CEAK Digital

Ecossistema digital do **Centro Espírita Allan Kardec — Penápolis/SP**: site público, CEAK App (PWA) e CEAK Gestão, com a mesma identidade visual e o mesmo backend.

> Especificação e protótipos: [`docs/design/README.md`](docs/design/README.md) e [`docs/design/PROMPT_DESENVOLVIMENTO.md`](docs/design/PROMPT_DESENVOLVIMENTO.md).

## Estrutura

```
apps/
  site/     Next.js 15 · site público            → http://localhost:3000
  app/      Next.js 15 · CEAK App (PWA)          → http://localhost:3001
  gestao/   Next.js 15 · CEAK Gestão (admin)     → http://localhost:3002
packages/
  ui/       tokens (Tailwind v4) e componentes compartilhados
  db/       Prisma 7, schema, migrações (com RLS), seed e acesso a dados
  core/     RBAC, auth, validação (Zod), auditoria, logs, adapters e config da instituição
  config/   tsconfig e ESLint compartilhados
e2e/        testes Playwright
supabase/   configuração do Supabase local
docs/design protótipos e especificação (referência)
```

## Pré-requisitos

- Node.js 22 e pnpm 10 (`corepack enable`)
- PostgreSQL 16+ — de duas formas:
  - **Supabase local** (recomendado): `npx supabase start` (exige Docker). Banco em `127.0.0.1:54322`.
  - **Postgres próprio**: qualquer instância local; ajuste `DATABASE_URL`.

## Primeiros passos

```bash
cp .env.example .env          # ajuste DATABASE_URL e AUTH_SECRET
pnpm install
pnpm db:deploy                # aplica as migrações (tabelas + RLS)
pnpm db:seed                  # dados fictícios dos protótipos
pnpm dev                      # sobe site, app e gestão
```

Entre no Gestão em http://localhost:3002 ou no App em http://localhost:3001 com qualquer usuário abaixo (senha `ceak-dev-2026`, ou o valor de `SEED_SENHA`):

| Perfil                                   | E-mail                                       |
| ---------------------------------------- | -------------------------------------------- |
| Administrador                            | antonio.ferreira@allankardecpenapolis.com.br |
| Diretoria                                | lucia.moraes@allankardecpenapolis.com.br     |
| Tesouraria                               | maria.silva@allankardecpenapolis.com.br      |
| Secretaria                               | paulo.mendes@allankardecpenapolis.com.br     |
| Coordenador                              | renata.campos@allankardecpenapolis.com.br    |
| Coordenador (coordenação de assistência) | sueli.andrade@allankardecpenapolis.com.br    |
| Instrutor                                | helena.prado@allankardecpenapolis.com.br     |
| Voluntário                               | victor.alves@email.com                       |
| Membro                                   | joao.rocha@email.com                         |
| Visitante                                | carla.nogueira@email.com                     |

A página **`/ui`** do Gestão mostra todos os componentes.

## Comandos

| Comando                                        | O que faz                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm dev`                                     | Sobe os três apps em modo de desenvolvimento                                              |
| `pnpm build`                                   | Build de produção de todos os apps                                                        |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | Qualidade de código                                                                       |
| `pnpm test`                                    | Testes unitários (Vitest). Os de `packages/db` usam o banco do `.env` (migrado e semeado) |
| `pnpm test:e2e`                                | Testes Playwright (exige `pnpm build` e banco semeado)                                    |
| `pnpm db:deploy`                               | Aplica as migrações                                                                       |
| `pnpm db:migrate`                              | Cria uma nova migração a partir do `schema.prisma` (desenvolvimento)                      |
| `pnpm db:seed`                                 | **Apaga** e recria os dados fictícios (bloqueado em produção)                             |

## Decisões técnicas

- **Tailwind CSS v4.** Os tokens ficam em `packages/ui/src/styles/theme.css` (bloco `@theme`), o equivalente v4 do `tailwind.config`.
- **Autenticação.** A sessão é um cookie httpOnly assinado (HS256), com expiração por inatividade de 30 minutos (renovação deslizante). A identidade vem de um `AuthProvider`:
  - `AUTH_PROVIDER=local`: senha (scrypt) e código por e-mail/WhatsApp guardados no banco, com envio pelos adapters mock. Roda sem nenhuma credencial.
  - `AUTH_PROVIDER=supabase`: Supabase Auth (GoTrue) via REST.
    Login tem bloqueio de 15 min após 5 tentativas falhas e nunca revela se o e-mail existe.
- **Autorização em três camadas.**
  1. O middleware do Gestão confere sessão e matriz perfil × módulo para cada rota (403 fora do perfil).
  2. As páginas repetem a verificação no servidor (`exigirModulo`).
  3. O banco aplica **RLS**: consultas sensíveis rodam em `comRls(contexto, fn)`, que troca para o papel `ceak_app` (sem `BYPASSRLS`) e define `app.perfil`, `app.pessoa_id` e `app.coord_assistencia`. As policies estão em `packages/db/prisma/migrations/*_rls`.
- **Dados sensíveis.**
  - O relato da assistência fica em `relato_assistencia`, legível só pela coordenação de assistência, pelo Administrador e pela Diretoria (decisão de 02/10/2026).
  - Senhas (`credencial`), códigos de acesso e segredos de integração ficam em tabelas sem nenhum acesso pelo papel `ceak_app`.
  - A auditoria é somente inserção: uma trigger impede alterações.
- **Adapters.** PIX (BR Code EMV válido + webhook HMAC), IA (RAG simples, sempre cita a fonte e encaminha questões pessoais ao atendimento fraterno), push, e-mail, WhatsApp e redes sociais têm versão mock em `packages/core/src/adapters`. Os provedores reais entram nas fases 4 e 5. Até lá, configurar um provedor diferente de `mock` gera erro explícito.
- **Ajustes de acessibilidade.** Para cumprir contraste ≥ 4,5:1, dois tons dos protótipos foram escurecidos levemente:
  - `muted-2`: de `#6B746C` para `#606861`.
  - Legenda dos placeholders: de `#7A7363` para `#6B6557`.

## Site público (Fase 1)

Rotas: `/`, `/o-ceak`, `/agenda` (filtro e mês por query string, `.ics` em `/agenda/[slug]/calendario.ics`), `/palestras` e `/palestras/[slug]`, `/lives`, `/estudos`, `/biblioteca`, `/blog` e `/blog/[slug]`, `/inscricao`, `/preciso-de-ajuda` e `/preciso-de-ajuda/[servico]` (5 etapas), `/quero-ajudar`, `/campanhas/[slug]`, `/doar` e `/doar/[id]`, `/loja` e `/loja/[produto]`, `/carrinho`, `/checkout`, `/pedido/[id]`, `/transparencia`, `/contato` e `/privacidade`.

- **Só conteúdo aprovado é público.** O blog lista apenas conteúdos `PUBLICADO`. A agenda omite atividades em rascunho, canceladas ou aguardando aprovação (por isso "Caridade sem distinção", que aguarda aprovação no seed, não aparece no site).
- **PIX.** A doação e o pedido criam a cobrança no `PaymentProvider` e mostram o QR Code real (gerado do BR Code) e o copia e cola. A confirmação chega pelo webhook `POST /api/pix/webhook` (assinatura em `x-ceak-assinatura`). Com o PSP simulado, o botão "Já fiz o PIX" dispara esse webhook, como o banco faria. O webhook é idempotente, confere o valor e, no pedido, baixa o estoque com movimentação, alerta de mínimo e auditoria.
- **Formulários.** Validação no servidor (Zod), consentimento LGPD obrigatório, campo-isca contra robôs e limite de envios por IP.
- **Assistência.** A vaga é reservada com bloqueio de linha (não há duas reservas para a última vaga). O relato fica na tabela restrita e a auditoria registra a solicitação sem o conteúdo do relato.
- **Doação mensal.** O controle "Tornar mensal" aparece desativado com o aviso "em breve" até o PIX Automático ser integrado.
- **SEO.** Metadata por página, `sitemap.xml`, `robots.txt`, imagem Open Graph e JSON-LD (`Organization`, `Event`, `BlogPosting`, `Product`). Lighthouse (perfil móvel) em produção: 93–99 em Performance e 100 em Acessibilidade, Boas práticas e SEO nas páginas principais.

## CEAK App (Fase 2)

PWA instalável em http://localhost:3001 (no desktop aparece na moldura de celular com o painel de atalhos; abaixo de 600px ocupa a tela inteira). Para ver a jornada completa do protótipo, entre como **Victor Alves** (`victor.alves@email.com`).

Rotas: `/entrar` (e-mail e senha), `/entrar/codigo` (código pelo WhatsApp), `/cadastro`, `/` (início), `/checkin`, `/jornada`, `/estudos`, `/estudos/[turma]` (abas Aulas, Materiais, Presença e Calendário), `/estudos/inscrever`, `/agenda` e `/agenda/[slug]` (tela "Palestra"), `/avaliacao/[slug]` (NPS), `/ia`, `/biblioteca`, `/notificacoes`, `/perfil`, `/perfil/dados`, `/perfil/contribuicoes`, `/lives`, `/quero-ajudar`, `/doar` e `/doar/[id]`, `/preciso-de-ajuda` e `/preciso-de-ajuda/[servico]`, `/loja` e `/offline`.

- **Sessão.** Cookie próprio (`ceak_app_sessao`), separado do Gestão, válido por 30 dias com renovação deslizante (`APP_SESSAO_DIAS`). O login tem o mesmo bloqueio do Gestão (5 tentativas → 15 min).
- **Código pelo WhatsApp.** Só é enviado se o número pertence a uma conta ativa, e a resposta é a mesma nos dois casos (não revela quem tem conta). Com os mocks, o código aparece no terminal do App.
- **Criar conta.** A conta nova entra como **Visitante**; a secretaria promove a Membro no Gestão. O cadastro reaproveita a pessoa que já se inscreveu ou pediu atendimento pelo site.
- **Check-in.** Pela câmera do App (BarcodeDetector nativo, com jsQR como alternativa no iPhone) ou pela câmera do celular, que abre `/checkin?evento=…&t=…`. O token é um HMAC do evento (`CHECKIN_SECRET`), então não dá para marcar presença em outro evento pela URL. "Confirmar presença" vale só para a atividade aberta de hoje (de 2 horas antes do início até o fim). A presença não duplica. Os QR Codes impressos serão gerados no Gestão (Fase 3).
- **Jornada.** Pessoal e sem ranking. As conquistas são concedidas automaticamente no check-in (Primeira visita, 5 encontros, Primeiro estudo, Primeiro voluntariado, Campanha solidária).
- **Avaliação (NPS).** Uma por pessoa e palestra (reenviar atualiza). A Home mostra a palestra com check-in dos últimos 14 dias ainda sem avaliação.
- **CEAK IA.** Responde só com base nos documentos oficiais (agenda, estudos, campanhas, orientações) e sempre mostra a "Fonte consultada". Perguntas pessoais são encaminhadas ao atendimento fraterno. A conversa não é gravada; o log registra só o evento, sem o texto.
- **Doação e assistência.** Mesmos fluxos do site, ligados à pessoa da sessão: a doação aparece em Minha jornada e em Minhas contribuições. No pedido de atendimento, o relato é opcional e, quando preenchido, exige um consentimento específico (fica na tabela restrita, legível pela coordenação da assistência e pela diretoria).
- **LGPD.** Em Perfil › Dados pessoais: corrigir nome e WhatsApp (com auditoria), baixar os próprios dados em JSON (`/api/meus-dados`, com auditoria) e pedir a exclusão (a secretaria conclui a anonimização no Gestão).
- **PWA.** Manifest com ícones 192/512/maskable (gerados do monograma "AK" até chegar o logo oficial), service worker (Serwist) e página `/offline`. O service worker guarda **só arquivos estáticos e a página offline**: telas da área do membro nunca ficam no cache do aparelho.
- **Push.** Web Push com VAPID. Com `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` definidos, o membro liga as notificações em Perfil e o envio usa o `web-push`. Sem as chaves, o controle aparece como "em breve" e os envios caem no mock.
- **Loja.** O App mostra a vitrine; o carrinho e o pagamento acontecem no site.
- **Testes.** `e2e/app` cobre a jornada 2 (Login → Home → Check-in → Estudo → Palestra → Avaliação), check-in por QR, login por código, cadastro, PWA (manifest, service worker e offline), acessibilidade (axe em todas as telas) e a moldura no desktop. Lighthouse (perfil móvel): 96–99 em Performance e 100 em Acessibilidade e Boas práticas.

## Dados institucionais pendentes

Endereço, CNPJ, telefones, chave PIX, diretoria, histórico/linha do tempo, programação semanal, logo e fotos estão centralizados em **[`packages/core/config/instituicao.ts`](packages/core/config/instituicao.ts)**, com os valores fictícios dos protótipos marcados como `PENDENTE`.

## Pendências de conteúdo e revisão

- O texto de `/privacidade` é uma base escrita a partir das regras do sistema e precisa de revisão jurídica da diretoria.
- Fotos reais (fachada, produtos, diretoria, blog) e o logo oficial: hoje são placeholders com a legenda do que deve entrar.

## Decisões pendentes de implementação

- **Seletor de perfil (Fase 3):** aparece só para quem tem duas ou mais funções e lista apenas os perfis que a pessoa realmente tem. Quem tem uma função só não vê o seletor.
