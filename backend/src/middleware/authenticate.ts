import type { FastifyRequest, FastifyReply } from "fastify";
import type { UserRole } from "@prisma/client";
import { Errors } from "../lib/response";

// ============================================================
// Middleware de autenticação e autorização (RBAC)
// Aplicado por padrão; rotas públicas são exceção explícita.
// ============================================================

/** Verifica JWT e popula request.user. Rotas devem declarar este hook explicitamente. */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    return Errors.unauthorized(reply);
  }
}

/** Retorna um hook que verifica se request.user.role está entre os papéis permitidos.
 *  Deve ser usado APÓS authenticate no array preHandler.
 */
export function authorize(allowedRoles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { role } = request.user;
    if (!allowedRoles.includes(role)) {
      return Errors.forbidden(reply);
    }
  };
}
