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


## Campanhas e doações — rascunhos de divulgação (etapa seguinte)
- Regra `DIARIO` + `RASCUNHO_CAMPANHA` começa desativada; apenas administrador pode habilitá-la sob confirmação.
- O cron reaproveitado da Vercel seleciona até **20 campanhas ATIVAS** em seu período válido (datas civis de São Paulo), com meta positiva ainda não atingida. Campanhas em RASCUNHO, AGENDADA, ENCERRADA, expiradas ou com meta concluída não geram aviso.
- Cria **somente rascunhos** no canal APP contendo o título, texto, progresso numérico, pontos de coleta (se houver) e link para a página institucional; não há PIX, cobrança, recibo ou solicitação automática de pagamento.
- `chaveCampanha=regra:campanha` evita um segundo rascunho para a mesma campanha, mesmo em dias diferentes; trava PostgreSQL protege execuções simultâneas, e o registro em `Execucao` evita repetição da regra no mesmo dia.
- O administrador deve conferir datas, metas, locais de coleta e texto antes de publicar. A publicação exige o fluxo existente de consentimento, conta ativa e segmentação por público.
- Ainda **não há integração com adquirente/PSP**. Nunca atribuir a uma campanha dados financeiros não confirmados.

### Testes necessários
1. Com zero regras ativas, confirmar que o cron não cria nenhum comunicado.
2. Habilitar uma regra em homologação e cadastrar campanha ATIVA, dentro das datas, com meta aberta; confirmar um rascunho APP.
3. Tentar segunda execução no mesmo dia e no dia seguinte; não criar rascunho duplicado.
4. Campanha com status RASCUNHO/ENCERRADA, fora das datas ou meta atingida não deve gerar rascunhos.
5. Conferir que `Comunicacao.status=RASCUNHO` e `enviados=0`, sem novas cobranças, PIX ou doações registradas.
6. Publicar somente com um administrador e contas de homologação consentidas; confirmar que os destinatários seguem o segmento escolhido.
7. Confirmar que o procedimento funciona sem qualquer campanha cadastrada na produção.
8. Executar testes do repositório e revisar build da versão com os novos módulos.

**Status:** código e documentação preparados, execução ponta a ponta pendente de aceite.


## Conferência de doações e prévia de agradecimento
- Rota administrativa `/doacoes/recibos`, para ADMINISTRADOR e TESOURARIA, exibe até 100 doações com `statusPagamento=PAGO` **e** `pagoEm` preenchido, sob contexto RLS.
- Rota `/doacoes/recibos/[id]` mostra uma prévia de agradecimento individual, acessível somente por perfis autorizados e apenas enquanto a doação estiver registrada como paga.
- A prévia usa valor ou descrição dos itens, destinação e data do próprio registro. Não consulta pagamento externo nem gera documento fiscal.
- A leitura **não** modifica `reciboEmitidoEm`, `statusPagamento`, saldo, campanha, `pagoEm` ou dados do doador, e não envia mensagens.
- Página deve ser descrita como **registro interno**; jamais afirmar que a prévia constitui nota fiscal, comprovante bancário ou certificado de dedução fiscal.
- Falta implementar a emissão administrativa oficial, trilha de auditoria específica, download de documento aprovado e integração autorizada de e-mail/WhatsApp.

### Critérios de aceite
1. Acessar a listagem com ADMINISTRADOR e TESOURARIA; outros perfis não podem consultar informações individuais.
2. Para doação PAGO com data de confirmação, abrir prévia e conferir texto com dados do cadastro.
3. Tentar abrir IDs de doação AGUARDANDO, CANCELADO, ESTORNADO ou sem `pagoEm`; a rota deve retornar 404.
4. Tentar acessar ID inválido ou inexistente; retornar 404 sem revelar dados pessoais.
5. Confirmar que ler a prévia não altera `reciboEmitidoEm` e não dispara avisos.
6. Confirmar que é possível usar a plataforma vazia, com lista em branco sem dados fictícios.
7. Testar fluxo com dados de homologação, sem simular quitação financeira em produção.

Status: páginas implementadas no repositório. Publicação e aceite operacional precisam de confirmação.


## Emissão de recibo administrativo interno — etapa adicional
- A página `/doacoes/recibos/[id]` mantém uma prévia somente leitura até o administrador marcar a confirmação e acionar `Emitir recibo interno`.
- A ação `emitirReciboInterno` exige sessão ADMINISTRADOR e identificador UUID válido.
- A transação confirma `statusPagamento=PAGO`, `pagoEm` preenchido e `reciboEmitidoEm` vazio; a atualização condicional evita emissão simultânea duplicada.
- A mesma transação insere auditoria com autor, data, referência e dados da doação. Em erro, a emissão e a auditoria são revertidas juntas.
- O identificador do recibo é `CEAK-{ANO_DO_PAGAMENTO}-{UUID_DA_DOACAO}`, único e estável, **não sequencial e não fiscal**.
- Após emissão, o administrador e a tesouraria podem imprimir ou salvar em PDF pelo navegador. Não há geração de nota fiscal, comprovação bancária nem envio por e-mail/WhatsApp.
- A emissão não altera valores, estado de pagamento, arrecadação de campanha, estoque ou dados da pessoa.

