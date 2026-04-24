import type { FastifyInstance } from "fastify";
import { ProfessionalSpecialty } from "@prisma/client";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authenticate";
import {
  CreateProfessionalSchema,
  UpdateProfessionalSchema,
  AddSpecialtySchema,
  ListProfessionalsQuerySchema,
} from "../schemas/professionals.schema";
import * as professionalsController from "../controllers/professionals.controller";
import { Errors } from "../lib/response";
import { errorSchema } from "../lib/swagger-schemas";

export async function professionalsRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /professionals
  // ----------------------------------------------------------
  app.get("/", {
    schema: {
      tags: ["Professionals"],
      summary: "Lista profissionais ativos",
      security: [],
      querystring: {
        type: "object",
        properties: {
          specialty: { type: "string" },
          page: { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: { description: "Lista retornada", type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", additionalProperties: true } }, meta: { type: "object", additionalProperties: true } } },
        422: errorSchema("Parâmetro inválido"),
      },
    },
    preHandler: async (request, reply) => {
      const result = ListProfessionalsQuerySchema.safeParse(request.query);
      if (!result.success) {
        return Errors.validation(
          reply,
          result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
        );
      }
      request.query = result.data as any;
    },
    handler: professionalsController.listProfessionals,
  });

  // ----------------------------------------------------------
  // GET /professionals/:id
  // ----------------------------------------------------------
  app.get("/:id", {
    schema: {
      tags: ["Professionals"],
      summary: "Detalhe de um profissional",
      security: [],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { description: "Profissional encontrado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        404: errorSchema("Profissional não encontrado"),
      },
    },
    handler: professionalsController.getProfessional,
  });

  // ----------------------------------------------------------
  // POST /professionals — apenas admin
  // ----------------------------------------------------------
  app.post("/", {
    schema: {
      tags: ["Professionals"],
      summary: "Cadastra profissional (moderado por admin)",
      description: "Acesso exclusivo a `admin`. Verificação do registro profissional (CREF, CRN, CRM etc.) é de responsabilidade do admin antes de cadastrar.",
      body: {
        type: "object",
        required: ["full_name", "birth_date", "education", "registration_number", "registration_type", "specialties"],
        properties: {
          full_name: { type: "string" },
          birth_date: { type: "string", format: "date" },
          education: { type: "string" },
          registration_number: { type: "string" },
          registration_type: { type: "string" },
          bio: { type: "string" },
          photo_url: { type: "string" },
          user_id: { type: "string", format: "uuid" },
          specialties: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              required: ["specialty"],
              properties: {
                specialty: {
                  type: "string",
                  enum: Object.values(ProfessionalSpecialty),
                  description: `Valores aceitos: ${Object.values(ProfessionalSpecialty).join(", ")}`,
                },
                notes: { type: "string", maxLength: 255 },
              },
            },
          },
        },
      },
      response: {
        201: { description: "Profissional criado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        409: errorSchema("Número de registro já cadastrado"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      authorize(["admin"]),
      async (request, reply) => {
        const result = CreateProfessionalSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.code === "invalid_enum_value"
                ? `Valor inválido para "${e.path.join(".")}". Valores aceitos: ${Object.values(ProfessionalSpecialty).join(", ")}.`
                : e.message,
            }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: professionalsController.createProfessional,
  });

  // ----------------------------------------------------------
  // PUT /professionals/:id — admin ou professional vinculado
  // ----------------------------------------------------------
  app.put("/:id", {
    schema: {
      tags: ["Professionals"],
      summary: "Atualiza profissional",
      description: "`admin` pode editar qualquer campo (exceto `registration_number`/`registration_type`). `professional` só pode editar o próprio perfil.",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          birth_date: { type: "string", format: "date" },
          education: { type: "string" },
          bio: { type: "string", nullable: true },
          photo_url: { type: "string", nullable: true },
          active: { type: "boolean" },
        },
      },
      response: {
        200: { description: "Atualizado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Profissional não encontrado"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      authorize(["admin", "professional"]),
      async (request, reply) => {
        const result = UpdateProfessionalSchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: professionalsController.updateProfessional,
  });

  // ----------------------------------------------------------
  // DELETE /professionals/:id — apenas admin
  // ----------------------------------------------------------
  app.delete("/:id", {
    schema: {
      tags: ["Professionals"],
      summary: "Desativa profissional (soft delete)",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { description: "Profissional desativado", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Profissional não encontrado"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: professionalsController.deleteProfessional,
  });

  // ----------------------------------------------------------
  // POST /professionals/:id/specialties — apenas admin
  // ----------------------------------------------------------
  app.post("/:id/specialties", {
    schema: {
      tags: ["Professionals"],
      summary: "Adiciona especialidade ao profissional",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["specialty"],
        properties: {
          specialty: {
            type: "string",
            enum: Object.values(ProfessionalSpecialty),
            description: `Valores aceitos: ${Object.values(ProfessionalSpecialty).join(", ")}`,
          },
          notes: { type: "string", maxLength: 255 },
        },
      },
      response: {
        201: { description: "Especialidade adicionada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Profissional não encontrado"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [
      authenticate,
      authorize(["admin"]),
      async (request, reply) => {
        const result = AddSpecialtySchema.safeParse(request.body);
        if (!result.success) {
          return Errors.validation(
            reply,
            result.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.code === "invalid_enum_value"
                ? `Valor inválido. Valores aceitos: ${Object.values(ProfessionalSpecialty).join(", ")}.`
                : e.message,
            }))
          );
        }
        request.body = result.data;
      },
    ],
    handler: professionalsController.addSpecialty,
  });

  // ----------------------------------------------------------
  // POST /professionals/:id/photo — upload de foto
  // ----------------------------------------------------------
  app.post("/:id/photo", {
    schema: {
      tags: ["Professionals"],
      summary: "Upload de foto do profissional",
      description: "Aceita `multipart/form-data` com campo `file`. Suporta JPEG, PNG e WebP. Máximo 5 MB. MIME validado via magic bytes. Admin ou o próprio profissional vinculado.",
      consumes: ["multipart/form-data"],
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "Foto do profissional (JPEG, PNG ou WebP — máx 5 MB)",
          },
        },
      },
      response: {
        200: { description: "Foto atualizada", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Profissional não encontrado"),
        422: errorSchema("Formato inválido ou arquivo muito grande"),
      },
    },
    validatorCompiler: ({ httpPart }) => {
      if (httpPart === "body") return () => true;
      return () => true;
    },
    preHandler: [authenticate, authorize(["admin", "professional"])],
    handler: professionalsController.uploadProfessionalPhoto,
  });

  // ----------------------------------------------------------
  // DELETE /professionals/:id/specialties/:sid — apenas admin
  // ----------------------------------------------------------
  app.delete("/:id/specialties/:sid", {
    schema: {
      tags: ["Professionals"],
      summary: "Remove especialidade do profissional",
      description: "Profissional deve manter ao menos 1 especialidade.",
      params: {
        type: "object",
        required: ["id", "sid"],
        properties: {
          id: { type: "string", format: "uuid" },
          sid: { type: "string", format: "uuid" },
        },
      },
      response: {
        200: { description: "Especialidade removida", type: "object", properties: { success: { type: "boolean" }, data: { type: "object", additionalProperties: true } } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Profissional não encontrado"),
        422: errorSchema("Profissional deve manter ao menos uma especialidade"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: professionalsController.removeSpecialty,
  });
}
