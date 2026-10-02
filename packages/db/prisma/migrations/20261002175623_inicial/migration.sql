-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA', 'SECRETARIA', 'COORDENADOR', 'INSTRUTOR', 'VOLUNTARIO', 'MEMBRO', 'VISITANTE');

-- CreateEnum
CREATE TYPE "StatusPessoa" AS ENUM ('ATIVO', 'NOVO', 'AUSENTE', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('PALESTRA', 'ESTUDO', 'CURSO', 'EVENTO', 'ASSISTENCIA', 'CAMPANHA');

-- CreateEnum
CREATE TYPE "StatusEvento" AS ENUM ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'CONFIRMADO', 'EM_ANDAMENTO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EtapaFluxoPalestra" AS ENUM ('CRIADA', 'DESCRICAO_IA', 'CONTEUDO_SOCIAL', 'APROVACAO_DIVULGACAO', 'POSTS_AGENDADOS', 'PUSH_ENVIADO', 'CHECKIN_ABERTO', 'REALIZADA', 'GRAVACAO_DISPONIVEL', 'NPS_ENVIADO', 'RESUMO_IA', 'ARTIGO_E_POST', 'APROVACAO_PUBLICACAO', 'PUBLICADA');

-- CreateEnum
CREATE TYPE "OrigemCheckin" AS ENUM ('QR', 'MANUAL', 'RECEPCAO');

-- CreateEnum
CREATE TYPE "StatusTurma" AS ENUM ('ATIVA', 'EM_RISCO', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('ATIVA', 'EM_RISCO', 'CONCLUIDA', 'TRANCADA');

-- CreateEnum
CREATE TYPE "TipoMaterial" AS ENUM ('PDF', 'VIDEO', 'AUDIO', 'LINK', 'APOSTILA');

-- CreateEnum
CREATE TYPE "StatusConteudo" AS ENUM ('CAPTURADO', 'PROCESSANDO', 'RASCUNHO_IA', 'REVISAO', 'APROVADO', 'AGENDADO', 'PUBLICADO', 'ERRO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('BLOG', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_BUSINESS', 'YOUTUBE', 'PUSH', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TipoAprovacao" AS ENUM ('CONTEUDO', 'FINANCEIRO', 'CAMPANHA', 'COMUNICACAO', 'PRODUTO', 'IA', 'EVENTO');

-- CreateEnum
CREATE TYPE "DecisaoAprovacao" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "StatusComunicacao" AS ENUM ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'AGENDADO', 'ENVIADO', 'ERRO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaDoacao" AS ENUM ('PIX', 'PIX_RECORRENTE', 'ENTREGA', 'DINHEIRO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('AGUARDANDO', 'PAGO', 'EXPIRADO', 'CANCELADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "StatusCampanha" AS ENUM ('RASCUNHO', 'ATIVA', 'ENCERRADA', 'AGENDADA');

-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('UN', 'KG', 'PECA', 'CESTA', 'REAIS');

-- CreateEnum
CREATE TYPE "OrigemProduto" AS ENUM ('DOADO', 'FEITO_POR_VOLUNTARIAS', 'LIVRARIA');

-- CreateEnum
CREATE TYPE "EstadoProduto" AS ENUM ('NOVO', 'SEMINOVO', 'USADO_OTIMO', 'USADO_BOM');

-- CreateEnum
CREATE TYPE "StatusProduto" AS ENUM ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'ATIVO', 'ESGOTADO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('AGUARDANDO_PIX', 'PAGO', 'AGUARDANDO_RETIRADA', 'RETIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaEstoque" AS ENUM ('ALIMENTOS', 'LOJA', 'LIMPEZA', 'DOACOES');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('PAGAR', 'RECEBER');

-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('PENDENTE', 'APROVADO', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusConciliacao" AS ENUM ('PENDENTE', 'SUGERIDO', 'CONCILIADO', 'DIVERGENTE');

-- CreateEnum
CREATE TYPE "TipoAssistencia" AS ENUM ('ATENDIMENTO_FRATERNO', 'PASSE', 'TRATAMENTO_ESPIRITUAL', 'PRECE', 'ORIENTACAO', 'EVANGELHO_NO_LAR');

-- CreateEnum
CREATE TYPE "StatusAssistencia" AS ENUM ('PENDENTE', 'AGENDADA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusExecucao" AS ENUM ('EM_EXECUCAO', 'SUCESSO', 'FALHA');

-- CreateEnum
CREATE TYPE "NivelLog" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "CategoriaLog" AS ENUM ('APLICACAO', 'SEGURANCA', 'AUDITORIA', 'FINANCEIRO', 'IA', 'AUTOMACAO', 'INTEGRACOES', 'NOTIFICACOES');

-- CreateEnum
CREATE TYPE "StatusIntegracao" AS ENUM ('CONECTADO', 'ATENCAO', 'ERRO', 'DESCONECTADO');

-- CreateEnum
CREATE TYPE "CanalCodigo" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateTable
CREATE TABLE "pessoa" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "nascimento" DATE,
    "cidade" TEXT,
    "perfil" "Perfil" NOT NULL DEFAULT 'VISITANTE',
    "status" "StatusPessoa" NOT NULL DEFAULT 'NOVO',
    "primeira_visita_em" TIMESTAMP(3),
    "membro_desde" TIMESTAMP(3),
    "consentimento_em" TIMESTAMP(3),
    "consentimento_versao" TEXT,
    "exclusao_solicitada_em" TIMESTAMP(3),
    "anonimizada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "coord_assistencia" BOOLEAN NOT NULL DEFAULT false,
    "auth_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dois_fatores" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_acesso_em" TIMESTAMP(3),
    "tentativas_falhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credencial" (
    "usuario_id" UUID NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credencial_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "codigo_acesso" (
    "id" UUID NOT NULL,
    "destino" TEXT NOT NULL,
    "canal" "CanalCodigo" NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "status" "StatusEvento" NOT NULL DEFAULT 'RASCUNHO',
    "etapa_fluxo" "EtapaFluxoPalestra",
    "descricao" TEXT,
    "resumo" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "local" TEXT,
    "palestrante_id" UUID,
    "responsavel" TEXT,
    "transmissao_url" TEXT,
    "gravacao_url" TEXT,
    "material_url" TEXT,
    "inscricao_aberta" BOOLEAN NOT NULL DEFAULT true,
    "vagas" INTEGER,
    "publico" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricao" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "primeira_vez" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "evento_id" UUID,
    "origem" "OrigemCheckin" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "pessoa_id" UUID,
    "nps" INTEGER NOT NULL,
    "conteudo" INTEGER,
    "clareza" INTEGER,
    "aplicabilidade" INTEGER,
    "comentario" TEXT,
    "sugestao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curso" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "descricao" TEXT,
    "publico" TEXT,
    "duracao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma" (
    "id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "instrutor_id" UUID,
    "encontros" TEXT NOT NULL,
    "progresso" TEXT,
    "status" "StatusTurma" NOT NULL DEFAULT 'ATIVA',
    "inicio" DATE,
    "fim" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aula" (
    "id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "evento_id" UUID,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "modulo" TEXT,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" UUID NOT NULL,
    "curso_id" UUID,
    "aula_id" UUID,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoMaterial" NOT NULL,
    "url" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matricula" (
    "id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "status" "StatusMatricula" NOT NULL DEFAULT 'ATIVA',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presenca" (
    "id" UUID NOT NULL,
    "aula_id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquista" (
    "id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conquista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conquista_pessoa" (
    "pessoa_id" UUID NOT NULL,
    "conquista_id" UUID NOT NULL,
    "obtida_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conquista_pessoa_pkey" PRIMARY KEY ("pessoa_id","conquista_id")
);

-- CreateTable
CREATE TABLE "conteudo" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,
    "texto_original" TEXT,
    "resumo" TEXT,
    "seo_titulo" TEXT,
    "seo_descricao" TEXT,
    "tags" TEXT[],
    "imagem_url" TEXT,
    "fontes" TEXT[],
    "status" "StatusConteudo" NOT NULL DEFAULT 'CAPTURADO',
    "gerado_por_ia" BOOLEAN NOT NULL DEFAULT false,
    "agendado_para" TIMESTAMP(3),
    "publicado_em" TIMESTAMP(3),
    "erro" TEXT,
    "evento_id" UUID,
    "responsavel_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteudo_versao" (
    "id" UUID NOT NULL,
    "conteudo_id" UUID NOT NULL,
    "canal" "Canal" NOT NULL,
    "texto" TEXT NOT NULL,
    "publicado_em" TIMESTAMP(3),
    "id_externo" TEXT,
    "url_externa" TEXT,
    "erro" TEXT,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteudo_versao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aprovacao" (
    "id" UUID NOT NULL,
    "tipo" "TipoAprovacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "detalhe" TEXT,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "decisao" "DecisaoAprovacao" NOT NULL DEFAULT 'PENDENTE',
    "comentario" TEXT,
    "solicitante_id" UUID,
    "responsavel_id" UUID,
    "conteudo_id" UUID,
    "decidido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aprovacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicacao" (
    "id" UUID NOT NULL,
    "canal" "Canal" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "publico" TEXT NOT NULL,
    "filtro" JSONB,
    "status" "StatusComunicacao" NOT NULL DEFAULT 'RASCUNHO',
    "agendado_para" TIMESTAMP(3),
    "enviado_em" TIMESTAMP(3),
    "enviados" INTEGER NOT NULL DEFAULT 0,
    "aberturas" INTEGER NOT NULL DEFAULT 0,
    "gerado_por_ia" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "url" TEXT,
    "lida_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivo_push" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivo_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanha" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusCampanha" NOT NULL DEFAULT 'ATIVA',
    "unidade" "UnidadeMedida" NOT NULL,
    "meta" INTEGER NOT NULL,
    "arrecadado" INTEGER NOT NULL DEFAULT 0,
    "inicio" DATE,
    "fim" DATE,
    "pontos_coleta" TEXT[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_campanha" (
    "id" UUID NOT NULL,
    "campanha_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "meta" INTEGER NOT NULL,
    "recebido" INTEGER NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL,

    CONSTRAINT "item_campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doacao" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID,
    "doador_nome" TEXT,
    "valor_centavos" INTEGER,
    "item_descricao" TEXT,
    "forma" "FormaDoacao" NOT NULL,
    "destino" TEXT NOT NULL,
    "campanha_id" UUID,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'AGUARDANDO',
    "cobranca_id" TEXT,
    "br_code" TEXT,
    "recibo_emitido_em" TIMESTAMP(3),
    "pago_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "preco_centavos" INTEGER NOT NULL,
    "origem" "OrigemProduto" NOT NULL,
    "estado" "EstadoProduto" NOT NULL,
    "status" "StatusProduto" NOT NULL DEFAULT 'ATIVO',
    "imagens" TEXT[],
    "item_estoque_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id" UUID NOT NULL,
    "numero" SERIAL NOT NULL,
    "pessoa_id" UUID,
    "cliente_nome" TEXT NOT NULL,
    "cliente_whatsapp" TEXT,
    "total_centavos" INTEGER NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'AGUARDANDO_PIX',
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'AGUARDANDO',
    "cobranca_id" TEXT,
    "br_code" TEXT,
    "pago_em" TIMESTAMP(3),
    "retirado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_pedido" (
    "id" UUID NOT NULL,
    "pedido_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unit_centavos" INTEGER NOT NULL,

    CONSTRAINT "item_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_estoque" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CategoriaEstoque" NOT NULL,
    "unidade" "UnidadeMedida" NOT NULL,
    "saldo" DECIMAL(12,3) NOT NULL,
    "minimo" DECIMAL(12,3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacao" (
    "id" UUID NOT NULL,
    "item_estoque_id" UUID NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "motivo" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "referencia" TEXT,
    "por" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_financeira" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "orcado_mes_centavos" INTEGER,

    CONSTRAINT "categoria_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centro_custo" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "orcado_mes_centavos" INTEGER,

    CONSTRAINT "centro_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamento" (
    "id" UUID NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "contraparte" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria_id" UUID NOT NULL,
    "centro_custo_id" UUID,
    "valor_centavos" INTEGER NOT NULL,
    "vencimento" DATE NOT NULL,
    "status" "StatusLancamento" NOT NULL DEFAULT 'PENDENTE',
    "pago_em" TIMESTAMP(3),
    "responsavel" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extrato_linha" (
    "id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "lancamento_id" UUID,
    "referencia" TEXT,
    "status" "StatusConciliacao" NOT NULL DEFAULT 'PENDENTE',
    "conciliado_em" TIMESTAMP(3),

    CONSTRAINT "extrato_linha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "necessidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilidade" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "habilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voluntario" (
    "id" UUID NOT NULL,
    "pessoa_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voluntario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voluntario_area" (
    "voluntario_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,

    CONSTRAINT "voluntario_area_pkey" PRIMARY KEY ("voluntario_id","area_id")
);

-- CreateTable
CREATE TABLE "voluntario_habilidade" (
    "voluntario_id" UUID NOT NULL,
    "habilidade_id" UUID NOT NULL,

    CONSTRAINT "voluntario_habilidade_pkey" PRIMARY KEY ("voluntario_id","habilidade_id")
);

-- CreateTable
CREATE TABLE "escala" (
    "id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "voluntario_id" UUID NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "funcao" TEXT,

    CONSTRAINT "escala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_assistencia" (
    "id" UUID NOT NULL,
    "tipo" "TipoAssistencia" NOT NULL,
    "pessoa_id" UUID,
    "nome_exibicao" TEXT NOT NULL,
    "contato" TEXT,
    "data" TIMESTAMP(3),
    "atendente_id" UUID,
    "equipe" TEXT,
    "status" "StatusAssistencia" NOT NULL DEFAULT 'PENDENTE',
    "anonimo" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_assistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relato_assistencia" (
    "solicitacao_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relato_assistencia_pkey" PRIMARY KEY ("solicitacao_id")
);

-- CreateTable
CREATE TABLE "automacao" (
    "id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "gatilho" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "exige_aprovacao" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucao" (
    "id" UUID NOT NULL,
    "automacao_id" UUID NOT NULL,
    "status" "StatusExecucao" NOT NULL,
    "entrada" JSONB,
    "saida" JSONB,
    "erro" TEXT,
    "duracao_ms" INTEGER,
    "iniciada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizada_em" TIMESTAMP(3),

    CONSTRAINT "execucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log" (
    "id" UUID NOT NULL,
    "categoria" "CategoriaLog" NOT NULL,
    "nivel" "NivelLog" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "rota" TEXT,
    "usuario_id" UUID,
    "ator" TEXT,
    "status" INTEGER,
    "latencia_ms" INTEGER,
    "contexto" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "antes" JSONB,
    "depois" JSONB,
    "ip" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integracao" (
    "id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusIntegracao" NOT NULL DEFAULT 'DESCONECTADO',
    "expira_em" TIMESTAMP(3),
    "ultimo_erro" TEXT,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integracao_segredo" (
    "integracao_id" UUID NOT NULL,
    "token_cifrado" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integracao_segredo_pkey" PRIMARY KEY ("integracao_id")
);

-- CreateTable
CREATE TABLE "configuracao" (
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_email_key" ON "pessoa"("email");

-- CreateIndex
CREATE INDEX "pessoa_perfil_idx" ON "pessoa"("perfil");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_pessoa_id_key" ON "usuario"("pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_auth_id_key" ON "usuario"("auth_id");

-- CreateIndex
CREATE INDEX "codigo_acesso_destino_canal_idx" ON "codigo_acesso"("destino", "canal");

-- CreateIndex
CREATE UNIQUE INDEX "evento_slug_key" ON "evento"("slug");

-- CreateIndex
CREATE INDEX "evento_inicio_idx" ON "evento"("inicio");

-- CreateIndex
CREATE INDEX "evento_tipo_inicio_idx" ON "evento"("tipo", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_evento_id_pessoa_id_key" ON "inscricao"("evento_id", "pessoa_id");

-- CreateIndex
CREATE INDEX "checkin_criado_em_idx" ON "checkin"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "checkin_pessoa_id_evento_id_key" ON "checkin"("pessoa_id", "evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_evento_id_pessoa_id_key" ON "avaliacao"("evento_id", "pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "curso_slug_key" ON "curso"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "aula_turma_id_numero_key" ON "aula"("turma_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "matricula_turma_id_pessoa_id_key" ON "matricula"("turma_id", "pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_aula_id_pessoa_id_key" ON "presenca"("aula_id", "pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "conquista_chave_key" ON "conquista"("chave");

-- CreateIndex
CREATE INDEX "conteudo_status_idx" ON "conteudo"("status");

-- CreateIndex
CREATE UNIQUE INDEX "conteudo_versao_conteudo_id_canal_key" ON "conteudo_versao"("conteudo_id", "canal");

-- CreateIndex
CREATE INDEX "aprovacao_decisao_tipo_idx" ON "aprovacao"("decisao", "tipo");

-- CreateIndex
CREATE INDEX "notificacao_pessoa_id_lida_em_idx" ON "notificacao"("pessoa_id", "lida_em");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivo_push_endpoint_key" ON "dispositivo_push"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "campanha_slug_key" ON "campanha"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "doacao_cobranca_id_key" ON "doacao"("cobranca_id");

-- CreateIndex
CREATE INDEX "doacao_criado_em_idx" ON "doacao"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "produto_slug_key" ON "produto"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "produto_item_estoque_id_key" ON "produto"("item_estoque_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_numero_key" ON "pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_cobranca_id_key" ON "pedido"("cobranca_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_estoque_sku_key" ON "item_estoque"("sku");

-- CreateIndex
CREATE INDEX "movimentacao_criado_em_idx" ON "movimentacao"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_financeira_nome_tipo_key" ON "categoria_financeira"("nome", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "centro_custo_nome_key" ON "centro_custo"("nome");

-- CreateIndex
CREATE INDEX "lancamento_tipo_status_vencimento_idx" ON "lancamento"("tipo", "status", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "area_nome_key" ON "area"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "habilidade_nome_key" ON "habilidade"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "voluntario_pessoa_id_key" ON "voluntario"("pessoa_id");

-- CreateIndex
CREATE INDEX "escala_inicio_idx" ON "escala"("inicio");

-- CreateIndex
CREATE INDEX "solicitacao_assistencia_status_data_idx" ON "solicitacao_assistencia"("status", "data");

-- CreateIndex
CREATE UNIQUE INDEX "automacao_chave_key" ON "automacao"("chave");

-- CreateIndex
CREATE INDEX "execucao_iniciada_em_idx" ON "execucao"("iniciada_em");

-- CreateIndex
CREATE INDEX "log_categoria_criado_em_idx" ON "log"("categoria", "criado_em");

-- CreateIndex
CREATE INDEX "log_criado_em_idx" ON "log"("criado_em");

-- CreateIndex
CREATE INDEX "auditoria_entidade_entidade_id_idx" ON "auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "auditoria_criado_em_idx" ON "auditoria"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "integracao_chave_key" ON "integracao"("chave");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_palestrante_id_fkey" FOREIGN KEY ("palestrante_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin" ADD CONSTRAINT "checkin_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin" ADD CONSTRAINT "checkin_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_instrutor_id_fkey" FOREIGN KEY ("instrutor_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "matricula_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conquista_pessoa" ADD CONSTRAINT "conquista_pessoa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conquista_pessoa" ADD CONSTRAINT "conquista_pessoa_conquista_id_fkey" FOREIGN KEY ("conquista_id") REFERENCES "conquista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudo" ADD CONSTRAINT "conteudo_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudo" ADD CONSTRAINT "conteudo_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteudo_versao" ADD CONSTRAINT "conteudo_versao_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacao" ADD CONSTRAINT "aprovacao_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacao" ADD CONSTRAINT "aprovacao_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacao" ADD CONSTRAINT "aprovacao_conteudo_id_fkey" FOREIGN KEY ("conteudo_id") REFERENCES "conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_campanha" ADD CONSTRAINT "item_campanha_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacao" ADD CONSTRAINT "doacao_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "campanha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "produto_item_estoque_id_fkey" FOREIGN KEY ("item_estoque_id") REFERENCES "item_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacao" ADD CONSTRAINT "movimentacao_item_estoque_id_fkey" FOREIGN KEY ("item_estoque_id") REFERENCES "item_estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento" ADD CONSTRAINT "lancamento_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria_financeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento" ADD CONSTRAINT "lancamento_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "centro_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extrato_linha" ADD CONSTRAINT "extrato_linha_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voluntario" ADD CONSTRAINT "voluntario_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voluntario_area" ADD CONSTRAINT "voluntario_area_voluntario_id_fkey" FOREIGN KEY ("voluntario_id") REFERENCES "voluntario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voluntario_area" ADD CONSTRAINT "voluntario_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voluntario_habilidade" ADD CONSTRAINT "voluntario_habilidade_voluntario_id_fkey" FOREIGN KEY ("voluntario_id") REFERENCES "voluntario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voluntario_habilidade" ADD CONSTRAINT "voluntario_habilidade_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escala" ADD CONSTRAINT "escala_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escala" ADD CONSTRAINT "escala_voluntario_id_fkey" FOREIGN KEY ("voluntario_id") REFERENCES "voluntario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_assistencia" ADD CONSTRAINT "solicitacao_assistencia_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_assistencia" ADD CONSTRAINT "solicitacao_assistencia_atendente_id_fkey" FOREIGN KEY ("atendente_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relato_assistencia" ADD CONSTRAINT "relato_assistencia_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacao_assistencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucao" ADD CONSTRAINT "execucao_automacao_id_fkey" FOREIGN KEY ("automacao_id") REFERENCES "automacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integracao_segredo" ADD CONSTRAINT "integracao_segredo_integracao_id_fkey" FOREIGN KEY ("integracao_id") REFERENCES "integracao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
