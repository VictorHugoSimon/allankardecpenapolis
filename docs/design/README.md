# Handoff: CEAK Digital — Centro Espírita Allan Kardec (Penápolis)

## Visão geral
CEAK Digital é o ecossistema digital do Centro Espírita Allan Kardec de Penápolis – SP. Ele tem três experiências com a mesma identidade visual:

1. **Site público** (`allankardecpenapolis.com.br`): institucional, agenda, palestras, lives, estudos, biblioteca, blog, loja solidária, doações, Quero ajudar, Preciso de ajuda, transparência e contato.
2. **CEAK App (PWA)**: área do membro instalável, mobile-first, com check-in, minha jornada, estudos, avaliação NPS, CEAK IA, doação PIX e assistência.
3. **CEAK Gestão (SaaS administrativo)**: Command Center, pessoas, agenda, eventos, estudos, conteúdo com aprovação humana, comunicação, doações, financeiro, loja, estoque, voluntariado, assistência, IA, automações, aprovações, BI, logs/auditoria, integrações, sistema e configurações com perfis de acesso.

Princípio do produto: *aproximar, acolher, informar, ensinar, envolver, permitir ajudar e facilitar ser ajudado.* A tecnologia fica a serviço das pessoas e não é o centro da experiência.

## Sobre os arquivos de design
Os arquivos deste pacote são **referências de design feitas em HTML**: protótipos navegáveis que mostram aparência e comportamento. **Não são código de produção.** A tarefa é **recriar estas telas no ambiente de desenvolvimento escolhido** (ver "Stack sugerida"), seguindo seus padrões, componentes e boas práticas. Os dados são fictícios e precisam ser substituídos por dados reais vindos de API ou banco.

- `prototipos/*.dc.html`: fonte dos protótipos. Abra com `support.js` na mesma pasta, por um servidor local (`npx serve prototipos`). Cada arquivo tem o markup (estilos inline) e uma classe `Component` com estado e dados.
- `offline/*.html`: versões autocontidas que abrem com duplo clique. Mantenha os 4 arquivos na mesma pasta para os links entre eles funcionarem.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos, raios e textos são finais para a v1. Recrie com precisão usando os tokens abaixo. Ícones ainda não foram definidos (ver "Assets").

## Stack sugerida (não há código existente)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS (mapear os tokens no `tailwind.config`). Um monorepo com 3 apps (`site`, `app`, `gestao`) e um pacote `ui` compartilhado.
- **PWA:** `next-pwa` ou Serwist, com manifest, service worker, Web Push (VAPID) e instalação.
- **Backend/dados:** PostgreSQL (Supabase ou Prisma + Postgres), com autenticação, RLS por perfil e armazenamento de arquivos.
- **Jobs/automação:** fila (BullMQ/Redis, Inngest ou Supabase Edge Functions + cron) para o Automation Engine.
- **Pagamentos:** PIX via PSP com webhook (ex.: Mercado Pago, Efí/Gerencianet, Asaas). PIX Automático para recorrência.
- **IA:** API de LLM com RAG sobre a base do CEAK (agenda, regulamentos, comunicados). Toda resposta precisa indicar a "Fonte consultada".
- **Integrações:** Meta Graph API (Facebook e Instagram), Google Business Profile API, YouTube Data API e e-mail transacional.
- **Observabilidade:** logs estruturados (categoria, nível, usuário, status, latência), trilha de auditoria (antes/depois) e health checks.

