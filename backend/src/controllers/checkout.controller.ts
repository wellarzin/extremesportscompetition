import { createHmac, timingSafeEqual } from "crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import { env } from "../lib/env";
import * as abacatepay from "../lib/abacatepay";

const PAYMENT_TTL_SECONDS = 900; // 15 minutos

// ============================================================
// POST /api/v1/checkout/events/:id
// Inicia o checkout de um evento pago — cria cobrança no AbacatePay
// ============================================================

export async function initiateCheckout(
  request: FastifyRequest<{ Params: { id: string }; Body: { method: 'pix' } }>,
  reply: FastifyReply,
) {
  if (!env.ABACATEPAY_API_KEY) {
    return reply.status(503).send({
      success: false,
      error: {
        code: "PAYMENT_UNAVAILABLE",
        message: "Gateway de pagamento não configurado. Contate o suporte.",
      },
    });
  }

  const userId = request.user.sub;
  const eventId = request.params.id;

  // ---- 1. Busca dados do evento no banco (nunca confiar no cliente) ----
  const event = await prisma.event.findUnique({
    where: { id: eventId, deleted_at: null },
    select: {
      id: true,
      title: true,
      price_cents: true,
      status: true,
      capacity: true,
      enrolled: true,
    },
  });

  if (!event) return Errors.notFound(reply, "Evento");
  if (event.status !== "aberto")
    return Errors.conflict(reply, "Inscrições não estão abertas para este evento.");
  if (event.price_cents === 0)
    return Errors.validation(reply, [
      { message: "Eventos gratuitos não requerem checkout. Use o endpoint de inscrição direta." },
    ]);
  if (event.capacity !== null && event.enrolled >= event.capacity)
    return Errors.conflict(reply, "Evento esgotado.");

  // ---- 2. Verifica ticket ativo já existente ----
  const existingTicket = await prisma.ticket.findFirst({
    where: { event_id: eventId, user_id: userId, status: "ativo" },
    select: { id: true },
  });
  if (existingTicket) return Errors.conflict(reply, "Você já está inscrito neste evento.");

  // ---- 3. Reutiliza pagamento pendente válido ----
  const pendingPayment = await prisma.payment.findFirst({
    where: { event_id: eventId, user_id: userId, status: "pending" },
  });
  if (pendingPayment && pendingPayment.expires_at > new Date()) {
    return sendSuccess(
      reply,
      {
        payment_id: pendingPayment.id,
        billing_id: pendingPayment.billing_id,
        pix_code: pendingPayment.pix_code,
        checkout_url: pendingPayment.checkout_url,
        amount_cents: pendingPayment.amount,
        expires_at: pendingPayment.expires_at,
      },
      201,
    );
  }

  // ---- 5. Cria registro Payment ANTES de chamar AbacatePay (externalId = payment.id) ----
  const expiresAt = new Date(Date.now() + PAYMENT_TTL_SECONDS * 1000);

  const payment = await prisma.payment.create({
    data: {
      event_id: eventId,
      user_id: userId,
      billing_id: "pending", // temporário — sobrescrito logo abaixo
      checkout_url: "",
      amount: event.price_cents,
      status: "pending",
      expires_at: expiresAt,
    },
  });

  // ---- 6. Cria cobrança no AbacatePay ----
  let charge: abacatepay.AbacateCharge;
  try {
    charge = await abacatepay.createCharge(
      env.ABACATEPAY_API_KEY,
      env.ABACATEPAY_BASE_URL,
      {
        amount: event.price_cents,
        description: `Inscrição: ${event.title}`,
        internalId: payment.id, // armazenado em metadata.payment.id, devolvido no webhook
        expiresIn: PAYMENT_TTL_SECONDS,
      },
    );
  } catch (err) {
    // Falha ao criar cobrança — remove o Payment para evitar registro órfão
    await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
    request.log.error(err, "AbacatePay charge creation failed");
    return Errors.internal(reply);
  }

  // ---- 7. Atualiza Payment com dados reais do AbacatePay ----
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      billing_id: charge.id,
      checkout_url: "",
      pix_code: charge.pixCode ?? null,
      expires_at: charge.expiresAt ? new Date(charge.expiresAt) : expiresAt,
    },
  });

  return sendSuccess(
    reply,
    {
      payment_id: payment.id,
      billing_id: charge.id,
      pix_code: charge.pixCode ?? null,
      pix_qr_code: charge.pixQrCode ?? null,
      amount_cents: event.price_cents,
      expires_at: charge.expiresAt ?? expiresAt.toISOString(),
    },
    201,
  );
}

// ============================================================
// GET /api/v1/checkout/payments/:paymentId/status
// Polling — frontend chama a cada 3s enquanto aguarda PIX
// ============================================================

