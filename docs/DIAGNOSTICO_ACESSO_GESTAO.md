# CEAK Digital — conferir acesso administrativo sem alterar dados

Este procedimento **não cria usuário, não redefine senha e não altera o banco**. Foi preparado para o repositório existente `VictorHugoSimon/allankardecpenapolis`.

## No Windows, usando o CMD

1. Abra o **Prompt de Comando**.
2. Entre na pasta **já existente** do projeto (substitua o exemplo pelo caminho real):

   ```bat
   cd /d C:\caminho\para\allankardecpenapolis
   ```

3. Confirme que está na pasta correta:

   ```bat
   dir package.json
   ```

4. Confirme que Node.js 22+ e pnpm estão instalados:

   ```bat
   node --version
   corepack pnpm --version
   ```

5. Com o arquivo privado `.env` já configurado para o banco correto, rode:

   ```bat
   corepack pnpm install --frozen-lockfile
   corepack pnpm db:generate
   corepack pnpm --filter @ceak/db db:diagnostico-acesso
   ```

**Nunca cole o conteúdo do `.env`, senhas, tokens ou string de conexão em chats ou prints.** O comando mostra apenas contagens de administradores e orientação de próximo passo.

## Interpretar o resultado

- **Nenhum administrador:** o primeiro acesso pode ser preparado pelo procedimento [PRIMEIRO_ACESSO_SEM_SEED.md](PRIMEIRO_ACESSO_SEM_SEED.md), depois de confirmar que o banco é o correto.
- **Administrador ativo com senha local:** acesse `/login`, complete a configuração do aplicativo autenticador (2FA) e abra `/config/usuarios` para cadastrar os demais.
- **Administrador inativo ou inconsistência de credencial:** interrompa o processo e faça uma recuperação administrativa autorizada; não rode seed ou bootstrap novamente sem conferir o estado.

## Links registrados no projeto

- Site: https://ceak-site-git-preview.vercel.app
- Aplicativo: https://ceak-app-git-preview.vercel.app
- Gestão: https://ceak-gestao-git-preview.vercel.app/login
- Após login: https://ceak-gestao-git-preview.vercel.app/config/usuarios

Para conferir as URLs e os recursos de instalação, no menu **Actions** do GitHub escolha **CEAK - Auditoria das URLs e PWA publicados** e execute **Run workflow** na branch `claude/new-session-n6t9kx`. Esse teste não substitui login e homologação reais em Android/iOS.

Não execute `db:seed` em produção. O fluxo de convites gera link privado de ativação (48 horas), que deve ser enviado individualmente, não publicado em grupos.
