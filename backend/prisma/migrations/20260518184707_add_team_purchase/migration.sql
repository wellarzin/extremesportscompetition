-- CreateEnum
CREATE TYPE "TeamPurchaseStatus" AS ENUM ('pending', 'paid', 'failed', 'expired');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "allow_team_purchase" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "team_purchase_id" UUID;

-- CreateTable
CREATE TABLE "team_purchases" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "buyer_user_id" UUID NOT NULL,
    "payment_id" UUID,
    "member_emails" TEXT[],
    "member_count" INTEGER NOT NULL,
    "status" "TeamPurchaseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_purchases_payment_id_key" ON "team_purchases"("payment_id");

-- CreateIndex
CREATE INDEX "team_purchases_event_id_idx" ON "team_purchases"("event_id");

-- CreateIndex
CREATE INDEX "team_purchases_buyer_user_id_idx" ON "team_purchases"("buyer_user_id");

-- CreateIndex
CREATE INDEX "team_purchases_status_idx" ON "team_purchases"("status");

-- CreateIndex
CREATE INDEX "tickets_team_purchase_id_idx" ON "tickets"("team_purchase_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_team_purchase_id_fkey" FOREIGN KEY ("team_purchase_id") REFERENCES "team_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_purchases" ADD CONSTRAINT "team_purchases_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_purchases" ADD CONSTRAINT "team_purchases_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_purchases" ADD CONSTRAINT "team_purchases_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
