-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('event_creator', 'sponsor');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'contacted', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "event_proposals" (
    "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "type"                "ProposalType" NOT NULL DEFAULT 'event_creator',
    "status"              "ProposalStatus" NOT NULL DEFAULT 'pending',
    "company_name"        VARCHAR(200) NOT NULL,
    "cnpj"                VARCHAR(20),
    "contact_name"        VARCHAR(200) NOT NULL,
    "contact_email"       VARCHAR(255) NOT NULL,
    "event_type"          VARCHAR(100),
    "event_date"          VARCHAR(20),
    "city"                VARCHAR(100),
    "budget"              VARCHAR(100),
    "services"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "sponsorship_package" VARCHAR(100),
    "message"             TEXT,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_proposals_type_idx" ON "event_proposals"("type");

-- CreateIndex
CREATE INDEX "event_proposals_status_idx" ON "event_proposals"("status");

-- CreateIndex
CREATE INDEX "event_proposals_created_at_idx" ON "event_proposals"("created_at");
