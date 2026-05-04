// ============================================================
// Rotas exclusivas de desenvolvimento — NUNCA registradas em produção
// ============================================================

import { createHmac } from "crypto";
import type { FastifyInstance } from "fastify";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { processPaymentConfirmation } from "../controllers/checkout.controller";

export async function devRoutes(app: FastifyInstance) {
  // POST /dev/simulate-payment/pix/:billingId
  // Delega para a AbacatePay (funciona para transparent/PIX em devMode)
  app.post<{ Params: { billingId: string } }>("/pix/:billingId", {
    schema: {
      tags: ["Dev"],
      summary: "Simula pagamento PIX (apenas dev)",
      params: {
        type: "object",
        required: ["billingId"],
        properties: { billingId: { type: "string" } },
      },
      response: { 200: { type: "object", additionalProperties: true } },
    },
    handler: async (request, reply) => {
      const { billingId } = request.params;
      const url = `${env.ABACATEPAY_BASE_URL}/transparents/simulate-payment?id=${encodeURIComponent(billingId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.ABACATEPAY_API_KEY}` },
        body: JSON.stringify({}),
      });
      const text = await res.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      return reply.status(res.status).send(body);
    },
  });

  // POST /dev/simulate-payment/checkout/:billingId
  // Para hosted checkout (cartão), a AbacatePay não tem endpoint de simulação.
  // Confirmamos diretamente no nosso banco — apenas em devMode.
  app.post<{ Params: { billingId: string } }>("/checkout/:billingId", {
    schema: {
      tags: ["Dev"],
      summary: "Simula pagamento de checkout com cartão (apenas dev)",
      params: {
        type: "object",
        required: ["billingId"],
        properties: { billingId: { type: "string" } },
      },
      response: { 200: { type: "object", additionalProperties: true } },
    },
    handler: async (request, reply) => {
      const { billingId } = request.params;

      const payment = await prisma.payment.findFirst({
        where: { billing_id: billingId, method: "credit_card" },
        select: { id: true, status: true },
      });

      if (!payment) {
        return reply.status(404).send({ success: false, error: "Pagamento não encontrado" });
      }

      if (payment.status !== "pending") {
        return reply.send({ success: true, already: true, status: payment.status });
      }

      const ticketId = await processPaymentConfirmation(payment.id, request.log);

      return reply.send({ success: true, ticketId });
    },
  });

  // POST /dev/simulate-payment/:billingId (retrocompatibilidade — PIX)
  app.post<{ Params: { billingId: string } }>("/:billingId", {
    schema: { hide: true },
    handler: async (request, reply) => {
      const { billingId } = request.params;
      const url = `${env.ABACATEPAY_BASE_URL}/transparents/simulate-payment?id=${encodeURIComponent(billingId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.ABACATEPAY_API_KEY}` },
        body: JSON.stringify({}),
      });
      const text = await res.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      return reply.status(res.status).send(body);
    },
  });

  // POST /dev/simulate-payment/card-webhook/:billingId
  // Dispara o handler REAL do webhook checkout.completed via HTTP —
  // testa o caminho completo de produção: parsing → rawBody → HMAC → handler → DB.
  // A AbacatePay envolve os dados em data.checkout, por isso replicamos esse formato.
  app.post<{ Params: { billingId: string } }>("/card-webhook/:billingId", {
    schema: {
      tags: ["Dev"],
      summary: "Simula webhook checkout.completed via handler real (apenas dev)",
      params: {
        type: "object",
        required: ["billingId"],
        properties: { billingId: { type: "string" } },
      },
      response: { 200: { type: "object", additionalProperties: true } },
    },
    handler: async (request, reply) => {
      const { billingId } = request.params;

      const payment = await prisma.payment.findFirst({
        where: { billing_id: billingId, method: "credit_card" },
        select: { id: true, status: true },
      });

      if (!payment) {
        return reply.status(404).send({ success: false, error: "Pagamento não encontrado" });
      }

      if (payment.status !== "pending") {
        return reply.send({ success: true, already: true, status: payment.status });
      }

      // Payload idêntico ao que a AbacatePay envia em checkout.completed
      const webhookPayload = JSON.stringify({
        event: "checkout.completed",
        data: {
          checkout: {
            id: billingId,
            externalId: payment.id,
            status: "PAID",
          },
        },
      });

      // Computa HMAC idêntico ao que a AbacatePay assina — obrigatório se o secret estiver configurado
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (env.ABACATEPAY_WEBHOOK_SECRET) {
        const sig = createHmac("sha256", env.ABACATEPAY_WEBHOOK_SECRET)
          .update(webhookPayload)
          .digest("hex");
        headers["x-abacatepay-signature"] = `sha256=${sig}`;
      }

      // Envia para o endpoint real — testa o handler completo, incluindo HMAC e rawBody
      const webhookUrl = `http://127.0.0.1:${env.PORT}/api/v1/checkout/webhook/abacatepay`;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: webhookPayload,
      });

      const text = await res.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      return reply.status(res.status).send(body);
    },
  });
}
