// Site Configuration - EXTREME SPORTS COMPETITION
// Configurações do site em português - Foco em Educação Física, Nutrição e Trabalhadores por Aplicativo

export interface SiteConfig {
  language: string;
  siteTitle: string;
  siteDescription: string;
}

export const siteConfig: SiteConfig = {
  language: "pt-BR",
  siteTitle: "EXTREME SPORTS COMPETITION - Esportes e Saúde",
  siteDescription: "A maior plataforma de competições esportivas para trabalhadores por aplicativo. Eventos, profissionais de educação física, nutrição e premiações exclusivas.",
};

// Hero Section Configuration
export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

export interface HeroConfig {
  slides: HeroSlide[];
  brandName: string;
  navLinks: { label: string; href: string }[];
  onlineUsers: number;
}

export const heroConfig: HeroConfig = {
  slides: [
    {
      id: 1,
      image: "/hero-1.jpg",
      title: "SAÚDE E MOVIMENTO",
      subtitle: "Profissionais de educação física e nutrição à disposição para transformar sua vida",
      ctaText: "Conhecer Profissionais",
      ctaHref: "#atletas"
    },
    {
      id: 2,
      image: "/hero-2.jpg",
      title: "CAMPEONATO DOS APLICATIVOS",
      subtitle: "O primeiro evento esportivo exclusivo para trabalhadores por aplicativo. Grandes premiações para participantes e profissionais de Educação Física e Nutrição!",
      ctaText: "Participar Agora",
      ctaHref: "#eventos"
    },
    {
      id: 3,
      image: "/hero-3.jpg",
      title: "NUTRIÇÃO ESPORTIVA",
      subtitle: "Consultoria nutricional especializada para atletas e trabalhadores ativos",
      ctaText: "Agendar Consulta",
      ctaHref: "#atletas"
    }
  ],
  brandName: "EXTREME SPORTS",
  navLinks: [
    { label: "Home", href: "#home" },
    { label: "Eventos", href: "#eventos" },
    { label: "Profissionais", href: "#atletas" },
    // { label: "Rankings", href: "#rankings" },
    { label: "Loja", href: "#loja" },
    { label: "Empresas", href: "#empresas" }
  ],
  onlineUsers: 3428
};

// Events Section Configuration
export interface Event {
  id: number;
  title: string;
  category: string;
  date: string;
  location: string;
  format: "online" | "presencial" | "hibrido";
  image: string;
  description: string;
  rules: string;
  prizes: string;
  price: number;
}

export interface EventsConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  description: string;
  events: Event[];
}

