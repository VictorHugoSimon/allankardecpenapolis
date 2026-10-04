-- AlterTable
ALTER TABLE "credencial" ADD COLUMN     "codigos_recuperacao" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totp_ativado_em" TIMESTAMP(3),
ADD COLUMN     "totp_pendente" TEXT,
ADD COLUMN     "totp_segredo" TEXT,
ADD COLUMN     "totp_ultimo_passo" INTEGER;
