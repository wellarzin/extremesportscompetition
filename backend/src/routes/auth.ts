import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate";
import {
  RegisterSchema,
  VerifyEmailSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../schemas/auth.schema";
import * as authController from "../controllers/auth.controller";
import { Errors } from "../lib/response";
import { errorSchema } from "../lib/swagger-schemas";

// Rate limits específicos para rotas de autenticação
const AUTH_RATE_LIMIT = { max: 5, timeWindow: "1 minute" };
const FORGOT_RATE_LIMIT = { max: 3, timeWindow: "15 minutes" };

export async function authRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // POST /auth/register
  // ----------------------------------------------------------
  app.post("/register", {
    config: { rateLimit: AUTH_RATE_LIMIT },
    schema: {
      tags: ["Auth"],
      summary: "Cadastra novo usuário",
      description:
        "Cria conta na plataforma. Em conflito de e-mail ou documento, retorna mensagem genérica para não revelar dados existentes.",
      security: [],
      body: {
        type: "object",
        required: [
          "full_name", "birth_date", "document_type", "document_number",
          "zip_code", "street", "city", "state", "number",
          "shirt_size", "education_level", "profession", "email", "password",
        ],
        examples: [
          {
            summary: "Apenas campos obrigatórios",
            value: {
              full_name: "João da Silva",
              birth_date: "1995-08-21",
              document_type: "cpf",
              document_number: "123.456.789-09",
              zip_code: "01310-100",
              street: "Avenida Paulista",
              city: "São Paulo",
              state: "SP",
              number: "1578",
              shirt_size: "M",
              education_level: "superior_completo",
              profession: "profissional_ti",
              email: "joao@email.com",
              password: "Senha@123",
            },
          },
          {
            summary: "Todos os campos (obrigatórios + opcionais)",
            value: {
              full_name: "João da Silva",
              birth_date: "1995-08-21",
              document_type: "cpf",
              document_number: "123.456.789-09",
              zip_code: "01310-100",
              street: "Avenida Paulista",
              neighborhood: "Bela Vista",
              city: "São Paulo",
              state: "SP",
              number: "1578",
              complement: "Apto 42",
              weight_kg: 75.5,
              height_cm: 178,
              shirt_size: "M",
              shoe_size: 42,
              education_level: "superior_completo",
              profession: "profissional_ti",
              email: "joao@email.com",
              password: "Senha@123",
              consent_version: "1.0",
            },
          },
        ],
        properties: {
          full_name: {
            type: "string", minLength: 3, maxLength: 255,
            description: "✦ OBRIGATÓRIO — Nome completo do usuário",
          },
          birth_date: {
            type: "string", format: "date",
            description: "✦ OBRIGATÓRIO — Data de nascimento no formato YYYY-MM-DD",
          },
          document_type: {
            type: "string", enum: ["cpf", "rg"],
            description: "✦ OBRIGATÓRIO — Tipo do documento de identidade",
          },
          document_number: {
            type: "string", minLength: 8, maxLength: 20,
            description: "✦ OBRIGATÓRIO — Número do documento (com ou sem máscara, será normalizado)",
          },
          zip_code: {
            type: "string",
            description: "✦ OBRIGATÓRIO — CEP no formato 00000-000 ou 00000000",
          },
          street: {
            type: "string", minLength: 3, maxLength: 255,
            description: "✦ OBRIGATÓRIO — Logradouro (rua, avenida, etc.)",
          },
          neighborhood: {
            type: "string", maxLength: 100,
            description: "○ opcional — Bairro",
          },
          city: {
            type: "string", minLength: 2, maxLength: 100,
            description: "✦ OBRIGATÓRIO — Cidade",
          },
          state: {
            type: "string", minLength: 2, maxLength: 2,
            description: "✦ OBRIGATÓRIO — UF do estado (2 letras maiúsculas)",
          },
          number: {
            type: "string", minLength: 1, maxLength: 10,
            description: "✦ OBRIGATÓRIO — Número do endereço",
          },
          complement: {
            type: "string", maxLength: 100,
            description: "○ opcional — Complemento do endereço",
          },
          weight_kg: {
            type: "number", minimum: 0, maximum: 500,
            description: "○ opcional — Peso em kg",
          },
          height_cm: {
            type: "integer", minimum: 0, maximum: 300,
            description: "○ opcional — Altura em centímetros",
          },
          shirt_size: {
            type: "string",
            enum: ["PP", "P", "M", "G", "GG", "XG", "XXG", "PP_BABY", "P_BABY", "M_BABY", "G_BABY", "GG_BABY", "XG_BABY", "XXG_BABY"],
            description: "✦ OBRIGATÓRIO — Tamanho da camiseta",
          },
          shoe_size: {
            type: "number", minimum: 0, maximum: 60,
            description: "○ opcional — Número do calçado",
          },
          education_level: {
            type: "string",
            enum: [
              "fundamental_incompleto", "fundamental_completo",
              "medio_incompleto", "medio_completo", "tecnico",
              "superior_incompleto", "superior_completo",
              "pos_graduacao", "mestrado", "doutorado",
            ],
            description: "✦ OBRIGATÓRIO — Nível de escolaridade",
          },
          profession: {
            type: "string",
            enum: [
              "trabalhador_autonomo", "educador_fisico", "nutricionista", "pedagogo",
              "professor", "profissional_ti", "medico", "enfermeiro", "fisioterapeuta",
              "psicologo", "advogado", "engenheiro", "administrador", "estudante", "outros",
            ],
            description: "✦ OBRIGATÓRIO — Profissão do usuário",
          },
          email: {
            type: "string", format: "email",
            description: "✦ OBRIGATÓRIO — E-mail (será normalizado para minúsculas)",
          },
          password: {
            type: "string", minLength: 8, maxLength: 72,
            description: "✦ OBRIGATÓRIO — Senha: mínimo 8 chars, ao menos uma maiúscula e um número",
          },
          consent_version: {
            type: "string", maxLength: 10,
            description: "○ opcional — Versão dos termos de uso aceitos (ex: '1.0')",
          },
        },
      },
      response: {
        201: {
          description: "Conta criada com sucesso. Um e-mail de verificação foi enviado.",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid", example: "a1b2c3d4-..." },
                email: { type: "string", format: "email", example: "joao@email.com" },
                full_name: { type: "string", example: "João da Silva" },
              },
            },
          },
        },
        409: errorSchema("E-mail ou documento já cadastrado (mensagem genérica por segurança)"),
        422: errorSchema("Erro de validação dos campos enviados"),
        429: errorSchema("Limite de requisições atingido (5 req/min)"),
        500: errorSchema("Erro interno do servidor"),
      },
    },
    preHandler: async (request, reply) => {
      const result = RegisterSchema.safeParse(request.body);
      if (!result.success) {
        const details = result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return Errors.validation(reply, details);
      }
      request.body = result.data;
    },
    handler: authController.register,
  });

  // ----------------------------------------------------------
  // POST /auth/verify-email
  // ----------------------------------------------------------
  app.post("/verify-email", {
    schema: {
      tags: ["Auth"],
      summary: "Ativa conta via token de e-mail",
      description: "Valida o token de 64 caracteres enviado por e-mail após o registro. O token é de uso único.",
      security: [],
      body: {
        type: "object",
        required: ["token"],
        examples: [
          {
            summary: "Campos obrigatórios",
            value: { token: "a3f8e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3" },
          },
        ],
        properties: {
          token: {
            type: "string", minLength: 64, maxLength: 64,
            description: "✦ OBRIGATÓRIO — Token de verificação de 64 caracteres recebido por e-mail",
          },
        },
      },
      response: {
        200: {
          description: "E-mail verificado com sucesso. Conta ativada.",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                message: { type: "string", example: "E-mail verificado com sucesso." },
              },
            },
          },
        },
        400: errorSchema("Token inválido, expirado ou já utilizado"),
        422: errorSchema("Erro de validação (token com formato incorreto)"),
      },
    },
    preHandler: async (request, reply) => {
      const result = VerifyEmailSchema.safeParse(request.body);
      if (!result.success) {
        return Errors.validation(reply, [{ message: "Token inválido." }]);
      }
      request.body = result.data;
    },
    handler: authController.verifyEmail,
  });

  // ----------------------------------------------------------
  // POST /auth/login
  // ----------------------------------------------------------
  app.post("/login", {
    config: { rateLimit: AUTH_RATE_LIMIT },
    schema: {
      tags: ["Auth"],
      summary: "Autentica e retorna tokens",
      description:
        "Retorna `access_token` no body (expira em 15 min) e define `refresh_token` via cookie HttpOnly (expira em 7 dias).",
      security: [],
      body: {
        type: "object",
        required: ["email", "password"],
        examples: [
          {
            summary: "Campos obrigatórios",
            value: { email: "joao@email.com", password: "Senha@123" },
          },
        ],
        properties: {
          email: {
            type: "string", format: "email",
            description: "✦ OBRIGATÓRIO — E-mail cadastrado",
          },
          password: {
            type: "string",
            description: "✦ OBRIGATÓRIO — Senha da conta",
          },
        },
      },
      response: {
        200: {
          description: "Autenticação bem-sucedida",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                access_token: {
                  type: "string",
                  description: "JWT RS256 para uso no header Authorization: Bearer <token>",
                  example: "eyJhbGciOiJSUzI1NiJ9...",
                },
                token_type: { type: "string", example: "Bearer" },
                expires_in: {
                  type: "number",
                  description: "Tempo de expiração em segundos",
                  example: 900,
                },
              },
            },
          },
        },
        401: errorSchema("Credenciais inválidas (mensagem genérica por segurança)"),
        403: errorSchema("Conta ainda não verificada por e-mail"),
        422: errorSchema("Erro de validação dos campos"),
        423: errorSchema("Conta bloqueada temporariamente por excesso de tentativas"),
        429: errorSchema("Limite de requisições atingido (5 req/min)"),
        500: errorSchema("Erro interno do servidor"),
      },
    },
    preHandler: async (request, reply) => {
      const result = LoginSchema.safeParse(request.body);
      if (!result.success) {
        return Errors.validation(reply, [{ message: "E-mail ou senha inválidos." }]);
      }
      request.body = result.data;
    },
    handler: authController.login,
  });

  // ----------------------------------------------------------
  // POST /auth/refresh
  // ----------------------------------------------------------
  app.post("/refresh", {
    schema: {
      tags: ["Auth"],
      summary: "Renova access token",
      description:
        "Lê o `refresh_token` do cookie HttpOnly e retorna um novo `access_token`. Implementa rotação de token: o refresh token atual é invalidado e um novo é emitido via cookie.",
      security: [],
      response: {
        200: {
          description: "Token renovado com sucesso",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                access_token: {
                  type: "string",
                  description: "Novo JWT RS256",
                  example: "eyJhbGciOiJSUzI1NiJ9...",
                },
                token_type: { type: "string", example: "Bearer" },
                expires_in: { type: "number", example: 900 },
              },
            },
          },
        },
        401: errorSchema("Refresh token ausente, inválido ou expirado"),
        500: errorSchema("Erro interno do servidor"),
      },
    },
    handler: authController.refresh,
  });

  // ----------------------------------------------------------
  // POST /auth/logout
  // ----------------------------------------------------------
  app.post("/logout", {
    schema: {
      tags: ["Auth"],
      summary: "Encerra sessão atual",
      description:
        "Revoga o refresh token da sessão atual (lido do cookie) e limpa o cookie. Requer `Authorization: Bearer <access_token>`.",
      response: {
        200: {
          description: "Sessão encerrada com sucesso",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                message: { type: "string", example: "Sessão encerrada." },
              },
            },
          },
        },
        401: errorSchema("Token ausente ou inválido"),
        500: errorSchema("Erro interno do servidor"),
      },
    },
    preHandler: [authenticate],
    handler: authController.logout,
  });

  // ----------------------------------------------------------
  // POST /auth/logout-all
  // ----------------------------------------------------------
  app.post("/logout-all", {
    schema: {
      tags: ["Auth"],
      summary: "Encerra todas as sessões",
      description:
        "Revoga todos os refresh tokens ativos do usuário (todos os dispositivos). Requer `Authorization: Bearer <access_token>`.",
      response: {
        200: {
          description: "Todas as sessões encerradas com sucesso",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                message: { type: "string", example: "Todas as sessões encerradas." },
                sessions_revoked: {
                  type: "number",
                  description: "Quantidade de sessões revogadas",
                  example: 3,
                },
              },
            },
          },
        },
        401: errorSchema("Token ausente ou inválido"),
        500: errorSchema("Erro interno do servidor"),
      },
    },
    preHandler: [authenticate],
    handler: authController.logoutAll,
  });

  // ----------------------------------------------------------
  // POST /auth/forgot-password
  // ----------------------------------------------------------
  app.post("/forgot-password", {
    config: { rateLimit: FORGOT_RATE_LIMIT },
    schema: {
      tags: ["Auth"],
      summary: "Solicita redefinição de senha",
      description:
        "Envia um e-mail com link de redefinição de senha. A resposta é sempre idêntica independente de o e-mail existir ou não, para não revelar dados de usuários.",
      security: [],
      body: {
        type: "object",
        required: ["email"],
        examples: [
          {
            summary: "Campos obrigatórios",
            value: { email: "joao@email.com" },
          },
        ],
        properties: {
          email: {
            type: "string", format: "email",
            description: "✦ OBRIGATÓRIO — E-mail da conta para redefinição",
          },
        },
      },
      response: {
        200: {
          description: "Solicitação processada (resposta sempre idêntica por segurança)",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Se o e-mail existir, você receberá as instruções em breve.",
                },
              },
            },
          },
        },
        422: errorSchema("Erro de validação (e-mail com formato inválido)"),
        429: errorSchema("Limite de requisições atingido (3 req/15 min)"),
      },
    },
    preHandler: async (request, reply) => {
      const result = ForgotPasswordSchema.safeParse(request.body);
      if (!result.success) {
        return Errors.validation(reply, [{ field: "email", message: "E-mail inválido." }]);
      }
      request.body = result.data;
    },
    handler: authController.forgotPassword,
  });

  // ----------------------------------------------------------
  // POST /auth/reset-password
  // ----------------------------------------------------------
  app.post("/reset-password", {
    config: { rateLimit: AUTH_RATE_LIMIT },
    schema: {
      tags: ["Auth"],
      summary: "Redefine senha via token",
      description:
        "Define uma nova senha usando o token de 64 caracteres recebido por e-mail. O token é de uso único e expira em 1 hora.",
      security: [],
      body: {
        type: "object",
        required: ["token", "password"],
        examples: [
          {
            summary: "Campos obrigatórios",
            value: {
              token: "f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2",
              password: "NovaSenha@456",
            },
          },
        ],
        properties: {
          token: {
            type: "string", minLength: 64, maxLength: 64,
            description: "✦ OBRIGATÓRIO — Token de redefinição de 64 caracteres recebido por e-mail",
          },
          password: {
            type: "string", minLength: 8, maxLength: 72,
            description: "✦ OBRIGATÓRIO — Nova senha: mínimo 8 chars, ao menos uma maiúscula e um número",
          },
        },
      },
      response: {
        200: {
          description: "Senha redefinida com sucesso",
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                message: { type: "string", example: "Senha redefinida com sucesso." },
              },
            },
          },
        },
        400: errorSchema("Token inválido, expirado ou já utilizado"),
        422: errorSchema("Erro de validação (senha não atende os requisitos)"),
        429: errorSchema("Limite de requisições atingido (5 req/min)"),
        500: errorSchema("Erro interno do servidor"),
      },
    },
    preHandler: async (request, reply) => {
      const result = ResetPasswordSchema.safeParse(request.body);
      if (!result.success) {
        const details = result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return Errors.validation(reply, details);
      }
      request.body = result.data;
    },
    handler: authController.resetPassword,
  });
}