export const eventsConfig: EventsConfig = {
  subtitle: "COMPETIÇÕES",
  titleRegular: "Próximos",
  titleItalic: "Eventos",
  description: "Participe dos eventos mais emocionantes para trabalhadores por aplicativo. Corrida, funcional, yoga e muito mais com premiações incríveis!",
  events: [
    {
      id: 1,
      title: "Campeonato dos Aplicativos 2026",
      category: "Corrida",
      date: "15-17 Maio 2026",
      location: "São Paulo, SP - Ibirapuera",
      format: "presencial",
      image: "/event-corrida.jpg",
      description: "O primeiro campeonato exclusivo para trabalhadores por aplicativo. Corrida de 5K e 10K com premiações em dinheiro para os vencedores e para os profissionais de Educação Física e Nutrição que os prepararem!",
      rules: "Prova por categorias: Masculino e Feminino. Divisão por idade de 5 em 5 anos. Comprovante de trabalho em aplicativo obrigatório.",
      prizes: "1º Lugar: R$ 10.000 + 6 meses de acompanhamento profissional | 2º Lugar: R$ 5.000 | 3º Lugar: R$ 2.500 | Profissionais: R$ 5.000 por atleta campeão preparado",
      price: 50
    },
    {
      id: 2,
      title: "Treino Funcional no Parque",
      category: "Funcional",
      date: "Todos os sábados",
      location: "Parques de São Paulo",
      format: "presencial",
      image: "/event-parque.jpg",
      description: "Aulas de treino funcional gratuitas para trabalhadores por aplicativo. Professores de Educação Física credenciados da Extreme Sports Competition.",
      rules: "Aulas em grupo com até 20 participantes. Trazer água e toalha. Inscrição prévia obrigatória.",
      prizes: "Participantes acumulam pontos para o ranking mensal. Top 10 ganham prêmios da loja oficial.",
      price: 0
    },
    {
      id: 3,
      title: "Yoga para Entregadores",
      category: "Yoga",
      date: "Domingos, 8h",
      location: "Parque Ibirapuera",
      format: "presencial",
      image: "/event-yoga.jpg",
      description: "Aulas de yoga especialmente desenvolvidas para quem passa o dia dirigindo ou pedalando. Melhore sua postura e reduza o estresse.",
      rules: "Aulas para todos os níveis. Trazer tapete de yoga ou toalha. Roupas confortáveis.",
      prizes: "Certificado de participação. Acúmulo de pontos no programa de benefícios.",
      price: 0
    },
    {
      id: 4,
      title: "Corrida dos Entregadores",
      category: "Corrida",
      date: "20 Junho 2026",
      location: "Avenida Paulista, SP",
      format: "presencial",
      image: "/event-delivery.jpg",
      description: "Corrida de 5K exclusiva para entregadores de delivery. Uma oportunidade única de competir, se exercitar e ainda concorrer a prêmios incríveis!",
      rules: "Prova cronometrada com chip. Categorias por idade e sexo. Comprovante de entregador obrigatório.",
      prizes: "1º Lugar: R$ 5.000 | 2º Lugar: R$ 2.500 | 3º Lugar: R$ 1.000 | Kit exclusivo para todos os finishers",
      price: 30
    },
    {
      id: 5,
      title: "Desafio na Pista",
      category: "Atletismo",
      date: "12 Julho 2026",
      location: "CEAR - São Paulo",
      format: "presencial",
      image: "/event-pista.jpg",
      description: "Competição de atletismo em pista oficial com provas de 100m, 400m e 1500m. Para motoristas e entregadores que querem testar seus limites.",
      rules: "Provas eliminatórias. Equipamento adequado obrigatório. Avaliação médica prévia.",
      prizes: "Medalhas para os 3 primeiros de cada prova. Troféu para o melhor atleta geral. R$ 3.000 em prêmios.",
      price: 40
    },
    {
      id: 6,
      title: "Academia Extreme",
      category: "Musculação",
      date: "Acesso mensal",
      location: "Unidades parceiras",
      format: "presencial",
      image: "/event-academia.jpg",
      description: "Acesso exclusivo à rede de academias parceiras com descontos especiais para trabalhadores por aplicativo. Acompanhamento de profissionais credenciados.",
      rules: "Matrícula na Extreme Sports Competition. Documento de trabalhador por aplicativo. Horários de pico podem ter restrições.",
      prizes: "Plano de treino personalizado. Avaliação física gratuita mensal. Desconto de 40% na mensalidade.",
      price: 79
    }
  ]
};

// Athletes Section Configuration - Agora Profissionais
export interface Athlete {
  id: number;
  name: string;
  nickname: string;
  modality: string;
  country: string;
  image: string;
  birthDate: string;
  age: number;
  birthplace: string;
  nationality: string;
  titles: string[];
  bio: string;
}

export interface AthletesConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  description: string;
  athletes: Athlete[];
}

