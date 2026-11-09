# CEAK Digital — Motor de automações: primeira etapa

## Entrega implementada
A rota existente `/automacoes` no painel CEAK Gestão inclui:
- Cadastro de **diagnóstico manual de estoque** com gatilho `MANUAL` e ação `DIAGNOSTICO_ESTOQUE`.
- Regra cadastrada como **desativada** e marcada para aprovação, preservando a configuração segura.
- Botão **Habilitar regra manual**, acompanhado de confirmação obrigatória do administrador. A habilitação/desativação ocorre na mesma transação da auditoria.
- Somente gatilho `MANUAL` com ação `DIAGNOSTICO_ESTOQUE` e `exigeAprovacao=true` pode ser habilitado. Regras desconhecidas permanecem bloqueadas.
- Botão **Executar diagnóstico** disponível apenas após habilitar a regra. O clique é a autorização explícita para uma operação **somente de leitura**.
- Varredura de até 5.000 itens cadastrados e detecção de saldo inferior ao mínimo configurado.
- Gravação de `Execucao` com status, duração e resumo, sem chamar qualquer provedor externo.
- Auditoria da ação vinculada à automação e histórico das últimas 20 execuções no painel.

## Limitações deliberadas
- Não executa textos livres inseridos nos campos gatilho/ação.
- Não liga automaticamente regras ou publica conteúdos.
- Não envia e-mail, WhatsApp, notificações push ou mensagens em redes sociais.
- Não altera estoque, pedidos, pagamentos ou doações.
- Ainda não é um motor de tarefas recorrentes. O agendador e novos tipos de gatilho exigem desenvolvimento e homologação separados.
- Para mais de 5.000 itens, aborta a execução sem gravar diagnóstico parcial. Implementar paginação antes de elevar o limite.

## Teste de aceite
1. Entrar em `/automacoes` com perfil **ADMINISTRADOR**.
2. Criar regra com um nome e opções `MANUAL` / `DIAGNOSTICO_ESTOQUE`.
3. Confirmar que ela aparece **DESATIVADA**; verificar que não há botão para executar a regra desativada.
4. Marcar a confirmação e clicar em **Habilitar regra manual**; conferir status **HABILITADA MANUAL** e evento de auditoria.
5. Selecionar **Executar diagnóstico**; conferir nova linha no **Histórico de execuções** com quantidade de itens analisados e abaixo do mínimo.
6. Confirmar que nenhuma movimentação de estoque, notificação externa ou pagamento foi criado.
7. Confirmar auditoria com a ação `automacao.diagnostico_estoque.executado`.
8. Verificar que usuários sem permissão de administrador não podem executar a ação.
9. Desativar a regra, conferir auditoria e verificar que a execução fica indisponível.
10. Regra livre/legada com gatilho ou ação diferente deve ser rejeitada pelo executor.

## Próximos componentes de desenvolvimento
1. Catálogo tipado de gatilhos e ações, com regras versionadas.
2. Ativação/desativação manual com confirmação e trilha de auditoria: implementada para diagnóstico homologado. Aprovação multietapa segue pendente.
3. Agendamento persistente, worker, controle de concorrência e retentativas.
4. Eventos do domínio: publicação de palestra, matrícula, check-in e campanhas.
5. Ações com efeito externo somente com conectores autorizados, autorização humana e controles anti-duplicidade.

Status: **implementado no código, homologação operacional ainda pendente**.


## Diagnóstico diário automático (etapa 2)
- Gatilho novo `DIARIO` com ação fixa `DIAGNOSTICO_ESTOQUE`; começa **desativado**.
- Administrador marca a confirmação explícita e habilita a regra no painel.
- O cron nativo já existente `GET /api/cron/notificacoes`, programado para **09:00 UTC** (06:00 em Brasília, enquanto UTC-3), processa as regras habilitadas.
- O worker só lê o estoque e grava `Execucao`; nunca envia mensagens, altera saldos nem acessa provedores de pagamento.
- Trava transacional PostgreSQL + procura de execução agendada na data UTC impedem dois cron jobs simultâneos de gerar duplicação funcional.
- Limite inicial por segurança: **10 regras por execução diária**, com limite transacional de 5 segundos por regra. A execução do cron reserva 45 segundos para os lotes push e a parcela restante para o diagnóstico.
- Uma automação desativada, desconhecida, de ação diferente ou sem aprovação nunca é executada pelo worker. O histórico distingue execuções `MANUAL` e `AGENDADO` por `entrada.modo`.
- Não existe reprocessamento automático de falhas do diagnóstico nesta etapa; erros são contabilizados na resposta protegida do cron e exigem supervisão.

### Critérios de aceite adicionais
1. Cadastrar regra `DIARIO` + `DIAGNOSTICO_ESTOQUE`, confirmar que inicia desativada.
2. Habilitar pelo painel com checkbox de confirmação e confirmar trilha de auditoria.
3. Executar a rota protegida em ambiente de homologação com o cron autorizado.
4. Confirmar nova execução com `entrada.modo=AGENDADO`, `somenteLeitura=true`.
5. Executar duas vezes no mesmo dia UTC e confirmar que a segunda execução é ignorada.
6. Desativar a regra e confirmar que o cron não cria novas execuções.
7. Confirmar que nenhuma alteração de saldo, transação financeira ou comunicação foi criada.
8. Conferir os eventos de deploy e logs da Vercel; não declarar homologação sem testar esta sequência.


