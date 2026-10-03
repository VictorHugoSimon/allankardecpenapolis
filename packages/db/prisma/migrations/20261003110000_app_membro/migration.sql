-- AlterTable
ALTER TABLE "material" ADD COLUMN     "detalhe" TEXT;

-- AlterTable
ALTER TABLE "notificacao" ADD COLUMN     "categoria" TEXT NOT NULL DEFAULT 'Aviso';
