# Primeira instalação do CEAK Digital — sem dados fictícios

A inicialização de produção usa **somente migrações**, jamais `pnpm db:seed`. O seed destrói registros e serve apenas ao banco isolado de testes. A partir do banco recém-migrado, crie **um único administrador real** usando a rotina auditada e transacional de bootstrap.

## Preparação segura

1. Configure um banco PostgreSQL exclusivo e o schema `ceak_v2`. Aplique as migrações com `pnpm db:deploy`, após backup/checagem de ambiente.
2. Configure `AUTH_PROVIDER=local`, `AUTH_SECRET` aleatório com pelo menos 32 caracteres e `CEAK_DB_SCHEMA=ceak_v2`.
3. Forneça `CEAK_ADMIN_NOME`, `CEAK_ADMIN_EMAIL` e `CEAK_ADMIN_SENHA` (senha exclusiva com no mínimo 16 caracteres, letras, número e símbolo) **pelo gerenciador de segredos da plataforma**, sem inserir senha em terminal compartilhado, arquivo versionado ou mensagem.
4. Configure `CEAK_BOOTSTRAP_CONFIRM=CRIAR_PRIMEIRO_ADMIN_REAL` apenas para a execução autorizada de `pnpm db:bootstrap`. Remova as variáveis de bootstrap imediatamente depois.
5. Confirme que o primeiro administrador consegue entrar e configurar o segundo fator; somente então convide os demais responsáveis.

## Bloqueios de segurança

- A rotina recusa bancos que já contenham pessoas ou usuários; não adiciona registros de exemplo, categorias ou contas bancárias.
- Exige schema `ceak_v2`, autenticação local, segredo de sessão forte e confirmação explícita.
- O registro é atômico, usa lock de transação e cria auditoria; não reexecute em banco ativo.
- A execução exige uma conexão administrativa com acesso à tabela privada de credenciais; **não dê esse acesso ao papel `ceak_app`**.
- Não execute o seed de desenvolvimento em produção, mesmo se existir um mecanismo de override legado.

## Homologação adicional necessária

Validar instalação no Android Chrome e iOS Safari; verificar o primeiro login, configuração TOTP, navegação do PWA e banco vazio sem conteúdo de protótipo. A CI com seed atende testes de regressão, **não comprova** o cenário de primeiro uso real.
