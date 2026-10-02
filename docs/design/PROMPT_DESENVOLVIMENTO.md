# PROMPT — Desenvolvimento da plataforma CEAK Digital

Você vai desenvolver o **CEAK Digital**, o ecossistema digital do **Centro Espírita Allan Kardec de Penápolis – SP**. Nesta pasta estão:

- `README.md`: especificação completa (telas, tokens de design, regras de negócio, perfis, modelo de dados). **Leia antes de tudo.**
- `offline/*.html`: protótipos navegáveis de alta fidelidade. Abra no navegador e navegue por todas as telas antes de codificar.
- `prototipos/*.dc.html`: fonte dos protótipos. Cada arquivo tem os textos, dados fictícios e estados de cada tela na classe `Component`.

Os protótipos são **referência visual e de comportamento**, não código para copiar. Recrie tudo em código de produção, com fidelidade visual (cores, tipografia, espaçamentos, textos).

---

## 1. Objetivo
Entregar três aplicações com a mesma identidade visual e o mesmo backend:

1. **Site público** (`allankardecpenapolis.com.br`)
2. **CEAK App**: PWA instalável, mobile-first, área do membro
3. **CEAK Gestão**: SaaS administrativo com Command Center

Princípio: *aproximar, acolher, informar, ensinar, envolver, permitir ajudar e facilitar ser ajudado.* Interface simples, acolhedora e acessível para pessoas de todas as idades.

## 2. Stack obrigatória
- **Monorepo** com Turborepo e pnpm:
  - `apps/site`: Next.js 15 (App Router)
  - `apps/app`: Next.js 15 + PWA (Serwist)
  - `apps/gestao`: Next.js 15
  - `packages/ui`: componentes e tokens compartilhados
  - `packages/db`: Prisma e schema
  - `packages/core`: regras de negócio, validações (Zod) e tipos
- **TypeScript estrito**, **Tailwind CSS** com os tokens do README no `tailwind.config` (cores, fontes Newsreader, Instrument Sans e JetBrains Mono, raios).
- **Banco:** PostgreSQL (Supabase) com Prisma. **Auth:** Supabase Auth (e-mail/senha e código por WhatsApp/e-mail).
- **Autorização:** RBAC por perfil (Administrador, Diretoria, Tesouraria, Secretaria, Coordenador, Instrutor, Voluntário, Membro, Visitante), verificado no servidor e no banco (RLS).
- **Jobs e automações:** Inngest (ou BullMQ + Redis) para o *CEAK Automation Engine*.
- **PIX:** integração com PSP via adapter (`PaymentProvider`), começando por Mercado Pago ou Efí, com webhook de confirmação.
- **IA:** adapter `AIProvider` (Claude/OpenAI) com RAG sobre agenda, regulamentos e comunicados. Toda resposta cita a fonte.
- **Push:** Web Push (VAPID). **E-mail:** Resend.
- **Integrações:** Meta Graph API (Facebook/Instagram), Google Business Profile, YouTube. Comece com adapters *mock* e deixe as reais configuráveis por variáveis de ambiente.
- **Qualidade:** ESLint, Prettier, Vitest (unitários), Playwright (jornadas), GitHub Actions (lint, test, build).

## 3. Regras inegociáveis
1. **Aprovação humana:** nenhum conteúdo gerado por IA ou robô é publicado sem aprovação. Fluxo: `CAPTURADO → PROCESSANDO → RASCUNHO_IA → REVISAO → APROVADO → AGENDADO → PUBLICADO | ERRO`.
2. **Auditoria:** toda alteração em financeiro, perfis, aprovações e assistência grava `Auditoria` (usuário, ação, entidade, valor anterior, valor novo, IP, data).
3. **Logs estruturados:** categoria (Aplicação, Segurança, Auditoria, Financeiro, IA, Automação, Integrações, Notificações), nível, rota, usuário, status e latência.
4. **Assistência espiritual:** dados sensíveis visíveis só para a coordenação de assistência. Exiba sempre o aviso: *"O atendimento espiritual não substitui acompanhamento médico ou psicológico quando necessário."*
5. **Minha jornada** é pessoal: sem ranking público.
6. **LGPD:** consentimento no cadastro, exportação e exclusão de dados do titular, retenção de logs configurável.
7. **Acessibilidade:** WCAG 2.1 AA, contraste mínimo de 4.5:1, alvos de toque de 44px ou mais, navegação por teclado, fontes legíveis (corpo de 15px ou mais).
8. **Responsivo:** todas as telas em desktop, tablet e celular. O App prioriza o mobile e o Gestão o desktop, mas continua usável no celular (sidebar vira gaveta).
9. **Português do Brasil**, tom institucional e formal. Use os textos dos protótipos literalmente.

