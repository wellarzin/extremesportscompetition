-- AlterTable
ALTER TABLE "events" ADD COLUMN "note" TEXT;

-- Observação de preço por equipe no Desafio dos Clubes
UPDATE "events"
SET "note" = 'O valor de R$ 1.200 é referente à inscrição de toda a equipe com 12 integrantes — apenas R$ 100 por atleta!'
WHERE "title" = 'Desafio dos Clubes'
  AND "deleted_at" IS NULL;
