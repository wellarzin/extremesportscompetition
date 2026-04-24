// ============================================================
// AbacatePay — client HTTP
// Docs: https://docs.abacatepay.com
// Base URL: https://api.abacatepay.com/v2
// Endpoint usado: POST /transparents/create
// ============================================================

export interface AbacateCreateChargeInput {
  amount: number;        // centavos (BRL)
  description?: string;
  internalId: string;    // ID interno do Payment — armazenado em metadata.payment.id
  expiresIn?: number;    // segundos até expirar (padrão: 900 = 15min)
}

export interface AbacateCharge {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  pixCode: string | null;      // brCode — código pix copia e cola
  pixQrCode: string | null;    // brCodeBase64 — imagem QR em base64
  expiresAt: string | null;
}

// ---- request helper ----

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

// ---- normaliza resposta do /transparents/create ----
// Resposta da AbacatePay:
// { data: { id, status, brCode, brCodeBase64, expiresAt, ... }, error: null }

function normalizeCharge(raw: Record<string, unknown>): AbacateCharge {
  const data = (raw.data ?? raw) as Record<string, unknown>;

  return {
    id: data.id as string,
    status: (data.status as AbacateCharge["status"]) ?? "PENDING",
    pixCode: (data.brCode as string | undefined) ?? null,
    pixQrCode: (data.brCodeBase64 as string | undefined) ?? null,
    expiresAt: (data.expiresAt as string | undefined) ?? null,
  };
}

// ============================================================
// Criar cobrança PIX transparente
// POST /transparents/create
// ============================================================

export async function createCharge(
  apiKey: string,
  baseUrl: string,
  input: AbacateCreateChargeInput,
): Promise<AbacateCharge> {
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
        // paymentId = nosso Payment.id interno, devolvido no webhook via data.metadata.paymentId
        metadata: { paymentId: input.internalId },
      },
    },
  );
  return normalizeCharge(raw);
}

// ============================================================
// Consultar status de cobrança PIX transparente
// GET /transparents/:id
// ============================================================

export async function getCharge(
  apiKey: string,
  baseUrl: string,
  chargeId: string,
): Promise<AbacateCharge> {
  const raw = await abacateRequest<Record<string, unknown>>(
    "GET",
    `/transparents/check?id=${encodeURIComponent(chargeId)}`,
    apiKey,
    baseUrl,
  );
  return normalizeCharge(raw);
}