### Aceite
1. Doação pendente/cancelada/estornada ou sem `pagoEm`: emissão rejeitada.
2. TESOURARIA pode conferir e imprimir recibo emitido; somente ADMINISTRADOR emite.
3. Duplo clique ou repetição do formulário: `reciboEmitidoEm` permanece o mesmo e somente um registro de auditoria de emissão é criado.
4. Doação paga: emissão cria data e auditoria na mesma transação.
5. A impressão omite controles administrativos e preserva o aviso não fiscal.
6. Não envia mensagem ou cria cobrança.
7. Verificar os comportamentos com dados isolados de homologação e conferir o build antes do aceite.


## Homologação complementar do recibo — 09/11/2026
- Regras de elegibilidade centralizadas em `apps/gestao/src/lib/recibosDoacoes.ts` e reutilizadas na emissão administrativa.
- Testes Vitest incluídos em `apps/gestao/src/lib/recibosDoacoes.test.ts` para pagamentos pendentes, expirados, cancelados e estornados, falta de data, repetição de emissão e referência única estável.
- Pipeline CI atualizado para exigir a execução específica desta suíte antes do conjunto integral de testes.
- **A inclusão dos testes não equivale à sua aprovação:** acompanhar execução GitHub Actions e deploy Vercel do commit mais recente.
- O envio de agradecimentos por e-mail/WhatsApp permanece desligado até que provedor, consentimento e homologação estejam disponíveis. Não encaminhar dados financeiros por comunicados gerais.


## Agradecimento individual com consentimento — 09/11/2026
- Na página individual de recibo interno, o CEAK prepara um texto de agradecimento **somente para leitura e cópia**, sem enviar e-mail, WhatsApp, notificações ou registrar despacho.
- A prévia só fica disponível quando a doação está `PAGO`, possui `pagoEm`, o recibo interno tem `reciboEmitidoEm` e a pessoa relacionada tem conta ativa, consentimento registrado e nenhum pedido de exclusão/anonimização.
- Doações anônimas, sem identificação vinculada, ainda não dão origem a mensagens individuais.
- O texto não contém valores, identificação bancária, ID interno nem forma de pagamento.
- O botão `Copiar texto para revisão` exige comando do operador; copiar **não significa envio nem consentimento para disparo externo**. A eventual utilização fora da plataforma deve seguir a política de comunicação do CEAK.
- Testes automatizados foram adicionados em `apps/gestao/src/lib/agradecimentoDoacoes.test.ts` e incluídos no GitHub Actions.
- Validação ainda pendente: execução do CI, build da página, teste com conta consentida em homologação e revisão da política de consentimento para canais externos.


## Liberação de e-mail e WhatsApp — política de segurança
- Implementado `apps/gestao/src/lib/politicaEnvioAgradecimentos.ts` como contrato estrito para futuras integrações de entrega. O envio **só será permitido** quando a doação estiver confirmada, recibo emitido, cadastro ativo, consentimento geral e **consentimento específico por canal** verificados, destino verificado, provedor homologado, aprovação administrativa e ausência de pedido de exclusão.
- Ambos os canais, `EMAIL` e `WHATSAPP`, permanecem explicitamente **desabilitados** no estado atual. Cadastro com consentimento LGPD geral não é suficiente para habilitá-los.
- A página individual do recibo exibe o motivo de bloqueio de cada canal, sem apresentar botões de disparo externos.
- A política possui testes em `apps/gestao/src/lib/politicaEnvioAgradecimentos.test.ts`, adicionados como etapa específica de validação no pipeline GitHub Actions.
- **Ainda não existe armazenamento homologado de preferência de canal, opt-in verificável, opt-out, fila de envio externo ou contrato com provedor para esses agradecimentos.** Esses componentes precisam ser implementados e validados antes de qualquer chamada real.
- Esta política é uma preparação de segurança; por si só, não constitui integração de envio nem comprovação de execução dos testes.

### Critérios de aceite dos canais externos
1. Exigir aceite por e-mail e WhatsApp separadamente e registrar data, versão e origem do consentimento.
2. Testar revogação e não envio após exclusão, anonimização ou cancelamento de consentimento.
3. Validar canal/destinatário e aprovação administrativa antes de enfileirar qualquer entrega.
4. Garantir idempotência de envios e auditoria de tentativas, erros e confirmações do provedor.
5. Executar testes em ambiente isolado, nunca para destinatários de produção.
6. Publicar apenas após aprovação do CI, revisão de privacidade e configuração dos provedores.
