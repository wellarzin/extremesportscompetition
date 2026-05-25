-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'organizer', 'professional', 'admin');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('cpf', 'rg');

-- CreateEnum
CREATE TYPE "ShirtSize" AS ENUM ('PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'PP_BABY', 'P_BABY', 'M_BABY', 'G_BABY', 'GG_BABY', 'XG_BABY', 'XXG_BABY');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('fundamental_incompleto', 'fundamental_completo', 'medio_incompleto', 'medio_completo', 'tecnico', 'superior_incompleto', 'superior_completo', 'pos_graduacao', 'mestrado', 'doutorado');

-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('trabalhador_autonomo', 'educador_fisico', 'nutricionista', 'pedagogo', 'professor', 'profissional_ti', 'medico', 'enfermeiro', 'fisioterapeuta', 'psicologo', 'advogado', 'engenheiro', 'administrador', 'estudante', 'outros');

-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('corrida', 'ciclismo', 'natacao', 'caminhada', 'volei', 'basquete', 'beach_tennis', 'patins', 'skate', 'crossfit', 'academia', 'escoteiro', 'outros');

-- CreateEnum
CREATE TYPE "SportLevel" AS ENUM ('iniciante', 'amador', 'competitivo', 'federado');

-- CreateEnum
CREATE TYPE "PracticeTime" AS ENUM ('menos_de_1_ano', '1_a_3_anos', '3_a_5_anos', '5_a_10_anos', 'mais_de_10_anos');

-- CreateEnum
CREATE TYPE "EducationSubject" AS ENUM ('portugues', 'matematica', 'historia', 'geografia', 'fisica', 'quimica', 'artes', 'biologia', 'ingles', 'educacao_fisica', 'filosofia', 'sociologia', 'outros');

-- CreateEnum
CREATE TYPE "EducationRole" AS ENUM ('estudante', 'professor', 'mestre', 'doutor', 'estudioso');

-- CreateEnum
CREATE TYPE "CultureArea" AS ENUM ('danca', 'fotografia', 'pintura_em_quadros', 'design_desenhista', 'arte_de_rua', 'musica', 'literatura', 'cinema', 'teatro', 'artesanato', 'outros');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('maratona', 'trail', 'ultramaratona', 'campeonato_crossfit', 'campeonato_natacao', 'campeonato_ciclismo', 'campeonato_volei', 'campeonato_basquete', 'beach_tennis', 'corrida_de_obstaculos', 'desafio_aberto', 'evento_recreativo', 'outros');

-- CreateEnum
CREATE TYPE "EventModality" AS ENUM ('presencial', 'online');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('aberto', 'encerrado', 'esgotado', 'em_breve', 'cancelado');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ativo', 'cancelado', 'usado');

-- CreateEnum
CREATE TYPE "RankingBadge" AS ENUM ('ouro', 'prata', 'bronze');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('event_creator', 'sponsor');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'contacted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ProfessionalSubscriptionStatus" AS ENUM ('pending_payment', 'active', 'cancelled', 'past_due');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('atletas', 'eventos', 'patrocinio', 'plataforma');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('vestuario', 'acessorios', 'equipamentos', 'nutricao', 'outros');

-- CreateEnum
CREATE TYPE "StoreOrderStatus" AS ENUM ('pending_payment', 'paid', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "TeamPurchaseStatus" AS ENUM ('pending', 'paid', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "ProfessionalSpecialty" AS ENUM ('hipertrofia', 'emagrecimento', 'funcional', 'resistencia', 'flexibilidade', 'reabilitacao', 'performance', 'nutricao_esportiva', 'suplementacao', 'psicologia_esportiva', 'preparacao_fisica', 'treinamento_de_forca', 'corrida_e_endurance', 'natacao', 'ciclismo', 'artes_marciais', 'crossfit', 'outros');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "photo_url" TEXT,
    "birth_date" DATE NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "document_number_hash" TEXT NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "number" VARCHAR(10) NOT NULL,
    "complement" VARCHAR(100),
    "weight_kg" DECIMAL(5,2),
    "height_cm" INTEGER,
    "shirt_size" "ShirtSize" NOT NULL,
    "shoe_size" DECIMAL(4,1),
    "education_level" "EducationLevel" NOT NULL,
    "profession" "Profession" NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "consent_version" VARCHAR(10),
    "consent_given_at" TIMESTAMP(3),
    "delivery_proof_url" TEXT,
    "deletion_requested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family" UUID NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "new_email" VARCHAR(255) NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sport_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sport" "Sport" NOT NULL,
    "level" "SportLevel" NOT NULL,
    "practice_time" "PracticeTime" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sport_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_education_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" "EducationSubject" NOT NULL,
    "education_role" "EducationRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_education_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_culture_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "culture_area" "CultureArea" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_culture_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "cover_image_url" TEXT,
    "category" "EventCategory" NOT NULL,
    "modality" "EventModality" NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "rules" TEXT,
    "location" VARCHAR(255),
    "city" VARCHAR(100),
    "state" CHAR(2),
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'aberto',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "ranking_points" INTEGER,
    "reward" TEXT NOT NULL DEFAULT 'A definir',
    "rules_file_url" TEXT,
    "note" TEXT,
    "allow_team_purchase" BOOLEAN NOT NULL DEFAULT false,
    "requires_professional_choice" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ativo',
    "price_paid_cents" INTEGER NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),
    "team_purchase_id" UUID,
    "uses_platform_professional" BOOLEAN,
    "external_cref" VARCHAR(60),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "billing_id" TEXT NOT NULL,
    "checkout_url" TEXT NOT NULL,
    "pix_code" TEXT,
    "method" VARCHAR(20) NOT NULL DEFAULT 'pix',
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "ticket_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "prof_uses_platform" BOOLEAN,
    "prof_external_cref" VARCHAR(60),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "photo_url" TEXT,
    "full_name" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "education" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "registration_type" VARCHAR(20) NOT NULL,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "cover_image_url" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_specialties" (
    "id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "specialty" "ProfessionalSpecialty" NOT NULL,
    "notes" VARCHAR(255),

    CONSTRAINT "professional_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sport" "Sport" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "badge" "RankingBadge",
    "events_participated" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_proposals" (
    "id" UUID NOT NULL,
    "type" "ProposalType" NOT NULL DEFAULT 'event_creator',
    "status" "ProposalStatus" NOT NULL DEFAULT 'pending',
    "company_name" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(20),
    "contact_name" VARCHAR(200) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100),
    "event_date" VARCHAR(20),
    "city" VARCHAR(100),
    "budget" VARCHAR(100),
    "services" TEXT[],
    "sponsorship_package" VARCHAR(100),
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_proposals_pkey" PRIMARY KEY ("id")
);

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
    "plan_type" VARCHAR(20) NOT NULL DEFAULT 'mensal',
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

