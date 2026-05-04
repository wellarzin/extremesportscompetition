import { z } from "zod";

const envSchema = z.object({
  // Banco de dados
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  // JWT — par de chaves assimétricas RS256
  JWT_PRIVATE_KEY: z.string().min(1, "JWT_PRIVATE_KEY (PEM RS256) é obrigatório"),
  JWT_PUBLIC_KEY: z.string().min(1, "JWT_PUBLIC_KEY (PEM RS256) é obrigatório"),

  // Criptografia de dados sensíveis (AES-256-GCM)
  AES_SECRET_KEY: z.string().length(64, "AES_SECRET_KEY deve ter 64 hex chars (32 bytes)"),

  // HMAC para hash determinístico do documento
  HMAC_SECRET_KEY: z.string().min(32, "HMAC_SECRET_KEY deve ter no mínimo 32 chars"),

  // Redis — rate limiting e blacklist de tokens
  REDIS_URL: z.string().optional(),

  // Servidor
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),

  // Frontend URL (usado em redirecionamentos de pagamento)
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  // AbacatePay
  ABACATEPAY_API_KEY: z.string().optional(),
  ABACATEPAY_WEBHOOK_SECRET: z.string().optional(),
  ABACATEPAY_BASE_URL: z.string().default("https://api.abacatepay.com/v2"),

  // Swagger (Basic Auth em produção)
  SWAGGER_USER: z.string().optional(),
  SWAGGER_PASS: z.string().optional(),

  // E-mail (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@extremesportscompetition.com"),
  EMAIL_FINANCIAL: z.string().default("financeiro@extremesportscompetition.com"),
}).superRefine((data, ctx) => {
  // ABACATEPAY_WEBHOOK_SECRET é obrigatório em produção —
  // sem ele qualquer requisição passa pela validação de assinatura
  if (data.NODE_ENV === "production" && !data.ABACATEPAY_WEBHOOK_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ABACATEPAY_WEBHOOK_SECRET"],
      message: "ABACATEPAY_WEBHOOK_SECRET é obrigatório em produção",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
