import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import { sanitizeHtml } from "../lib/sanitize";
import type {
  CreateEventInput,
  UpdateEventInput,
  ListEventsQueryInput,
} from "../schemas/events.schema";

const COVERS_DIR = join(process.cwd(), "uploads", "covers");
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
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
// POST /events/:id/cover — upload de foto de capa
// ============================================================

export async function uploadEventCover(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const role = request.user.role;
  const { id } = request.params;

  const event = await prisma.event.findUnique({
    where: { id, deleted_at: null },
    select: { organizer_id: true },
  });

  if (!event) return Errors.notFound(reply, "Evento");
  if (role !== "admin" && event.organizer_id !== userId) return Errors.forbidden(reply);

  const data = await (request as any).file({ limits: { fileSize: 5 * 1024 * 1024 } });

  if (!data) {
    return Errors.validation(reply, [{ field: "file", message: "Arquivo não encontrado na requisição." }]);
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

  const ext = ALLOWED_MIME[mime];
  const filename = `${randomUUID()}${ext}`;

  try {
    mkdirSync(COVERS_DIR, { recursive: true });
  } catch {
    return Errors.internal(reply);
  }

  const filePath = join(COVERS_DIR, filename);
  const ws = createWriteStream(filePath);
  ws.write(fullBuffer);
  ws.end();

  await new Promise<void>((resolve, reject) => {
    ws.on("finish", resolve);
    ws.on("error", reject);
  });

  const cover_image_url = `/uploads/covers/${filename}`;

  await prisma.event.update({
    where: { id },
    data: { cover_image_url },
  });

  return sendSuccess(reply, { cover_image_url });
}

// ============================================================
// GET /events
// ============================================================

export async function listEvents(
  request: FastifyRequest<{ Querystring: ListEventsQueryInput }>,
  reply: FastifyReply
) {
  const q = request.query;
  const page = Math.max(1, q.page);
  const perPage = Math.min(100, Math.max(1, q.per_page));
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { deleted_at: null };

  if (q.sport) where.category = q.sport;
  if (q.modality) where.modality = q.modality;
  if (q.city) where.city = { contains: q.city, mode: "insensitive" };
  if (q.state) where.state = q.state;
  if (q.status) where.status = q.status;
  if (q.price_max !== undefined) where.price_cents = { lte: q.price_max };

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

  const orderBy: Record<string, string> = { [q.sort]: q.order };

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
      orderBy,
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
}

// ============================================================
// GET /events/:id
// ============================================================

export async function getEvent(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const event = await prisma.event.findUnique({
    where: { id: request.params.id, deleted_at: null },
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
      updated_at: true,
      organizer: { select: { id: true, full_name: true } },
    },
  });

  if (!event) return Errors.notFound(reply, "Evento");

  return sendSuccess(reply, event);
}

// ============================================================
// POST /events
// ============================================================

export async function createEvent(
  request: FastifyRequest<{ Body: CreateEventInput }>,
  reply: FastifyReply
) {
  const organizerId = request.user.sub;
  const body = request.body;

  const event = await prisma.event.create({
    data: {
      organizer_id: organizerId,
      title: body.title,
      category: body.category,
      modality: body.modality,
      start_datetime: new Date(body.start_datetime),
      end_datetime: body.end_datetime ? new Date(body.end_datetime) : undefined,
      description: sanitizeHtml(body.description),
      rules: body.rules ? sanitizeHtml(body.rules) : undefined,
      location: body.location,
      city: body.city,
      state: body.state,
      price_cents: body.price_cents,
      capacity: body.capacity,
      ranking_points: body.ranking_points,
    },
    select: {
      id: true,
      title: true,
      category: true,
      modality: true,
      start_datetime: true,
      end_datetime: true,
      price_cents: true,
      capacity: true,
      status: true,
      created_at: true,
    },
  });

  return sendSuccess(reply, event, 201);
}

// ============================================================
// PUT /events/:id
// ============================================================

export async function updateEvent(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateEventInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const role = request.user.role;
  const { id } = request.params;
  const body = request.body;

  const event = await prisma.event.findUnique({
    where: { id, deleted_at: null },
    select: { organizer_id: true },
  });

  if (!event) return Errors.notFound(reply, "Evento");

  // Apenas o dono ou admin pode editar
  if (role !== "admin" && event.organizer_id !== userId) return Errors.forbidden(reply);

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.category !== undefined) data.category = body.category;
  if (body.modality !== undefined) data.modality = body.modality;
  if (body.start_datetime !== undefined) data.start_datetime = new Date(body.start_datetime);
  if (body.end_datetime !== undefined) data.end_datetime = body.end_datetime ? new Date(body.end_datetime) : null;
  if (body.description !== undefined) data.description = sanitizeHtml(body.description);
  if (body.rules !== undefined) data.rules = body.rules ? sanitizeHtml(body.rules) : null;
  if (body.location !== undefined) data.location = body.location;
  if (body.city !== undefined) data.city = body.city;
  if (body.state !== undefined) data.state = body.state;
  if (body.price_cents !== undefined) data.price_cents = body.price_cents;
  if (body.capacity !== undefined) data.capacity = body.capacity;
  if (body.status !== undefined) data.status = body.status;
  if (body.featured !== undefined && role === "admin") data.featured = body.featured;
  if (body.ranking_points !== undefined) data.ranking_points = body.ranking_points;

  const updated = await prisma.event.update({
    where: { id },
    data,
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
      ranking_points: true,
      updated_at: true,
    },
  });

  return sendSuccess(reply, updated);
}

// ============================================================
// DELETE /events/:id — soft delete
// ============================================================

