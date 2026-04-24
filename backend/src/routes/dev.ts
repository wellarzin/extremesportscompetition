// ============================================================
// Rotas exclusivas de desenvolvimento — NUNCA registradas em produção
// Permitem simular pagamentos sem gastar dinheiro real
// ============================================================

import type { FastifyInstance } from "fastify";
import { env } from "../lib/env";

export async function devRoutes(app: FastifyInstance) {
  // POST /dev/simulate-payment/:billingId
  // Chama o endpoint de simulação da AbacatePay para marcar uma cobrança como paga
  app.post<{ Params: { billingId: string } }>("/:billingId", {
    schema: {
      tags: ["Dev"],
      summary: "Simula pagamento PIX (apenas dev)",
      description:
        "Marca uma cobrança AbacatePay como paga sem transação real. Só funciona com chave de API de desenvolvimento.",
      params: {
        type: "object",
        required: ["billingId"],
        properties: { billingId: { type: "string" } },
      },
      response: {
        200: { type: "object", additionalProperties: true },
      },
    },
    handler: async (request, reply) => {
      const { billingId } = request.params;

      const url = `${env.ABACATEPAY_BASE_URL}/transparents/simulate-payment?id=${encodeURIComponent(billingId)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ABACATEPAY_API_KEY}`,
        },
        body: JSON.stringify({}),
      });

      const text = await res.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = text; }

      return reply.status(res.status).send(data);
    },
  });
}
