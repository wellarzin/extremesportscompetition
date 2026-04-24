import { createHmac, timingSafeEqual } from "crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import { env } from "../lib/env";
import * as abacatepay from "../lib/abacatepay";

const PAYMENT_TTL_SECONDS = 900; // 15 minutos

// ---- helper compartilhado: cria ticket atomicamente ----
// Usado tanto pelo polling quanto pelo webhook para evitar duplicação

async function processPaymentConfirmation(paymentId: string, log: { info: (...a: unknown[]) => void; error: (...a: unknown[]) => void }): Promise<string | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { event: { select: { id: true, capacity: true, enrolled: true } } },
  });

  if (!payment || payment.status !== "pending") {
    return payment?.ticket_id ?? null;
  }

  let ticketId: string | null = null;

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { status: true, ticket_id: true },
    });
    if (fresh?.status !== "pending") {
      ticketId = fresh?.ticket_id ?? null;
      return;
    }

    const ticket = await tx.ticket.create({
      data: {
        event_id: payment.event_id,
        user_id: payment.user_id,
        price_paid_cents: payment.amount,
        status: "ativo",
      },
    });

    const newEnrolled = payment.event.enrolled + 1;
    const reachedCapacity =
      payment.event.capacity !== null && newEnrolled >= payment.event.capacity;

    await tx.event.update({
      where: { id: payment.event_id },
      data: {
        enrolled: { increment: 1 },
        ...(reachedCapacity ? { status: "esgotado" } : {}),
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "paid", ticket_id: ticket.id },
    });

    ticketId = ticket.id;
  });

  log.info({ paymentId }, "Pagamento processado com sucesso");
  return ticketId;
}

// ============================================================
// POST /api/v1/checkout/events/:id
// ============================================================

type PaymentMethod = "pix" | "credit_card";

