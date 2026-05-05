import { z } from "zod";
import { NewsCategory } from "@prisma/client";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const CreateNewsSchema = z
  .object({
    title: z.string().min(5).max(255).trim(),
    slug: z
      .string()
      .max(255)
      .trim()
      .toLowerCase()
      .optional()
      .transform((v, ctx) => {
        const title = (ctx as any)?._parent?.title as string | undefined;
        return v ?? (title ? slugify(title) : undefined);
      }),
    excerpt: z.string().min(10).max(500).trim(),
    body: z.string().min(20).trim(),
    category: z.nativeEnum(NewsCategory),
    cover_image_url: z.string().url().optional(),
    published: z.boolean().default(false),
    published_at: z.string().datetime().optional().nullable(),
  })
  .strict();

export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;

export const UpdateNewsSchema = z
  .object({
    title: z.string().min(5).max(255).trim().optional(),
    slug: z.string().max(255).trim().toLowerCase().optional(),
    excerpt: z.string().min(10).max(500).trim().optional(),
    body: z.string().min(20).trim().optional(),
    category: z.nativeEnum(NewsCategory).optional(),
    cover_image_url: z.string().url().nullable().optional(),
    published: z.boolean().optional(),
    published_at: z.string().datetime().nullable().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Ao menos um campo deve ser fornecido.",
  });

export type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;

export const ListNewsQuerySchema = z.object({
  category: z.nativeEnum(NewsCategory).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(12),
});

export type ListNewsQueryInput = z.infer<typeof ListNewsQuerySchema>;
