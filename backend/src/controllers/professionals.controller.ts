import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import type {
  CreateProfessionalInput,
  UpdateProfessionalInput,
  AddSpecialtyInput,
  ListProfessionalsQueryInput,
} from "../schemas/professionals.schema";

const PHOTOS_DIR = join(process.cwd(), "uploads", "professionals");
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
// GET /professionals
// ============================================================

export async function listProfessionals(
  request: FastifyRequest<{ Querystring: ListProfessionalsQueryInput }>,
  reply: FastifyReply
) {
  const { specialty, page, per_page } = request.query;
  const skip = (page - 1) * per_page;

  const where: Record<string, unknown> = {
    active: true,
    deleted_at: null,
  };

  if (specialty) {
    where.specialties = { some: { specialty } };
  }

  const [professionals, total] = await Promise.all([
    prisma.professional.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        photo_url: true,
        birth_date: true,
        education: true,
        registration_type: true,
        bio: true,
        active: true,
        specialties: {
          select: { id: true, specialty: true, notes: true },
        },
      },
      orderBy: { full_name: "asc" },
      skip,
      take: per_page,
    }),
    prisma.professional.count({ where }),
  ]);

  return sendSuccess(reply, professionals, 200, {
    page,
    per_page,
    total,
    total_pages: Math.ceil(total / per_page),
  });
}

// ============================================================
// GET /professionals/:id
// ============================================================

export async function getProfessional(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const professional = await prisma.professional.findUnique({
    where: { id: request.params.id, active: true, deleted_at: null },
    select: {
      id: true,
      full_name: true,
      photo_url: true,
      birth_date: true,
      education: true,
      registration_type: true,
      bio: true,
      active: true,
      created_at: true,
      updated_at: true,
      specialties: {
        select: { id: true, specialty: true, notes: true },
      },
      // user_id nunca exposto em rotas públicas
    },
  });

  if (!professional) return Errors.notFound(reply, "Profissional");

  return sendSuccess(reply, professional);
}

// ============================================================
// POST /professionals — apenas admin
// ============================================================

export async function createProfessional(
  request: FastifyRequest<{ Body: CreateProfessionalInput }>,
  reply: FastifyReply
) {
  const body = request.body;

  // Verificar unicidade do registro
  const existing = await prisma.professional.findUnique({
    where: { registration_number: body.registration_number },
    select: { id: true },
  });

  if (existing) {
    return Errors.conflict(reply, "Número de registro profissional já cadastrado.");
  }

  // Se user_id fornecido, validar que existe e ainda não tem profissional vinculado
  if (body.user_id) {
    const user = await prisma.user.findUnique({
      where: { id: body.user_id, deleted_at: null },
      select: { id: true, professional: { select: { id: true } } },
    });

    if (!user) return Errors.validation(reply, [{ field: "user_id", message: "Usuário não encontrado." }]);
    if (user.professional) {
      return Errors.conflict(reply, "Este usuário já está vinculado a um profissional.");
    }
  }

  const professional = await prisma.professional.create({
    data: {
      full_name: body.full_name,
      birth_date: new Date(body.birth_date),
      education: body.education,
      registration_number: body.registration_number,
      registration_type: body.registration_type,
      bio: body.bio,
      photo_url: body.photo_url,
      user_id: body.user_id ?? null,
      specialties: {
        create: body.specialties.map((s) => ({
          specialty: s.specialty,
          notes: s.notes,
        })),
      },
    },
    select: {
      id: true,
      full_name: true,
      education: true,
      registration_number: true,
      registration_type: true,
      bio: true,
      photo_url: true,
      active: true,
      created_at: true,
      specialties: { select: { id: true, specialty: true, notes: true } },
    },
  });

  return sendSuccess(reply, professional, 201);
}

// ============================================================
// PUT /professionals/:id — admin ou professional vinculado
// ============================================================

