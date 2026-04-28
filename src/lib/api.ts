// ============================================================
// Cliente HTTP da Extreme Competition API
//
// Segurança:
// - access_token armazenado apenas em memória (nunca localStorage/cookie JS)
// - credentials: 'include' para enviar o refresh token httpOnly automaticamente
// - Sem dados sensíveis em query strings ou URLs
// - Erros da API nunca expõem stack traces ao usuário
// ============================================================

import type {
  ApiResponse,
  ApiMeta,
  LandingEvent,
  LandingEventDetail,
  FeaturedEvent,
  LandingProfessional,
  AuthUser,
  RegisterInput,
  UserTicket,
  PaymentSession,
  PaymentStatusResponse,
} from '../types/api';

export type { RegisterInput };

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3333';

// Token em memória — não persiste entre recarregamentos (design intencional)
let _accessToken: string | null = null;
let _onAuthChange: ((user: AuthUser | null) => void) | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function registerAuthChangeCallback(cb: (user: AuthUser | null) => void): void {
  _onAuthChange = cb;
}

// ---- Erro tipado ----

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

// ---- Núcleo da requisição ----

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Envia refresh token httpOnly cookie automaticamente
  });

  // Token expirado — tenta renovar uma vez
  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    // Refresh falhou — limpa estado de auth
    _accessToken = null;
    _onAuthChange?.(null);
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message: string =
      (body as { message?: string } | null)?.message ?? 'Erro na requisição.';
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// ---- Tipos de usuário autenticado ----

export interface MeData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  photo_url: string | null;
}

