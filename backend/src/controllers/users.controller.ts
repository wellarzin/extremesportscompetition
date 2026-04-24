import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { prisma } from "../lib/prisma";
import { sendSuccess, Errors } from "../lib/response";
import { decrypt, maskDocument } from "../lib/crypto";
import type {
  UpdateProfileInput,
  ChangeEmailInput,
  DeleteAccountInput,
  AddSportPreferenceInput,
  UpdateSportPreferenceInput,
} from "../schemas/users.schema";

const BCRYPT_ROUNDS = 12;
const MAX_SPORT_PREFERENCES = 5;
const UPLOADS_DIR = join(process.cwd(), "uploads", "avatars");
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Detecta MIME type via magic bytes — nunca confiar na extensão do arquivo
function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

function safeDecryptMask(encryptedDoc: string, docType: string): string {
  try {
    const plain = decrypt(encryptedDoc);
    return maskDocument(plain, docType as "cpf" | "rg");
  } catch {
    return "***";
  }
}

// ============================================================
// GET /users/me
// ============================================================

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: {
      id: true,
      full_name: true,
      email: true,
      photo_url: true,
      birth_date: true,
      document_type: true,
      document_number: true,
      zip_code: true,
      street: true,
      neighborhood: true,
      city: true,
      state: true,
      number: true,
      complement: true,
      weight_kg: true,
      height_cm: true,
      shirt_size: true,
      shoe_size: true,
      education_level: true,
      profession: true,
      role: true,
      email_verified: true,
      consent_version: true,
      consent_given_at: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) return Errors.notFound(reply, "Usuário");

  const { document_number, document_type, ...rest } = user;

  return sendSuccess(reply, {
    ...rest,
    document_type,
    document_masked: safeDecryptMask(document_number, document_type),
  });
}

// ============================================================
// PUT /users/me
// ============================================================

export async function updateMe(
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const body = request.body;

  const data: Record<string, unknown> = {};

  if (body.full_name !== undefined) data.full_name = body.full_name;
  if (body.birth_date !== undefined) data.birth_date = new Date(body.birth_date);
  if (body.zip_code !== undefined) data.zip_code = body.zip_code;
  if (body.street !== undefined) data.street = body.street;
  if (body.neighborhood !== undefined) data.neighborhood = body.neighborhood;
  if (body.city !== undefined) data.city = body.city;
  if (body.state !== undefined) data.state = body.state;
  if (body.number !== undefined) data.number = body.number;
  if (body.complement !== undefined) data.complement = body.complement;
  if (body.weight_kg !== undefined) data.weight_kg = body.weight_kg;
  if (body.height_cm !== undefined) data.height_cm = body.height_cm;
  if (body.shirt_size !== undefined) data.shirt_size = body.shirt_size;
  if (body.shoe_size !== undefined) data.shoe_size = body.shoe_size;
  if (body.education_level !== undefined) data.education_level = body.education_level;
  if (body.profession !== undefined) data.profession = body.profession;
  if (body.consent_version !== undefined) {
    data.consent_version = body.consent_version;
    data.consent_given_at = new Date();
  }

  const updated = await prisma.user.update({
    where: { id: userId, deleted_at: null },
    data,
    select: {
      id: true,
      full_name: true,
      email: true,
      photo_url: true,
      birth_date: true,
      document_type: true,
      document_number: true,
      zip_code: true,
      street: true,
      neighborhood: true,
      city: true,
      state: true,
      number: true,
      complement: true,
      weight_kg: true,
      height_cm: true,
      shirt_size: true,
      shoe_size: true,
      education_level: true,
      profession: true,
      role: true,
      updated_at: true,
    },
  });

  const { document_number, document_type, ...rest } = updated;

  return sendSuccess(reply, {
    ...rest,
    document_type,
    document_masked: safeDecryptMask(document_number, document_type),
  });
}

// ============================================================
// POST /users/me/change-email
// ============================================================

export async function changeEmail(
  request: FastifyRequest<{ Body: ChangeEmailInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const { new_email, password } = request.body;

  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, email: true, password_hash: true },
  });

  if (!user) return Errors.notFound(reply, "Usuário");

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) return Errors.unauthorized(reply);

  // Verificar se o novo e-mail já existe (resposta genérica)
  const existing = await prisma.user.findUnique({
    where: { email: new_email },
    select: { id: true },
  });

  if (existing) {
    // Resposta genérica — não confirmar se o e-mail já existe
    return sendSuccess(reply, {
      message: "Se o e-mail informado estiver disponível, você receberá as instruções em breve.",
    });
  }

  // TODO: gerar token, salvar e enviar e-mail de confirmação
  // Requer model EmailChangeToken no schema (migração pendente).
  // Por ora, responde de forma genérica para não revelar detalhes.

  return sendSuccess(reply, {
    message: "Se o e-mail informado estiver disponível, você receberá as instruções em breve.",
  });
}

