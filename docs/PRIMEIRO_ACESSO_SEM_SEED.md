# Primeira instalação do CEAK Digital — sem dados fictícios

A inicialização de produção usa **somente migrações**, jamais `pnpm db:seed`. O seed destrói registros e serve apenas ao banco isolado de testes. Em um banco recém-migrado — ou num banco que já contenha apenas visitantes, sem administrador — crie **um único administrador real** usando a rotina auditada e transacional de bootstrap. A rotina preserva integralmente os registros existentes.

## Preparação segura

1. Configure um banco PostgreSQL exclusivo e o schema `ceak_v2`. Aplique as migrações com `pnpm db:deploy`, após backup/checagem de ambiente.
2. Configure `AUTH_PROVIDER=local`, `AUTH_SECRET` aleatório com pelo menos 32 caracteres e `CEAK_DB_SCHEMA=ceak_v2`.
3. Forneça `CEAK_ADMIN_NOME`, `CEAK_ADMIN_EMAIL` e `CEAK_ADMIN_SENHA` (senha exclusiva com no mínimo 16 caracteres, letras, número e símbolo) **pelo gerenciador de segredos da plataforma**, sem inserir senha em terminal compartilhado, arquivo versionado ou mensagem.
4. Configure `CEAK_BOOTSTRAP_CONFIRM=CRIAR_PRIMEIRO_ADMIN_REAL` apenas para a execução autorizada de `pnpm db:bootstrap`. Remova as variáveis de bootstrap imediatamente depois.
5. Confirme que o primeiro administrador consegue entrar e configurar o segundo fator; somente então convide os demais responsáveis.

## Bloqueios de segurança

- A rotina recusa a criação se já existir uma pessoa ou conta com perfil ADMINISTRADOR ou se o e-mail fornecido já estiver cadastrado. Visitantes existentes são preservados; não há promoção automática de perfil, exclusão de dados ou criação de categorias e contas bancárias.
- Exige schema `ceak_v2`, autenticação local, segredo de sessão forte e confirmação explícita.
- O registro é atômico, usa lock de transação e cria auditoria; uma segunda execução é recusada após existir administrador.
- A execução exige uma conexão administrativa com acesso à tabela privada de credenciais; **não dê esse acesso ao papel `ceak_app`**.
- Não execute o seed de desenvolvimento em produção, mesmo se existir um mecanismo de override legado.

## Homologação adicional necessária

Validar instalação no Android Chrome e iOS Safari; verificar o primeiro login, configuração TOTP, navegação do PWA e banco vazio sem conteúdo de protótipo. A CI com seed atende testes de regressão, **não comprova** o cenário de primeiro uso real.

## Ambiente que já possui visitantes, mas nenhum administrador

A base CEAK v2 conectada foi inspecionada em 05/11/2026 e tinha contas com perfil VISITANTE, mas nenhuma com perfil ADMINISTRADOR. Não é necessário excluir ninguém, reinicializar o banco ou fazer seed: forneça **credenciais institucionais reais** ao comando `pnpm db:bootstrap` usando o gerenciador de segredos, confirme a conexão com o banco correto e execute uma única vez. O procedimento cria uma nova pessoa e uma conta de administrador, preservando todas as outras.

Para evitar criação por engano, o comando não possui e-mail ou senha padrão, recusa reutilização de e-mail existente, exige a confirmação específica e exige configuração do segundo fator no primeiro acesso. Nunca compartilhe credenciais no GitHub, nos logs ou neste documento.