## Design tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#F7F4EE` | Fundo geral (off-white quente) |
| `surface` | `#FFFFFF` | Cards |
| `beige` | `#EFE8DA` | Seções de destaque, sidebar do admin, fundo do app no desktop |
| `beige-2` | `#F2ECE0` | Trilhas de barras e chips neutros |
| `ink` | `#1F2A24` | Texto principal |
| `ink-2` | `#3F4A42` | Texto de leitura longa |
| `muted` | `#5E675F` | Texto secundário |
| `muted-2` | `#6B746C` | Legendas e metadados |
| `line` | `#E6E0D3` | Bordas de cards |
| `line-2` | `#D8D0BF` / `#CFC7B6` | Bordas de inputs e botões secundários |
| `green` | `#2F5D46` | Primária institucional (botões, links, ativo) |
| `green-dark` | `#1E3D2F` | Blocos de contraste, rodapé |
| `green-soft` | `#E4EDE6` | Fundo de sucesso e seleção suave |
| `green-on-dark` | `#C9D6CD` / `#A9C2B1` | Texto sobre verde escuro |
| `ochre` | `#B5833A` | Despesas no gráfico, estrelas, alerta suave |
| `danger` | `#A4473A` | Erros, vencidos, remover |
| `ok-strong` | `#2F7A52` | Status "Online" |

**Pills de status** (fundo / texto):
- ok `#E4EDE6` / `#1E3D2F`
- warn `#F4EAD5` / `#7A5A1E`
- err `#F3DDD5` / `#8A3426`
- neutro `#EEEAE1` / `#4F5A52`
- info `#E1E8EF` / `#2F4B63`

**Categorias de agenda e canais** (mesma luminosidade e croma, variando o matiz): `oklch(0.48 0.08 H)`.
- Palestras H=155
- Estudos 235
- Cursos 295
- Eventos 60
- Assistência 20
- Campanhas 195
- Facebook 250
- Instagram 330
- Google 60

### Tipografia (Google Fonts)
- **Títulos:** `Newsreader` (serif), pesos 400–600. H1 do site `clamp(38px, 5vw, 56–66px)` com line-height 1.04–1.08. H1 do admin 34px. H2 32–38px. Números de KPI 28–40px.
- **Texto e UI:** `Instrument Sans`, pesos 400/500/600. Corpo 15–18px (leitura 17–18px, line-height 1.6–1.75). UI 13–15px. Rótulos 11–13px em caixa alta com `letter-spacing .06–.14em` e peso 600.
- **Mono:** `JetBrains Mono` para logs, códigos PIX, slugs e legendas de placeholder.

### Raios, espaçamentos e sombras
- **Raios:**
  - pill `999px` (botões e chips)
  - cards 14–20px, hero 24px
  - inputs 10–14px
  - frame do app 52/42px
- **Espaçamento:**
  - padding de card 16–28px
  - gaps 8/10/12/16/20/24px
  - seções do site com 56–72px de respiro vertical
  - largura máxima do site 1240px, do texto 640–1040px, do admin 1360px
- **Sombras:** quase inexistentes. O app no desktop usa `0 30px 60px -30px rgba(31,42,36,.45)` e os dropdowns `0 20px 40px -20px rgba(31,42,36,.3)`.
- **Botões:**
  - primário: fundo green, texto branco, padding 12–15px × 20–26px, peso 500
  - secundário: branco com borda `#CFC7B6`
  - labels com `white-space:nowrap`

### Animações
- `ceakPop`: escala de .6 para 1.06 e depois 1, com opacidade de 0 a 1, em 0.6s ease-out. Usada no círculo de sucesso (check-in, doação, confirmação).
- `ceakRing`: anel que se expande de .8 a 1.6 e some, em 1.4s.
- `ceakPulse`: ponto "ao vivo" alternando opacidade 1 e .3, em 1.6s, em loop.
- `ceakScan`: linha do leitor de QR subindo e descendo, em 2.4s.

## Telas

### 1. Site público (`CEAK Site.dc.html`)
Header sticky com logo, menu (O CEAK, Agenda, Palestras, Estudos, Biblioteca, Loja, Quero ajudar, Preciso de ajuda), Carrinho e "Área do membro" (leva ao App). Abaixo de 980px vira botão "Menu". O rodapé verde escuro traz os links completos e as redes sociais.