// Tenta renovar o access token via refresh token cookie httpOnly
async function tryRefreshToken(): Promise<boolean> {
  try {
    const data = await request<ApiResponse<{ access_token: string }>>(
      '/api/v1/auth/refresh',
      { method: 'POST' },
      false, // Não retenta o refresh
    );
    if (data.data?.access_token) {
      _accessToken = data.data.access_token;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Restaura sessão ao carregar a aplicação — usa o refresh token httpOnly cookie
// para obter um novo access token sem expor credenciais. Retorna o usuário ou null.
export async function restoreSession(): Promise<AuthUser | null> {
  const refreshed = await tryRefreshToken();
  if (!refreshed) return null;

  try {
    const res = await request<ApiResponse<MeData>>('/api/v1/users/me', { method: 'GET' }, false);
    return {
      sub: res.data.id,
      full_name: res.data.full_name,
      email: res.data.email,
      role: res.data.role,
      photo_url: res.data.photo_url ?? null,
    };
  } catch {
    _accessToken = null;
    return null;
  }
}

// ============================================================
// Auth
// ============================================================

export async function login(
  email: string,
  password: string,
): Promise<{ access_token: string; user: AuthUser }> {
  const res = await request<ApiResponse<{ access_token: string; user: AuthUser }>>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    false,
  );
  _accessToken = res.data.access_token;
  _onAuthChange?.(res.data.user);
  return res.data;
}

export async function register(
  data: RegisterInput,
): Promise<{ id: string; email: string; full_name: string }> {
  const res = await request<ApiResponse<{ id: string; email: string; full_name: string }>>(
    '/api/v1/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    false,
  );
  return res.data;
}

export async function fetchMe(): Promise<MeData> {
  const res = await request<ApiResponse<MeData>>('/api/v1/users/me', { method: 'GET' });
  return {
    id: res.data.id,
    full_name: res.data.full_name,
    email: res.data.email,
    role: res.data.role,
    photo_url: res.data.photo_url ?? null,
  };
}

export async function fetchMyTickets(
  page = 1,
  per_page = 20,
): Promise<{ data: UserTicket[]; meta: ApiMeta }> {
  const qs = new URLSearchParams({ page: String(page), per_page: String(per_page) });
  const res = await request<ApiResponse<UserTicket[]>>(
    `/api/v1/users/me/tickets?${qs.toString()}`,
    { method: 'GET' },
  );
  return { data: res.data, meta: res.meta! };
}

export async function logout(): Promise<void> {
  try {
    await request('/api/v1/auth/logout', { method: 'POST' }, false);
  } finally {
    _accessToken = null;
    _onAuthChange?.(null);
  }
}

// ============================================================
// Landing — Eventos em destaque (público, sem auth)
// ============================================================

export async function fetchFeaturedEvents(): Promise<FeaturedEvent[]> {
  const res = await request<ApiResponse<FeaturedEvent[]>>(
    '/api/v1/landing/featured',
    { method: 'GET' },
    false,
  );
  return res.data;
}

// ============================================================
// Landing — Eventos (público, sem auth)
// ============================================================

export interface FetchLandingEventsParams {
  category?: string;
  modality?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export async function fetchLandingEvents(
  params: FetchLandingEventsParams = {},
): Promise<{ data: LandingEvent[]; meta: ApiMeta }> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.modality) qs.set('modality', params.modality);
  qs.set('status', params.status ?? 'aberto');
  qs.set('page', String(params.page ?? 1));
  qs.set('per_page', String(params.per_page ?? 9));

  const res = await request<ApiResponse<LandingEvent[]>>(
    `/api/v1/landing/events?${qs.toString()}`,
    { method: 'GET' },
    false,
  );

  return {
    data: res.data,
    meta: res.meta!,
  };
}

export async function fetchLandingEventDetail(id: string): Promise<LandingEventDetail> {
  const res = await request<ApiResponse<LandingEventDetail>>(
    `/api/v1/landing/events/${encodeURIComponent(id)}`,
    { method: 'GET' },
    false,
  );
  return res.data;
}

// ============================================================
// Landing — Profissionais (público, sem auth)
// ============================================================

// ============================================================
// Checkout / Pagamento
// ============================================================

export async function enrollFreeEvent(eventId: string): Promise<{ enrolled: boolean; message: string }> {
  const res = await request<ApiResponse<{ enrolled: boolean; message: string }>>(
    `/api/v1/events/${encodeURIComponent(eventId)}/enroll`,
    { method: 'POST' },
  );
  return res.data;
}

export type PaymentMethod = 'pix' | 'credit_card';

export async function initiateCheckout(eventId: string, method: PaymentMethod): Promise<PaymentSession> {
  const res = await request<ApiResponse<PaymentSession>>(
    `/api/v1/checkout/events/${encodeURIComponent(eventId)}`,
    { method: 'POST', body: JSON.stringify({ method }) },
  );
  return res.data;
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  const res = await request<ApiResponse<PaymentStatusResponse>>(
    `/api/v1/checkout/payments/${encodeURIComponent(paymentId)}/status`,
    { method: 'GET' },
  );
  return res.data;
}

// ============================================================
// Landing — Profissionais (público, sem auth)
// ============================================================

export async function fetchLandingProfessionals(
  page = 1,
  per_page = 9,
): Promise<{ data: LandingProfessional[]; meta: ApiMeta }> {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(per_page),
  });

  const res = await request<ApiResponse<LandingProfessional[]>>(
    `/api/v1/landing/professionals?${qs.toString()}`,
    { method: 'GET' },
    false,
  );

  return {
    data: res.data,
    meta: res.meta!,
  };
}

// ============================================================
// Landing — Contato de Parceria (público, sem auth)
// ============================================================

export interface PartnerContactData {
  company_name: string;
  cnpj: string;
  contact_name: string;
  contact_email: string;
  event_type: string;
  event_date: string;
  city: string;
  budget: string;
  services: string[];
  message: string;
}

export async function sendPartnerContact(
  data: PartnerContactData,
): Promise<{ message: string }> {
  const res = await request<ApiResponse<{ message: string }>>(
    '/api/v1/landing/contact',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    false,
  );
  return res.data;
}
