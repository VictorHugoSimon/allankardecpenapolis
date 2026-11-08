# CEAK Digital — homologação de comunicados e Web Push

Atualizado em 08/11/2026. Branch do projeto: `claude/new-session-n6t9kx`.

## Configuração concluída no ambiente Vercel

Os projetos `ceak-app-git-preview` e `ceak-gestao-git-preview` possuem as variáveis:
- `VAPID_PUBLIC_KEY` (chave pública);
- `VAPID_PRIVATE_KEY` (segredo criptografado, nunca copiar ao repositório);
- `VAPID_SUBJECT`;
- `PUSH_PROVIDER=webpush`.

**Atenção:** variáveis novas só entram em vigor depois de um novo deployment.
Em 08/11/2026, a tentativa de publicação foi recusada pelo limite diário
`api-deployments-free-per-day` da Vercel. Não considerar a versão online atualizada.

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
- **Sim** é a preferência inicial, mas não substitui o consentimento exigido por Android, iOS e navegadores.
- A caixa interna funciona independentemente de permissão push.
- Envio externo é tentado apenas com VAPID configurado e provedor `webpush`, sem simulação.
- Na implantação atual, o fluxo síncrono envia Web Push apenas quando existem até 100 inscrições elegíveis; acima disso, registra que é necessário um processador em lotes. Nunca declara que os demais receberam push.
- O painel separa quantidade de avisos internos e tentativas Web Push aceitas/falhas.
- A notificação push abre o CEAK App em `/notificacoes`, onde o usuário pode tocar no link externo compartilhado.
- Não existe publicação automática no Facebook. O endereço fornecido é um **link de referência**, não uma integração Meta autorizada.
- Não registrar senhas, tokens VAPID, URLs de endpoints ou dados pessoais nos logs.

## Pendências para aceite final

- [ ] Fazer novo deploy dos dois aplicativos após liberação do limite da Vercel.
- [ ] Executar build, lint e TypeScript na versão publicada.
- [ ] Testar primeiro consentimento e o botão push no Android Chrome.
- [ ] Testar no iPhone com PWA instalado pela Tela de Início.
- [ ] Conferir rascunho, destinatário, link, publicação e contadores no Gestão.
- [ ] Testar envio com app fechado e permissão concedida.
- [ ] Testar recusa de permissão, saída da conta e opção **Não**.
- [ ] Implementar fila durável com retentativas para públicos acima de 100 dispositivos.
- [ ] Definir política de retenção de comunicados e revisão LGPD.
