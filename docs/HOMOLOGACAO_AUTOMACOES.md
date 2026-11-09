# CEAK Digital — Motor de automações: primeira etapa

## Entrega implementada
A rota existente `/automacoes` no painel CEAK Gestão inclui:
- Cadastro de **diagnóstico manual de estoque** com gatilho `MANUAL` e ação `DIAGNOSTICO_ESTOQUE`.
- Regra cadastrada como **desativada** e marcada para aprovação, preservando a configuração segura.
- Botão **Executar diagnóstico** para administrador autenticado. O clique é a autorização explícita para uma operação **somente de leitura**.
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
3. Confirmar que ela aparece **DESATIVADA**.
4. Selecionar **Executar diagnóstico**; conferir nova linha no **Histórico de execuções** com quantidade de itens analisados e abaixo do mínimo.
5. Confirmar que nenhuma movimentação de estoque, notificação externa ou pagamento foi criado.
6. Confirmar auditoria com a ação `automacao.diagnostico_estoque.executado`.
7. Verificar que usuários sem permissão de administrador não podem executar a ação.
8. Regra livre/legada com gatilho ou ação diferente deve ser rejeitada pelo executor.

## Próximos componentes de desenvolvimento
1. Catálogo tipado de gatilhos e ações, com regras versionadas.
2. Ativação/desativação com aprovação e trilha de auditoria.
3. Agendamento persistente, worker, controle de concorrência e retentativas.
4. Eventos do domínio: publicação de palestra, matrícula, check-in e campanhas.
5. Ações com efeito externo somente com conectores autorizados, autorização humana e controles anti-duplicidade.

Status: **implementado no código, homologação operacional ainda pendente**.
