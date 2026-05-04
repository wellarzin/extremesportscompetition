// ============================================================
// AbacatePay — client HTTP
// Docs: https://docs.abacatepay.com
// Base URL: https://api.abacatepay.com/v2
// ============================================================

// ---- shared ----

async function abacateRequest<T>(
  method: string,
  path: string,
  apiKey: string,
  baseUrl: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`AbacatePay ${res.status}: ${text}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`AbacatePay: resposta não é JSON — ${text.slice(0, 200)}`);
  }

  return json as T;
}

// ============================================================
// PIX — Transparent checkout
// POST /transparents/create
// GET  /transparents/check?id=:id
// POST /transparents/simulate-payment?id=:id  (apenas dev)
// ============================================================

export interface AbacateCreatePixInput {
  amount: number;        // centavos (BRL)
  description?: string;
  internalId: string;    // armazenado em metadata.paymentId
  expiresIn?: number;    // segundos (padrão: 900)
}

export interface AbacatePixCharge {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  pixCode: string | null;      // brCode
  pixQrCode: string | null;    // brCodeBase64
  expiresAt: string | null;
}

function normalizePixCharge(raw: Record<string, unknown>): AbacatePixCharge {
  const data = (raw.data ?? raw) as Record<string, unknown>;
  return {
    id: data.id as string,
    status: (data.status as AbacatePixCharge["status"]) ?? "PENDING",
    pixCode: (data.brCode as string | undefined) ?? null,
    pixQrCode: (data.brCodeBase64 as string | undefined) ?? null,
    expiresAt: (data.expiresAt as string | undefined) ?? null,
  };
}

export async function createPixCharge(
  apiKey: string,
  baseUrl: string,
  input: AbacateCreatePixInput,
): Promise<AbacatePixCharge> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "POST",
    "/transparents/create",
    apiKey,
    baseUrl,
    {
      method: "PIX",
      data: {
        amount: input.amount,
        ...(input.description ? { description: input.description } : {}),
        expiresIn: input.expiresIn ?? 900,
        metadata: { paymentId: input.internalId },
      },
    },
  );
  return normalizePixCharge(raw);
}

export async function getPixChargeStatus(
  apiKey: string,
  baseUrl: string,
  chargeId: string,
): Promise<AbacatePixCharge> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "GET",
    `/transparents/check?id=${encodeURIComponent(chargeId)}`,
    apiKey,
    baseUrl,
  );
  return normalizePixCharge(raw);
}

// ============================================================
// Produtos — necessário para checkout com cartão
// POST /products/create
// GET  /products/list?externalId=:eventId
// ============================================================

export async function findOrCreateProduct(
  apiKey: string,
  baseUrl: string,
  eventId: string,
  name: string,
  priceCents: number,
): Promise<string> {
  // Tenta encontrar produto existente pelo externalId (nosso eventId)
  const listRaw = await abacateRequest<Record<string, unknown>>(
    "GET",
    `/products/list?externalId=${encodeURIComponent(eventId)}&limit=1`,
    apiKey,
    baseUrl,
  );

  const listData = (listRaw.data as unknown[] | undefined) ?? [];
  if (listData.length > 0) {
    const existing = listData[0] as Record<string, unknown>;
    return existing.id as string;
  }

  // Cria novo produto para este evento
  const createRaw = await abacateRequest<Record<string, unknown>>(
    "POST",
    "/products/create",
    apiKey,
    baseUrl,
    {
      externalId: eventId,
      name,
      price: priceCents,
      currency: "BRL",
    },
  );

  const product = ((createRaw.data ?? createRaw) as Record<string, unknown>);
  return product.id as string;
}

// ============================================================
// Cartão — Hosted checkout
// POST /checkouts/create
// GET  /checkouts/get?id=:id
// ============================================================

export interface AbacateCreateCardCheckoutInput {
  productId: string;       // ID do produto no catálogo AbacatePay
  externalId: string;      // nosso payment.id — devolvido no webhook via data.checkout.externalId
  completionUrl: string;   // URL pós-pagamento (frontend)
  returnUrl: string;       // URL de retorno ao cancelar
  maxInstallments?: number; // máx de parcelas (1–12)
}

export interface AbacateCardCheckout {
  id: string;
  url: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED";
}

function normalizeCardCheckout(raw: Record<string, unknown>): AbacateCardCheckout {
  // AbacatePay pode retornar: { data: { ... } } ou { data: { checkout: { ... } } }
  let data = (raw.data ?? raw) as Record<string, unknown>;
  // Desempacota nível extra se vier aninhado em "checkout"
  if (data.checkout && typeof data.checkout === "object") {
    data = data.checkout as Record<string, unknown>;
  }
  return {
    id: (data.id as string | undefined) ?? "",
    url: (data.url as string | undefined) ?? "",
    status: (data.status as AbacateCardCheckout["status"]) ?? "PENDING",
  };
}

export async function createCardCheckout(
  apiKey: string,
  baseUrl: string,
  input: AbacateCreateCardCheckoutInput,
): Promise<AbacateCardCheckout> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "POST",
    "/checkouts/create",
    apiKey,
    baseUrl,
    {
      items: [{ id: input.productId, quantity: 1 }],
      methods: ["CARD"],
      externalId: input.externalId,
      completionUrl: input.completionUrl,
      returnUrl: input.returnUrl,
      ...(input.maxInstallments ? { card: { maxInstallments: input.maxInstallments } } : {}),
    },
  );
  return normalizeCardCheckout(raw);
}

export async function getCardCheckoutStatus(
  apiKey: string,
  baseUrl: string,
  checkoutId: string,
): Promise<AbacateCardCheckout & { _raw?: unknown }> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "GET",
    `/checkouts/get?id=${encodeURIComponent(checkoutId)}`,
    apiKey,
    baseUrl,
  );
  const normalized = normalizeCardCheckout(raw);
  // _raw exposto para logging no controller — removido após diagnóstico
  return { ...normalized, _raw: raw };
}

// ============================================================
// Assinaturas — Subscription (apenas cartão de crédito)
// POST /subscriptions/create
// POST /subscriptions/cancel
// Docs: https://docs.abacatepay.com/pages/subscriptions/create
// ============================================================

export async function findOrCreateSubscriptionProduct(
  apiKey: string,
  baseUrl: string,
  externalId: string,
  name: string,
  priceCents: number,
  cycle: "WEEKLY" | "MONTHLY" | "SEMIANNUALLY" | "ANNUALLY" = "MONTHLY",
): Promise<string> {
  // Tenta encontrar produto de assinatura existente pelo externalId
  const listRaw = await abacateRequest<Record<string, unknown>>(
    "GET",
    `/products/list?externalId=${encodeURIComponent(externalId)}&limit=1`,
    apiKey,
    baseUrl,
  );

  const listData = (listRaw.data as unknown[] | undefined) ?? [];
  if (listData.length > 0) {
    const existing = listData[0] as Record<string, unknown>;
    return existing.id as string;
  }

  // Cria produto com ciclo de cobrança
  const createRaw = await abacateRequest<Record<string, unknown>>(
    "POST",
    "/products/create",
    apiKey,
    baseUrl,
    {
      externalId,
      name,
      price: priceCents,
      currency: "BRL",
      cycle,
    },
  );

  const product = (createRaw.data ?? createRaw) as Record<string, unknown>;
  return product.id as string;
}

export interface AbacateCreateSubscriptionCheckoutInput {
  productId: string;
  externalId: string;      // nosso subscription.id — devolvido no webhook via data.subscription.externalId
  completionUrl: string;
  returnUrl: string;
}

export interface AbacateSubscriptionCheckout {
  id: string;
  url: string;
  status: string;
}

function normalizeSubscriptionCheckout(raw: Record<string, unknown>): AbacateSubscriptionCheckout {
  const data = (raw.data ?? raw) as Record<string, unknown>;
  return {
    id: data.id as string,
    url: (data.url as string | undefined) ?? "",
    status: (data.status as string | undefined) ?? "PENDING",
  };
}

export async function createSubscriptionCheckout(
  apiKey: string,
  baseUrl: string,
  input: AbacateCreateSubscriptionCheckoutInput,
): Promise<AbacateSubscriptionCheckout> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "POST",
    "/subscriptions/create",
    apiKey,
    baseUrl,
    {
      items: [{ id: input.productId, quantity: 1 }],
      externalId: input.externalId,
      completionUrl: input.completionUrl,
      returnUrl: input.returnUrl,
    },
  );
  return normalizeSubscriptionCheckout(raw);
}

export async function getSubscriptionStatus(
  apiKey: string,
  baseUrl: string,
  subscriptionId: string,
): Promise<{ id: string; status: string }> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "GET",
    `/subscriptions/get?id=${encodeURIComponent(subscriptionId)}`,
    apiKey,
    baseUrl,
  );
  const data = (raw.data ?? raw) as Record<string, unknown>;
  return {
    id: data.id as string,
    status: (data.status as string | undefined) ?? "PENDING",
  };
}

export async function cancelSubscription(
  apiKey: string,
  baseUrl: string,
  subscriptionId: string,
): Promise<void> {
  await abacateRequest<Record<string, unknown>>(
    "POST",
    "/subscriptions/cancel",
    apiKey,
    baseUrl,
    { id: subscriptionId },
  );
}

// ============================================================
// Aliases para compatibilidade com código existente
// ============================================================

/** @deprecated use createPixCharge */
export const createCharge = createPixCharge;
/** @deprecated use getPixChargeStatus */
export const getCharge = getPixChargeStatus;