export async function updateProfessional(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateProfessionalInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const role = request.user.role;
  const { id } = request.params;
  const body = request.body;

  const professional = await prisma.professional.findUnique({
    where: { id, deleted_at: null },
    select: { user_id: true },
  });

  if (!professional) return Errors.notFound(reply, "Profissional");

  // Professional só pode editar o próprio perfil; admin pode editar qualquer um
  if (role !== "admin" && professional.user_id !== userId) return Errors.forbidden(reply);

  // Campos registration_number e registration_type são imutáveis sem aprovação de admin
  // (não constam no UpdateProfessionalSchema, então já estão bloqueados por .strict())

  const data: Record<string, unknown> = {};
  if (body.full_name !== undefined) data.full_name = body.full_name;
  if (body.birth_date !== undefined) data.birth_date = new Date(body.birth_date);
  if (body.education !== undefined) data.education = body.education;
  if (body.bio !== undefined) data.bio = body.bio;
  if (body.photo_url !== undefined) data.photo_url = body.photo_url;
  // active só admin pode alterar
  if (body.active !== undefined && role === "admin") data.active = body.active;

  const updated = await prisma.professional.update({
    where: { id },
    data,
    select: {
      id: true,
      full_name: true,
      education: true,
      registration_type: true,
      bio: true,
      photo_url: true,
      active: true,
      updated_at: true,
      specialties: { select: { id: true, specialty: true, notes: true } },
    },
  });

  return sendSuccess(reply, updated);
}

// ============================================================
// DELETE /professionals/:id — apenas admin, soft delete
// ============================================================

export async function deleteProfessional(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  const professional = await prisma.professional.findUnique({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!professional) return Errors.notFound(reply, "Profissional");

  await prisma.professional.update({
    where: { id },
    data: { active: false, deleted_at: new Date() },
  });

  return sendSuccess(reply, { message: "Profissional desativado." });
}

// ============================================================
// POST /professionals/:id/specialties — apenas admin
// ============================================================

export async function addSpecialty(
  request: FastifyRequest<{ Params: { id: string }; Body: AddSpecialtyInput }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const { specialty, notes } = request.body;

  const professional = await prisma.professional.findUnique({
    where: { id, deleted_at: null },
    select: { id: true },
  });

  if (!professional) return Errors.notFound(reply, "Profissional");

  const created = await prisma.professionalSpecialties.create({
    data: {
      professional_id: id,
      specialty,
      notes,
    },
    select: { id: true, specialty: true, notes: true },
  });

  return sendSuccess(reply, created, 201);
}

// ============================================================
// DELETE /professionals/:id/specialties/:sid — apenas admin
// ============================================================

export async function removeSpecialty(
  request: FastifyRequest<{ Params: { id: string; sid: string } }>,
  reply: FastifyReply
) {
  const { id, sid } = request.params;

  // Verificar que o profissional existe
  const professional = await prisma.professional.findUnique({
    where: { id, deleted_at: null },
    select: {
      id: true,
      specialties: { select: { id: true } },
    },
  });

  if (!professional) return Errors.notFound(reply, "Profissional");

  const specialty = professional.specialties.find((s) => s.id === sid);
  if (!specialty) return Errors.forbidden(reply); // 403 em vez de 404

  // Profissional deve manter ao menos 1 especialidade
  if (professional.specialties.length <= 1) {
    return Errors.validation(reply, [
      { message: "O profissional deve manter ao menos uma especialidade." },
    ]);
  }

  await prisma.professionalSpecialties.delete({ where: { id: sid } });

  return sendSuccess(reply, { message: "Especialidade removida." });
}

// ============================================================
// POST /professionals/:id/photo — upload de foto
// ============================================================

export async function uploadProfessionalPhoto(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const role = request.user.role;
  const { id } = request.params;

  const professional = await prisma.professional.findUnique({
    where: { id, deleted_at: null },
    select: { user_id: true },
  });

  if (!professional) return Errors.notFound(reply, "Profissional");
  if (role !== "admin" && professional.user_id !== userId) return Errors.forbidden(reply);

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
    mkdirSync(PHOTOS_DIR, { recursive: true });
  } catch {
    return Errors.internal(reply);
  }

  const filePath = join(PHOTOS_DIR, filename);
  const ws = createWriteStream(filePath);
  ws.write(fullBuffer);
  ws.end();

  await new Promise<void>((resolve, reject) => {
    ws.on("finish", resolve);
    ws.on("error", reject);
  });

  const photo_url = `/uploads/professionals/${filename}`;

  await prisma.professional.update({
    where: { id },
    data: { photo_url },
  });

  return sendSuccess(reply, { photo_url });
}
