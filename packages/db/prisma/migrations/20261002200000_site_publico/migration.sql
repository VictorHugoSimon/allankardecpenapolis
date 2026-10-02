-- CreateEnum
CREATE TYPE "TipoItemBiblioteca" AS ENUM ('LIVRO', 'PDF', 'ARTIGO', 'VIDEO', 'AUDIO', 'PALESTRA');

-- CreateEnum
CREATE TYPE "TipoIntencaoAjuda" AS ENUM ('ALIMENTOS', 'ROUPAS', 'PRODUTOS', 'VOLUNTARIO', 'EVENTOS', 'HABILIDADE');

-- AlterTable
ALTER TABLE "campanha" ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "conteudo" ADD COLUMN     "autor_exibicao" TEXT,
ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "lead" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "curso" ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "encontros" TEXT,
ADD COLUMN     "status_inscricao" TEXT,
ADD COLUMN     "tag" TEXT;

-- AlterTable
ALTER TABLE "doacao" ADD COLUMN     "doador_email" TEXT;

-- AlterTable
ALTER TABLE "evento" ADD COLUMN     "gravacao_duracao_min" INTEGER;

-- AlterTable
ALTER TABLE "inscricao" ADD COLUMN     "curso_id" UUID,
ALTER COLUMN "evento_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "solicitacao_assistencia" ADD COLUMN     "vaga_id" UUID;

-- CreateTable
CREATE TABLE "vaga_assistencia" (
    "id" UUID NOT NULL,
    "tipo" "TipoAssistencia",
    "inicio" TIMESTAMP(3) NOT NULL,
    "vagas" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vaga_assistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_biblioteca" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "tipo" "TipoItemBiblioteca" NOT NULL,
    "tema" TEXT NOT NULL,
    "assuntos" TEXT[],
    "curso" TEXT,
    "url" TEXT,
    "emprestimo" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestacao_contas" (
    "id" UUID NOT NULL,
    "mes" DATE NOT NULL,
    "receitas_centavos" INTEGER NOT NULL,
    "despesas_centavos" INTEGER NOT NULL,
    "origens" JSONB NOT NULL,
    "aplicacoes" JSONB NOT NULL,
    "impacto" JSONB NOT NULL,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "aprovada_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestacao_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_transparencia" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "url" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_transparencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem_contato" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "respondida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagem_contato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intencao_ajuda" (
    "id" UUID NOT NULL,
    "tipo" "TipoIntencaoAjuda" NOT NULL,
    "pessoa_id" UUID,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "habilidades" TEXT[],
    "mensagem" TEXT,
    "atendida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intencao_ajuda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vaga_assistencia_inicio_idx" ON "vaga_assistencia"("inicio");

-- CreateIndex
CREATE UNIQUE INDEX "prestacao_contas_mes_key" ON "prestacao_contas"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "conteudo_slug_key" ON "conteudo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "inscricao_curso_id_pessoa_id_key" ON "inscricao"("curso_id", "pessoa_id");

-- AddForeignKey
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_assistencia" ADD CONSTRAINT "solicitacao_assistencia_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "vaga_assistencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── RLS das novas tabelas com dados pessoais ──────────────────────────
ALTER TABLE "mensagem_contato" ENABLE ROW LEVEL SECURITY;
CREATE POLICY contato_insert ON "mensagem_contato" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY contato_select ON "mensagem_contato" FOR SELECT TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA'));
CREATE POLICY contato_update ON "mensagem_contato" FOR UPDATE TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA'));

ALTER TABLE "intencao_ajuda" ENABLE ROW LEVEL SECURITY;
CREATE POLICY intencao_insert ON "intencao_ajuda" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY intencao_select ON "intencao_ajuda" FOR SELECT TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'COORDENADOR'));
CREATE POLICY intencao_update ON "intencao_ajuda" FOR UPDATE TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'COORDENADOR'));

-- Prestação de contas: só a publicada é pública; rascunhos só para quem tem o financeiro.
ALTER TABLE "prestacao_contas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY prestacao_select ON "prestacao_contas" FOR SELECT TO ceak_app
  USING (publicada OR app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'));
CREATE POLICY prestacao_write ON "prestacao_contas" FOR ALL TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'))
  WITH CHECK (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'));
