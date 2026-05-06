import type { FastifyInstance } from "fastify";
import { authenticate, authorize } from "../middleware/authenticate";
import { Errors } from "../lib/response";
import { CreateNewsSchema, UpdateNewsSchema, ListNewsQuerySchema } from "../schemas/news.schema";
import * as news from "../controllers/news.controller";
import { errorSchema } from "../lib/swagger-schemas";

// ============================================================
// Rotas administrativas de notícias — requerem autenticação admin
// ============================================================

export async function newsRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /news — lista todas (incluindo rascunhos)
  // ----------------------------------------------------------
  app.get("/", {
    schema: {
      tags: ["📰 Notícias (Admin)"],
      summary: "Lista todas as notícias (admin)",
      security: [{ BearerAuth: [] }],
      querystring: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["atletas", "eventos", "patrocinio", "plataforma"] },
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 12 },
        },
      },
      response: {
        400: errorSchema("Parâmetros inválidos"),
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: async (request, reply) => {
      const result = ListNewsQuerySchema.safeParse(request.query);
      if (!result.success) return Errors.validation(reply, result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })));
      request.query = result.data as any;
      return news.listAllNews(request as any, reply);
    },
  });

  // ----------------------------------------------------------
  // POST /news — criar notícia
  // ----------------------------------------------------------
  app.post("/", {
    schema: {
      tags: ["📰 Notícias (Admin)"],
      summary: "Cria uma notícia",
      security: [{ BearerAuth: [] }],
      body: {
        type: "object",
        required: ["title", "excerpt", "body", "category"],
        properties: {
          title: { type: "string", minLength: 5, maxLength: 255 },
          slug: { type: "string", maxLength: 255 },
          excerpt: { type: "string", minLength: 10, maxLength: 500 },
          body: { type: "string", minLength: 20 },
          category: { type: "string", enum: ["atletas", "eventos", "patrocinio", "plataforma"] },
          cover_image_url: { type: "string", format: "uri" },
          published: { type: "boolean", default: false },
          published_at: { type: "string", format: "date-time" },
        },
      },
      response: {
        400: errorSchema("Dados inválidos"),
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        409: errorSchema("Conflito de slug"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: async (request, reply) => {
      const result = CreateNewsSchema.safeParse(request.body);
      if (!result.success) return Errors.validation(reply, result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })));
      request.body = result.data as any;
      return news.createNews(request as any, reply);
    },
  });

  // ----------------------------------------------------------
  // PATCH /news/:id — atualizar notícia
  // ----------------------------------------------------------
  app.patch("/:id", {
    schema: {
      tags: ["📰 Notícias (Admin)"],
      summary: "Atualiza uma notícia",
      security: [{ BearerAuth: [] }],
      params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
      response: {
        400: errorSchema("Dados inválidos"),
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Notícia não encontrada"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: async (request, reply) => {
      const result = UpdateNewsSchema.safeParse(request.body);
      if (!result.success) return Errors.validation(reply, result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })));
      request.body = result.data as any;
      return news.updateNews(request as any, reply);
    },
  });

  // ----------------------------------------------------------
  // DELETE /news/:id — soft delete
  // ----------------------------------------------------------
  app.delete("/:id", {
    schema: {
      tags: ["📰 Notícias (Admin)"],
      summary: "Remove uma notícia (soft delete)",
      security: [{ BearerAuth: [] }],
      params: { type: "object", properties: { id: { type: "string", format: "uuid" } } },
      response: {
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Notícia não encontrada"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: news.deleteNews as any,
  });
}
