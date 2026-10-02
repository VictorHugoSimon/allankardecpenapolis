-- AlterTable
ALTER TABLE "turma" ADD COLUMN     "etapa_atual" TEXT,
ADD COLUMN     "progresso_pct" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resumo_publico" TEXT;
