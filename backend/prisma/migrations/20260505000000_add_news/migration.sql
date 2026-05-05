-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('atletas', 'eventos', 'patrocinio', 'plataforma');

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

-- Seed: artigos iniciais
INSERT INTO "news" ("id", "slug", "title", "excerpt", "body", "category", "published", "published_at", "updated_at") VALUES
(
  gen_random_uuid(),
  'evelyn-pereira-afilia-extreme-competition',
  'Ex-campeã brasileira de atletismo assina com a Extreme Competition',
  'Evelyn Pereira, recordista no 100m com barreiras e Vice-Campeã Sul-Americana, chega à plataforma como personal trainer especializada em CrossFit e musculação.',
  'A Extreme Sports Competition anuncia com orgulho a chegada de Evelyn Pereira ao seu quadro de profissionais afiliados. Ex-atleta de alto rendimento, Evelyn construiu uma carreira de destaque nas pistas: foi Campeã Brasileira nos 100 metros com barreiras e Vice-Campeã Sul-Americana na mesma prova no ano 2000 — feito que repetiu no 400m sem barreiras em 2003, quando conquistou o vice-campeonato brasileiro e sul-americano.

Agora em nova fase da carreira, a atleta atua como personal trainer com foco em Cross Training, treinos funcionais, condicionamento físico e musculação — tanto hipertrofia quanto fortalecimento. Registrada com o CREF 194882-G/SP e formação superior completa, Evelyn também compete ativamente no CrossFit.

"A experiência que tive como atleta de pista me deu uma visão única sobre biomecânica, periodização e limite corporal. Trago isso para cada aluno que trabalho", afirmou a profissional ao assinar seu cadastro na plataforma.

A chegada de Evelyn reforça o compromisso da Extreme Competition em conectar trabalhadores por aplicativo aos melhores profissionais de saúde e performance do Brasil. Seu perfil completo já está disponível na seção de Profissionais da plataforma.',
  'atletas',
  true,
  '2026-05-05 10:00:00',
  '2026-05-05 10:00:00'
),
(
  gen_random_uuid(),
  'campeonato-aplicativos-2026-inscricoes',
  'Campeonato dos Aplicativos 2026 abre inscrições com prêmio de R$ 10.000',
  'Primeira edição do campeonato exclusivo para trabalhadores por aplicativo acontece em maio no Ibirapuera, São Paulo.',
  'O aguardado Campeonato dos Aplicativos 2026 já tem data confirmada: de 15 a 17 de maio, no Parque do Ibirapuera, São Paulo. O evento, inédito no cenário esportivo nacional, foi desenvolvido especialmente para motoristas e entregadores que desejam transformar a atividade física em competição de alto nível.

As provas serão de 5K e 10K, com categorias divididas por sexo e faixa etária (intervalos de cinco anos). A participação exige apenas comprovante de trabalho em aplicativo — o primeiro evento esportivo do país com este requisito como critério de elegibilidade.

O prêmio do primeiro lugar chega a R$ 10.000, acrescido de seis meses de acompanhamento profissional. O segundo colocado leva R$ 5.000 e o terceiro, R$ 2.500. Uma das grandes novidades é o prêmio para os profissionais de Educação Física e Nutrição: R$ 5.000 para cada atleta campeão que tiver um profissional credenciado como preparador.

As inscrições estão abertas pelo valor de R$ 50,00. Vagas limitadas.',
  'eventos',
  true,
  '2026-05-03 09:00:00',
  '2026-05-03 09:00:00'
),
(
  gen_random_uuid(),
  'apexforce-patrocinio-master',
  'ApexForce fecha patrocínio master e se torna energia oficial da plataforma',
  '"Energia que move campeões" passa a estampar todos os eventos e materiais da Extreme Competition em acordo histórico.',
  'A ApexForce, marca de bebidas energéticas com presença em mais de 12 países, firmou contrato de patrocínio master com a Extreme Sports Competition. O acordo, considerado o mais robusto já fechado pela plataforma, concede à marca naming rights nos eventos e presença exclusiva em todas as ativações físicas.

Com o slogan "Energia que move campeões", a ApexForce estará presente em largadas, chegadas, kits de participante e em toda a comunicação digital da plataforma. A parceria inclui distribuição gratuita de produto nos pontos de hidratação dos eventos e ações de branded content com os profissionais afiliados.

A ApexForce complementa um time de patrocinadores que inclui VitaRun, SportZone, TrailPro e NutriMax — todos com cotas ouro na plataforma.',
  'patrocinio',
  true,
  '2026-04-28 11:00:00',
  '2026-04-28 11:00:00'
),
(
  gen_random_uuid(),
  'corrida-entregadores-junho-2026',
  'Corrida dos Entregadores: 5K na Avenida Paulista em 20 de junho',
  'Prova cronometrada com chip reúne entregadores de delivery em corrida histórica pelo coração de São Paulo.',
  'A Corrida dos Entregadores promete ser um dos eventos mais simbólicos do calendário esportivo paulistano em 2026. No dia 20 de junho, a Avenida Paulista será palco de uma prova de 5K exclusiva para trabalhadores de delivery.

A prova será cronometrada com chip individual, com categorias separadas por idade e sexo. O primeiro lugar recebe R$ 5.000, seguido de R$ 2.500 para o segundo e R$ 1.000 para o terceiro. Todos os que cruzarem a linha de chegada recebem um kit exclusivo da Extreme Competition.

A inscrição custa R$ 30 e exige comprovante de entregador ativo. As vagas estão disponíveis na plataforma.',
  'eventos',
  true,
  '2026-04-25 08:00:00',
  '2026-04-25 08:00:00'
),
(
  gen_random_uuid(),
  'vitarun-nutricao-oficial',
  'VitaRun se torna fornecedora oficial de nutrição da plataforma',
  'Marca especializada em suplementação de performance garante cota ouro e passa a orientar protocolos nutricionais nos eventos.',
  'A VitaRun, com o posicionamento "Nutrição de alta performance", assinou cota ouro de patrocínio com a Extreme Competition. A parceria vai além do naming: a marca terá profissionais presentes nos eventos para orientação nutricional gratuita aos participantes.

A VitaRun também passa a integrar o programa de benefícios da plataforma, oferecendo descontos exclusivos para atletas e profissionais afiliados. Em conjunto com os nutricionistas credenciados da Extreme, a marca deve lançar em breve um protocolo oficial de alimentação para trabalhadores por aplicativo em período de preparação competitiva.',
  'patrocinio',
  true,
  '2026-04-20 14:00:00',
  '2026-04-20 14:00:00'
),
(
  gen_random_uuid(),
  'desafio-na-pista-julho-2026',
  'Desafio na Pista traz atletismo oficial ao CEAR em julho',
  'Provas de 100m, 400m e 1500m em pista certificada para motoristas e entregadores que querem testar o limite.',
  'No dia 12 de julho, o Centro Esportivo de Alto Rendimento (CEAR) receberá o Desafio na Pista — uma competição de atletismo em pista oficial aberta exclusivamente a trabalhadores por aplicativo.

O evento conta com provas de 100m, 400m e 1500m, com formato eliminatório. A participação exige equipamento adequado e avaliação médica prévia — requisitos que reforçam o compromisso da Extreme Competition com a segurança e seriedade das competições.

Medalhas serão entregues aos três primeiros colocados em cada prova, e o melhor atleta geral leva o troféu Extreme e participa do pool de R$ 3.000 em premiações. O valor de inscrição é de R$ 40.',
  'eventos',
  true,
  '2026-04-15 10:00:00',
  '2026-04-15 10:00:00'
),
(
  gen_random_uuid(),
  'plataforma-ultrapassa-3400-usuarios',
  'Extreme Competition ultrapassa 3.400 usuários ativos na plataforma',
  'Crescimento de 40% em dois meses impulsionado pelos eventos de corrida e pela entrada de novos profissionais afiliados.',
  'A Extreme Sports Competition registrou um crescimento expressivo nos últimos dois meses: a plataforma ultrapassou a marca de 3.400 usuários ativos simultâneos, com pico de 3.428 registrado na última semana de abril.

O crescimento é atribuído principalmente à divulgação do Campeonato dos Aplicativos 2026 e à expansão do quadro de profissionais afiliados. Com a chegada de especialistas como Evelyn Pereira — ex-atleta de pista e personal trainer —, a plataforma consolida seu posicionamento como o principal hub de esporte e saúde para trabalhadores por aplicativo no Brasil.

A equipe de produto trabalha agora na implementação do sistema de ranking, que permitirá acompanhar a evolução dos atletas ao longo das competições.',
  'plataforma',
  true,
  '2026-04-10 16:00:00',
  '2026-04-10 16:00:00'
),
(
  gen_random_uuid(),
  'sportzone-equipa-atletas',
  'SportZone equipa atletas com linha exclusiva para trabalhadores por aplicativo',
  'Marca de equipamentos esportivos lança coleção desenvolvida para as especificidades do corpo de quem trabalha em movimento.',
  'A SportZone — "Equipamento para vencer" — lançou uma linha exclusiva de produtos desenvolvida em parceria com os profissionais de Educação Física credenciados pela Extreme Competition. A coleção inclui calçados, roupas de compressão e acessórios pensados para as condições de quem passa horas em movimento no trabalho.

A marca, que ocupa cota ouro na plataforma, oferecerá descontos de até 35% para atletas inscritos nos eventos da Extreme. Um estande da SportZone estará presente no Campeonato dos Aplicativos 2026 para fitting e orientação técnica.',
  'patrocinio',
  true,
  '2026-04-05 09:00:00',
  '2026-04-05 09:00:00'
);
