-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "perfis_extras" "Perfil"[] DEFAULT ARRAY[]::"Perfil"[];
