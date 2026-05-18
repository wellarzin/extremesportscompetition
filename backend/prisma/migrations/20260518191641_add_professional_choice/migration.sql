-- AlterTable
ALTER TABLE "events" ADD COLUMN     "requires_professional_choice" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "prof_external_cref" VARCHAR(60),
ADD COLUMN     "prof_uses_platform" BOOLEAN;

-- AlterTable
ALTER TABLE "team_purchases" ADD COLUMN     "external_cref" VARCHAR(60),
ADD COLUMN     "uses_platform_professional" BOOLEAN;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "external_cref" VARCHAR(60),
ADD COLUMN     "uses_platform_professional" BOOLEAN;
