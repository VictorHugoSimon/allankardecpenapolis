# CEAK Digital — Homologação da fila Web Push (1.000 aparelhos)

**Data:** 11/11/2026  
**Status:** roteiro de teste preparado; execução de carga e aceite em aparelhos reais **pendentes**.

## Escopo e segurança

Validar a fila persistente de `entrega_push` sem enviar mensagens para usuários reais.

- Utilizar **somente** ambiente de teste isolado, com banco e VAPID próprios. Nunca executar `db:seed` sobre banco real.
- Não usar endpoints nem chaves Web Push reais. Usar um provedor de teste determinístico que registre apenas identificadores fictícios, sem PII.
- O limite de 50 itens por claim e concorrência de até 10 envios são parâmetros do código; não garantem velocidade real de entrega.
- Registrar IDs sintéticos, estados, tentativas e duração, sem endpoints, chaves, senhas ou conteúdo pessoal.

## Preparação do cenário

1. Criar 1.000 aparelhos sintéticos para contas fictícias com consentimento **no banco isolado**.
2. Criar um comunicado destinado exclusivamente a essas contas, com link interno `/agenda`.
3. Garantir que nenhum worker/cron externo esteja conectado ao banco do teste.
4. Instrumentar contadores de `PENDENTE`, `PROCESSANDO`, `ENVIADO`, `FALHA` e `EXPIRADO`.
5. Confirmar que uma entrega por par comunicado/aparelho é garantida no banco.

## Cenários obrigatórios

| ID | Execução | Critério de aceite |
| --- | --- | --- |
| P01 | Executar worker com 1.000 entregas pendentes | Cada claim contém no máximo 50 registros; fila chega a estado terminal |
| P02 | Executar dois workers simultaneamente | Nenhum par comunicado/aparelho é reivindicado por dois workers com claim válido |
| P03 | Interromper worker durante `PROCESSANDO` | Claim vencido é recuperável após o prazo, com incremento das tentativas |
| P04 | Simular falha transitória do provedor | Retry ocorre após 1, 2, 4, 8 ou 16 minutos conforme a tentativa; não há loop infinito |
| P05 | Interromper a quinta tentativa | Claim vencido termina em `FALHA`; não existe sexta tentativa |
| P06 | Simular inscrição expirada | Entrega termina em falha e inscrição inválida é removida |
| P07 | Revogar consentimento antes de enviar | Entrega termina em `EXPIRADO`; nenhum envio é iniciado |
| P08 | Desativar usuário ou solicitar exclusão | Nenhum envio é iniciado ao destino não elegível |
| P09 | Tentar registrar resultado de worker antigo | Atualização de tentativa antiga afeta zero registros |
| P10 | Testar link externo e URL ambígua | Notificação aponta para `/notificacoes`, sem redirecionamento |
| P11 | Falta de VAPID ou provedor real | Retorna indisponível; não simula entrega bem-sucedida |
| P12 | Pausar e reiniciar cron | Registros persistidos não são perdidos; processamento retoma |

## Evidências exigidas

- Resultado da CI com lint, typecheck, testes e build aprovados.
- Identificação do banco de homologação, número de destinos sintéticos e resumo da carga (sem segredos).
- Contagem inicial e final por status, distribuição de tentativas, quantidade de claims e de falhas simuladas.
- Demonstração de concorrência, recuperação de claims e ausência de sobrescrita por workers antigos.
- Validação de migrações da fila e monitoramento do cron na Vercel.
- Teste manual de Web Push com consentimento em Android Chrome e iOS com PWA adicionado à Tela de Início.

## Limitações e decisão de aceite

Web Push fornece confirmação de **aceite pelo serviço push**, não garantia de exibição pelo sistema operacional. Uma falha após o aceite remoto e antes da gravação do resultado pode ocasionar repetição de mensagem: a fila deve ser tratada como **entrega ao menos uma vez**. Não prometer entrega exatamente uma vez no aparelho.

O cron diário do plano Hobby não fornece prazo curto ou contínuo para todas as mensagens. Se houver exigência operacional de comunicação quase imediata, validar um scheduler/fila com frequência adequada e credenciais privadas.

**Não marcar homologado** até concluir os cenários P01–P12, os testes em aparelhos e a verificação da versão publicada.