## 4. Fases de entrega
Trabalhe **fase por fase**. Ao fim de cada fase: rode lint, testes e build, faça um resumo do que foi feito e **pare para eu validar** antes de seguir.

**Fase 0 — Fundação**
- Monorepo, CI, `packages/ui` com tokens e componentes (Button, Chip, Card, Pill de status, KPI, Table, Tabs, Input, Select, Textarea, Toggle, Stepper, ProgressBar, SuccessMark animado, Toast, EmptyState, ImagePlaceholder).
- Uma página `/ui` no Gestão mostrando todos os componentes.
- Schema Prisma completo (entidades do README), seed com os dados fictícios dos protótipos, auth e RBAC.

**Fase 1 — Site público**
- Todas as rotas listadas no README (home, o-ceak, agenda, palestras, lives, estudos, biblioteca, blog, preciso-de-ajuda com o fluxo de 5 etapas, quero-ajudar, campanhas, doar com PIX, loja, carrinho, checkout, pedido, transparência, contato).
- SEO (metadata, sitemap, Open Graph, schema.org `Organization` e `Event`).

**Fase 2 — CEAK App (PWA)**
- Login, home, check-in por QR (câmera) e confirmação manual, minha jornada com conquistas, estudos e curso (aulas, materiais, presença, calendário), palestra, avaliação NPS, CEAK IA, agenda, biblioteca, notificações, perfil, lives, doação, assistência e loja.
- Manifest, ícones, modo offline básico e push.

**Fase 3 — CEAK Gestão (núcleo)**
- Login, Command Center, Pessoas e Perfil 360°, Agenda, Eventos, Estudos, Aprovações, Conteúdo e Editor (abas por canal), Financeiro (Dashboard, Contas a pagar e Contas a receber), Configurações (instituição, matriz de perfis, usuários, segurança e LGPD).
- O seletor de perfil muda os menus conforme a matriz do README.

**Fase 4 — Gestão (operação)**
- Doações, Loja, Estoque (baixa automática por pedido pago, alerta de mínimo), Voluntariado (áreas, habilidades, escalas), Assistência, Comunicação (Push, E-mail, WhatsApp com aprovação).
- Financeiro completo: Fluxo de caixa, Categorias, Centros de custo, Conciliação e Relatórios em PDF/XLSX.

**Fase 5 — Inteligência e automação**
- Automation Engine com as automações do protótipo e o **fluxo completo da palestra** (criada → IA gera descrição → social → humano aprova → agendamento → push → check-in → gravação → NPS → IA resume → artigo e post → humano aprova → publicação).
- CEAK IA administrativa (copiloto com consultas aos dados e rascunhos enviados à aprovação), BI (11 painéis), Logs Center, Auditoria, Saúde do sistema e Integrações (status Conectado, Atenção ou Erro, com reconexão).

## 5. Critérios de aceite
Escreva testes Playwright para as 6 jornadas:
1. **Visitante:** Home → Agenda → Palestra → Inscrição → convite ao App.
2. **Membro:** Login → Home App → Check-in → Estudo → Palestra → Avaliação.
3. **Ajuda:** Home → Preciso de ajuda → Tratamento espiritual → Solicitar → Confirmar.
4. **Doação:** Home → Quero ajudar → Doação → PIX → Confirmação (webhook simulado).
5. **Loja:** Loja → Produto → Carrinho → Checkout → PIX → Pedido (estoque baixado).
6. **Administrativa:** Login → Command Center → Conteúdo pendente → Revisar → Aprovar → Publicação (com auditoria registrada).

Além disso:
- Lighthouse de 90 ou mais em Performance, Acessibilidade e SEO no site.
- PWA instalável.
- Nenhuma rota do Gestão acessível sem o perfil correto (teste de autorização).

## 6. Forma de trabalhar
- Antes de codificar, leia o README, abra os protótipos e apresente um **plano técnico curto**: estrutura de pastas, schema resumido e riscos. Aguarde minha aprovação.
- Commits pequenos e descritivos. Inclua um `README` de setup com `.env.example` e os comandos `pnpm dev`, `pnpm test` e `pnpm db:seed`.
- Integrações externas (PIX, Meta, Google, IA, WhatsApp) atrás de adapters com versão *mock*. O sistema precisa rodar 100% localmente sem credenciais.
- Quando algo não estiver definido no README ou nos protótipos, **pergunte** em vez de inventar.
- Dados reais pendentes (endereço, CNPJ, chave PIX, diretoria, histórico, logo e fotos) ficam centralizados em `packages/core/config/instituicao.ts` para eu preencher.

Comece pela leitura dos arquivos e pelo plano técnico da Fase 0.
