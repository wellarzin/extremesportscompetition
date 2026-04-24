import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { email as emailService } from "../lib/email";
import { sendSuccess, Errors } from "../lib/response";
import {
  encrypt,
  hmac,
  sha256,
  generateSecureToken,
  validateCPF,
  normalizeDocument,
  maskDocument,
} from "../lib/crypto";
import type {
  RegisterInput,
  VerifyEmailInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schemas/auth.schema";

// ============================================================
// Constantes de segurança
// ============================================================

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const EMAIL_VERIFY_EXPIRES_MS = 24 * 60 * 60 * 1000;      // 24 horas
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000;             // 1 hora

// Hash dummy para simular bcrypt.compare em e-mails não encontrados (tempo constante)
const DUMMY_HASH = "$2a$12$LCY0MefVIEc3TYPHV9SNnuzOfyr2p/AcCYxCzVzQfRuM1K4m8EKNu";

// ============================================================
// Helpers internos
// ============================================================

function issueAccessToken(
  request: FastifyRequest,
  userId: string,
  role: UserRole
): string {
  return request.server.jwt.sign(
    { sub: userId, role },
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

async function createRefreshToken(
  userId: string,
  family?: string
): Promise<{ rawToken: string; tokenFamily: string }> {
  const rawToken = generateSecureToken();
  const tokenHash = sha256(rawToken);
  const tokenFamily = family ?? randomUUID();

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      family: tokenFamily,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  });

  return { rawToken, tokenFamily };
}

function setRefreshCookie(reply: FastifyReply, rawToken: string): void {
  reply.setCookie("refresh_token", rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_EXPIRES_MS / 1000,
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie("refresh_token", { path: "/api/v1/auth" });
}

// ============================================================
// POST /auth/register
// ============================================================

export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  const body = request.body;

  // Validação de CPF (dígito verificador)
  if (body.document_type === "cpf") {
    if (!validateCPF(body.document_number)) {
      return Errors.validation(reply, [
        { field: "document_number", message: "CPF inválido." },
      ]);
    }
  }

  const normalizedDoc = normalizeDocument(body.document_number);
  const docHash = hmac(normalizedDoc);

  // Verificar unicidade — resposta genérica em conflito (não revelar qual campo colide)
  const [existingEmail, existingDoc] = await Promise.all([
    prisma.user.findUnique({ where: { email: body.email }, select: { id: true } }),
    prisma.user.findUnique({ where: { document_number_hash: docHash }, select: { id: true } }),
  ]);

  if (existingEmail || existingDoc) {
    // Mensagem genérica — não confirmar se e-mail ou documento já existem
    return reply.status(409).send({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Não foi possível concluir o cadastro. Verifique os dados informados.",
      },
    });
  }

  const [passwordHash, encryptedDoc] = await Promise.all([
    bcrypt.hash(body.password, BCRYPT_ROUNDS),
    Promise.resolve(encrypt(normalizedDoc)),
  ]);

  const verificationRaw = generateSecureToken();
  const verificationHash = sha256(verificationRaw);

  const user = await prisma.user.create({
    data: {
      full_name: body.full_name.trim(),
      birth_date: new Date(body.birth_date),
      document_type: body.document_type,
      document_number: encryptedDoc,
      document_number_hash: docHash,
      zip_code: body.zip_code,
      street: body.street,
      neighborhood: body.neighborhood,
      city: body.city,
      state: body.state,
      number: body.number,
      complement: body.complement,
      weight_kg: body.weight_kg,
      height_cm: body.height_cm,
      shirt_size: body.shirt_size,
      shoe_size: body.shoe_size,
      education_level: body.education_level,
      profession: body.profession,
      email: body.email,
      password_hash: passwordHash,
      consent_version: body.consent_version,
      consent_given_at: body.consent_version ? new Date() : undefined,
      email_verification_tokens: {
        create: {
          token_hash: verificationHash,
          expires_at: new Date(Date.now() + EMAIL_VERIFY_EXPIRES_MS),
        },
      },
    },
    select: { id: true, email: true, full_name: true },
  });

  // Enviar e-mail de verificação (não bloqueia a resposta)
  emailService.sendVerification(user.email, verificationRaw).catch((err) => {
    console.error("[EMAIL] Falha ao enviar verificação:", err);
  });

  return sendSuccess(
    reply,
    { id: user.id, email: user.email, full_name: user.full_name },
    201
  );
}

// ============================================================
// POST /auth/verify-email
// ============================================================

export async function verifyEmail(
  request: FastifyRequest<{ Body: VerifyEmailInput }>,
  reply: FastifyReply
) {
  const { token } = request.body;
  const tokenHash = sha256(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token_hash: tokenHash },
    include: { user: { select: { id: true, email_verified: true } } },
  });

  // Resposta genérica — não revelar se token existe ou não
  const genericMsg = { message: "Se o token for válido, seu e-mail será confirmado." };

  if (!record || record.used_at || record.expires_at < new Date()) {
    return sendSuccess(reply, genericMsg);
  }

  if (record.user.email_verified) {
    return sendSuccess(reply, genericMsg);
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    }),
    prisma.user.update({
      where: { id: record.user_id },
      data: { email_verified: true, email_verified_at: new Date() },
    }),
  ]);

  return sendSuccess(reply, { message: "E-mail confirmado com sucesso." });
}

// ============================================================
// POST /auth/login
// ============================================================

