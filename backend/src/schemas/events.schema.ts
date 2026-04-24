import { z } from "zod";
import { EventCategory, EventModality, EventStatus } from "@prisma/client";

const MIN_HOURS_AHEAD = 24;

export const CreateEventSchema = z
  .object({
    title: z.string().min(3).max(255).trim(),
    category: z.nativeEnum(EventCategory),
    modality: z.nativeEnum(EventModality),
    start_datetime: z
      .string()
      .datetime({ message: "Data/hora inválida. Use ISO 8601." })
      .refine(
        (v) => new Date(v) > new Date(Date.now() + MIN_HOURS_AHEAD * 60 * 60 * 1000),
        { message: "O evento deve iniciar com ao menos 24h de antecedência." }
      ),
    end_datetime: z.string().datetime({ message: "Data/hora inválida." }).optional(),
    description: z.string().min(10).max(10_000).trim(),
    rules: z.string().max(5_000).trim().optional(),
    location: z.string().max(255).trim().optional(),
    city: z.string().max(100).trim().optional(),
    state: z.string().length(2).toUpperCase().optional(),
    price_cents: z.number().int().min(0).default(0),
    capacity: z.number().int().positive().optional(),
    ranking_points: z.number().int().min(0).optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.modality === "presencial") {
      if (!d.location) ctx.addIssue({ code: "custom", path: ["location"], message: "Local é obrigatório para eventos presenciais." });
      if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Cidade é obrigatória para eventos presenciais." });
      if (!d.state) ctx.addIssue({ code: "custom", path: ["state"], message: "Estado é obrigatório para eventos presenciais." });
    }
    if (d.end_datetime && new Date(d.end_datetime) <= new Date(d.start_datetime)) {
      ctx.addIssue({ code: "custom", path: ["end_datetime"], message: "Data de término deve ser posterior ao início." });
    }
  });

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = z
  .object({
    title: z.string().min(3).max(255).trim().optional(),
    category: z.nativeEnum(EventCategory).optional(),
    modality: z.nativeEnum(EventModality).optional(),
    start_datetime: z
      .string()
      .datetime()
      .refine(
        (v) => new Date(v) > new Date(Date.now() + MIN_HOURS_AHEAD * 60 * 60 * 1000),
        { message: "O evento deve iniciar com ao menos 24h de antecedência." }
      )
      .optional(),
    end_datetime: z.string().datetime().nullable().optional(),
    description: z.string().min(10).max(10_000).trim().optional(),
    rules: z.string().max(5_000).trim().nullable().optional(),
    location: z.string().max(255).trim().nullable().optional(),
    city: z.string().max(100).trim().nullable().optional(),
    state: z.string().length(2).toUpperCase().nullable().optional(),
    price_cents: z.number().int().min(0).optional(),
    capacity: z.number().int().positive().nullable().optional(),
    status: z.nativeEnum(EventStatus).optional(),
    featured: z.boolean().optional(),
    ranking_points: z.number().int().min(0).nullable().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: "Ao menos um campo deve ser fornecido." });

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const ListEventsQuerySchema = z
  .object({
    sport: z.nativeEnum(EventCategory).optional(),
    modality: z.nativeEnum(EventModality).optional(),
    city: z.string().max(100).optional(),
    state: z.string().length(2).toUpperCase().optional(),
    status: z.nativeEnum(EventStatus).optional(),
    date_from: z.string().date().optional(),
    date_to: z.string().date().optional(),
    price_max: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["start_datetime", "price_cents", "created_at", "title"]).default("start_datetime"),
    order: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().positive().default(1),
    per_page: z.coerce.number().int().positive().max(100).default(20),
  });

export type ListEventsQueryInput = z.infer<typeof ListEventsQuerySchema>;
