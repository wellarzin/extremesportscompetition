import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authenticate";
import {
  CreateEventSchema,
  UpdateEventSchema,
  ListEventsQuerySchema,
} from "../schemas/events.schema";
import * as eventsController from "../controllers/events.controller";
import { Errors } from "../lib/response";
import { errorSchema } from "../lib/swagger-schemas";

export async function eventsRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /events/me/organized   ← declarado ANTES de /events/:id
  // ----------------------------------------------------------
  app.get("/me/organized", {
    schema: {
      tags: ["Events"],
      summary: "Lista eventos criados pelo organizador autenticado",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: { description: "Lista retornada", type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", additionalProperties: true } }, meta: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
      },
    },
    preHandler: [authenticate, authorize(["organizer", "admin"])],
    handler: eventsController.getOrganizedEvents,
  });

  // ----------------------------------------------------------
  // GET /events
  // ----------------------------------------------------------
  app.get("/", {
    schema: {
      tags: ["Events"],
      summary: "Lista eventos com filtros e paginação",
      security: [],
      querystring: {
        type: "object",
        properties: {
          sport: { type: "string" },
          modality: { type: "string", enum: ["presencial", "online"] },
          city: { type: "string" },
          state: { type: "string", minLength: 2, maxLength: 2 },
          status: { type: "string" },
          date_from: { type: "string", format: "date" },
          date_to: { type: "string", format: "date" },
          price_max: { type: "integer", minimum: 0 },
          sort: { type: "string", enum: ["start_datetime", "price_cents", "created_at", "title"], default: "start_datetime" },
          order: { type: "string", enum: ["asc", "desc"], default: "asc" },
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: { description: "Lista de eventos", type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", additionalProperties: true } }, meta: { type: "object", additionalProperties: true } } },
        422: errorSchema("Parâmetro inválido"),
      },
    },
    preHandler: async (request, reply) => {
      const result = ListEventsQuerySchema.safeParse(request.query);
      if (!result.success) {
        return Errors.validation(
          reply,
          result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
        );
      }
      request.query = result.data as any;
    },
    handler: eventsController.listEvents,
  });

  // ----------------------------------------------------------
  // GET /events/:id
  // ----------------------------------------------------------
  app.get("/:id", {
    schema: {
      tags: ["Events"],
      summary: "Detalhe de um evento",
      security: [],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { description: "Evento encontrado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        404: errorSchema("Evento não encontrado"),
      },
    },
    handler: eventsController.getEvent,
  });

  // ----------------------------------------------------------
  // POST /events
  // ----------------------------------------------------------
  app.post("/", {
    schema: {
      tags: ["Events"],
      summary: "Cria novo evento",
      description: "Acesso: `organizer` e `admin`. `start_datetime` mínimo 24h no futuro.",
      body: {
        type: "object",
        required: ["title", "category", "modality", "start_datetime", "description"],
        example: {
          title: "Corrida das Montanhas 2027",
          category: "trail",
          modality: "presencial",
          start_datetime: "2027-06-15T08:00:00.000Z",
          end_datetime: "2027-06-15T18:00:00.000Z",
          description: "Corrida de trail com percurso de 42km nas serras gauches.",
          rules: "Proibido uso de bicicleta. Obrigatorio kit de seguranca.",
          location: "Parque Estadual do Tainhas",
          city: "Sao Francisco de Paula",
          state: "RS",
          price_cents: 15000,
          capacity: 500,
          ranking_points: 150,
        },
        properties: {
          title: { type: "string", example: "Corrida das Montanhas 2027" },
          category: {
            type: "string",
            enum: [
              "maratona", "trail", "ultramaratona", "campeonato_crossfit",
              "campeonato_natacao", "campeonato_ciclismo", "campeonato_volei",
              "campeonato_basquete", "beach_tennis", "corrida_de_obstaculos",
              "desafio_aberto", "evento_recreativo", "outros",
            ],
            example: "trail",
          },
          modality: { type: "string", enum: ["presencial", "online"], example: "presencial" },
          start_datetime: { type: "string", format: "date-time", example: "2027-06-15T08:00:00.000Z" },
          end_datetime: { type: "string", format: "date-time", example: "2027-06-15T18:00:00.000Z" },
          description: { type: "string", example: "Corrida de trail com percurso de 42km nas serras gauches." },
          rules: { type: "string", example: "Proibido uso de bicicleta. Obrigatorio kit de seguranca." },
          location: { type: "string", example: "Parque Estadual do Tainhas" },
          city: { type: "string", example: "Sao Francisco de Paula" },
          state: { type: "string", example: "RS" },
          price_cents: { type: "integer", minimum: 0, default: 0, example: 15000 },
          capacity: { type: "integer", minimum: 1, example: 500 },
          ranking_points: { type: "integer", minimum: 0, example: 150 },
        },
      },
      response: {
        201: { description: "Evento criado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      authorize(["organizer", "admin"]),
      async (request, reply) => {
        const result = CreateEventSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: eventsController.createEvent,
  });

  // ----------------------------------------------------------
  // PUT /events/:id
  // ----------------------------------------------------------
  app.put("/:id", {
    schema: {
      tags: ["Events"],
      summary: "Atualiza evento",
      description: "Apenas o organizador dono ou `admin`. Ao menos um campo deve ser enviado.",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: { type: "object" },
      response: {
        200: { description: "Evento atualizado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Evento não encontrado"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      async (request, reply) => {
        const result = UpdateEventSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: eventsController.updateEvent,
  });

  // ----------------------------------------------------------
  // DELETE /events/:id
  // ----------------------------------------------------------
  app.delete("/:id", {
    schema: {
      tags: ["Events"],
      summary: "Cancela evento (soft delete)",
      description: "Apenas o organizador dono ou `admin`. Ingressos ativos são cancelados.",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { description: "Evento cancelado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Evento não encontrado"),
      },
    },
    preHandler: [authenticate],
    handler: eventsController.deleteEvent,
  });

  // ----------------------------------------------------------
  // POST /events/:id/enroll
  // ----------------------------------------------------------
  app.post("/:id/enroll", {
    schema: {
      tags: ["Events"],
      summary: "Inscreve usuário no evento",
      description: "Usa SELECT FOR UPDATE para evitar race condition. Se esgotado, usuário vai para lista de espera.",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        201: { description: "Inscrito ou adicionado à lista de espera", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        404: errorSchema("Evento não encontrado"),
        409: errorSchema("Já inscrito ou inscrições fechadas"),
      },
    },
    preHandler: [authenticate],
    handler: eventsController.enrollEvent,
  });

  // ----------------------------------------------------------
  // POST /events/:id/cover — upload de foto de capa
  // ----------------------------------------------------------
  app.post("/:id/cover", {
    schema: {
      tags: ["Events"],
      summary: "Upload de foto de capa do evento",
      description: "Aceita `multipart/form-data` com campo `file`. Suporta JPEG, PNG e WebP. Máximo 5 MB. MIME validado via magic bytes. Apenas o organizador dono ou `admin`.",
      consumes: ["multipart/form-data"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "Imagem de capa do evento (JPEG, PNG ou WebP — máx 5 MB)",
          },
        },
      },
      response: {
        200: { description: "Capa atualizada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Evento não encontrado"),
        422: errorSchema("Formato inválido ou arquivo muito grande"),
      },
    },
    validatorCompiler: ({ httpPart }) => {
      // Body é multipart/form-data — o @fastify/multipart faz o parse manualmente
      // no controller via request.file(). Desabilitar a validação JSON do body
      // para evitar o erro "body must be object".
      if (httpPart === "body") return () => true;
      return () => true;
    },
    preHandler: [authenticate],
    handler: eventsController.uploadEventCover,
  });

  // ----------------------------------------------------------
  // DELETE /events/:id/enroll
  // ----------------------------------------------------------
  app.delete("/:id/enroll", {
    schema: {
      tags: ["Events"],
      summary: "Cancela inscrição no evento",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { description: "Inscrição cancelada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        404: errorSchema("Inscrição não encontrada"),
      },
    },
    preHandler: [authenticate],
    handler: eventsController.cancelEnroll,
  });
}