| Rota | Conteúdo |
|---|---|
| `/` | Hero (título, subtítulo, 4 CTAs, foto), faixa "Estamos ao vivo", próximas atividades (4), estudos (3 com progresso), Quero ajudar (5), Preciso de ajuda (6), blog (3), loja (4), transparência |
| `/o-ceak` | História, missão, valores, estrutura, linha do tempo (1962, 1969, 1972, 1988, 2004, 2020, 2026), diretoria |
| `/agenda` | Filtros (Todos, Palestras, Estudos, Cursos, Eventos, Assistência, Campanhas), calendário do mês e lista de eventos (título, data, horário, local, palestrante, descrição, inscrição, adicionar ao calendário, compartilhar) |
| `/palestras` | Próximas palestras e gravações |
| `/palestras/[slug]` | Título, transmissão, resumo, material, gravação, avaliação. Card lateral com data, horário, local, palestrante, inscrição, check-in, calendário e compartilhar |
| `/inscricao` | Formulário com nome, WhatsApp, e-mail e "primeira vez". O sucesso convida a instalar o App |
| `/lives` | Player ao vivo, próximas transmissões e gravações |
| `/estudos` | 6 programas (ESDE, Evangelho, Mediunidade, Mocidade, Evangelização infantil, Obras complementares) e "Como funciona" |
| `/biblioteca` | Busca em texto, filtros de tipo (Livros, PDFs, Artigos, Vídeos, Áudios, Palestras) e selects de assunto, autor, curso e tema |
| `/blog`, `/blog/[slug]` | Lista com filtro por categoria. Artigo com lead, corpo, compartilhar e "Leia também" |
| `/preciso-de-ajuda` | "Como podemos acolher você?" com 6 cards |
| `/preciso-de-ajuda/[servico]` | Fluxo em 5 etapas: Conheça, Orientações, Solicitação, Data, Confirmar. Aviso fixo: *"O atendimento espiritual não substitui acompanhamento médico ou psicológico quando necessário."* |
| `/quero-ajudar` | Campanha ativa e 7 opções. As de itens abrem painel com instruções; a de habilidades tem chips selecionáveis |
| `/campanhas/[slug]` | Meta, arrecadado, %, itens necessários com progresso e pontos de coleta |
| `/doar` | Valores de R$ 20/50/100/200 ou outro, destino, toggle "Tornar mensal" (PIX Automático, em breve), QR e copia-e-cola PIX, confirmação |
| `/loja`, `/loja/[produto]`, `/carrinho`, `/checkout`, `/pedido/[id]` | Categorias, cards (foto, nome, preço, estado, disponibilidade), galeria com 4 miniaturas, origem "Produto doado", retirada no CEAK, quantidade +/–, PIX |
| `/transparencia` | Receitas, despesas, resultado, origem e aplicação dos recursos, impacto e documentos |
| `/contato` | Endereço, programação semanal, canais, mapa e formulário |

### 2. CEAK App — PWA (`CEAK App.dc.html`)
No desktop aparece numa moldura de celular com painel lateral de jornadas. Abaixo de 600px ocupa a tela inteira, sem moldura. A barra inferior tem Início, Agenda, Check-in (destaque), Estudos e Perfil. As subtelas mostram header com botão voltar.