export async function getPaymentStatus(
  request: FastifyRequest<{ Params: { paymentId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.user.sub;
  const { paymentId } = request.params;

  // Filtra por userId + paymentId — nunca expor status de pagamento alheio
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, user_id: userId },
    include: {
      event: { select: { id: true, capacity: true, enrolled: true } },
    },
  });

  if (!payment) return Errors.notFound(reply, "Pagamento");

  // Já processado — retorna direto
  if (payment.status !== "pending") {
    return sendSuccess(reply, { status: payment.status, ticket_id: payment.ticket_id });
  }

  // TTL expirado localmente
  if (payment.expires_at < new Date()) {
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "expired" } });
    return sendSuccess(reply, { status: "expired", ticket_id: null });
  }

  // ---- Fallback: consulta status na AbacatePay quando webhook não chegou ----
  // Cobre dev local (sem ngrok) e casos de webhook perdido
  if (env.ABACATEPAY_API_KEY && payment.billing_id && payment.billing_id !== "pending") {
    try {
      const charge = await abacatepay.getCharge(
        env.ABACATEPAY_API_KEY,
        env.ABACATEPAY_BASE_URL,
        payment.billing_id,
      );

      if (charge.status === "PAID") {
        // Mesma lógica do webhook — transação atômica com idempotência
        let ticketId: string | null = null;

        await prisma.$transaction(async (tx) => {
          // Re-lê para evitar race condition com webhook chegando ao mesmo tempo
          const fresh = await tx.payment.findUnique({
            where: { id: payment.id },
            select: { status: true },
          });
          if (fresh?.status !== "pending") {
            ticketId = payment.ticket_id;
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

        request.log.info({ paymentId: payment.id }, "Pagamento confirmado via polling AbacatePay");
        return sendSuccess(reply, { status: "paid", ticket_id: ticketId });
      }
    } catch (err) {
      // Falha ao consultar AbacatePay — retorna status local sem quebrar o polling
      request.log.warn(err, "Falha ao consultar status na AbacatePay durante polling");
    }
  }

  return sendSuccess(reply, { status: payment.status, ticket_id: payment.ticket_id });
}

// ============================================================
// POST /api/v1/checkout/webhook/abacatepay
// AbacatePay chama este endpoint quando o pagamento é confirmado
// ============================================================

export async function abacatepayWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // ---- 1. Validação HMAC com timingSafeEqual ----
  if (env.ABACATEPAY_WEBHOOK_SECRET) {
    const rawBody =
      (request.raw as import("http").IncomingMessage & { rawBody?: string }).rawBody ?? "";
    const signature = (request.headers["x-abacatepay-signature"] as string | undefined) ?? "";

    const expected = createHmac("sha256", env.ABACATEPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    // Remove prefixo "sha256=" se presente
    const sig = signature.startsWith("sha256=") ? signature.slice(7) : signature;

    let valid = false;
    try {
      valid =
        sig.length === expected.length &&
        timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
    } catch {
      valid = false;
    }

    if (!valid) {
      request.log.warn("AbacatePay webhook: assinatura inválida");
      return reply.status(401).send({ error: "Invalid signature" });
    }
  }

  // ---- 2. Parseia e normaliza o payload ----
  const body = request.body as Record<string, unknown>;
  const event = (body.event as string | undefined) ?? "";

  // Ignora silenciosamente eventos que não sejam transparent.completed
  if (event !== "transparent.completed") {
    return reply.status(200).send({ received: true });
  }

  // Payload do transparent.completed:
  // { event: "transparent.completed", data: { id, metadata: { payment: { id } }, pixQrCode: { id } } }
  const dataObj = (body.data as Record<string, unknown> | undefined) ?? {};
  const pixQrCodeData = (dataObj.pixQrCode as Record<string, unknown> | undefined) ?? {};
  const metadataObj = (dataObj.metadata as Record<string, unknown> | undefined) ?? {};

  const externalId = metadataObj["paymentId"] as string | undefined; // nosso payment.id
  const abacatePayId =
    (pixQrCodeData["id"] as string | undefined) ??
    (dataObj["id"] as string | undefined); // ID do QR code ou da transação

  if (!abacatePayId && !externalId) {
    request.log.warn("AbacatePay webhook: payload sem billing ID");
    return reply.status(200).send({ received: true });
  }

  // ---- 3. Busca Payment pelo externalId (nosso ID interno) ou billing_id ----
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(externalId ? [{ id: externalId }] : []),
        ...(abacatePayId ? [{ billing_id: abacatePayId }] : []),
      ],
    },
    include: {
      event: {
        select: {
          id: true,
          capacity: true,
          enrolled: true,
        },
      },
    },
  });

  if (!payment) {
    request.log.warn({ abacatePayId, externalId }, "AbacatePay webhook: pagamento não encontrado");
    return reply.status(200).send({ received: true });
  }

  // ---- 4. Idempotência — ignora se já processado ----
  if (payment.status !== "pending") {
    return reply.status(200).send({ received: true });
  }

  // ---- 5. Transação atômica: ticket + enrolled + status ----
  try {
    await prisma.$transaction(async (tx) => {
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
    });

    request.log.info({ paymentId: payment.id }, "Pagamento processado com sucesso");
  } catch (err) {
    request.log.error(err, "Falha ao processar webhook de pagamento");
    return reply.status(500).send({ error: "Internal error" });
  }

  // ---- 6. E-mail de confirmação (fora da transação — falha não reverte o ticket) ----
  // TODO: disparar e-mail de confirmação ao usuário

  return reply.status(200).send({ received: true });
}
