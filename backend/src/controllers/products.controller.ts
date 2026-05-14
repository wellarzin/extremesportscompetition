import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import { uploadFile } from "../lib/storage";
import { ProductCategory } from "@prisma/client";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
};

function detectMime(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

// ============================================================
// GET /products — admin: todos, incluindo inativos
// ============================================================

export async function listProducts(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const q = request.query as {
    category?: string;
    active?: string;
    page?: string;
    per_page?: string;
  };
  const page    = Math.max(1, Number(q.page    ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(q.per_page ?? 20)));
  const skip    = (page - 1) * perPage;

  const where: Record<string, unknown> = { deleted_at: null };
  if (q.category) where.category = q.category;
  if (q.active !== undefined) where.active = q.active === "true";

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { created_at: "desc" }, skip, take: perPage }),
    prisma.product.count({ where }),
  ]);

  return sendSuccess(reply, products, 200, {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  });
}

// ============================================================
// GET /products/:id
// ============================================================

export async function getProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const product = await prisma.product.findFirst({
    where: { id: request.params.id, deleted_at: null },
  });
  if (!product) return Errors.notFound(reply, "Produto");
  return sendSuccess(reply, product);
}

// ============================================================
// POST /products — admin
// ============================================================

interface CreateProductBody {
  name: string;
  description?: string;
  price_cents: number;
  stock: number;
  category: ProductCategory;
}

export async function createProduct(
  request: FastifyRequest<{ Body: CreateProductBody }>,
  reply: FastifyReply,
) {
  const body = request.body;
  const product = await prisma.product.create({
    data: {
      name:        body.name,
      description: body.description ?? null,
      price_cents: body.price_cents,
      stock:       body.stock,
      category:    body.category,
      active:      true,
    },
  });
  return sendSuccess(reply, product, 201);
}

// ============================================================
// PUT /products/:id — admin
// ============================================================

interface UpdateProductBody {
  name?:        string;
  description?: string | null;
  price_cents?: number;
  stock?:       number;
  category?:    ProductCategory;
  active?:      boolean;
}

export async function updateProduct(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const body   = request.body;

  const existing = await prisma.product.findFirst({ where: { id, deleted_at: null } });
  if (!existing) return Errors.notFound(reply, "Produto");

  const data: Record<string, unknown> = {};
  if (body.name        !== undefined) data.name        = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price_cents !== undefined) data.price_cents = body.price_cents;
  if (body.stock       !== undefined) data.stock       = body.stock;
  if (body.category    !== undefined) data.category    = body.category;
  if (body.active      !== undefined) data.active      = body.active;

  if (Object.keys(data).length === 0) {
    return Errors.validation(reply, [{ message: "Ao menos um campo deve ser enviado." }]);
  }

  const updated = await prisma.product.update({ where: { id }, data });
  return sendSuccess(reply, updated);
}

// ============================================================
// DELETE /products/:id — admin, soft delete
// ============================================================

export async function deleteProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const existing = await prisma.product.findFirst({ where: { id, deleted_at: null } });
  if (!existing) return Errors.notFound(reply, "Produto");

  await prisma.product.update({
    where: { id },
    data: { active: false, deleted_at: new Date() },
  });

  return sendSuccess(reply, { message: "Produto desativado." });
}

// ============================================================
// POST /products/:id/image — admin, upload de imagem
// ============================================================

export async function uploadProductImage(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const existing = await prisma.product.findFirst({ where: { id, deleted_at: null } });
  if (!existing) return Errors.notFound(reply, "Produto");

  const data = await (request as any).file({ limits: { fileSize: 5 * 1024 * 1024 } });

  if (!data) {
    return Errors.validation(reply, [{ field: "file", message: "Arquivo não encontrado." }]);
  }

  const chunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of data.file) {
    chunks.push(chunk as Buffer);
    totalSize += (chunk as Buffer).length;
    if (totalSize > 5 * 1024 * 1024) {
      return Errors.validation(reply, [{ field: "file", message: "Arquivo excede 5 MB." }]);
    }
  }

  const fullBuffer = Buffer.concat(chunks);
  if (fullBuffer.length < 12) {
    return Errors.validation(reply, [{ field: "file", message: "Arquivo inválido." }]);
  }

  const mime = detectMime(fullBuffer);
  if (!mime || !ALLOWED_MIME[mime]) {
    return Errors.validation(reply, [{ field: "file", message: "Formato não suportado. Use JPEG, PNG ou WebP." }]);
  }

  const ext      = ALLOWED_MIME[mime];
  const filename = `${randomUUID()}${ext}`;

  const image_url = await uploadFile("products", filename, fullBuffer, mime);

  await prisma.product.update({ where: { id }, data: { image_url } });

  return sendSuccess(reply, { image_url });
}
