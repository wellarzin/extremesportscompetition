// Schema de erro reutilizável para o Swagger.
// Inclui o campo `details` para que o Fastify não o corte na serialização.
export function errorSchema(description: string) {
  return {
    description,
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } as const;
}
