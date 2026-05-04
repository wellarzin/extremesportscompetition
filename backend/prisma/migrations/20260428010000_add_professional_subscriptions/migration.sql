-- CreateEnum
CREATE TYPE "ProfessionalSubscriptionStatus" AS ENUM ('pending_payment', 'active', 'cancelled', 'past_due');

-- CreateTable
CREATE TABLE "professional_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "education" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "registration_type" VARCHAR(20) NOT NULL,
    "bio" TEXT,
    "photo_url" TEXT,
    "billing_id" TEXT,
    "checkout_url" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "status" "ProfessionalSubscriptionStatus" NOT NULL DEFAULT 'pending_payment',
    "professional_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_subscription_specialties" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "specialty" "ProfessionalSpecialty" NOT NULL,
    "notes" VARCHAR(255),

    CONSTRAINT "professional_subscription_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_subscriptions_user_id_key" ON "professional_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_subscriptions_registration_number_key" ON "professional_subscriptions"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "professional_subscriptions_professional_id_key" ON "professional_subscriptions"("professional_id");

-- CreateIndex
CREATE INDEX "professional_subscriptions_status_idx" ON "professional_subscriptions"("status");

-- CreateIndex
CREATE INDEX "professional_subscriptions_billing_id_idx" ON "professional_subscriptions"("billing_id");

-- CreateIndex
CREATE INDEX "professional_subscription_specialties_subscription_id_idx" ON "professional_subscription_specialties"("subscription_id");

-- AddForeignKey
ALTER TABLE "professional_subscriptions" ADD CONSTRAINT "professional_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscriptions" ADD CONSTRAINT "professional_subscriptions_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscription_specialties" ADD CONSTRAINT "professional_subscription_specialties_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "professional_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
