import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import { errorSchema } from "../lib/swagger-schemas";

// ============================================================
// Rotas públicas da Landing Page
// Sem autenticação. Retornam apenas dados públicos — sem dados
// pessoais, documentos, informações internas ou campos sensíveis.
// ============================================================

export async function landingRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /landing/professionals
  // ----------------------------------------------------------
  app.get("/professionals", {
    schema: {
      tags: ["🏠 Landing Page"],
      summary: "Lista profissionais para a landing page",
      description: "Retorna apenas dados públicos dos profissionais ativos. Sem autenticação.",
      security: [],
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1, example: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20, example: 20 },
        },
      },
      response: {
        200: {
          description: "Lista de profissionais",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  full_name: { type: "string" },
                  photo_url: { type: "string", nullable: true },
                  education: { type: "string" },
                  registration_type: { type: "string" },
                  bio: { type: "string", nullable: true },
                  specialties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        specialty: { type: "string" },
                        notes: { type: "string", nullable: true },
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
      },
    },
    handler: async (request, reply) => {
      const page = Math.max(1, Number((request.query as any).page ?? 1));
      const perPage = Math.min(100, Math.max(1, Number((request.query as any).per_page ?? 20)));
      const skip = (page - 1) * perPage;

      const [professionals, total] = await Promise.all([
        prisma.professional.findMany({
          where: { active: true, deleted_at: null },
          select: {
            id: true,
            full_name: true,
            photo_url: true,
            education: true,
            registration_type: true,
            bio: true,
            specialties: {
              select: { id: true, specialty: true, notes: true },
            },
          },
          orderBy: { full_name: "asc" },
          skip,
          take: perPage,
        }),
        prisma.professional.count({ where: { active: true, deleted_at: null } }),
      ]);

      return sendSuccess(reply, professionals, 200, {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      });
    },
  });

  // ----------------------------------------------------------
  // GET /landing/featured
  // ----------------------------------------------------------
  app.get("/featured", {
    schema: {
      tags: ["🏠 Landing Page"],
      summary: "Retorna até 3 eventos em destaque para a Hero Section",
      description: "Eventos marcados como `featured = true` pelo admin, ordenados por data de início. Sem autenticação.",
      security: [],
      response: {
        200: {
          description: "Eventos em destaque",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              maxItems: 3,
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  modality: { type: "string" },
                  start_datetime: { type: "string", format: "date-time" },
                  end_datetime: { type: "string", format: "date-time", nullable: true },
                  location: { type: "string", nullable: true },
                  city: { type: "string", nullable: true },
                  state: { type: "string", nullable: true },
                  price_cents: { type: "integer" },
                  capacity: { type: "integer", nullable: true },
                  enrolled: { type: "integer" },
                  status: { type: "string" },
                  cover_image_url: { type: "string", nullable: true },
                  ranking_points: { type: "integer", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      const events = await prisma.event.findMany({
        where: {
          featured: true,
          deleted_at: null,
          status: { notIn: ["cancelado", "encerrado"] },
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          modality: true,
          start_datetime: true,
          end_datetime: true,
          location: true,
          city: true,
          state: true,
          price_cents: true,
          capacity: true,
          enrolled: true,
          status: true,
          cover_image_url: true,
          ranking_points: true,
        },
        orderBy: { start_datetime: "asc" },
        take: 3,
      });

      return sendSuccess(reply, events);
    },
  });

  // ----------------------------------------------------------
  // GET /landing/events
  // ----------------------------------------------------------
  app.get("/events", {
    schema: {
      tags: ["🏠 Landing Page"],
      summary: "Lista eventos para a landing page",
      description: "Retorna apenas dados públicos dos eventos com filtros e paginação. Sem autenticação.",
      security: [],
      querystring: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filtrar por categoria do evento" },
          modality: { type: "string", enum: ["presencial", "online"] },
          city: { type: "string" },
          state: { type: "string", minLength: 2, maxLength: 2 },
          status: { type: "string", enum: ["aberto", "encerrado", "esgotado", "em_breve", "cancelado"], default: "aberto" },
          date_from: { type: "string", format: "date" },
          date_to: { type: "string", format: "date" },
          price_max: { type: "integer", minimum: 0, description: "Preço máximo em centavos" },
          sort: { type: "string", enum: ["start_datetime", "price_cents", "created_at", "title"], default: "start_datetime" },
          order: { type: "string", enum: ["asc", "desc"], default: "asc" },
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          description: "Lista de eventos",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  title: { type: "string" },
                  category: { type: "string" },
                  modality: { type: "string" },
                  start_datetime: { type: "string", format: "date-time" },
                  end_datetime: { type: "string", format: "date-time", nullable: true },
                  location: { type: "string", nullable: true },
                  city: { type: "string", nullable: true },
                  state: { type: "string", nullable: true },
                  price_cents: { type: "integer" },
                  capacity: { type: "integer", nullable: true },
                  enrolled: { type: "integer" },
                  status: { type: "string" },
                  cover_image_url: { type: "string", nullable: true },
                  ranking_points: { type: "integer", nullable: true },
                  organizer: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      full_name: { type: "string" },
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
        422: errorSchema("Parâmetro inválido"),
      },
    },
    handler: async (request, reply) => {
      const q = request.query as Record<string, string | undefined>;

      const page = Math.max(1, Number(q.page ?? 1));
      const perPage = Math.min(100, Math.max(1, Number(q.per_page ?? 20)));
      const skip = (page - 1) * perPage;

      const where: Record<string, unknown> = {
        deleted_at: null,
        status: q.status ?? "aberto",
      };

      if (q.category) where.category = q.category;
      if (q.modality) where.modality = q.modality;
      if (q.city) where.city = { contains: q.city, mode: "insensitive" };
      if (q.state) where.state = q.state.toUpperCase();
      if (q.price_max !== undefined) where.price_cents = { lte: Number(q.price_max) };

      if (q.date_from || q.date_to) {
        const startFilter: Record<string, Date> = {};
        if (q.date_from) startFilter.gte = new Date(q.date_from);
        if (q.date_to) {
          const to = new Date(q.date_to);
          to.setHours(23, 59, 59, 999);
          startFilter.lte = to;
        }
        where.start_datetime = startFilter;
      }

      const validSorts = ["start_datetime", "price_cents", "created_at", "title"] as const;
      const sort = validSorts.includes(q.sort as any) ? q.sort! : "start_datetime";
      const order = q.order === "desc" ? "desc" : "asc";

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          select: {
            id: true,
            title: true,
            category: true,
            modality: true,
            start_datetime: true,
            end_datetime: true,
            location: true,
            city: true,
            state: true,
            price_cents: true,
            capacity: true,
            enrolled: true,
            status: true,
            cover_image_url: true,
            ranking_points: true,
            organizer: { select: { id: true, full_name: true } },
          },
          orderBy: { [sort]: order },
          skip,
          take: perPage,
        }),
        prisma.event.count({ where }),
      ]);

      return sendSuccess(reply, events, 200, {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      });
    },
  });

  // ----------------------------------------------------------
  // GET /landing/events/:id
  // ----------------------------------------------------------
  app.get("/events/:id", {
    schema: {
      tags: ["🏠 Landing Page"],
      summary: "Detalhe de um evento para a landing page",
      description: "Retorna todos os dados públicos do evento pelo ID. Sem autenticação. Nunca expõe dados do organizador além de `id` e `full_name`.",
      security: [],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid", description: "UUID do evento" } },
      },
      response: {
        200: {
          description: "Evento encontrado",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                title: { type: "string" },
                category: { type: "string" },
                modality: { type: "string" },
                start_datetime: { type: "string", format: "date-time" },
                end_datetime: { type: "string", format: "date-time", nullable: true },
                description: { type: "string" },
                rules: { type: "string", nullable: true },
                location: { type: "string", nullable: true },
                city: { type: "string", nullable: true },
                state: { type: "string", nullable: true },
                price_cents: { type: "integer" },
                capacity: { type: "integer", nullable: true },
                enrolled: { type: "integer" },
                status: { type: "string" },
                cover_image_url: { type: "string", nullable: true },
                ranking_points: { type: "integer", nullable: true },
                created_at: { type: "string", format: "date-time" },
                organizer: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    full_name: { type: "string" },
                  },
                },
              },
            },
          },
        },
        404: errorSchema("Evento não encontrado"),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const event = await prisma.event.findUnique({
        where: { id, deleted_at: null },
        select: {
          id: true,
          title: true,
          category: true,
          modality: true,
          start_datetime: true,
          end_datetime: true,
          description: true,
          rules: true,
          location: true,
          city: true,
          state: true,
          price_cents: true,
          capacity: true,
          enrolled: true,
          status: true,
          cover_image_url: true,
          ranking_points: true,
          created_at: true,
          // Nunca expor dados privados do organizador além de id e full_name
          organizer: { select: { id: true, full_name: true } },
        },
      });

      if (!event) return Errors.notFound(reply, "Evento");

      return sendSuccess(reply, event);
    },
  });
}