export const athletesConfig: AthletesConfig = {
  subtitle: "PROFISSIONAIS",
  titleRegular: "Nossos",
  titleItalic: "Especialistas",
  description: "Conheça os profissionais de Educação Física e Nutrição credenciados pela Extreme Sports Competition. Especialistas em preparar trabalhadores por aplicativo para as competições.",
  athletes: [
    {
      id: 1,
      name: "Carlos Eduardo Silva",
      nickname: "Professor Carlos",
      modality: "Educação Física",
      country: "Brasil",
      image: "/professor-1.jpg",
      birthDate: "15/03/1985",
      age: 41,
      birthplace: "São Paulo, SP",
      nationality: "Brasileiro",
      titles: ["CREF 012345-G/SP", "Especialista em Condicionamento Físico", "Preparador de atletas campeões"],
      bio: "Carlos é professor de Educação Física com 15 anos de experiência. Especializado em treinamento funcional e preparação de atletas amadores, ele já preparou mais de 200 trabalhadores por aplicativo para competições esportivas."
    },
    {
      id: 2,
      name: "Dra. Fernanda Lima",
      nickname: "Dra. Fernanda",
      modality: "Nutrição",
      country: "Brasil",
      image: "/nutricionista-1.jpg",
      birthDate: "22/07/1988",
      age: 37,
      birthplace: "Rio de Janeiro, RJ",
      nationality: "Brasileira",
      titles: ["CRN 12345", "Nutricionista Esportiva", "Especialista em Nutrição Funcional"],
      bio: "Fernanda é nutricionista esportiva com foco em alimentação para trabalhadores de alta demanda física. Desenvolveu planos alimentares específicos para motoristas e entregadores, otimizando energia e recuperação."
    },
    {
      id: 3,
      name: "Ana Paula Mendes",
      nickname: "Ana Fitness",
      modality: "Educação Física",
      country: "Brasil",
      image: "/professor-2.jpg",
      birthDate: "10/11/1990",
      age: 35,
      birthplace: "Campinas, SP",
      nationality: "Brasileira",
      titles: ["CREF 054321-G/SP", "Instrutora de Yoga", "Especialista em Pilates"],
      bio: "Ana é especialista em atividades que combinam força e flexibilidade. Suas aulas de yoga para entregadores são um sucesso, ajudando a prevenir dores nas costas e melhorar a concentração ao volante."
    },
    {
      id: 4,
      name: "Ricardo Oliveira",
      nickname: "Ricardo Nutri",
      modality: "Nutrição",
      country: "Brasil",
      image: "/nutricionista-2.jpg",
      birthDate: "05/05/1982",
      age: 43,
      birthplace: "Belo Horizonte, MG",
      nationality: "Brasileiro",
      titles: ["CRN 54321", "Nutricionista Clínico", "Especialista em Emagrecimento"],
      bio: "Ricardo desenvolveu um método exclusivo de nutrição para quem trabalha muitas horas sentado ou pedalando. Seus planos são práticos, econômicos e focados na saúde metabólica."
    },
    {
      id: 5,
      name: "Juliana Costa",
      nickname: "Ju Personal",
      modality: "Educação Física",
      country: "Brasil",
      image: "/professor-3.jpg",
      birthDate: "18/09/1987",
      age: 38,
      birthplace: "Santos, SP",
      nationality: "Brasileira",
      titles: ["CREF 98765-G/SP", "Personal Trainer", "Especialista em Corrida"],
      bio: "Juliana é especialista em preparação de corredores. Já treinou dezenas de motoristas e entregadores para completarem suas primeiras provas de 5K e 10K. Seu método é progressivo e adaptado à rotina de quem trabalha o dia todo."
    },
    {
      id: 6,
      name: "Marcos Vinícius",
      nickname: "Marcos Delivery",
      modality: "Entregador Campeão",
      country: "Brasil",
      image: "/atleta-delivery.jpg",
      birthDate: "25/12/1992",
      age: 33,
      birthplace: "São Paulo, SP",
      nationality: "Brasileiro",
      titles: ["Campeão dos Aplicativos 2025", "Maior pontuador do ranking", "Embaixador Extreme Sports"],
      bio: "Marcos é entregador de delivery e campeão do primeiro Campeonato dos Aplicativos. Sua história de superação inspirou centenas de trabalhadores a começarem a praticar esportes. Hoje é embaixador da Extreme Sports Competition."
    }
  ]
};

