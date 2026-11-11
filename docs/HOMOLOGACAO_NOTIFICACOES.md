# CEAK Digital — homologação de comunicados e Web Push

Atualizado em 11/11/2026. Branch do projeto: `claude/new-session-n6t9kx`.

## Configuração concluída no ambiente Vercel

Os projetos `ceak-app-git-preview` e `ceak-gestao-git-preview` possuem as variáveis:

- `VAPID_PUBLIC_KEY` (chave pública);
- `VAPID_PRIVATE_KEY` (segredo criptografado, nunca copiar ao repositório);
- As duas chaves VAPID foram regeneradas a partir do mesmo par P-256 e aplicadas no CEAK App e no CEAK Gestão. Como a produção ainda não tem aparelhos inscritos, isso não exige migração de assinaturas existentes.
- `VAPID_SUBJECT`;
- `PUSH_PROVIDER=webpush`.

**Situação verificada em 11/11/2026:** variáveis VAPID e `CRON_SECRET` existem nos respectivos projetos Vercel (sem expor seus valores). As versões do site e do PWA estavam publicadas (`READY`), e o Gestão teve nova publicação solicitada para o commit `1f36e48`. A CI desse commit passou. Confirmar o estado final da nova publicação e testar o cron autenticado ainda são passos necessários.

## Enviar um comunicado de teste depois da publicação

1. Entre no CEAK Gestão e abra `/comunicacao/avisos`.
2. Em **Nova mensagem**, escreva título e texto.
3. Em **Destinatários**, escolha o público adequado (não use um envio geral para teste).
4. Em **Link**, use `/agenda` ou `https://www.facebook.com/CEAKDEPENAPOLIS`.
5. Salve como rascunho; confira a mensagem; só então publique.
6. No CEAK App de um usuário elegível, abra **Notificações** e confirme texto e link.
7. No aparelho instalado, marque **Sim**, autorize o navegador/sistema pelo botão e confirme a inscrição.
8. Publique um novo comunicado para observar o Web Push. Apenas aparelhos inscritos recebem push; todos os destinatários elegíveis recebem o aviso interno.

## Critérios e limites

- O usuário pode desativar o Web Push em **Não**; o sistema remove a inscrição do aparelho antes de salvar a preferência local.
- A preferência local **Sim/Não** é armazenada separadamente para cada pessoa autenticada, evitando herdar a escolha de outro usuário no mesmo dispositivo. A troca de conta reinicializa a preferência para Sim quando não houver escolha salva naquela conta.
- **Sim** é a preferência inicial, mas não substitui o consentimento exigido por Android, iOS e navegadores.
- A caixa interna funciona independentemente de permissão push.
- Envio externo é tentado apenas com VAPID configurado e provedor `webpush`, sem simulação.
- A nova fila persistente suporta **mais de 1.000 aparelhos inscritos**; cada comunicado e aparelho tem uma entrada única no PostgreSQL.
- A publicação cria os avisos internos e a fila de push na mesma transação. O processamento é tentado automaticamente após a resposta, em lotes de 50, com até 10 envios simultâneos.
- O processamento automático pós-resposta depende do tempo disponível na hospedagem; se for interrompido, o restante permanece na fila.
- Foi adicionado um cron nativo diário em `apps/gestao/vercel.json` (`0 9 * * *`, UTC), compatível com a frequência máxima do plano Hobby; ele processa lotes consecutivos durante o orçamento de execução. O cron diário não substitui um serviço de filas em tempo quase real.
- O painel agora mostra pendências, aceites e falhas para cada comunicado, além dos totais globais.
- Para retomada imediata existe o botão **Processar próximo lote (até 50)** no CEAK Gestão. A rota protegida `GET /api/cron/notificacoes` aceita `Authorization: Bearer <CRON_SECRET>` de agendador autorizado. O agendamento periódico externo ainda precisa ser ativado.
- Falhas transitórias são retentadas até cinco vezes, com espera progressiva. Claims abandonados na quinta tentativa são encerrados em FALHA (evita novas tentativas infinitas), e atualizações de workers antigos não sobrescrevem tentativas recentes. O serviço registra aceites e falhas, sem prometer que o sistema operacional exibiu o alerta.
- O plano Vercel **Hobby** não foi assumido como agendador de alta frequência; a publicação não deve ser chamada de totalmente automatizada até testar recuperação dos lotes interrompidos.
- O painel separa quantidade de avisos internos e tentativas Web Push aceitas/falhas.
- A notificação push abre o CEAK App em `/notificacoes`, onde o usuário pode tocar no link externo compartilhado.
- Não existe publicação automática no Facebook. O endereço fornecido é um **link de referência**, não uma integração Meta autorizada.
- Não registrar senhas, tokens VAPID, URLs de endpoints ou dados pessoais nos logs.

## Verificação pública do cron — 11/11/2026

- A CI do commit `0a766dd` foi concluída com sucesso (lint, TypeScript, build, testes e Playwright).
- O deployment de `ceak-gestao-git-preview` desse commit está `READY` na Vercel.
- Em navegação pública, sem autenticação, a rota `/api/cron/notificacoes` **não redirecionou para `/login`**; respondeu com `{"erro":"Acesso não autorizado."}`. O navegador utilizado não expôs o código HTTP exato; o teste automático de contrato espera **401**.
- O monitor HTTP foi configurado para verificação diária. Esta observação não comprova a execução autenticada do cron nem a entrega de push a um celular real.

## Pendências para aceite final

**Banco CEAK (consulta somente leitura, 11/11/2026):** 4 pessoas, 4 usuários, 1 dispositivo push e zero comunicações/entregas na fila. A homologação de 1.000 dispositivos reais não é possível com a base atual. Não cadastrar dispositivos artificiais em produção.

- [x] Confirmar migração `20261108193000_entrega_push_fila` no Neon CEAK: tabela `ceak_v2.entrega_push` presente e migração marcada como concluída (consulta somente leitura em 11/11/2026).
- [x] Site e PWA com deployments `READY` na Vercel; último commit funcional verificado: `2103c73` (11/11/2026).
- [x] Adicionar cron diário autenticado à rota `/api/cron/notificacoes` no código do CEAK Gestão.
- [ ] Publicar e testar o cron real no ambiente Vercel, validando retomada de fila interrompida e limites de execução.
- [ ] Para maior frequência, contratar plano adequado ou integrar agendador externo com credencial protegida.
- [ ] Verificar 1.000 aparelhos inscritos em ambiente de teste com métricas de aceites/falhas sem envio acidental para usuários reais.
- [x] Validar `EXPLAIN` da consulta de seleção concorrente de 50 registros no Neon de homologação.
- [x] CI em PostgreSQL local: 1.000 claims sintéticos, dois workers concorrentes, recuperação de claim, proteção contra atualização obsoleta e limite de tentativas aprovados. Ainda é necessário testar falhas reais e o cron publicado.
- [x] CI do commit `1f36e48`: build, lint, TypeScript, testes e Playwright aprovados. Deploy dessa revisão do Gestão submetido separadamente.
- [ ] Testar primeiro consentimento e o botão push no Android Chrome.
- [ ] Testar no iPhone com PWA instalado pela Tela de Início.
- [ ] Conferir rascunho, destinatário, link, publicação e contadores no Gestão.
- [ ] Testar envio com app fechado e permissão concedida.
- [ ] Testar recusa de permissão, saída da conta e opção **Não**.
- [x] Implementar fila durável com retentativas para públicos acima de 100 dispositivos (validada estruturalmente no Neon de homologação).
- [ ] Definir política de retenção de comunicados e revisão LGPD.
