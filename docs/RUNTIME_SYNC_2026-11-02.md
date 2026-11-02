# CEAK Digital — Runtime Sync — 2026-11-02

Este registro documenta o estado funcional validado em preview antes da incorporação definitiva ao monorepo.

## Ambientes validados

### Site público
- Alias estável: `https://ceak-site-preview.vercel.app`
- Projeto Vercel: `ceak-site-preview`
- Versão funcional: v0.3
- Recursos validados: Home, Agenda, Estudos, Palestras, Blog, Lives, Biblioteca, Inscrição, Ajuda, Doações, Loja, produto, carrinho, checkout de handoff, sitemap, robots e menu mobile.
- Carrinho usa `localStorage` apenas para experiência do navegador; preço, estoque e identidade não são confiados ao cliente na finalização.

### CEAK App / PWA
- Alias estável: `https://ceak-app-preview-vi-ctor-hugo.vercel.app`
- Projeto Vercel: `ceak-app-preview`
- Versão funcional: v0.4
- Next.js: 16.4.3
- Recursos validados: autenticação PT-BR, Agenda, inscrição, check-in, NPS, Minha Jornada, Estudos, Biblioteca, Lives, Ajuda, Doações, Loja, Serviços, manifesto PWA, service worker mínimo e tela offline.
- `/checkout` protegido por autenticação no middleware e novamente no servidor.
- Service worker não armazena dados pessoais; somente a experiência offline mínima.

## Segurança do checkout

A finalização no App:
1. exige sessão autenticada;
2. resolve `user_account` pelo `auth_subject`;
3. valida UUID e quantidade;
4. consulta novamente produto, preço, status e estoque no servidor;
5. não confia no preço enviado pelo navegador;
6. não captura pagamento;
7. registra auditoria quando o pedido é criado.

Enquanto as tabelas de pedido não estiverem presentes no banco principal, o checkout deve permanecer em homologação e informar que nenhuma cobrança foi realizada.

## Migração Neon preparada e testada

Migração preparada em branch temporária para:
- `orders`
- `order_items`
- `payments`

Validação na branch temporária:
- 3 tabelas
- RLS habilitado nas 3
- 9 policies
- comprador opera somente o próprio carrinho/pedido pré-pagamento
- pagamento não pode ser marcado como pago pelo comprador

A promoção automática para o branch principal foi bloqueada pela camada de segurança da ferramenta. Não contornar com SQL direto. O estado atual de produção não deve ser descrito como contendo essas tabelas até a promoção oficial ser concluída.

## Onboarding endurecido

O runtime v0.4 inclui fluxo que:
- procura conta existente pelo `auth_subject`;
- procura conta existente pelo e-mail antes de criar outra;
- reutiliza `people` existente por e-mail quando seguro;
- bloqueia tentativa de vincular cadastro já associado a outra identidade;
- atribui `participant` de forma idempotente;
- grava auditoria de conclusão do onboarding.

## Pendências institucionais

Não publicar valores inventados. Ainda dependem de confirmação institucional:
- endereço completo;
- CNPJ;
- telefone;
- chave PIX oficial;
- diretoria;
- história/linha do tempo;
- programação oficial;
- logo final.

## Próxima incorporação no monorepo

Prioridade:
1. alinhar `apps/app` com Next.js 16.4.x e compatibilidade do Auth;
2. incorporar o onboarding seguro na arquitetura existente do monorepo;
3. incorporar checkout/pedidos usando os pacotes compartilhados de `core/db/ui`;
4. integrar administração de pedidos no `apps/gestao`;
5. conectar Vercel ao GitHub após build/testes do monorepo;
6. promover domínio oficial somente após homologação institucional.

Nenhum segredo, `DATABASE_URL`, cookie secret ou credencial deve ser versionado.