// Rankings Section Configuration
export interface RankingCategory {
  id: number;
  name: string;
  modality: string;
  gender: "masculino" | "feminino";
  ageRange: string;
  leaders: {
    position: number;
    name: string;
    country: string;
    score: number;
    image: string;
  }[];
}

export interface RankingsConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  description: string;
  categories: RankingCategory[];
}

export const rankingsConfig: RankingsConfig = {
  subtitle: "CLASSIFICAÇÃO",
  titleRegular: "Rankings",
  titleItalic: "Mensais",
  description: "Acompanhe a classificação dos participantes nos eventos mensais. Sistema de pontuação justo e transparente para todos os trabalhadores por aplicativo.",
  categories: [
    {
      id: 1,
      name: "Corrida 5K Masculino",
      modality: "Corrida",
      gender: "masculino",
      ageRange: "18-99",
      leaders: [
        { position: 1, name: "Marcos Vinícius", country: "BR", score: 9850, image: "/atleta-delivery.jpg" },
        { position: 2, name: "João Silva", country: "BR", score: 9720, image: "/professor-1.jpg" },
        { position: 3, name: "Pedro Santos", country: "BR", score: 9580, image: "/professor-1.jpg" }
      ]
    },
    {
      id: 2,
      name: "Corrida 5K Feminino",
      modality: "Corrida",
      gender: "feminino",
      ageRange: "18-99",
      leaders: [
        { position: 1, name: "Ana Paula", country: "BR", score: 9650, image: "/professor-2.jpg" },
        { position: 2, name: "Maria Costa", country: "BR", score: 9420, image: "/professor-2.jpg" },
        { position: 3, name: "Juliana Lima", country: "BR", score: 9380, image: "/professor-3.jpg" }
      ]
    },
    {
      id: 3,
      name: "Treino Funcional",
      modality: "Funcional",
      gender: "masculino",
      ageRange: "18-99",
      leaders: [
        { position: 1, name: "Carlos Eduardo", country: "BR", score: 9920, image: "/professor-1.jpg" },
        { position: 2, name: "Ricardo Oliveira", country: "BR", score: 9780, image: "/nutricionista-2.jpg" },
        { position: 3, name: "Fernando Souza", country: "BR", score: 9650, image: "/professor-1.jpg" }
      ]
    }
  ]
};

// Store Section Configuration
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  inStock: boolean;
}

export interface StoreConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  description: string;
  products: Product[];
}

export const storeConfig: StoreConfig = {
  subtitle: "LOJA OFICIAL",
  titleRegular: "Produtos",
  titleItalic: "Exclusivos",
  description: "Equipamentos e vestuário oficial da Extreme Sports Competition. Qualidade premium para trabalhadores por aplicativo que querem se exercitar com estilo.",
  products: [
    {
      id: 1,
      name: "Camiseta Extreme Sports Pro",
      category: "Vestuário",
      price: 89.90,
      originalPrice: 119.90,
      image: "/product-shirt.jpg",
      description: "Camiseta técnica de alta performance com tecnologia de secagem rápida. Ideal para treinos intensos.",
      inStock: true
    },
    {
      id: 2,
      name: "Boné Extreme Sports Official",
      category: "Acessórios",
      price: 69.90,
      image: "/product-cap.jpg",
      description: "Boné ajustável com logo bordado. Proteção solar para quem trabalha o dia todo na rua.",
      inStock: true
    },
    {
      id: 3,
      name: "Mochila Extreme Sports Delivery",
      category: "Equipamento",
      price: 199.90,
      originalPrice: 249.90,
      image: "/product-backpack.jpg",
      description: "Mochila resistente à água com compartimento para notebook e itens de treino. Perfeita para quem trabalha e treina no mesmo dia.",
      inStock: true
    },
    {
      id: 4,
      name: "Garrafa Térmica Extreme",
      category: "Acessórios",
      price: 59.90,
      image: "/product-bottle.jpg",
      description: "Garrafa térmica de aço inox mantém a temperatura por 12 horas. Essencial para longas jornadas.",
      inStock: true
    },
    {
      id: 5,
      name: "Tênis Extreme Sports Running",
      category: "Calçados",
      price: 299.90,
      image: "/product-shoes.jpg",
      description: "Tênis de corrida com amortecimento de alta performance. Conforto para trabalhar e treinar.",
      inStock: true
    }
  ]
};