export async function initiateCheckout(
  request: FastifyRequest<{ Params: { id: string }; Body: { method: PaymentMethod } }>,
  reply: FastifyReply,
) {
  if (!env.ABACATEPAY_API_KEY) {
    return reply.status(503).send({
      success: false,
      error: { code: "PAYMENT_UNAVAILABLE", message: "Gateway de pagamento não configurado. Contate o suporte." },
    });
  }

  const userId = request.user.sub;
  const eventId = request.params.id;
  const method: PaymentMethod = request.body?.method ?? "pix";

  // ---- 1. Busca evento ----
  const event = await prisma.event.findUnique({
    where: { id: eventId, deleted_at: null },
    select: { id: true, title: true, price_cents: true, status: true, capacity: true, enrolled: true },
  });

  if (!event) return Errors.notFound(reply, "Evento");
  if (event.status !== "aberto")
    return Errors.conflict(reply, "Inscrições não estão abertas para este evento.");
  if (event.price_cents === 0)
    return Errors.validation(reply, [{ message: "Eventos gratuitos não requerem checkout." }]);
  if (event.capacity !== null && event.enrolled >= event.capacity)
    return Errors.conflict(reply, "Evento esgotado.");

  // ---- 2. Verifica ticket existente ----
  const existingTicket = await prisma.ticket.findFirst({
    where: { event_id: eventId, user_id: userId, status: "ativo" },
    select: { id: true },
  });
  if (existingTicket) return Errors.conflict(reply, "Você já está inscrito neste evento.");

  // ---- 3. Reutiliza pagamento pendente válido (mesmo método) ----
  const pendingPayment = await prisma.payment.findFirst({
    where: { event_id: eventId, user_id: userId, status: "pending", method },
  });
  if (pendingPayment && pendingPayment.expires_at > new Date()) {
    return sendSuccess(reply, {
      payment_id: pendingPayment.id,
      billing_id: pendingPayment.billing_id,
      method: pendingPayment.method,
      pix_code: pendingPayment.pix_code,
      checkout_url: pendingPayment.checkout_url,
      amount_cents: pendingPayment.amount,
      expires_at: pendingPayment.expires_at,
    }, 201);
  }

  // ---- 4. Cria registro Payment ----
  const expiresAt = new Date(Date.now() + PAYMENT_TTL_SECONDS * 1000);

  const payment = await prisma.payment.create({
    data: {
      event_id: eventId,
      user_id: userId,
      billing_id: "pending",
      checkout_url: "",
      amount: event.price_cents,
      method,
      status: "pending",
      expires_at: expiresAt,
    },
  });

  // ---- 5a. PIX ----
  if (method === "pix") {
    let charge: abacatepay.AbacatePixCharge;
    try {
      charge = await abacatepay.createPixCharge(env.ABACATEPAY_API_KEY, env.ABACATEPAY_BASE_URL, {
        amount: event.price_cents,
        description: `Inscrição: ${event.title}`,
        internalId: payment.id,
        expiresIn: PAYMENT_TTL_SECONDS,
      });
    } catch (err) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      request.log.error(err, "AbacatePay PIX charge creation failed");
      return Errors.internal(reply);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        billing_id: charge.id,
        pix_code: charge.pixCode ?? null,
        expires_at: charge.expiresAt ? new Date(charge.expiresAt) : expiresAt,
      },
    });

    return sendSuccess(reply, {
      payment_id: payment.id,
      billing_id: charge.id,
      method: "pix",
      pix_code: charge.pixCode ?? null,
      pix_qr_code: charge.pixQrCode ?? null,
      checkout_url: null,
      amount_cents: event.price_cents,
      expires_at: charge.expiresAt ?? expiresAt.toISOString(),
    }, 201);
  }

  // ---- 5b. Cartão de crédito ----
  if (method === "credit_card") {
    let productId: string;
    try {
      productId = await abacatepay.findOrCreateProduct(
        env.ABACATEPAY_API_KEY,
        env.ABACATEPAY_BASE_URL,
        event.id,
        event.title,
        event.price_cents,
      );
    } catch (err) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      request.log.error(err, "AbacatePay product find/create failed");
      return Errors.internal(reply);
    }

    let checkout: abacatepay.AbacateCardCheckout;
    try {
      checkout = await abacatepay.createCardCheckout(
        env.ABACATEPAY_API_KEY,
        env.ABACATEPAY_BASE_URL,
        {
          productId,
          externalId: payment.id, // devolvido no webhook via data.checkout.externalId
          completionUrl: `${env.FRONTEND_URL}?payment_success=${payment.id}`,
          returnUrl: env.FRONTEND_URL,
          maxInstallments: 12,
        },
      );
    } catch (err) {
      await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
      request.log.error(err, "AbacatePay card checkout creation failed");
      return Errors.internal(reply);
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        billing_id: checkout.id,
        checkout_url: checkout.url,
        expires_at: expiresAt,
      },
    });

    return sendSuccess(reply, {
      payment_id: payment.id,
      billing_id: checkout.id,
      method: "credit_card",
      pix_code: null,
      pix_qr_code: null,
      checkout_url: checkout.url,
      amount_cents: event.price_cents,
      expires_at: expiresAt.toISOString(),
    }, 201);
  }

  return Errors.validation(reply, [{ message: "Método de pagamento inválido." }]);
}

// ============================================================
// GET /api/v1/checkout/payments/:paymentId/status
// ============================================================

