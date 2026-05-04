import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { join } from "path";
import { env } from "./lib/env";
import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { eventsRoutes } from "./routes/events";
import { professionalsRoutes } from "./routes/professionals";
import { landingRoutes } from "./routes/landing";
import { checkoutRoutes } from "./routes/checkout";
import { devRoutes } from "./routes/dev";

let redisClient: import("ioredis").Redis | undefined;

async function buildRedis() {
  if (!env.REDIS_URL) {
    if (env.NODE_ENV === "production") {
      console.warn("⚠️  REDIS_URL não configurado. Rate limiting em memória.");
    }
    return undefined;
  }
  const { default: Redis } = await import("ioredis");
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // não reconecta automaticamente
    enableOfflineQueue: false,
  });
  // Suprime erros de reconexão para não poluir os logs nem crashar o processo
  client.on("error", () => {});
  try {
    await client.connect();
    return client;
  } catch {
    console.warn("⚠️  Não foi possível conectar ao Redis. Rate limiting em memória.");
    await client.quit().catch(() => {});
    return undefined;
  }
}

export async function buildApp() {
  redisClient = await buildRedis();

  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : true,
    trustProxy: true,
    ajv: {
      customOptions: {
        // Permite keywords do OpenAPI (example, description, etc.) nos schemas de validação
        keywords: ["example"],
      },
    },
  });

  // ---- Swagger / OpenAPI ----
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "⚡ Extreme Competition API",
        version: "1.0.0",
        description: `
Marketplace de eventos esportivos — maratonas, campeonatos e desafios.

### Como autenticar
1. Execute **POST /api/v1/auth/login** com e-mail e senha.
2. Copie o valor de \`data.access_token\` da resposta.
3. Clique em **Authorize** 🔓 e cole **apenas o token** no campo — **sem** o prefixo \`Bearer\`. O Swagger adiciona o prefixo automaticamente.
4. O token expira em **15 minutos**. Use **POST /api/v1/auth/refresh** para renovar.

> ⚠️ **Atenção:** Cole só o token puro (ex: \`eyJhbGci...\`). Se colar \`Bearer eyJhbGci...\` o header ficará duplicado e a autenticação falhará.

| Contexto | Rate Limit |
|---|---|
| Rotas públicas | 60 req/min |
| Rotas autenticadas | 120 req/min |
| Login / Registro | 5 req/min |
        `,
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT RS256. Cole aqui APENAS o token (sem o prefixo 'Bearer'). Ex: eyJhbGci...",
          },
        },
      },
      // Segurança global: todas as rotas exigem Bearer por padrão.
      // Rotas públicas sobrescrevem com security: [] no próprio schema.
      security: [{ BearerAuth: [] }],
      tags: [
        { name: "Auth",          description: "Autenticação e gestão de sessão" },
        { name: "Users",         description: "Perfil e preferências do usuário autenticado" },
        { name: "Events",        description: "Eventos esportivos — CRUD e inscrições" },
        { name: "Professionals", description: "Profissionais da plataforma" },
        { name: "🏠 Landing Page", description: "Endpoints públicos para a landing page — sem autenticação, sem dados sensíveis" },
      ],
    },
  });

  // Servindo Swagger UI via CDN com tema e autenticação persistente
  app.get("/api/docs", { schema: { hide: true } }, async (_req, reply) => {
    reply.type("text/html").send(`<!DOCTYPE html>
<html>
  <head>
    <title>⚡ Extreme Competition — API Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
    <style>
      body { background-color: #0A0A0A !important; margin: 0; }
      .swagger-ui { color: #FFFFFF; font-family: 'DM Sans', sans-serif; }
      .swagger-ui .topbar { background-color: #0d1310; border-bottom: 2px solid #00FF87; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #00FF87; font-weight: 800; font-size: 2rem; letter-spacing: -0.04em; }
      .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: #888888; }
      .swagger-ui .info .markdown p { color: #888888; }
      .swagger-ui .scheme-container { background: #0d1310; padding: 16px; border-bottom: 1px solid #1a2e25; }
      .swagger-ui .opblock-tag { color: #FFFFFF !important; font-weight: 700; border-bottom: 1px solid #1a2e25 !important; }
      .swagger-ui .opblock-tag:hover { background: rgba(0,255,135,0.04) !important; }
      .swagger-ui .opblock { border-radius: 4px; margin-bottom: 6px; border: none !important; }
      .swagger-ui .opblock.opblock-get    { background: rgba(0,255,135,0.05); border-left: 3px solid #00FF87 !important; }
      .swagger-ui .opblock.opblock-post   { background: rgba(0,120,255,0.05); border-left: 3px solid #0078FF !important; }
      .swagger-ui .opblock.opblock-put    { background: rgba(255,165,0,0.05);  border-left: 3px solid #FFA500 !important; }
      .swagger-ui .opblock.opblock-patch  { background: rgba(138,43,226,0.05); border-left: 3px solid #8A2BE2 !important; }
      .swagger-ui .opblock.opblock-delete { background: rgba(255,77,0,0.05);   border-left: 3px solid #FF4D00 !important; }
      .swagger-ui .opblock-summary-description { color: #CCCCCC !important; }
      .swagger-ui .opblock-body { background: #111 !important; }
      .swagger-ui section.models { background: #0d1310; border: 1px solid #1a2e25; border-radius: 4px; }
      .swagger-ui .model-title { color: #00FF87 !important; }
      .swagger-ui .btn.authorize { background: transparent; border: 2px solid #00FF87; color: #00FF87; font-weight: 700; border-radius: 3px; }
      .swagger-ui .btn.authorize:hover { background: #00FF87; color: #0A0A0A; }
      .swagger-ui .btn.authorize svg { fill: #00FF87; }
      .swagger-ui .btn.authorize:hover svg { fill: #0A0A0A; }
      .swagger-ui .btn.execute { background: #00FF87 !important; color: #0A0A0A !important; font-weight: 700; border: none !important; }
      .swagger-ui .btn { border-radius: 3px; }
      .swagger-ui input, .swagger-ui textarea, .swagger-ui select { background: #0d1310 !important; border: 1px solid #1a2e25 !important; color: #FFFFFF !important; }
      .swagger-ui input:focus { border-color: #00FF87 !important; outline: none !important; box-shadow: 0 0 0 2px rgba(0,255,135,0.15) !important; }
      .swagger-ui .dialog-ux .modal-ux { background: #0d1310; border: 1px solid #1a2e25; }
      .swagger-ui .dialog-ux .modal-ux-header { background: #0A0A0A; border-bottom: 1px solid #1a2e25; }
      .swagger-ui .dialog-ux .modal-ux-header h3 { color: #00FF87; }
      .swagger-ui .dialog-ux .modal-ux-content p { color: #888; }
      .swagger-ui .microlight { background: #111 !important; color: #00FF87; padding: 12px; border-radius: 3px; }
      .swagger-ui .prop-type { color: #00FF87 !important; }
      .swagger-ui .response-col_status { color: #00FF87 !important; font-weight: 700; }
      .swagger-ui table tbody tr td { color: #CCCCCC; border-color: #1a2e25; }
      .swagger-ui table thead tr th { color: #888; border-color: #1a2e25; }
      .swagger-ui .parameter__name { color: #FFFFFF; }
      .swagger-ui .parameter__type { color: #00FF87; }
      .swagger-ui span.opblock-summary-method { border-radius: 3px; font-weight: 700; min-width: 70px; text-align: center; }
      .swagger-ui .authorization__btn { border: none; background: none; }
      .swagger-ui .authorization__btn svg { fill: #00FF87; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-thumb { background: #00FF87; border-radius: 3px; }
      ::-webkit-scrollbar-track { background: #0A0A0A; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: "/api/docs/json",
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: "BaseLayout",
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          docExpansion: "list",
          syntaxHighlight: { theme: "monokai" },
        });
      };
    </script>
  </body>
</html>`);
  });

  app.get("/api/docs/json", { schema: { hide: true } }, async (_req, reply) => {
    reply.send(app.swagger());
  });

  // ---- Segurança via Helmet ----
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    // cross-origin: permite que o frontend (porta diferente) carregue
    // imagens e outros recursos servidos por este backend.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  // ---- CORS ----
  await app.register(cors, {
    origin: env.ALLOWED_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // ---- Cookie ----
  await app.register(cookie);

  // ---- Arquivos estáticos — uploads de imagens ----
  // Serve todo o diretório uploads/ (avatars, covers, professionals)
  // Nunca expõe o restante do filesystem
  await app.register(staticFiles, {
    root: join(process.cwd(), "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  // ---- Multipart — upload de avatars (limite: 5 MB) ----
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  // ---- Rate Limiting global (60 req/min por IP) ----
  await app.register(rateLimit, {
    global: true,
    max: 60,
    timeWindow: "1 minute",
    ...(redisClient ? { redis: redisClient } : {}),
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Limite de requisições atingido. Tente novamente em instantes.",
      },
    }),
  });

  // ---- JWT RS256 ----
  // Chaves armazenadas em base64 nas variáveis de ambiente para evitar
  // problemas com escaping de \n em diferentes plataformas de hosting.
  const privateKey = Buffer.from(env.JWT_PRIVATE_KEY, "base64").toString("utf8");
  const publicKey = Buffer.from(env.JWT_PUBLIC_KEY, "base64").toString("utf8");

  await app.register(jwt, {
    secret: {
      private: privateKey,
      public: publicKey,
    },
    sign: { algorithm: "RS256" },
    verify: { algorithms: ["RS256"] },
  });

  // ---- Payload máximo global: 100kb ----
  // Registrado também com charset para compatibilidade com Swagger UI
  const parseJson = (req: import("fastify").FastifyRequest, body: string, done: (err: Error | null, body?: unknown) => void) => {
    try {
      (req.raw as import("http").IncomingMessage & { rawBody?: string }).rawBody = body;
      const cleaned = body.replace(/^\uFEFF/, "").trimStart();
      done(null, JSON.parse(cleaned));
    } catch {
      const error = new Error("Payload inválido. Verifique se o JSON está bem formatado.") as Error & { statusCode: number };
      error.statusCode = 400;
      done(error, undefined);
    }
  };

  app.removeAllContentTypeParsers();
  app.addContentTypeParser(/^application\/json/, { parseAs: "string", bodyLimit: 100 * 1024 }, parseJson);

  // ---- Health check ----
  app.get("/health", { schema: { hide: true } }, async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  }));

  // ---- Rotas ----
  app.register(authRoutes,         { prefix: "/api/v1/auth" });
  app.register(usersRoutes,         { prefix: "/api/v1/users" });
  app.register(eventsRoutes,        { prefix: "/api/v1/events" });
  app.register(professionalsRoutes, { prefix: "/api/v1/professionals" });
  app.register(landingRoutes,       { prefix: "/api/v1/landing" });
  app.register(checkoutRoutes,      { prefix: "/api/v1/checkout" });

  if (env.NODE_ENV === "development") {
    app.register(devRoutes, { prefix: "/api/dev/simulate-payment" });
    app.log.info("🧪 Rotas de desenvolvimento ativas em /api/dev/simulate-payment");
  }

  return app;
}

export { redisClient };
