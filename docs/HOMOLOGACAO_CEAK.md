# CEAK Digital — registro de homologação

Data de referência: 04/11/2026.

## Decisão de implantação

A implantação começa sem registros fictícios. Não executar o seed de desenvolvimento no banco real. Contas bancárias e importação de extratos permanecem adiadas.

## Qualidade

- O GitHub Actions foi dividido em jobs independentes para Prettier, TypeScript e demais verificações.
- Foi gerado e aplicado na branch um patch Prettier para 56 arquivos, no commit `49472fb0a9a2a2bd8299b6eaa5e4f105440ace67`.
- O TypeScript dos sete pacotes foi aprovado em execução anterior, assim como lint e testes automatizados antes da compilação.
- A aprovação definitiva depende de uma CI completa sobre o HEAD formatado, além da revisão do build de produção, dos testes E2E e das políticas RLS.
- As prévias Vercel mostraram limite de builds, que não equivale a um erro do projeto.

## Portões de publicação

1. Prettier, ESLint, TypeScript e testes aprovados.
2. Build de produção e testes E2E aprovados.
3. Operações e permissões validadas em PostgreSQL de homologação.
4. Instalação PWA validada em Android e iPhone.
5. Revisão humana antes do merge e deploy.

O Pull Request #1 permanece em rascunho até o cumprimento dos critérios.

## Portão de publicação adicionado

Execute `pnpm release:check` com as variáveis de ambiente de produção **sem publicar os seus valores**. A verificação bloqueia publicação se detectar dados institucionais fictícios e configurações críticas de demonstração: CNPJ, endereço, contatos, PIX, diretoria, imagens, histórico, programação semanal, segredo, URLs HTTPS, banco, autenticação ou ativação indevida de pagamentos simulados.

O verificador falhar enquanto os dados oficiais não forem fornecidos **é o resultado esperado e seguro**. Nenhum dado oficial deve ser inferido de protótipos. O comando é uma verificação adicional, não substitui aprovação da instituição, análise de privacidade, backup, testes reais do PWA e da política RLS.

Até a conclusão desses critérios, manter o PR em rascunho e não promover a produção.