-- CreateTable
CREATE TABLE "ranking_history" (
    "id" UUID NOT NULL,
    "ranking_id" UUID NOT NULL,
    "previous_position" INTEGER NOT NULL,
    "new_position" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_purchases" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "buyer_user_id" UUID NOT NULL,
    "payment_id" UUID,
    "member_emails" TEXT[],
    "member_count" INTEGER NOT NULL,
    "uses_platform_professional" BOOLEAN,
    "external_cref" VARCHAR(60),
    "status" "TeamPurchaseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "category" "ProductCategory" NOT NULL DEFAULT 'outros',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "StoreOrderStatus" NOT NULL DEFAULT 'pending_payment',
    "total_cents" INTEGER NOT NULL,
    "billing_id" TEXT,
    "checkout_url" TEXT,
    "pix_code" TEXT,
    "method" VARCHAR(20) NOT NULL DEFAULT 'pix',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "store_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_document_number_hash_key" ON "users"("document_number_hash");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_document_number_hash_idx" ON "users"("document_number_hash");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_tokens_token_hash_key" ON "email_change_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_change_tokens_user_id_idx" ON "email_change_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_sport_preferences_user_id_idx" ON "user_sport_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_education_preferences_user_id_idx" ON "user_education_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_culture_preferences_user_id_idx" ON "user_culture_preferences"("user_id");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_featured_idx" ON "events"("featured");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_start_datetime_idx" ON "events"("start_datetime");

-- CreateIndex
CREATE INDEX "events_deleted_at_idx" ON "events"("deleted_at");

-- CreateIndex
CREATE INDEX "tickets_event_id_idx" ON "tickets"("event_id");

-- CreateIndex
CREATE INDEX "tickets_user_id_idx" ON "tickets"("user_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_team_purchase_id_idx" ON "tickets"("team_purchase_id");

-- CreateIndex
CREATE INDEX "waitlist_event_id_idx" ON "waitlist"("event_id");

-- CreateIndex
CREATE INDEX "waitlist_user_id_idx" ON "waitlist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_event_id_user_id_key" ON "waitlist"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_event_id_position_key" ON "waitlist"("event_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "payments_billing_id_key" ON "payments"("billing_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_ticket_id_key" ON "payments"("ticket_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_event_id_idx" ON "payments"("event_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_user_id_key" ON "professionals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_registration_number_key" ON "professionals"("registration_number");

-- CreateIndex
CREATE INDEX "professionals_active_idx" ON "professionals"("active");

-- CreateIndex
CREATE INDEX "professionals_deleted_at_idx" ON "professionals"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_published_published_at_idx" ON "news"("published", "published_at" DESC);

-- CreateIndex
CREATE INDEX "news_category_idx" ON "news"("category");

-- CreateIndex
CREATE INDEX "news_slug_idx" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_deleted_at_idx" ON "news"("deleted_at");

-- CreateIndex
CREATE INDEX "professional_specialties_professional_id_idx" ON "professional_specialties"("professional_id");

-- CreateIndex
CREATE INDEX "rankings_sport_points_idx" ON "rankings"("sport", "points" DESC);

-- CreateIndex
CREATE INDEX "rankings_user_id_idx" ON "rankings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_user_id_sport_key" ON "rankings"("user_id", "sport");

-- CreateIndex
CREATE INDEX "event_proposals_type_idx" ON "event_proposals"("type");

-- CreateIndex
CREATE INDEX "event_proposals_status_idx" ON "event_proposals"("status");

-- CreateIndex
CREATE INDEX "event_proposals_created_at_idx" ON "event_proposals"("created_at");

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

-- CreateIndex
CREATE INDEX "ranking_history_ranking_id_idx" ON "ranking_history"("ranking_id");

-- CreateIndex
CREATE INDEX "ranking_history_changed_at_idx" ON "ranking_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "team_purchases_payment_id_key" ON "team_purchases"("payment_id");

-- CreateIndex
CREATE INDEX "team_purchases_event_id_idx" ON "team_purchases"("event_id");

-- CreateIndex
CREATE INDEX "team_purchases_buyer_user_id_idx" ON "team_purchases"("buyer_user_id");

-- CreateIndex
CREATE INDEX "team_purchases_status_idx" ON "team_purchases"("status");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_deleted_at_idx" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "store_orders_user_id_idx" ON "store_orders"("user_id");

-- CreateIndex
CREATE INDEX "store_orders_status_idx" ON "store_orders"("status");

-- CreateIndex
CREATE INDEX "store_orders_billing_id_idx" ON "store_orders"("billing_id");

-- CreateIndex
CREATE INDEX "store_order_items_order_id_idx" ON "store_order_items"("order_id");

-- CreateIndex
CREATE INDEX "store_order_items_product_id_idx" ON "store_order_items"("product_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_change_tokens" ADD CONSTRAINT "email_change_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sport_preferences" ADD CONSTRAINT "user_sport_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_education_preferences" ADD CONSTRAINT "user_education_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_culture_preferences" ADD CONSTRAINT "user_culture_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_team_purchase_id_fkey" FOREIGN KEY ("team_purchase_id") REFERENCES "team_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_specialties" ADD CONSTRAINT "professional_specialties_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscriptions" ADD CONSTRAINT "professional_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscriptions" ADD CONSTRAINT "professional_subscriptions_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_subscription_specialties" ADD CONSTRAINT "professional_subscription_specialties_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "professional_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_purchases" ADD CONSTRAINT "team_purchases_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_purchases" ADD CONSTRAINT "team_purchases_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_purchases" ADD CONSTRAINT "team_purchases_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