export async function getPaymentStatus(
  request: FastifyRequest<{ Params: { paymentId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.user.sub;
  const { paymentId } = request.params;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, user_id: userId },
    include: { event: { select: { id: true, capacity: true, enrolled: true } } },
  });

  if (!payment) return Errors.notFound(reply, "Pagamento");

  if (payment.status !== "pending") {
    return sendSuccess(reply, { status: payment.status, ticket_id: payment.ticket_id });
  }

  if (payment.expires_at < new Date()) {
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "expired" } });
    return sendSuccess(reply, { status: "expired", ticket_id: null });
  }

  // ---- Fallback: consulta status na AbacatePay (cobre dev sem ngrok e webhooks perdidos) ----
  if (env.ABACATEPAY_API_KEY && payment.billing_id && payment.billing_id !== "pending") {
    try {
      let abacateStatus: string;

      if (payment.method === "credit_card") {
        const checkout = await abacatepay.getCardCheckoutStatus(
          env.ABACATEPAY_API_KEY,
          env.ABACATEPAY_BASE_URL,
          payment.billing_id,
        );
        abacateStatus = checkout.status;
      } else {
        const charge = await abacatepay.getPixChargeStatus(
          env.ABACATEPAY_API_KEY,
          env.ABACATEPAY_BASE_URL,
          payment.billing_id,
        );
        abacateStatus = charge.status;
      }

      request.log.info(
        { abacateStatus, method: payment.method, billingId: payment.billing_id },
        "AbacatePay status poll result",
      );

      const isPaid = ["PAID", "COMPLETED", "APPROVED"].includes(abacateStatus.toUpperCase());
      if (isPaid) {
        const ticketId = await processPaymentConfirmation(paymentId, request.log);
        return sendSuccess(reply, { status: "paid", ticket_id: ticketId });
      }
    } catch (err) {
      request.log.warn(err, "Falha ao consultar status na AbacatePay durante polling");
    }
  }

  return sendSuccess(reply, { status: payment.status, ticket_id: payment.ticket_id });
}

// ============================================================
// POST /api/v1/checkout/webhook/abacatepay
// ============================================================

export async function abacatepayWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // ---- 1. Validação HMAC ----
  if (env.ABACATEPAY_WEBHOOK_SECRET) {
    const rawBody =
      (request.raw as import("http").IncomingMessage & { rawBody?: string }).rawBody ?? "";
    const signature = (request.headers["x-abacatepay-signature"] as string | undefined) ?? "";

    const expected = createHmac("sha256", env.ABACATEPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const sig = signature.startsWith("sha256=") ? signature.slice(7) : signature;

    let valid = false;
    try {
      valid = sig.length === expected.length &&
        timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
    } catch {
      valid = false;
    }

    if (!valid) {
      request.log.warn("AbacatePay webhook: assinatura inválida");
      return reply.status(401).send({ error: "Invalid signature" });
    }
  }

  const body = request.body as Record<string, unknown>;
  const event = (body.event as string | undefined) ?? "";

  // ---- 2. transparent.completed (PIX) ----
  if (event === "transparent.completed") {
    const dataObj = (body.data as Record<string, unknown> | undefined) ?? {};
    const pixQrCodeData = (dataObj.pixQrCode as Record<string, unknown> | undefined) ?? {};
    const metadataObj = (dataObj.metadata as Record<string, unknown> | undefined) ?? {};

    const externalId = metadataObj["paymentId"] as string | undefined;
    const abacatePayId =
      (pixQrCodeData["id"] as string | undefined) ??
      (dataObj["id"] as string | undefined);

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(externalId ? [{ id: externalId }] : []),
          ...(abacatePayId ? [{ billing_id: abacatePayId }] : []),
        ],
      },
    });

    if (!payment || payment.status !== "pending") {
      return reply.status(200).send({ received: true });
    }

    try {
      await processPaymentConfirmation(payment.id, request.log);
    } catch (err) {
      request.log.error(err, "Falha ao processar webhook PIX");
      return reply.status(500).send({ error: "Internal error" });
    }

    return reply.status(200).send({ received: true });
  }

  // ---- 3. checkout.completed (Cartão) ----
  if (event === "checkout.completed") {
    const dataObj = (body.data as Record<string, unknown> | undefined) ?? {};
    const checkoutData = (dataObj.checkout as Record<string, unknown> | undefined) ?? {};

    const externalId = checkoutData["externalId"] as string | undefined; // nosso payment.id
    const abacateCheckoutId = checkoutData["id"] as string | undefined;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(externalId ? [{ id: externalId }] : []),
          ...(abacateCheckoutId ? [{ billing_id: abacateCheckoutId }] : []),
        ],
      },
    });

    if (!payment || payment.status !== "pending") {
      return reply.status(200).send({ received: true });
    }

    try {
      await processPaymentConfirmation(payment.id, request.log);
    } catch (err) {
      request.log.error(err, "Falha ao processar webhook cartão");
      return reply.status(500).send({ error: "Internal error" });
    }

    return reply.status(200).send({ received: true });
  }

  // Ignora outros eventos
  return reply.status(200).send({ received: true });
}