| Tela | Conteúdo |
|---|---|
| Login | E-mail, senha, "Entrar com código pelo WhatsApp" e criar conta |
| Home | Saudação, notificações, "Hoje no CEAK" (Ver detalhes, Check-in), minha jornada (7/3/2), Preciso de ajuda / Quero ajudar, meus estudos (ESDE 78%), avaliação pendente, CEAK IA, atalhos (Biblioteca, Lives, Loja) |
| Check-in | Escanear QR ou confirmar presença. A leitura mostra a linha animada. O sucesso traz o círculo animado e "Check-in realizado · Centro Espírita Allan Kardec · 02/10/2026 · 19:54" |
| Minha jornada | 4 métricas do mês, conquistas (Primeira visita, 5 encontros, Primeiro estudo, Primeiro voluntariado, Campanha solidária) e linha do tempo. **Sem ranking**, com o aviso de que a jornada é pessoal |
| Meus estudos / Curso | Cards com %. No curso: abas Aulas, Materiais, Presença (grade de frequência) e Calendário |
| Palestra | Player, dados, check-in, material, agenda, compartilhar, avaliar a anterior |
| Avaliação (NPS) | Escala 0–10, estrelas para Conteúdo, Clareza e Aplicabilidade, 2 campos abertos, enviar e confirmação |
| CEAK IA | Aviso, 5 sugestões, chat com "Fonte consultada" e input fixo |
| Agenda, Biblioteca, Notificações, Perfil | Listas e filtros. Perfil com atalhos e Sair |
| Lives, Quero ajudar, Doação PIX, Preciso de ajuda, Loja | Versões mobile dos fluxos do site. Doação e assistência têm confirmação animada |

### 3. CEAK Gestão (`CEAK Gestao.dc.html`)
Sidebar (240px, bege) agrupada em: Visão Geral · Pessoas e atividades · Comunicação · Solidário e finanças · Serviço · Inteligência · Sistema. Abaixo de 900px vira gaveta sobreposta. O topbar tem Menu, busca, **seletor de perfil de acesso**, Alertas (dropdown) e usuário.

| Módulo | Conteúdo |
|---|---|
| Login | Painel verde institucional, e-mail, senha, recuperar senha |
| Visão Geral (Command Center) | 7 KPIs (Pessoas 1.284, Membros ativos 382, Visitantes 214, Check-ins 1.472, Eventos 23, Alunos 147, Voluntários 68), engajamento (12 semanas, NPS 72, avaliação 4,7), alertas, financeiro, aprovações, saúde do sistema, Loja, Conteúdo, Automações |
| Pessoas e Perfil 360° | Abas Membros, Visitantes, Voluntários, Instrutores e Diretoria. Tabela com nome, perfil, última visita, check-ins, estudos e status. O perfil mostra dados, jornada, check-ins, estudos, eventos, voluntariado, contribuições, avaliações e solicitações |
| Agenda | Calendário mensal com eventos por dia e tabela de atividades |
| Eventos | Lista e detalhe (KPIs, avaliações, comentários, status do fluxo da palestra) |
| Estudos | KPIs, tabela de turmas (clicável) e alunos da turma com frequência |
| Conteúdo | KPIs (34/12/8/1), pipeline IA, Rascunho, Revisão humana, Aprovação, Publicação, tabela (título, fonte, canal, status, data, responsável) e calendário editorial semanal com filtro por canal |
| Editor de conteúdo | Título, texto original (transcrição), abas Blog, Facebook, Instagram e Google Business, resumo, SEO, tags, imagem, fontes. Ações Editar, Rejeitar, Agendar e Aprovar, depois "Publicar" |
| Comunicação | Composer (Push, E-mail, WhatsApp), público, agendamento, "Gerar com IA", "Enviar para aprovação" e histórico |
| Doações | KPIs, campanhas com progresso, doações recentes com recibo |
| Financeiro | Abas: Dashboard (5 KPIs, receita × despesa, fluxo, receita por origem, despesa por categoria), Contas a pagar, Contas a receber, Fluxo de caixa, Categorias (realizado × orçado), Centros de custo, Conciliação (extrato × sistema) e Relatórios |
| Loja | KPIs (215/78/R$ 4.820/R$ 61,79), pedidos e mais vendidos |
| Estoque | Alerta de mínimo, filtros por categoria, saldos e movimentações |
| Voluntariado | 68 ativos, 6 áreas, banco de habilidades |
| Assistência | KPIs (8/12/15/42), solicitações e aviso de sigilo |
| CEAK IA | Copiloto com 4 sugestões, respostas com tabela e fontes, rascunho enviado à aprovação |
| Automações | KPIs (438/426/12/97,2%/31h), tabela (automação, gatilho, ação, status com toggle, última execução) e fluxo completo da palestra (15 passos, com as decisões humanas em destaque) |
| Aprovações | 6 contadores clicáveis (filtro) e lista com Aprovar, Editar e Rejeitar. Cada decisão gera registro de auditoria |
| BI | 11 abas (Executivo, Financeiro, Pessoas, Eventos, Estudos, Loja, Doações, Comunicação, Conteúdo, IA, Automação), cada uma com KPIs, gráfico e destaques |
| Logs Center | Filtros por categoria e console mono (timestamp, nível, categoria, mensagem, usuário, status, latência). Aba Auditoria com valores antes e depois |
| Sistema e Integrações | 9 serviços (Website, App, API, Banco, IA, Push, Facebook, Instagram, Google) com status. Integrações Conectado/Atenção/Erro com Configurar ou Reconectar |
| Configurações | Instituição, matriz de perfis × módulos, usuários, Segurança e LGPD |