// Companies Section Configuration
export interface CompaniesConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  description: string;
  benefits: string[];
  ctaText: string;
  ctaHref: string;
}

export const companiesConfig: CompaniesConfig = {
  subtitle: "PARA EMPRESAS",
  titleRegular: "Seja",
  titleItalic: "Parceiro",
  description: "Junte-se à Extreme Sports Competition como empresa parceira. Ofereça benefícios aos trabalhadores por aplicativo e fortaleça sua marca.",
  benefits: [
    "Visibilidade para milhares de trabalhadores",
    "Ações de marketing direcionadas",
    "Eventos exclusivos para sua marca",
    "Programa de fidelidade integrado",
    "Relatórios de engajamento",
    "Impacto social positivo"
  ],
  ctaText: "Seja um Parceiro",
  ctaHref: "#contato"
};

// Stats Section Configuration
export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export interface StatsConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  stats: Stat[];
}

export const statsConfig: StatsConfig = {
  subtitle: "EM NÚMEROS",
  titleRegular: "Nossa",
  titleItalic: "História",
  stats: [
    { value: 50, suffix: "+", label: "Eventos Realizados" },
    { value: 15000, suffix: "+", label: "Trabalhadores Atendidos" },
    { value: 120, suffix: "", label: "Profissionais Credenciados" },
    { value: 8, suffix: "", label: "Cidades Atendidas" },
    { value: 500, suffix: "K+", label: "Em Premiações" },
    { value: 98, suffix: "%", label: "Satisfação dos Participantes" }
  ]
};

// Testimonials Section Configuration
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  quote: string;
}

export interface TestimonialsConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  testimonials: Testimonial[];
}

export const testimonialsConfig: TestimonialsConfig = {
  subtitle: "DEPOIMENTOS",
  titleRegular: "O Que Dizem",
  titleItalic: "Sobre Nós",
  testimonials: [
    {
      id: 1,
      name: "Carlos Eduardo",
      role: "Motorista de App",
      image: "/professor-1.jpg",
      quote: "Graças à Extreme Sports Competition, perdi 15kg e melhorei minha disposição para dirigir. As aulas de yoga mudaram minha vida!"
    },
    {
      id: 2,
      name: "Fernanda Lima",
      role: "Entregadora",
      image: "/nutricionista-1.jpg",
      quote: "Ganhei o primeiro Campeonato dos Aplicativos e levei R$ 10.000 para casa! Agora treino sério e tenho uma vida muito mais saudável."
    },
    {
      id: 3,
      name: "Ricardo Souza",
      role: "Professor de Educação Física",
      image: "/nutricionista-2.jpg",
      quote: "Ser credenciado pela Extreme Sports me trouxe mais de 50 alunos trabalhadores por aplicativo. Uma oportunidade incrível de crescer profissionalmente."
    }
  ]
};

// FAQ Section Configuration
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQConfig {
  subtitle: string;
  titleRegular: string;
  titleItalic: string;
  ctaText: string;
  ctaButtonText: string;
  ctaHref: string;
  faqs: FAQItem[];
}