## Lembretes de palestras e estudos — preparação de rascunhos
- Novo gatilho `DIARIO` com ação `RASCUNHO_LEMBRETE_EVENTO`, criado **desativado**.
- Somente administrador pode habilitar a regra, mediante confirmação e auditoria. O cron já existente a executa após os diagnósticos.
- Busca **palestras e estudos públicos confirmados**, com início nas próximas **48 horas**, no máximo **20 eventos** por regra/dia.
- Cria `Comunicacao` com canal `APP`, status `RASCUNHO`, link para `/agenda/{slug}` e referência ao evento no filtro. Não notifica nem envia push, e-mail ou WhatsApp.
- A chave `chaveLembrete` identifica regra+evento e é verificada antes de criar rascunhos. A transação possui advisory lock, e o histórico `Execucao` evita executar a mesma regra duas vezes no dia UTC.
- Os rascunhos ficam na central de notificações para revisão **humana**. Apenas a ação existente de publicação envia avisos, aplicando consentimento e segmentação. Não usar disparo geral para testes.
- Uma alteração posterior na agenda não edita automaticamente rascunhos já criados. O administrador deve revisar o conteúdo imediatamente antes de publicar.

### Aceite do gatilho de eventos
1. Sem regra ativa: cron não deve gerar rascunhos.
2. Com regra ativa e agenda vazia: registra execução com zero eventos.
3. Com evento CONFIRMADO e público nas próximas 48 h: gera um rascunho APP com link correto.
4. Evento em RASCUNHO, CANCELADO ou privado: nenhum rascunho.
5. Duas execuções no mesmo dia: nenhum rascunho duplicado.
6. Dia seguinte: evento já preparado não deve gerar novo rascunho.
7. Ao desativar regra: novos rascunhos deixam de ser preparados.
8. Validar que a quantidade de notificações enviadas permanece inalterada até a publicação manual.


## Lembretes de aulas para alunos matriculados
- Nova regra `DIARIO` + `RASCUNHO_LEMBRETE_AULA`, sempre criada desativada.
- A execução diária identifica aulas nas próximas 48 horas, de turmas ativas e cursos ativos que tenham matrículas ativas.
- Cria um rascunho no canal APP com `segmento=MATRICULADOS_TURMA`, `turmaId` e `aulaId`. Não inclui dados pessoais nos rascunhos.
- Ao publicar, o servidor confirma que a aula ainda não ocorreu, turma/curso continuam ativos e busca somente matrículas ativas daquela turma.
- Os destinatários finais ainda precisam ter conta ativa, consentimento registrado e não ter solicitado exclusão. Nenhum disparo é feito para alunos de outras turmas.
- A publicação e a criação da caixa interna / fila de push acontecem dentro da mesma transação.
- O botão administrativo informa explicitamente que a publicação será **somente para matriculados da turma**.
- A execução é protegida por trava PostgreSQL, histórico diário e deduplicação por regra/aula.
- O envio automático de mensagens permanece desabilitado; apenas o rascunho é preparado automaticamente.

### Homologação obrigatória da segmentação
1. Cadastrar uma turma ativa com curso ativo, aula futura e duas matrículas ativas em ambiente de teste.
2. Cadastrar um aluno em outra turma, uma matrícula trancada e uma conta sem consentimento.
3. Ativar a regra de rascunhos; executar o cron em homologação.
4. Confirmar que só há um rascunho por aula e que duas execuções no dia não criam cópias.
5. Publicar explicitamente pelo painel de comunicação e validar apenas destinatários elegíveis da turma.
6. Confirmar que nenhuma pessoa de outra turma, matrícula trancada ou conta sem consentimento recebeu notificação.
7. Cancelar/inativar turma ou expirar a data da aula e confirmar que a publicação é rejeitada.
8. Verificar auditoria, fila de push e a ausência de alteração em matrícula, presenças ou financeiro.

Status: código implementado; **teste funcional de ponta a ponta e aceite ainda pendentes**.


## Revisão de segurança da segmentação — 09/11/2026
- Extraídas regras puras em `apps/gestao/src/lib/segmentacaoAulas.ts` para reconhecer e validar filtros restritos. Se `turmaId`, `aulaId`, `origem`, `segmento` ou sinalização de restrição aparecerem isoladamente, o servidor não poderá convertê-los para o público geral; um filtro incompleto será rejeitado.
- Os avisos de aula só podem ser publicados após validação de turma/aula e seleção no banco de matrículas ativas, contas ativas e consentimento. Retiradas/exclusões não participam.
- Adicionados testes Vitest em `apps/gestao/src/lib/segmentacaoAulas.test.ts` com: UUID inválido, filtro TODOS (geral) incompatível, matrículas trancadas, contas inativas, ausência de consentimento, exclusão solicitada, pessoa anonimizada e pessoa de outra turma.
- **Testes incluídos no código; execução automatizada ainda não confirmada.** O aceite funcional requer rodar a suíte e validar publicação numa base de homologação com perfis distintos.
- Não foram criados usuários, matrículas ou mensagens fictícias no banco principal.