## Regras de negócio essenciais
1. **Aprovação humana obrigatória.** Conteúdo gerado por IA ou robô segue sempre o fluxo `capturado → processando → rascunho IA → revisão → aprovado → agendado → publicado` (ou `erro`). Nada institucional é publicado sem aprovação de um responsável.
2. **Fluxo da palestra:** criada, IA gera descrição, conteúdo social, humano aprova, posts agendados, push antes do evento, check-in, palestra, gravação, NPS, IA resume, artigo e post, humano aprova, publicação.
3. **Perfis de acesso.** Os menus e dados mudam conforme o perfil. Matriz de módulos permitidos:
   - **Administrador:** todos.
   - **Diretoria:** Visão Geral, Pessoas, Agenda, Eventos, Estudos, Conteúdo, Doações, Financeiro, Loja, Voluntariado, Assistência, IA, Aprovações, BI.
   - **Tesouraria:** Visão Geral, Doações, Financeiro, Loja, Estoque, Aprovações, BI.
   - **Secretaria:** Visão Geral, Pessoas, Agenda, Eventos, Conteúdo, Comunicação, Aprovações.
   - **Coordenador:** Visão Geral, Pessoas, Agenda, Eventos, Estudos, Voluntariado, Assistência.
   - **Instrutor:** Visão Geral, Agenda, Estudos, Pessoas (só os seus alunos).
   - **Voluntário:** Visão Geral, Agenda, Voluntariado, Assistência (só a escala).
   - **Membro e Visitante:** sem acesso ao Gestão, usam o App.
4. **Assistência:** dados sensíveis visíveis só para a coordenação de assistência, com todo acesso auditado.
5. **Minha jornada:** pessoal, sem ranking público.
6. **IA:** sempre cita a fonte e encaminha questões pessoais ao atendimento fraterno.
7. **Estoque:** pedido pago baixa o estoque automaticamente e o saldo abaixo do mínimo gera alerta.
8. **Financeiro:** status de contas `pendente | aprovado | pago | vencido | cancelado`. Toda alteração de lançamento é auditada.

## Modelo de dados sugerido (entidades)
`Pessoa` (perfil, consentimento LGPD) · `Usuario` (perfil de acesso) · `Evento` (tipo, palestrante, local, transmissão, gravação) · `Inscricao` · `Checkin` · `Avaliacao` (nps, conteudo, clareza, aplicabilidade, textos) · `Curso` / `Turma` / `Aula` / `Material` / `Presenca` · `Conteudo` (status, canal, fonte, versões por canal) · `Aprovacao` (tipo, item, decisão, responsável) · `Comunicacao` (canal, público, agendamento, métricas) · `Doacao` (valor ou item, forma, destino, recorrência, recibo) · `Campanha` · `Produto` (origem, estado) / `Pedido` / `ItemPedido` · `ItemEstoque` / `Movimentacao` · `Lancamento` (pagar/receber, categoria, centro de custo, status) · `ExtratoLinha` (conciliação) · `Voluntario` / `Area` / `Habilidade` / `Escala` · `SolicitacaoAssistencia` (tipo, data, atendente, status, relato restrito) · `Automacao` / `Execucao` · `Log` · `Auditoria` (antes/depois, usuário, IP) · `Integracao` (status, token, expiração) · `Notificacao`.

