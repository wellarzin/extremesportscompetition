import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import type {
  CreateNewsInput,
  UpdateNewsInput,
  ListNewsQueryInput,
} from "../schemas/news.schema";

// ---- Seleção pública (landing) ----
const PUBLIC_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  body: true,
  category: true,
  cover_image_url: true,
  published_at: true,
  created_at: true,
} as const;

// ---- Seleção admin (completa) ----
const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  published: true,
  updated_at: true,
  deleted_at: true,
} as const;

// ============================================================
// Público (landing)
// ============================================================

export async function listPublishedNews(
  request: FastifyRequest<{ Querystring: ListNewsQueryInput }>,
  reply: FastifyReply,
) {
  const { category, page, per_page } = request.query;
  const skip = (page - 1) * per_page;

  const where = {
    published: true,
    deleted_at: null,
    ...(category ? { category } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: PUBLIC_SELECT,
      orderBy: { published_at: "desc" },
      skip,
      take: per_page,
    }),
    prisma.news.count({ where }),
  ]);

  return sendSuccess(reply, articles, 200, {
    page,
    per_page,
    total,
    total_pages: Math.ceil(total / per_page),
  });
}

export async function getPublishedNewsBySlug(
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) {
  const article = await prisma.news.findFirst({
    where: { slug: request.params.slug, published: true, deleted_at: null },
    select: PUBLIC_SELECT,
  });

  if (!article) return Errors.notFound(reply, "Notícia");

  return sendSuccess(reply, article);
}

// ============================================================
// Admin
// ============================================================

export async function listAllNews(
  request: FastifyRequest<{ Querystring: ListNewsQueryInput }>,
  reply: FastifyReply,
) {
  const { category, page, per_page } = request.query;
  const skip = (page - 1) * per_page;

  const where = {
    deleted_at: null,
    ...(category ? { category } : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.news.findMany({
      where,
      select: ADMIN_SELECT,
      orderBy: { created_at: "desc" },
      skip,
      take: per_page,
    }),
    prisma.news.count({ where }),
  ]);

  return sendSuccess(reply, articles, 200, {
    page,
    per_page,
    total,
    total_pages: Math.ceil(total / per_page),
  });
}

export async function createNews(
  request: FastifyRequest<{ Body: CreateNewsInput }>,
  reply: FastifyReply,
) {
  const { title, slug, excerpt, body, category, cover_image_url, published, published_at } =
    request.body;

  const finalSlug =
    slug ??
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const existing = await prisma.news.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return Errors.conflict(reply, `Já existe uma notícia com o slug "${finalSlug}".`);
  }

  const article = await prisma.news.create({
    data: {
      slug: finalSlug,
      title,
      excerpt,
      body,
      category,
      cover_image_url: cover_image_url ?? null,
      published: published ?? false,
      published_at: published && !published_at ? new Date() : published_at ? new Date(published_at) : null,
    },
    select: ADMIN_SELECT,
  });

  return sendSuccess(reply, article, 201);
}

export async function updateNews(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateNewsInput }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const existing = await prisma.news.findFirst({ where: { id, deleted_at: null } });
  if (!existing) return Errors.notFound(reply, "Notícia");

  const { published_at, ...rest } = request.body;

  const updated = await prisma.news.update({
    where: { id },
    data: {
      ...rest,
      ...(published_at !== undefined
        ? { published_at: published_at ? new Date(published_at) : null }
        : {}),
      // Se publicando agora e sem data definida, usar now()
      ...(rest.published === true && !existing.published_at && !published_at
        ? { published_at: new Date() }
        : {}),
    },
    select: ADMIN_SELECT,
  });

  return sendSuccess(reply, updated);
}

export async function deleteNews(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const existing = await prisma.news.findFirst({ where: { id, deleted_at: null } });
  if (!existing) return Errors.notFound(reply, "Notícia");

  await prisma.news.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  return sendSuccess(reply, { id });
}
