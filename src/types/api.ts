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
  organizer: { id: string; full_name: string };
}

export interface LandingEventDetail extends LandingEvent {
  description: string;
  rules: string | null;
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
}

// ---- Landing: Profissionais ----

export interface ProfessionalSpecialty {
  id: string;
  specialty: string;
  notes: string | null;
}

export interface LandingProfessional {
  id: string;
  full_name: string;
  photo_url: string | null;
  education: string;
  registration_type: string;
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