## Interações e estado (referência dos protótipos)
- **Navegação:** cada protótipo usa estado interno (`page`/`screen`) e aceita `#hash` para abrir uma tela direto (ex.: `CEAK App.dc.html#checkin`). Na implementação real, use rotas.
- **Estado relevante:**
  - Site: filtro da agenda, evento selecionado, etapa do fluxo de atendimento (0–5), valor e recorrência da doação, carrinho (`[{produto, qtd}]`), categoria da loja, busca da biblioteca.
  - App: etapa do check-in (0, 1, 2), nota NPS e estrelas, mensagens da IA, aba do curso.
  - Gestão: perfil, módulo, aba financeira, status do editor (Revisão, Aprovado, Publicado ou Rejeitado), itens aprovados, automações pausadas, filtros.
- **Feedback:**
  - Toast escuro no canto inferior direito por 2,6s após aprovar ou rejeitar.
  - Círculo de sucesso animado nas confirmações.
  - Estados vazios com borda tracejada.
- **Responsivo:**
  - Grids com `auto-fill/auto-fit minmax()`.
  - Layouts de 2 colunas em `flex-wrap` (principal `flex:2 1 520px`, lateral `flex:1 1 300px`).
  - Tabelas com rolagem horizontal.
  - Alvos de toque no App de 44px ou mais.

## Assets
- **Logo:** provisório ("AK" em círculo verde). Substituir pelo logo oficial.
- **Fotos:** todas são placeholders listrados com a legenda do que deve entrar (fachada/salão, triagem de roupas, grupo de estudo, produtos, diretoria, mapa).
- **QR Code PIX:** placeholder. Gerar o BR Code dinâmico pelo PSP.
- **Ícones:** não definidos. Sugestão: Lucide ou Phosphor em traço fino, tamanho 18–20px, cor `muted` ou `green`.
- **Referências institucionais:**
  - Facebook https://www.facebook.com/CEAKDEPENAPOLIS
  - Instagram https://www.instagram.com/ceakpenapolis/
  - Google https://share.google/ELrVUYHEiXnuNoDge
  - Domínio pretendido: `allankardecpenapolis.com.br`

## Pendências de conteúdo (dados fictícios no protótipo)
Endereço, CNPJ, telefone, chave PIX, nomes da diretoria, histórico e linha do tempo, programação semanal real, fotos e logo.

## Arquivos
- `prototipos/CEAK Digital.dc.html`: visão geral e jornadas.
- `prototipos/CEAK Site.dc.html`: site público.
- `prototipos/CEAK App.dc.html`: PWA.
- `prototipos/CEAK Gestao.dc.html`: SaaS administrativo.
- `prototipos/support.js`: runtime necessário para abrir os `.dc.html`.
- `offline/*.html`: versões autocontidas para abrir sem servidor.

## Ordem de implementação sugerida
1. Monorepo, pacote `ui` com os tokens e componentes base (Button, Chip, Card, Pill, KPI, Table, Tabs, Input, Stepper, SuccessMark), autenticação e perfis.
2. Site público: home, agenda, palestra, Preciso de ajuda, Quero ajudar, doação PIX.
3. PWA: login, home, check-in (QR), jornada, estudos, NPS, push.
4. Gestão: Command Center, pessoas, eventos, financeiro (pagar/receber), aprovações e conteúdo.
5. Automation Engine, integrações sociais, IA com RAG, BI, logs e auditoria.
6. Loja e estoque, conciliação bancária, relatórios.