export const faqConfig: FAQConfig = {
  subtitle: "PERGUNTAS FREQUENTES",
  titleRegular: "Tire Suas",
  titleItalic: "Dúvidas",
  ctaText: "Ainda tem dúvidas?",
  ctaButtonText: "Fale Conosco",
  ctaHref: "#contato",
  faqs: [
    {
      id: "1",
      question: "Quem pode participar do evento Rota da Saúde?",
      answer: "Podem participar trabalhadores que utilizam aplicativos de mobilidade ou entrega, desde que comprovem atividade na plataforma e tenham no mínimo 200 corridas ou entregas realizadas. Não há limite de idade. Também é necessário realizar o cadastro e efetuar o pagamento da taxa de participação."
    },
    {
      id: "2",
      question: "Como me inscrevo em um evento?",
      answer: "Para se inscrever, acesse a página do evento desejado, clique em 'Participar' e siga o processo de pagamento. Você receberá um email de confirmação com todos os detalhes."
    },
    {
      id: "3",
      question: "Os eventos são gratuitos?",
      answer: "Temos eventos gratuitos e eventos pagos. Os eventos pagos têm valores acessíveis e premiações em dinheiro para os vencedores."
    },
    {
      id: "4",
      question: "Como funciona o sistema de premiação?",
      answer: "O Rota da Saúde premia os participantes com base na evolução física ao longo do evento. Os melhores colocados no ranking geral — separados entre masculino e feminino — recebem premiações. Além disso, há premiações em eventos mensais e pontuação por desempenho em avaliações físicas."
    },
    {
      id: "5",
      question: "Como me tornar um profissional credenciado?",
      answer: "Profissionais da saúde devem se cadastrar na plataforma, informar sua área de atuação, registro no conselho e pagar a taxa de adesão. Após aprovação, poderão atender participantes, divulgar seus serviços e também concorrer a premiações com base nos resultados obtidos com seus alunos."
    }
  ]
};

// Brands Ticker Configuration
export interface Brand {
  name: string;
  logoUrl?: string; // caminho em /public/brands/ — se vazio, renderiza nome estilizado
}

export interface BrandsConfig {
  brands: Brand[];
}

export const brandsConfig: BrandsConfig = {
  brands: [
    { name: 'iFood' },
    { name: 'Uber Eats' },
    { name: 'Rappi' },
    { name: '99' },
    { name: 'Loggi' },
    { name: 'Red Bull' },
    { name: 'Nike' },
    { name: 'Adidas' },
    { name: 'Decathlon' },
    { name: 'Wellhub' },
  ]
};

// Footer Configuration
export interface SocialLink {
  iconName: string;
  href: string;
  label: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  logoText: string;
  contactLabel: string;
  email: string;
  locationText: string;
  navigationLabel: string;
  navLinks: FooterLink[];
  socialLabel: string;
  socialLinks: SocialLink[];
  tagline: string;
  copyright: string;
  bottomLinks: FooterLink[];
}

export const footerConfig: FooterConfig = {
  logoText: "EXTREME SPORTS",
  contactLabel: "Contato",
  email: "extreme@extremesportscompetition.com",
  locationText: "Porto Alegre, RS - Brasil",
  navigationLabel: "Navegação",
  navLinks: [
    { label: "Home", href: "#home" },
    { label: "Eventos", href: "#eventos" },
    { label: "Profissionais", href: "#atletas" },
    // { label: "Rankings", href: "#rankings" },
    { label: "Loja", href: "#loja" },
    { label: "Empresas", href: "#empresas" }
  ],
  socialLabel: "Redes Sociais",
  socialLinks: [
    { iconName: "Instagram", href: "https://instagram.com", label: "Instagram" },
    { iconName: "Mail", href: "mailto:suporte@extremesportscompetition.com", label: "Email" }
  ],
  tagline: "Saúde e movimento para quem move o mundo.\nSeja Extreme.",
  copyright: "© 2026 Extreme Sports Competition. Todos os direitos reservados.",
  bottomLinks: [
    { label: "Política de Privacidade", href: "#" },
    { label: "Termos de Uso", href: "#" },
    { label: "SAC", href: "extreme@extremesportscompetition.com" }
  ]
};
