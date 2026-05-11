import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authenticate";
import * as productsController from "../controllers/products.controller";
import { errorSchema } from "../lib/swagger-schemas";

const productSchema = {
  type: "object",
  properties: {
    id:          { type: "string", format: "uuid" },
    name:        { type: "string" },
    description: { type: "string", nullable: true },
    price_cents: { type: "integer" },
    stock:       { type: "integer" },
    image_url:   { type: "string", nullable: true },
    category:    { type: "string" },
    active:      { type: "boolean" },
    created_at:  { type: "string", format: "date-time" },
    updated_at:  { type: "string", format: "date-time" },
  },
};

export async function productsRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------
  // GET /products — lista todos (admin)
  // ----------------------------------------------------------
  app.get("/", {
    schema: {
      tags: ["🛍️ Store — Produtos"],
      summary: "Lista todos os produtos (admin)",
      querystring: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["vestuario", "acessorios", "equipamentos", "nutricao", "outros"],
          },
          active:   { type: "boolean" },
          page:     { type: "integer", minimum: 1, default: 1 },
          per_page: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: productSchema },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" }, per_page: { type: "integer" },
                total: { type: "integer" }, total_pages: { type: "integer" },
              },
            },
          },
        },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: productsController.listProducts,
  });

  // ----------------------------------------------------------
  // GET /products/:id
  // ----------------------------------------------------------
  app.get("/:id", {
    schema: {
      tags: ["🛍️ Store — Produtos"],
      summary: "Detalhe de um produto",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: { type: "object", properties: { success: { type: "boolean" }, data: productSchema } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Produto não encontrado"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: productsController.getProduct,
  });

  // ----------------------------------------------------------
  // POST /products — cria produto (admin)
  // ----------------------------------------------------------
  app.post("/", {
    schema: {
      tags: ["🛍️ Store — Produtos"],
      summary: "Cria novo produto (admin)",
      body: {
        type: "object",
        required: ["name", "price_cents", "stock", "category"],
        properties: {
          name:        { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string", maxLength: 2000 },
          price_cents: { type: "integer", minimum: 0, description: "Preço em centavos (BRL)" },
          stock:       { type: "integer", minimum: 0 },
          category: {
            type: "string",
            enum: ["vestuario", "acessorios", "equipamentos", "nutricao", "outros"],
          },
        },
      },
      response: {
        201: { type: "object", properties: { success: { type: "boolean" }, data: productSchema } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: productsController.createProduct,
  });

  // ----------------------------------------------------------
  // PUT /products/:id — atualiza produto (admin)
  // ----------------------------------------------------------
  app.put("/:id", {
    schema: {
      tags: ["🛍️ Store — Produtos"],
      summary: "Atualiza produto (admin)",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          name:        { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string", maxLength: 2000, nullable: true },
          price_cents: { type: "integer", minimum: 0 },
          stock:       { type: "integer", minimum: 0 },
          category: {
            type: "string",
            enum: ["vestuario", "acessorios", "equipamentos", "nutricao", "outros"],
          },
          active: { type: "boolean" },
        },
      },
      response: {
        200: { type: "object", properties: { success: { type: "boolean" }, data: productSchema } },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Produto não encontrado"),
        422: errorSchema("Erro de validação"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: productsController.updateProduct,
  });

  // ----------------------------------------------------------
  // DELETE /products/:id — desativa produto (admin)
  // ----------------------------------------------------------
  app.delete("/:id", {
    schema: {
      tags: ["🛍️ Store — Produtos"],
      summary: "Desativa produto (admin, soft delete)",
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", properties: { message: { type: "string" } } },
          },
        },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Produto não encontrado"),
      },
    },
    preHandler: [authenticate, authorize(["admin"])],
    handler: productsController.deleteProduct,
  });

  // ----------------------------------------------------------
  // POST /products/:id/image — upload de imagem (admin)
  // ----------------------------------------------------------
  app.post("/:id/image", {
    schema: {
      tags: ["🛍️ Store — Produtos"],
      summary: "Upload de imagem do produto (admin)",
      description: "Aceita JPEG, PNG ou WebP. Máximo 5 MB.",
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
          file: { type: "string", format: "binary", description: "Imagem do produto" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object", properties: { image_url: { type: "string" } } },
          },
        },
        401: errorSchema("Não autorizado"),
        403: errorSchema("Sem permissão"),
        404: errorSchema("Produto não encontrado"),
        422: errorSchema("Formato inválido"),
      },
    },
    validatorCompiler: () => () => true,
    preHandler: [authenticate, authorize(["admin"])],
    handler: productsController.uploadProductImage,
  });
}
