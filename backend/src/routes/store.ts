import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate";
import * as storeController from "../controllers/store.controller";
import { errorSchema } from "../lib/swagger-schemas";

export async function storeRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // POST /store/orders — Cria pedido e inicia pagamento
  // ----------------------------------------------------------
  app.post("/orders", {
    schema: {
      tags: ["🛍️ Store"],
      summary: "Cria pedido da loja e inicia pagamento",
      description: "Recebe os itens do carrinho, valida estoque e cria uma cobrança via AbacatePay (PIX ou cartão).",
      body: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["product_id", "quantity"],
              properties: {
                product_id: { type: "string", format: "uuid" },
                quantity: { type: "integer", minimum: 1, maximum: 99 },
              },
            },
          },
          method: {
            type: "string",
            enum: ["pix", "credit_card"],
            default: "pix",
            description: "Método de pagamento",
          },
        },
      },
      response: {
        201: {
          description: "Pedido criado",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                order_id: { type: "string", format: "uuid" },
                billing_id: { type: "string" },
                method: { type: "string" },
                pix_code: { type: "string", nullable: true },
                pix_qr_code: { type: "string", nullable: true },
                checkout_url: { type: "string", nullable: true },
                total_cents: { type: "integer" },
                expires_at: { type: "string" },
              },
            },
          },
        },
        401: errorSchema("Não autorizado"),
        409: errorSchema("Estoque insuficiente"),
        422: errorSchema("Erro de validação"),
        503: errorSchema("Gateway indisponível"),
      },
    },
    preHandler: [authenticate],
    handler: storeController.createOrder,
  });

  // ----------------------------------------------------------
  // GET /store/orders/:id/status — Polling de status do pedido
  // ----------------------------------------------------------
  app.get("/orders/:id/status", {
    schema: {
      tags: ["🛍️ Store"],
      summary: "Consulta status do pedido da loja (polling)",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["pending_payment", "paid", "cancelled", "refunded"],
                },
              },
            },
          },
        },
        401: errorSchema("Não autorizado"),
        404: errorSchema("Pedido não encontrado"),
      },
    },
    preHandler: [authenticate],
    handler: storeController.getOrderStatus,
  });

  // ----------------------------------------------------------
  // GET /store/orders — Lista pedidos do usuário
  // ----------------------------------------------------------
  app.get("/orders", {
    schema: {
      tags: ["🛍️ Store"],
      summary: "Lista pedidos do usuário autenticado",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  status: { type: "string" },
                  total_cents: { type: "integer" },
                  method: { type: "string" },
                  created_at: { type: "string", format: "date-time" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        quantity: { type: "integer" },
                        unit_price_cents: { type: "integer" },
                        product: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            name: { type: "string" },
                            image_url: { type: "string", nullable: true },
                            category: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" },
                per_page: { type: "integer" },
                total: { type: "integer" },
                total_pages: { type: "integer" },
              },
            },
          },
        },
        401: errorSchema("Não autorizado"),
      },
    },
    preHandler: [authenticate],
    handler: storeController.listMyOrders,
  });
}