export async function login(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  const user = await prisma.user.findUnique({
    where: { email, deleted_at: null },
    select: {
      id: true,
      email: true,
      full_name: true,
      password_hash: true,
      role: true,
      locked_until: true,
      login_attempts: true,
      email_verified: true,
      document_type: true,
      document_number: true,
    },
  });

  // E-mail não encontrado: simular bcrypt.compare para manter tempo constante
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return Errors.unauthorized(reply);
  }

  // Conta bloqueada
  if (user.locked_until && user.locked_until > new Date()) {
    return Errors.accountLocked(reply);
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    const newAttempts = user.login_attempts + 1;
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        login_attempts: newAttempts,
        locked_until: shouldLock
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : undefined,
      },
    });

    if (shouldLock) return Errors.accountLocked(reply);
    return Errors.unauthorized(reply);
  }

  // Login bem-sucedido — reset brute-force counters
  await prisma.user.update({
    where: { id: user.id },
    data: { login_attempts: 0, locked_until: null },
  });

  const [accessToken, { rawToken }] = await Promise.all([
    Promise.resolve(issueAccessToken(request, user.id, user.role)),
    createRefreshToken(user.id),
  ]);

  setRefreshCookie(reply, rawToken);

  return sendSuccess(reply, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 900, // 15 minutos em segundos
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      document_masked: maskDocument(
        user.document_number, // descriptografar apenas para mascarar
        user.document_type
      ),
    },
  });
}

// ============================================================
// POST /auth/refresh
// ============================================================

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const rawToken: string | undefined = request.cookies?.["refresh_token"];

  if (!rawToken) {
    return Errors.unauthorized(reply);
  }

  const tokenHash = sha256(rawToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { token_hash: tokenHash },
    include: {
      user: { select: { id: true, role: true, deleted_at: true } },
    },
  });

  if (!stored || stored.expires_at < new Date() || stored.user.deleted_at) {
    clearRefreshCookie(reply);
    return Errors.unauthorized(reply);
  }

  // Detecção de roubo — token já revogado sendo reapresentado
  if (stored.revoked) {
    await prisma.refreshToken.updateMany({
      where: { family: stored.family },
      data: { revoked: true, revoked_at: new Date() },
    });
    clearRefreshCookie(reply);
    return Errors.unauthorized(reply);
  }

  // Rotação: revogar token atual e emitir novo da mesma família
  const [accessToken, { rawToken: newRawToken }] = await Promise.all([
    Promise.resolve(issueAccessToken(request, stored.user.id, stored.user.role)),
    createRefreshToken(stored.user.id, stored.family),
  ]);

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true, revoked_at: new Date() },
  });

  setRefreshCookie(reply, newRawToken);

  return sendSuccess(reply, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 900,
  });
}

// ============================================================
// POST /auth/logout
// ============================================================

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const rawToken: string | undefined = request.cookies?.["refresh_token"];

  if (rawToken) {
    const tokenHash = sha256(rawToken);
    await prisma.refreshToken
      .update({
        where: { token_hash: tokenHash },
        data: { revoked: true, revoked_at: new Date() },
      })
      .catch(() => {
        // Token não encontrado — silenciar (idempotente)
      });
  }

  clearRefreshCookie(reply);
  return sendSuccess(reply, { message: "Sessão encerrada." });
}

// ============================================================
// POST /auth/logout-all
// ============================================================

export async function logoutAll(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

  await prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked: false },
    data: { revoked: true, revoked_at: new Date() },
  });

  clearRefreshCookie(reply);
  return sendSuccess(reply, { message: "Todas as sessões foram encerradas." });
}

// ============================================================
// POST /auth/forgot-password
// ============================================================

export async function forgotPassword(
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
) {
  // Resposta sempre idêntica — não revelar se o e-mail existe
  const genericResponse = {
    message:
      "Se este e-mail estiver cadastrado, você receberá as instruções em breve.",
  };

  const user = await prisma.user.findUnique({
    where: { email: request.body.email, deleted_at: null },
    select: { id: true, email: true },
  });

  if (!user) {
    return sendSuccess(reply, genericResponse);
  }

  // Invalidar tokens anteriores não usados
  await prisma.passwordResetToken.updateMany({
    where: { user_id: user.id, used_at: null },
    data: { used_at: new Date() },
  });

  const rawToken = generateSecureToken();
  const tokenHash = sha256(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + RESET_TOKEN_EXPIRES_MS),
    },
  });

  emailService.sendPasswordReset(user.email, rawToken).catch((err) => {
    console.error("[EMAIL] Falha ao enviar reset:", err);
  });

  return sendSuccess(reply, genericResponse);
}

// ============================================================
// POST /auth/reset-password
// ============================================================

export async function resetPassword(
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
) {
  const { token, password } = request.body;
  const tokenHash = sha256(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token_hash: tokenHash },
    include: { user: { select: { id: true } } },
  });

  if (!record || record.used_at || record.expires_at < new Date()) {
    return Errors.validation(reply, [
      { field: "token", message: "Token inválido ou expirado." },
    ]);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    }),
    prisma.user.update({
      where: { id: record.user_id },
      data: { password_hash: passwordHash, login_attempts: 0, locked_until: null },
    }),
    // Revogar todos os refresh tokens do usuário (sessões ativas)
    prisma.refreshToken.updateMany({
      where: { user_id: record.user_id, revoked: false },
      data: { revoked: true, revoked_at: new Date() },
    }),
  ]);

  return sendSuccess(reply, {
    message: "Senha redefinida com sucesso. Faça login novamente.",
  });
}
