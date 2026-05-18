import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate";
import * as checkoutController from "../controllers/checkout.controller";
import { errorSchema } from "../lib/swagger-schemas";

export async function checkoutRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // POST /checkout/events/:id
  // ----------------------------------------------------------
  app.post("/events/:id", {
    schema: {
      tags: ["Checkout"],
      summary: "Inicia checkout de evento pago via AbacatePay",
      description:
        "Cria uma cobrança no AbacatePay com o método de pagamento escolhido (pix, credit_card ou debit_card). Para eventos gratuitos, use `POST /events/:id/enroll`.",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["method"],
        properties: {
          method: {
            type: "string",
            enum: ["pix", "credit_card"],
            description: "Método de pagamento: pix (QR Code) ou credit_card (checkout hospedado AbacatePay)",
          },
        },
      },
      response: {
        201: {
          description: "Cobrança criada",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                payment_id: { type: "string", format: "uuid" },
                billing_id: { type: "string" },
                pix_code: { type: "string", nullable: true },
                checkout_url: { type: "string" },
                amount_cents: { type: "integer" },
                expires_at: { type: "string", format: "date-time" },
              },
              additionalProperties: true,
            },
          },
        },
        401: errorSchema("Não autorizado"),
        404: errorSchema("Evento não encontrado"),
        409: errorSchema("Já inscrito ou inscrições fechadas"),
        503: errorSchema("Gateway de pagamento não configurado"),
      },
    },
    preHandler: [authenticate],
    handler: checkoutController.initiateCheckout,
  });

  // ----------------------------------------------------------
  // POST /checkout/events/:id/team
  // ----------------------------------------------------------
  app.post("/events/:id/team", {
    schema: {
      tags: ["Checkout"],
      summary: "Inicia checkout de equipe — compra ingressos para múltiplos membros",
      description:
        "Cria uma cobrança no AbacatePay pelo valor total (price × membros). Todos os e-mails informados devem pertencer a usuários cadastrados na plataforma. Após a confirmação do pagamento, cada membro recebe o ingresso em 'Meus Ingressos'.",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["method", "member_emails"],
        properties: {
          method: {
            type: "string",
            enum: ["pix", "credit_card"],
          },
          member_emails: {
            type: "array",
            items: { type: "string", format: "email" },
            minItems: 2,
            maxItems: 50,
            description: "E-mails de todos os membros da equipe. Todos devem estar cadastrados na plataforma.",
          },
        },
      },
      response: {
        201: {
          description: "Cobrança de equipe criada",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                payment_id: { type: "string", format: "uuid" },
                billing_id: { type: "string" },
                pix_code: { type: "string", nullable: true },
                checkout_url: { type: "string", nullable: true },
                amount_cents: { type: "integer" },
                expires_at: { type: "string", format: "date-time" },
                team_purchase_id: { type: "string", format: "uuid" },
                member_count: { type: "integer" },
              },
              additionalProperties: true,
            },
          },
        },
        401: errorSchema("Não autorizado"),
        404: errorSchema("Evento não encontrado"),
        409: errorSchema("Evento esgotado ou membro já inscrito"),
        422: errorSchema("E-mails não cadastrados na plataforma"),
        503: errorSchema("Gateway de pagamento não configurado"),
      },
    },
    preHandler: [authenticate],
    handler: checkoutController.initiateTeamCheckout,
  });

  // ----------------------------------------------------------
  // GET /checkout/payments/:paymentId/status
  // ----------------------------------------------------------
  app.get("/payments/:paymentId/status", {
    schema: {
      tags: ["Checkout"],
      summary: "Consulta status do pagamento (polling)",
      description:
        "Frontend chama a cada 3 segundos enquanto aguarda a confirmação do PIX. Retorna `status: paid` assim que o webhook for processado.",
      params: {
        type: "object",
        required: ["paymentId"],
        properties: { paymentId: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          description: "Status retornado",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["pending", "paid", "failed", "expired"],
                },
                ticket_id: { type: "string", nullable: true },
              },
              additionalProperties: true,
            },
          },
        },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Pagamento não encontrado"),
      },
    },
    preHandler: [authenticate],
    handler: checkoutController.getPaymentStatus,
  });

  // ----------------------------------------------------------
  // POST /checkout/webhook/abacatepay  (público — chamado pelo AbacatePay)
  // ----------------------------------------------------------
  app.post("/webhook/abacatepay", {
    schema: {
      tags: ["Checkout"],
      summary: "Webhook do AbacatePay",
      description:
        "Endpoint chamado pelo AbacatePay ao confirmar pagamentos (PIX, cartão) e eventos de assinatura. " +
        "Validado via HMAC-SHA256 no header `x-abacatepay-signature` (formato: `sha256=<hex>`). " +
        "Configure a URL `<API_URL>/api/v1/checkout/webhook/abacatepay` no painel do AbacatePay.",
      security: [],
      body: { type: "object", additionalProperties: true },
      response: {
        200: {
          description: "Webhook processado",
          type: "object",
          properties: { received: { type: "boolean" } },
        },
      },
    },
    config: {
      // Rate limit dedicado — AbacatePay pode fazer muitas chamadas
      rateLimit: { max: 300, timeWindow: "1 minute" },
    },
    handler: checkoutController.abacatepayWebhook,
  });
}
