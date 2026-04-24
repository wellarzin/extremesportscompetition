import type { FastifyReply } from "fastify";

// ============================================================
// Formato padrão de resposta da API
// ============================================================

interface SuccessMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

interface ErrorDetail {
  field?: string;
  message: string;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: SuccessMeta
) {
  return reply.status(statusCode).send({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: ErrorDetail[]
) {
  return reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

// Atalhos para os erros mais comuns
export const Errors = {
  unauthorized: (reply: FastifyReply) =>
    sendError(reply, 401, "UNAUTHORIZED", "Não autorizado."),

  forbidden: (reply: FastifyReply) =>
    sendError(reply, 403, "FORBIDDEN", "Sem permissão para acessar este recurso."),

  notFound: (reply: FastifyReply, resource = "Recurso") =>
    sendError(reply, 404, "NOT_FOUND", `${resource} não encontrado.`),

  conflict: (reply: FastifyReply, message: string) =>
    sendError(reply, 409, "CONFLICT", message),

  validation: (reply: FastifyReply, details: ErrorDetail[]) =>
    sendError(reply, 422, "VALIDATION_ERROR", "Erro de validação.", details),

  accountLocked: (reply: FastifyReply) =>
    sendError(
      reply,
      423,
      "ACCOUNT_LOCKED",
      "Conta bloqueada temporariamente. Tente novamente mais tarde."
    ),

  internal: (reply: FastifyReply) =>
    sendError(reply, 500, "INTERNAL_ERROR", "Erro interno. Tente novamente em instantes."),
};
