import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate";
import {
  UpdateProfileSchema,
  ChangeEmailSchema,
  DeleteAccountSchema,
  AddSportPreferenceSchema,
  UpdateSportPreferenceSchema,
} from "../schemas/users.schema";
import * as usersController from "../controllers/users.controller";
import { Errors } from "../lib/response";
import { errorSchema } from "../lib/swagger-schemas";

const AUTHENTICATED = { preHandler: [authenticate] };

export async function usersRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /users/me
  // ----------------------------------------------------------
  app.get("/me", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Retorna perfil completo do usuário autenticado",
      response: {
        200: {
          description: "Perfil retornado com sucesso",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object", additionalProperties: true },
          },
        },
        401: errorSchema("Token ausente ou inválido"),
        404: errorSchema("Usuário não encontrado"),
      },
    },
    handler: usersController.getMe,
  });

  // ----------------------------------------------------------
  // PUT /users/me
  // ----------------------------------------------------------
  app.put("/me", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Atualiza perfil do usuário",
      description: "Campos imutáveis: `email`, `password`, `document_number`, `role`.",
      body: {
        type: "object",
        properties: {
          full_name: { type: "string", minLength: 3, maxLength: 255 },
          birth_date: { type: "string", format: "date" },
          zip_code: { type: "string" },
          street: { type: "string" },
          neighborhood: { type: "string", nullable: true },
          city: { type: "string" },
          state: { type: "string", minLength: 2, maxLength: 2 },
          number: { type: "string" },
          complement: { type: "string", nullable: true },
          weight_kg: { type: "number", nullable: true },
          height_cm: { type: "integer", nullable: true },
          shirt_size: { type: "string" },
          shoe_size: { type: "number", nullable: true },
          education_level: { type: "string" },
          profession: { type: "string" },
          consent_version: { type: "string" },
        },
      },
      response: {
        200: { description: "Perfil atualizado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      async (request, reply) => {
        const result = UpdateProfileSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: usersController.updateMe,
  });

  // ----------------------------------------------------------
  // POST /users/me/change-email
  // ----------------------------------------------------------
  app.post("/me/change-email", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Solicita troca de e-mail",
      description: "Exige confirmação via senha. Um link de verificação será enviado ao novo e-mail.",
      body: {
        type: "object",
        required: ["new_email", "password"],
        properties: {
          new_email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      response: {
        200: { description: "Solicitação registrada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Senha incorreta ou token inválido"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      async (request, reply) => {
        const result = ChangeEmailSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: usersController.changeEmail,
  });

  // ----------------------------------------------------------
  // POST /users/me/avatar
  // ----------------------------------------------------------
  app.post("/me/avatar", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Upload de foto de perfil",
      description: "Aceita `multipart/form-data` com campo `file`. Suporta JPEG, PNG e WebP. Máximo 5 MB. MIME validado via magic bytes.",
      consumes: ["multipart/form-data"],
      response: {
        200: { description: "Avatar atualizado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        422: errorSchema("Formato inválido ou arquivo muito grande"),
      },
    },
    handler: usersController.uploadAvatar,
  });

  // ----------------------------------------------------------
  // POST /users/me/delivery-proof
  // ----------------------------------------------------------
  app.post("/me/delivery-proof", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Upload de comprovante de 200+ viagens/entregas",
      description: "Aceita `multipart/form-data` com campo `file`. Suporta JPEG, PNG e WebP. Máximo 10 MB. MIME validado via magic bytes.",
      consumes: ["multipart/form-data"],
      response: {
        200: {
          description: "Comprovante salvo",
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: { delivery_proof_url: { type: "string" } },
            },
          },
        },
        401: errorSchema("Não autorizado"),
        422: errorSchema("Formato inválido ou arquivo muito grande"),
      },
    },
    handler: usersController.uploadDeliveryProof,
  });

  // ----------------------------------------------------------
  // DELETE /users/me
  // ----------------------------------------------------------
  app.delete("/me", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Solicita exclusão da conta (LGPD)",
      description: "Requer senha para confirmar. Tokens revogados imediatamente. Conta removida em 7 dias.",
      body: {
        type: "object",
        required: ["password"],
        properties: {
          password: { type: "string" },
        },
      },
      response: {
        200: { description: "Solicitação registrada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Senha incorreta"),
      },
    },
    preHandler: [
      authenticate,
      async (request, reply) => {
        const result = DeleteAccountSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(reply, [{ field: "password", message: "Senha é obrigatória." }]);
        }
        request.body = result.data;
      },
    ],
    handler: usersController.deleteMe,
  });

  // ----------------------------------------------------------
  // GET /users/me/sport-preferences
  // ----------------------------------------------------------
  app.get("/me/sport-preferences", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Lista preferências esportivas do usuário",
      response: {
        200: { description: "Lista retornada", type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", additionalProperties: true } } } },
        401: errorSchema("Não autorizado"),
      },
    },
    handler: usersController.getSportPreferences,
  });

  // ----------------------------------------------------------
  // POST /users/me/sport-preferences
  // ----------------------------------------------------------
  app.post("/me/sport-preferences", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Adiciona preferência esportiva",
      description: "Máximo de 5 modalidades por usuário.",
      body: {
        type: "object",
        required: ["sport", "level", "practice_time"],
        properties: {
          sport: { type: "string" },
          level: { type: "string" },
          practice_time: { type: "string" },
        },
      },
      response: {
        201: { description: "Preferência adicionada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        422: errorSchema("Erro de validação ou limite atingido"),
      },
    },
    preHandler: [
      authenticate,
      async (request, reply) => {
        const result = AddSportPreferenceSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: usersController.addSportPreference,
  });

  // ----------------------------------------------------------
  // PUT /users/me/sport-preferences/:id
  // ----------------------------------------------------------
  app.put("/me/sport-preferences/:id", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Atualiza preferência esportiva",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          sport: { type: "string" },
          level: { type: "string" },
          practice_time: { type: "string" },
        },
      },
      response: {
        200: { description: "Atualizado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      async (request, reply) => {
        const result = UpdateSportPreferenceSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: usersController.updateSportPreference,
  });

  // ----------------------------------------------------------
  // DELETE /users/me/sport-preferences/:id
  // ----------------------------------------------------------
  app.delete("/me/sport-preferences/:id", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Remove preferência esportiva",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { description: "Removida", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
      },
    },
    handler: usersController.removeSportPreference,
  });

  // ----------------------------------------------------------
  // GET /users/me/tickets
  // ----------------------------------------------------------
  app.get("/me/tickets", {
    ...AUTHENTICATED,
    schema: {
      tags: ["Users"],
      summary: "Lista ingressos comprados pelo usuário",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: { description: "Lista retornada", type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", additionalProperties: true } }, meta: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
      },
    },
    handler: usersController.getTickets,
  });
}
