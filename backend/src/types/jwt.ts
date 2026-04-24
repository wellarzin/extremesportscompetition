import type { UserRole } from "@prisma/client";

export interface JWTPayload {
  sub: string;     // user_id
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Augmentação dos tipos do @fastify/jwt
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
