// ============================================================
// Tipos que espelham as respostas da API
// ============================================================

export interface ApiMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
}

// ---- Landing: Eventos ----

export type EventStatus = 'aberto' | 'encerrado' | 'esgotado' | 'em_breve' | 'cancelado';
export type EventModality = 'presencial' | 'online';
export type EventCategory =
  | 'maratona'
  | 'trail'
  | 'ultramaratona'
  | 'campeonato_crossfit'
  | 'campeonato_natacao'
  | 'campeonato_ciclismo'
  | 'campeonato_volei'
  | 'campeonato_basquete'
  | 'beach_tennis'
  | 'corrida_de_obstaculos';

export interface LandingEvent {
  id: string;
  title: string;
  category: EventCategory;
  modality: EventModality;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  price_cents: number;
  capacity: number | null;
  enrolled: number;
  status: EventStatus;
  cover_image_url: string | null;
  ranking_points: number | null;
  reward: string;
  organizer: { id: string; full_name: string };
}

export interface LandingEventDetail extends LandingEvent {
  description: string;
  rules: string | null;
  rules_file_url: string | null;
  created_at: string;
}

export interface FeaturedEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  modality: EventModality;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  price_cents: number;
  capacity: number | null;
  enrolled: number;
  status: EventStatus;
  cover_image_url: string | null;
  ranking_points: number | null;
  reward: string;
}

// ---- Landing: Profissionais ----

export interface ProfessionalSpecialty {
  id: string;
  specialty: string;
  notes: string | null;
}

// ---- News ----

export type NewsCategory = 'atletas' | 'eventos' | 'patrocinio' | 'plataforma';

export interface LandingNewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: NewsCategory;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface LandingProfessional {
  id: string;
  full_name: string;
  photo_url: string | null;
  education: string;
  registration_type: string;
  registration_number: string;
  bio: string | null;
  specialties: ProfessionalSpecialty[];
}

// ---- Auth ----

export interface AuthUser {
  sub: string;
  email: string;
  full_name: string;
  role: string;
  photo_url?: string | null;
}

// ---- User tickets ----

export interface UserTicket {
  id: string;
  event_id: string;
  user_id: string;
  status: 'ativo' | 'cancelado' | 'usado';
  price_paid_cents: number;
  purchased_at: string;
  used_at: string | null;
  event: {
    id: string;
    title: string;
    category: string;
    modality: string;
    start_datetime: string;
    location: string | null;
    city: string | null;
    state: string | null;
    cover_image_url: string | null;
  };
}

// ---- Checkout / Pagamento ----

export interface PaymentSession {
  payment_id: string;
  billing_id: string;
  pix_code: string | null;
  pix_qr_code: string | null;
  checkout_url: string | null;
  amount_cents: number;
  expires_at: string;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'paid' | 'failed' | 'expired';
  ticket_id: string | null;
}

// ---- Assinatura Profissional ----

export type ProfessionalSubscriptionStatus = 'pending_payment' | 'active' | 'cancelled' | 'past_due';

export interface ProfessionalSubscriptionSession {
  subscription_id: string;
  checkout_url: string;
  amount_cents: number;
  status: ProfessionalSubscriptionStatus;
  resumed?: boolean;
}

export interface ProfessionalSubscriptionStatusResponse {
  id: string;
  status: ProfessionalSubscriptionStatus;
  checkout_url: string | null;
  amount_cents: number;
  full_name: string;
  registration_type: string;
  professional_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfessionalPlanType = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface ProfessionalSubscribeInput {
  full_name: string;
  birth_date: string;
  education: string;
  registration_number: string;
  registration_type: string;
  bio?: string;
  plan_type: ProfessionalPlanType;
  specialties: Array<{ specialty: string; notes?: string }>;
}

// ---- Loja ----

export type ProductCategory = 'vestuario' | 'acessorios' | 'equipamentos' | 'nutricao' | 'outros';
export type StoreOrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded';

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
  category: ProductCategory;
}

export interface StoreOrderSession {
  order_id: string;
  billing_id: string;
  method: 'pix' | 'credit_card';
  pix_code: string | null;
  pix_qr_code: string | null;
  checkout_url: string | null;
  total_cents: number;
  expires_at: string;
}

export interface StoreOrderStatusResponse {
  status: StoreOrderStatus;
}

export interface StoreOrderItem {
  id: string;
  quantity: number;
  unit_price_cents: number;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    category: string;
  };
}

export interface StoreOrder {
  id: string;
  status: StoreOrderStatus;
  total_cents: number;
  method: string;
  created_at: string;
  items: StoreOrderItem[];
}

export interface RegisterInput {
  full_name: string;
  birth_date: string;
  document_type: 'cpf' | 'rg';
  document_number: string;
  zip_code: string;
  street: string;
  neighborhood?: string;
  city: string;
  state: string;
  number: string;
  complement?: string;
  weight_kg?: number;
  height_cm?: number;
  shirt_size: string;
  shoe_size?: number;
  education_level: string;
  profession: string;
  email: string;
  password: string;
  consent_version?: string;
}
