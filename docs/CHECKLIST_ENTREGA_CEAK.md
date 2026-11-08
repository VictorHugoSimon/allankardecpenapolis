# CEAK Digital — Checklist de entrega e aceite

Atualizado em 08/11/2026. Repositório existente: `VictorHugoSimon/allankardecpenapolis`.

## Plataformas publicadas

- Site institucional: https://ceak-site-git-preview.vercel.app
- Aplicativo de membros (PWA): https://ceak-app-git-preview.vercel.app
- Gestão administrativa: https://ceak-gestao-git-preview.vercel.app/login

## Módulos por estado

| Área             | Fluxo funcional disponível                                           | Dependência ou limite                                                 |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Administração    | Login, perfis, usuários convidados, auditoria e 2FA                  | Validar acessos por todos os perfis reais                             |
| Agenda e eventos | Cadastro, agenda, presenças, check-in e atividades                   | Importação e cadastros reais podem ocorrer depois                     |
| Estudos          | Turmas, matrículas, presenças e gestão de aulas                      | Validar com instrutores reais                                         |
| Pessoas          | Cadastros e gerenciamento de informações                             | Consentimentos LGPD e manutenção de dados                             |
| Conteúdo         | Editor, revisão e aprovações                                         | Publicação automática externa requer integração                       |
| Financeiro       | Contas e categorias, fluxo de caixa e conciliação manual             | Contas bancárias e extratos reais pendentes                           |
| Doações          | Recebimento presencial (dinheiro ou itens), campanhas e metas        | PIX recorrente e doações on-line dependem de provedor real            |
| Loja             | Produtos, rascunhos, publicação, pedidos e retirada de pedidos pagos | Checkout/pagamento externo indisponível sem provedor                  |
| Estoque          | Cadastro, saldo, movimentação, mínimo e alertas                      | Homologar operação física com equipe                                  |
| Voluntariado     | Áreas, cadastro de voluntários e escalas                             | Dados de voluntários a cadastrar                                      |
| Assistência      | Solicitações, gestão e acompanhamento                                | Restrições de privacidade devem ser homologadas                       |
| Comunicação      | Rascunhos, avisos na caixa interna do PWA com consentimento          | E-mail, WhatsApp e push do navegador requerem provedores/configuração |
| BI               | Indicadores e relatório operacional mensal real                      | Evolução exige histórico real                                         |
| Logs             | Consulta de eventos de aplicação                                     | Definir rotina de monitoramento                                       |
| Integrações      | Consulta dos conectores e saúde                                      | Chaves e serviços externos ainda não configurados                     |
| CEAK IA          | Painel de contexto e indicadores reais                               | Respostas de IA generativa requerem provedor; não simular             |
| Automações       | Regras cadastradas desativadas                                       | Motor de execução e conectores externos ainda não concluídos          |

## Restrições de segurança deliberadas

1. Não gerar PIX falso, simular quitação, ou marcar um pedido como pago sem confirmação de provedor autorizado.
2. A baixa de retirada só é aceita para pedidos com pagamento `PAGO` e situação `AGUARDANDO_RETIRADA`.
3. Avisos internos são destinados somente a contas ativas com consentimento e não se confundem com push, e-mail ou WhatsApp.
4. Novos produtos, campanhas e automações podem iniciar sem dados de exemplo, em rascunho ou desativados.
5. Perfis, transações e operações administrativas usam RLS e trilha de auditoria.
6. Segredos de banco e de provedores devem permanecer em variáveis de ambiente privadas, nunca no GitHub.

## Critérios para considerar a plataforma completamente entregue

- [ ] Aprovação funcional de cada módulo pela equipe do CEAK com usuários de perfis diferentes
- [ ] Cadastro/validação de conteúdo institucional e pessoas reais
- [ ] Configuração de provedor de pagamentos e teste de PIX com transação real de valor mínimo
- [ ] Configuração de e-mail transacional e validação de entrega
- [ ] Configuração de WhatsApp, se desejado, e aprovação do remetente e modelos de mensagem
- [ ] Configuração de provedor de IA com controles de dados, limites e custos
- [ ] Configuração e teste de push, se desejado, em Android e iOS
- [ ] Teste end-to-end de compra, pagamento, reserva/baixa de estoque, retirada e estorno
- [ ] Homologação da execução de automações, com aprovação humana para ações públicas
- [ ] Revisão LGPD, backups, monitoramento e plano de recuperação
- [ ] Homologação mobile/PWA e validação de acesso em produção

**Estado geral:** plataforma publicada com módulos internos em funcionamento e dependências externas identificadas. Não considerar "entrega integral" até os itens de aceite pendentes estarem homologados.
