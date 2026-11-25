# CEAK Digital — Checklist de entrega e aceite

Atualizado em 25/11/2026. Repositório existente: `VictorHugoSimon/allankardecpenapolis`.

## Plataformas publicadas

- Site institucional: https://ceak-site-git-preview.vercel.app
- Aplicativo de membros (PWA): https://ceak-app-git-preview.vercel.app
- Gestão administrativa: https://ceak-gestao-git-preview.vercel.app/login

## Estado técnico verificado em 25/11/2026

- Referência de código: commit `5b1e62cd42299b5e1584311d027f4fdffffe246f`, branch `claude/new-session-n6t9kx`.
- GitHub Actions CI: execução [45638643471](https://github.com/VictorHugoSimon/allankardecpenapolis/actions/runs/45638643471) concluída com **success** nos três jobs (formatação, TypeScript independente e lint/testes/build com Playwright).
- Deployments Vercel do **site, aplicativo e painel**: `READY` para o mesmo commit.
- Neon: cron `cron.notificacoes.executado` com HTTP 200 nos dias 23, 24 e 25/11/2026. Nessas três execuções, fila vazia e nenhum envio realizado; isso **não** comprova entrega em aparelhos reais.
- O estado `READY` indica publicação técnica de prévia, não validação de dados oficiais, aceite humano ou promoção para domínio definitivo.
- Permanecem fora do escopo da entrega inicial: importação de usuários/extratos e ativação de contas bancárias, por decisão de implantação. A plataforma deve funcionar com listas vazias, rascunhos e cadastros novos.

## Matriz operacional de aceite — evidência ainda necessária

| Frente | Teste que a equipe deve executar | Evidência de aceite | Situação |
| --- | --- | --- | --- |
| Acesso e segurança | Entrar e sair com administrador e perfis restritos; criar usuário pelo painel; tentar acessar módulo sem permissão | Capturas de acesso permitido/negado; registro de auditoria | Aguardando homologação humana |
| Cadastros e LGPD | Cadastrar participante novo, revisar consentimento, alterar dados e solicitar exclusão com conta de teste autorizada | Fluxo concluído sem expor informações de outros usuários | Aguardando homologação humana |
| Agenda e check-in | Cadastrar evento, abrir agenda no PWA, fazer check-in com QR válido e testar token inválido | Evento e presença consistentes entre painel e PWA | Aguardando homologação humana |
| Estudos | Criar turma, matricular usuário de teste, abrir materiais, frequência e calendário inclusive sem próximas aulas | Dados coerentes entre instrutor, painel e PWA | Aguardando homologação humana |
| Conteúdo | Criar rascunho, revisar, aprovar e publicar item de teste | Publicação correta apenas após aprovação | Aguardando homologação humana |
| Voluntariado e assistência | Registrar solicitação ou escala de teste e validar visibilidade por perfil | Informações sensíveis restritas e ações auditáveis | Aguardando homologação humana |
| Loja e estoque | Criar produto, conferir vitrine, movimentar saldo e tentar finalizar checkout sem PIX real | Botão de pagamento desabilitado, sem pedidos pagos artificiais | Checkout validado por CI; operação física pendente |
| Financeiro e doações | Abrir relatórios vazios, registrar lançamento manual permitido e consultar categorias sem banco conectado | Nenhuma conciliação ou quitação presumida | Aguardando homologação humana |
| Comunicação | Criar e revisar rascunho, conferir público elegível, depois testar push somente com contas consentidas | Caixa interna, vínculo de aparelhos e aceites/falhas conferidos | Testes automatizados aprovados; aparelhos reais pendentes |
| BI, logs e automações | Conferir indicadores reais/zero, auditoria, execução diária e rascunhos de automação | Sem métricas fictícias nem publicação automática não aprovada | Cron ativo; aceite funcional pendente |
| Instalação mobile | Instalar pelo Android Chrome e por Adicionar à Tela de Início no iPhone, verificar login e notificações com app fechado | Capturas e registro de versão/dispositivo, sem endpoints ou chaves | Pendente em aparelhos físicos |

**Regra de evidência:** um módulo só muda para `Homologado` após teste por pessoa autorizada, registro de resultado, data e aceite da instituição. CI aprovada, página `READY` e funcionalidade codificada não equivalem a aceite operacional.

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
| Comunicação      | Rascunhos, avisos na caixa interna do PWA com consentimento          | Web Push configurado; envio real ainda exige teste com aparelhos consentidos; e-mail/WhatsApp dependem de integração |
| BI               | Indicadores e relatório operacional mensal real                      | Evolução exige histórico real                                         |
| Logs             | Consulta de eventos de aplicação                                     | Definir rotina de monitoramento                                       |
| Integrações      | Consulta dos conectores e saúde                                      | Chaves e serviços externos ainda não configurados                     |
| CEAK IA          | Painel de contexto e indicadores reais                               | Respostas de IA generativa requerem provedor; não simular             |
| Automações       | Regras cadastradas desativadas                                       | Cron diário executa diagnósticos e prepara rascunhos; ações externas exigem conectores e aprovação          |

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