// ============================================================
// POST /users/me/avatar
// ============================================================

export async function uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

  const data = await (request as any).file({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  });

  if (!data) {
    return Errors.validation(reply, [{ field: "file", message: "Arquivo não encontrado na requisição." }]);
  }

  // Ler primeiros 12 bytes para validação via magic bytes
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

  const mime = detectMimeFromBuffer(fullBuffer);
  if (!mime || !ALLOWED_MIME[mime]) {
    return Errors.validation(reply, [{ field: "file", message: "Formato não suportado. Use JPEG, PNG ou WebP." }]);
  }

  const ext = ALLOWED_MIME[mime];
  const filename = `${randomUUID()}${ext}`;

  try {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch {
    return Errors.internal(reply);
  }

  const filePath = join(UPLOADS_DIR, filename);
  const ws = createWriteStream(filePath);
  ws.write(fullBuffer);
  ws.end();

  await new Promise<void>((resolve, reject) => {
    ws.on("finish", resolve);
    ws.on("error", reject);
  });

  const photo_url = `/uploads/avatars/${filename}`;

  await prisma.user.update({
    where: { id: userId },
    data: { photo_url },
  });

  return sendSuccess(reply, { photo_url });
}

// ============================================================
// DELETE /users/me
// ============================================================

export async function deleteMe(
  request: FastifyRequest<{ Body: DeleteAccountInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const { password } = request.body;

  const user = await prisma.user.findUnique({
    where: { id: userId, deleted_at: null },
    select: { id: true, password_hash: true },
  });

  if (!user) return Errors.notFound(reply, "Usuário");

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) return Errors.unauthorized(reply);

  // Revogar todos os tokens imediatamente
  await prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked: false },
    data: { revoked: true, revoked_at: new Date() },
  });

  // Soft delete com carência de 7 dias: deleted_at = agora + 7 dias
  const deletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { deleted_at: deletionDate },
  });

  reply.clearCookie("refresh_token", { path: "/api/v1/auth" });

  return sendSuccess(reply, {
    message: "Solicitação de exclusão registrada. Sua conta será removida em 7 dias.",
  });
}

// ============================================================
// GET /users/me/sport-preferences
// ============================================================

export async function getSportPreferences(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

  const preferences = await prisma.userSportPreference.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "asc" },
  });

  return sendSuccess(reply, preferences);
}

// ============================================================
// POST /users/me/sport-preferences
// ============================================================

export async function addSportPreference(
  request: FastifyRequest<{ Body: AddSportPreferenceInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const { sport, level, practice_time } = request.body;

  const count = await prisma.userSportPreference.count({ where: { user_id: userId } });

  if (count >= MAX_SPORT_PREFERENCES) {
    return Errors.validation(reply, [
      { message: `Máximo de ${MAX_SPORT_PREFERENCES} modalidades por usuário.` },
    ]);
  }

  const preference = await prisma.userSportPreference.create({
    data: { user_id: userId, sport, level, practice_time },
  });

  return sendSuccess(reply, preference, 201);
}

// ============================================================
// PUT /users/me/sport-preferences/:id
// ============================================================

export async function updateSportPreference(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportPreferenceInput }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const { id } = request.params;

  const existing = await prisma.userSportPreference.findUnique({
    where: { id },
    select: { user_id: true },
  });

  // Sempre 403 quando não pertence — nunca 404 (evita enumeração)
  if (!existing || existing.user_id !== userId) return Errors.forbidden(reply);

  const updated = await prisma.userSportPreference.update({
    where: { id },
    data: request.body,
  });

  return sendSuccess(reply, updated);
}

// ============================================================
// DELETE /users/me/sport-preferences/:id
// ============================================================

export async function removeSportPreference(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const { id } = request.params;

  const existing = await prisma.userSportPreference.findUnique({
    where: { id },
    select: { user_id: true },
  });

  if (!existing || existing.user_id !== userId) return Errors.forbidden(reply);

  await prisma.userSportPreference.delete({ where: { id } });

  return sendSuccess(reply, { message: "Preferência removida." });
}

// ============================================================
// GET /users/me/tickets
// ============================================================

export async function getTickets(
  request: FastifyRequest<{ Querystring: { page?: number; per_page?: number } }>,
  reply: FastifyReply
) {
  const userId = request.user.sub;
  const page = Math.max(1, Number(request.query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(request.query.per_page ?? 20)));
  const skip = (page - 1) * perPage;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where: { user_id: userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            modality: true,
            start_datetime: true,
            location: true,
            city: true,
            state: true,
            cover_image_url: true,
          },
        },
      },
      orderBy: { purchased_at: "desc" },
      skip,
      take: perPage,
    }),
    prisma.ticket.count({ where: { user_id: userId } }),
  ]);

  return sendSuccess(reply, tickets, 200, {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  });
}
