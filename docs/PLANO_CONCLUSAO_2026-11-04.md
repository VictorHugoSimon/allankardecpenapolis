## Decisão de escopo — 04/11/2026

A implantação deve começar **sem dados financeiros fictícios**. Cadastro de contas bancárias, importação bancária persistente e conciliação bancária operacional ficam **adiados** até nova orientação.

- Não executar `db:seed` no ambiente real; o seed existente é destinado exclusivamente a desenvolvimento e apaga/recria dados.
- O painel financeiro deve exibir estado vazio quando não houver movimentações.
- Se não houver categorias financeiras, o formulário de lançamento deve orientar a configuração sem inventar categorias.
- A prévia de importação bancária foi retirada da navegação operacional; o código permanece preservado para retomada futura.
- Prioridade de entrega muda para ativação inicial sem dados e demais módulos administrativos não dependentes de bancos.

# CEAK Digital — Plano de conclusão (04/11/2026)

## Base auditada
- Repositório: `VictorHugoSimon/allankardecpenapolis`.
- Fases 1–3: rotas do site, PWA e gestão documentadas no README; não considerar homologadas apenas pela presença das rotas.
- O PWA possui `manifest.ts`, `public/sw.js` e testes Playwright; segurança de cache privado e instalação real no celular precisam de regressão em produção.
- Dados reais institucionais ainda estão pendentes em `packages/core/config/instituicao.ts`.
- PSP, mensageria, IA e canais sociais ainda devem ser considerados **mock** até habilitar e validar credenciais em ambiente seguro.

## Entrega incremental desta branch
1. Service Worker: falha temporária de download de `/offline` não impede instalação/ativação.
2. Links de notificações: proibir caminhos que saiam da origem do app, inclusive barras invertidas interpretadas como URLs externas.
3. Testes unitários do Service Worker sem dependência de navegador.
4. Preservar a regra de não persistir páginas autenticadas ou APIs no cache.

## Fase 4 — Gestão operacional (próxima implementação)
| Prioridade | Domínio | Entrega de aceite |
| --- | --- | --- |
| P0 | Doações e cobrança | Transações, conciliação com webhook autenticado, idempotência, estorno e extrato por competência |
| P0 | Loja e estoque | Pedidos, baixas apenas após pagamento confirmado, devolução de estoque em cancelamento e alerta de mínimo |
| P0 | Financeiro | Fluxo de caixa, categorias, centros de custo, conciliação bancária e exportação PDF/XLSX |
| P1 | Assistência | Agenda, capacidade, sigilo, controle estrito por perfil e trilha de auditoria sem expor relatos |
| P1 | Voluntariado | Competências, disponibilidade, escalas, convites e confirmação |
| P1 | Comunicação | Templates aprováveis e envio por e-mail/WhatsApp/push com opt-in e histórico |

## Fase 5 — Automação e inteligência
1. Jobs duráveis, reentrantes e idempotentes com retries, fila de erros e observabilidade.
2. Automação de palestra: criação → rascunho IA → aprovação humana → programação → comunicação → check-in → NPS → resumo → nova revisão → publicação.
3. Assistente administrativo de consulta com permissões RLS, fontes citadas e sem publicação automática.
4. Indicadores e 11 painéis previstos, com filtros por período e dados reais.
5. Central de logs, auditoria, saúde dos sistemas e status/reconexão das integrações.

## Dependências para produção
- Dados oficiais (CNPJ, endereço, contatos, diretoria, programação, imagens e chave PIX): obter da instituição, não usar placeholders em publicação.
- Credenciais PSP, VAPID e mensageria via secrets: nunca registrar em código/commits.
- Revisão jurídica de política de privacidade e fluxos de assistência.
- Homologar em Android Chrome, Samsung Internet e iOS Safari, inclusive deep links, modo instalado, atualização e offline.
- Executar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` com banco de testes isolado antes de mesclar.
- Não executar `pnpm db:seed` em produção.

## Critério de conclusão
Uma tarefa só será marcada como concluída quando código, teste automatizado, revisão de autorização/auditoria e validação do deploy real estiverem comprovados. Um commit isolado não é prova de funcionamento em produção.