export async function deleteEvent(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const role = request.user.role;
  const { id } = request.params;

  const event = await prisma.event.findUnique({
    where: { id, deleted_at: null },
    select: { organizer_id: true, enrolled: true },
  });

  if (!event) return Errors.notFound(reply, "Evento");

  if (role !== "admin" && event.organizer_id !== userId) return Errors.forbidden(reply);

  await prisma.event.update({
    where: { id },
    data: {
      status: "cancelado",
      deleted_at: new Date(),
    },
  });

  // Se houver inscritos, cancelar os ingressos ativos
  if (event.enrolled > 0) {
    await prisma.ticket.updateMany({
      where: { event_id: id, status: "ativo" },
      data: { status: "cancelado" },
    });
    // TODO: criar jobs de reembolso e notificação por e-mail
  }

  return sendSuccess(reply, { message: "Evento cancelado." });
}

// ============================================================
// POST /events/:id/enroll
// ============================================================

export async function enrollEvent(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const eventId = request.params.id;

  type EnrollResult = { enrolled: boolean; waitlisted: boolean; message: string } | null;

  const result: EnrollResult = await prisma.$transaction(async (tx) => {
    // SELECT FOR UPDATE — previne race condition em inscrições simultâneas
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        status: string;
        capacity: number | null;
        enrolled: number;
        price_cents: number;
      }>
    >`
      SELECT id, status, capacity, enrolled, price_cents
      FROM events
      WHERE id = ${eventId}::uuid
        AND deleted_at IS NULL
      FOR UPDATE
    `;

    const event = rows[0];
    if (!event) throw Object.assign(new Error("Evento não encontrado."), { code: "NOT_FOUND" });

    if (event.status === "esgotado") {
      // Adicionar à lista de espera
      const maxPos = await tx.$queryRaw<Array<{ max: number | null }>>`
        SELECT MAX(position) as max FROM waitlist WHERE event_id = ${eventId}::uuid
      `;
      const nextPos = (maxPos[0]?.max ?? 0) + 1;
      await tx.$queryRaw`
        INSERT INTO waitlist (id, event_id, user_id, position, registered_at)
        VALUES (gen_random_uuid(), ${eventId}::uuid, ${userId}::uuid, ${nextPos}, NOW())
        ON CONFLICT (event_id, user_id) DO NOTHING
      `;
      return { enrolled: false, waitlisted: true, message: "Evento esgotado. Você foi adicionado à lista de espera." };
    }

    if (event.status !== "aberto") {
      throw Object.assign(new Error("Inscrições não estão abertas para este evento."), { code: "CONFLICT" });
    }

    const existingTicket = await tx.ticket.findFirst({
      where: { event_id: eventId, user_id: userId, status: "ativo" },
      select: { id: true },
    });
    if (existingTicket) {
      throw Object.assign(new Error("Você já está inscrito neste evento."), { code: "CONFLICT" });
    }

    if (event.capacity !== null && event.enrolled >= event.capacity) {
      await tx.event.update({ where: { id: eventId }, data: { status: "esgotado" } });
      throw Object.assign(new Error("Capacidade esgotada."), { code: "CONFLICT" });
    }

    await tx.ticket.create({
      data: {
        event_id: eventId,
        user_id: userId,
        price_paid_cents: event.price_cents,
        status: "ativo",
      },
    });

    const reachedCapacity = event.capacity !== null && event.enrolled + 1 >= event.capacity;
    await tx.event.update({
      where: { id: eventId },
      data: {
        enrolled: { increment: 1 },
        ...(reachedCapacity ? { status: "esgotado" } : {}),
      },
    });

    return { enrolled: true, waitlisted: false, message: "Inscrição realizada com sucesso." };
  }).catch((err: Error & { code?: string }) => {
    if (err.code === "CONFLICT") { Errors.conflict(reply, err.message); return null; }
    if (err.code === "NOT_FOUND") { Errors.notFound(reply, "Evento"); return null; }
    throw err;
  });

  if (result === null) return;

  return sendSuccess(reply, result, result.enrolled ? 201 : 200);
}

// ============================================================
// DELETE /events/:id/enroll — cancelar inscrição
// ============================================================

export async function cancelEnroll(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const eventId = request.params.id;

  const ticket = await prisma.ticket.findFirst({
    where: { event_id: eventId, user_id: userId, status: "ativo" },
    select: { id: true },
  });

  if (!ticket) return Errors.notFound(reply, "Inscrição");

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "cancelado" },
    }),
    prisma.event.update({
      where: { id: eventId },
      data: { enrolled: { decrement: 1 } },
    }),
  ]);

  // TODO: reembolso e notificação

  return sendSuccess(reply, { message: "Inscrição cancelada." });
}

// ============================================================
// GET /events/me/organized
// ============================================================

export async function getOrganizedEvents(
  request: FastifyRequest<{ Querystring: { page?: number; per_page?: number } }>,
  reply: FastifyReply
) {
  const organizerId = request.user.sub;
  const page = Math.max(1, Number(request.query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(request.query.per_page ?? 20)));
  const skip = (page - 1) * perPage;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: { organizer_id: organizerId, deleted_at: null },
      select: {
        id: true,
        title: true,
        category: true,
        modality: true,
        start_datetime: true,
        end_datetime: true,
        status: true,
        price_cents: true,
        capacity: true,
        enrolled: true,
        cover_image_url: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take: perPage,
    }),
    prisma.event.count({ where: { organizer_id: organizerId, deleted_at: null } }),
  ]);

  return sendSuccess(reply, events, 200, {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  });
}
