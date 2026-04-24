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
CREATE TYPE "TicketStatus" AS ENUM ('ativo', 'cancelado', 'usado');

-- CreateEnum
CREATE TYPE "RankingBadge" AS ENUM ('ouro', 'prata', 'bronze');

-- CreateEnum
CREATE TYPE "ProfessionalSpecialty" AS ENUM ('hipertrofia', 'emagrecimento', 'funcional', 'resistencia', 'flexibilidade', 'reabilitacao', 'performance', 'nutricao_esportiva', 'suplementacao', 'psicologia_esportiva', 'preparacao_fisica', 'treinamento_de_forca', 'corrida_e_endurance', 'natacao', 'ciclismo', 'artes_marciais', 'crossfit', 'outros');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "photo_url" TEXT,
    "birth_date" DATE NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" VARCHAR(20) NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
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
    "ranking_points" INTEGER,
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
CREATE TABLE "ranking_history" (
    "id" UUID NOT NULL,
    "ranking_id" UUID NOT NULL,
    "previous_position" INTEGER NOT NULL,
    "new_position" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_document_number_key" ON "users"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_document_number_idx" ON "users"("document_number");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

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
CREATE INDEX "waitlist_event_id_idx" ON "waitlist"("event_id");

-- CreateIndex
CREATE INDEX "waitlist_user_id_idx" ON "waitlist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_event_id_user_id_key" ON "waitlist"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_event_id_position_key" ON "waitlist"("event_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_user_id_key" ON "professionals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_registration_number_key" ON "professionals"("registration_number");

-- CreateIndex
CREATE INDEX "professionals_active_idx" ON "professionals"("active");

-- CreateIndex
CREATE INDEX "professionals_registration_number_idx" ON "professionals"("registration_number");

-- CreateIndex
CREATE INDEX "professionals_deleted_at_idx" ON "professionals"("deleted_at");

-- CreateIndex
CREATE INDEX "professional_specialties_professional_id_idx" ON "professional_specialties"("professional_id");

-- CreateIndex
CREATE INDEX "rankings_sport_points_idx" ON "rankings"("sport", "points" DESC);

-- CreateIndex
CREATE INDEX "rankings_user_id_idx" ON "rankings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_user_id_sport_key" ON "rankings"("user_id", "sport");

-- CreateIndex
CREATE INDEX "ranking_history_ranking_id_idx" ON "ranking_history"("ranking_id");

-- CreateIndex
CREATE INDEX "ranking_history_changed_at_idx" ON "ranking_history"("changed_at");

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
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_specialties" ADD CONSTRAINT "professional_specialties_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
