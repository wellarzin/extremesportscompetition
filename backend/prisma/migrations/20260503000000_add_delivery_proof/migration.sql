-- AlterTable: adiciona coluna de comprovante de entregas/viagens no perfil do usuário
ALTER TABLE "users" ADD COLUMN "delivery_proof_url" TEXT;
