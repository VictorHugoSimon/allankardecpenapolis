# CEAK Digital — Runtime validado em 2026-11-02

Este arquivo registra o estado efetivamente validado em execução na Vercel e no Neon. Ele existe para impedir regressão acidental para versões antigas do monorepo enquanto o código é consolidado.

## Arquitetura oficial

- Banco: Neon PostgreSQL, projeto `wandering-voice-86216041`, banco `ceak`, branch principal `br-dry-heart-b615yh3f`.
- Autenticação: Neon Managed Auth / Better Auth.
- Framework em execução: Next.js 16.4.3.
- Região das funções principais: `gru1`.
- Segredos ficam somente nos ambientes da Vercel; não devem ser versionados.

## Site Público

URL estável: `https://ceak-site-preview.vercel.app`

Estado validado:
- leitura pública server-side no Neon;
- Agenda exibindo apenas eventos públicos futuros;
- Estudos, Conteúdo/Blog, Loja, Carrinho, Ajuda, Lives, Biblioteca e Inscrição;
- carrinho no navegador e handoff de checkout para o CEAK App;
- sem exposição de credencial privilegiada no cliente.

## CEAK App / PWA

URL estável: `https://ceak-app-preview-vi-ctor-hugo.vercel.app`

Deployment validado em 2026-11-02: `dpl_BUoXexeSLFh9T8RoBm9aD73KY8aa`.

Estado validado:
- autenticação PT-BR;
- onboarding seguro contra duplicidade de e-mail;
- Agenda, evento, inscrição, check-in, NPS e Minha Jornada;
- Estudos, Biblioteca, Lives, Ajuda, Doações, Loja e Serviços;
- PWA com manifesto e fallback offline mínimo;
- checkout autenticado com validação server-side de produto, preço, estoque e quantidade;
- criação transacional de `orders` + `order_items`;
- página `/pedidos` para o participante acompanhar seus próprios pedidos;
- `/checkout` e `/pedidos` redirecionam visitantes para login;
- nenhuma cobrança é executada automaticamente no momento da criação do pedido.

## CEAK Gestão

URLs estáveis:
- `https://ceak-gestao-preview.vercel.app`
- `https://ceak-gestao-preview-vi-ctor-hugo.vercel.app`

Deployment validado em 2026-11-02: `dpl_4VAAGrxUN3WnbSgFGpvUaLm7hTL7`.

Estado validado:
- Command Center;
- Agenda/Eventos;
- Pessoas / Perfil 360;
- Estudos;
- Conteúdo com aprovação humana;
- Comunicação;
- Voluntariado;
- Financeiro;
- Doações;
- Atendimento Espiritual;
- Loja/Estoque;
- BI inicial;
- Permissões;
- Pedidos com lista e detalhe.

Fluxo operacional de pedido:
- Admin, Tesouraria e Secretaria podem operar pedidos;
- Diretoria é somente leitura;
- confirmação de pagamento valida estoque de todos os itens;
- pagamento confirmado atualiza o pedido, baixa estoque, cria `inventory_movements`, cria receita em `financial_entries` com categoria/centro de custo Loja e registra auditoria;
- estorno é permitido para Admin/Tesouraria, devolve estoque, registra movimento de entrada, cancela o lançamento financeiro relacionado e grava auditoria;
- cancelamento direto de pedido já pago é bloqueado, exigindo estorno primeiro.

## Schema comercial em produção

Tabelas principais:
- `products`
- `inventory_movements`
- `orders`
- `order_items`
- `financial_entries`
- `finance_categories`
- `cost_centers`
- `audit_logs`

`orders` e `order_items` estão com RLS ativo. O participante só acessa os próprios pedidos; equipe autorizada tem leitura/operação conforme papel.

## Estado de dados ao encerrar esta validação

No momento da conferência de 2026-11-02:
- pedidos reais: 0;
- lançamentos financeiros com `source='store_order'`: 0;
- movimentos de estoque vinculados a pedido: 0.

Nenhum pedido fictício foi deixado no banco principal durante a homologação.

## Regra para sincronização do monorepo

O código do monorepo ainda contém trechos de uma arquitetura anterior (incluindo Next 15 e autenticação local/Supabase em partes do Gestão). Não substituir os deployments validados por essa linha antiga.

A consolidação deve preservar como referência:
1. Next.js 16.4.3;
2. Neon Managed Auth;
3. RBAC baseado em `public.user_accounts`, `public.user_roles` e `public.roles` no runtime administrativo atual;
4. RLS já existente no Neon;
5. fluxo de conteúdo com aprovação humana;
6. fluxo comercial transacional descrito acima;
7. ausência de segredos no Git.
