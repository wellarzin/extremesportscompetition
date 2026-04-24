# api.md — Rotas da API
## Extreme Competition Platform

> **Claude Code:** segurança não é opcional. Implemente cada regra abaixo sem exceção.

---

## Regras Globais de Segurança

> Estas regras se aplicam a **todas** as rotas, sem exceção.

**Autenticação e Autorização**
- JWT com par de chaves assimétricas `RS256` (nunca `HS256` com segredo simples).
- `access_token`: 15 minutos. `refresh_token`: 7 dias em cookie `HttpOnly; Secure; SameSite=Strict` — **nunca em `localStorage`**.
- Rotação obrigatória de refresh token a cada uso. Se token já usado for apresentado novamente: revogar toda a família de tokens do usuário.
- Middleware de autenticação aplicado por padrão. Rotas públicas são exceção explícita declarada.
- RBAC com papéis: `user`, `organizer`, `professional`, `admin`. Cada rota declara quais papéis têm acesso.
- O `user_id` da operação **sempre** vem do JWT (`req.user.id`), nunca do body ou params.
- Antes de qualquer UPDATE ou DELETE: verificar se o recurso pertence ao `req.user.id`. Retornar `403` se não — nunca `404` (evita enumeração).

**Senhas e Dados Sensíveis**
- Senhas: hash com `bcrypt` custo mínimo `12`. Nunca armazenar, logar ou retornar.
- CPF/RG: criptografar em repouso com `AES-256-GCM`. Sempre mascarado nas respostas.
- Tokens: gerados com `crypto.randomBytes(32)`. Nunca `Math.random()`.
- Refresh tokens no banco: armazenar apenas o `SHA-256` do valor bruto.
- Comparações de tokens: sempre `crypto.timingSafeEqual` (evita timing attacks).

**Validação e Sanitização**
- Validar tudo no servidor com schema (`Zod` ou `Joi`). Campos extras desconhecidos: rejeitar com `422`.
- Sanitizar inputs antes de persistir: remover HTML/scripts, trimar strings.
- Queries: exclusivamente parametrizadas ou via ORM. Nenhuma concatenação de string SQL.
- Payload máximo: `10kb` global. Upload de imagem: rota dedicada com limite de `5MB`.

**Headers de Segurança** (via `helmet` — obrigatório em todas as respostas)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store  ← em rotas autenticadas
```

**Rate Limiting** (via Redis)
| Contexto | Limite |
|---|---|
| Rotas públicas | 60 req/min por IP |
| Rotas autenticadas | 120 req/min por usuário |
| Login / Registro | 5 req/min por IP |
| Recuperação de senha | 3 req/15min por IP |

Após 5 tentativas falhas de login: bloquear conta por 30 minutos com backoff progressivo.

**CORS:** apenas origens da variável de ambiente `ALLOWED_ORIGINS`. Nunca `origin: '*'` em produção.

**Soft Delete:** nenhuma tabela principal usa deleção física. Sempre `deleted_at = NOW()`. Queries padrão filtram `WHERE deleted_at IS NULL`.

**Logs de Auditoria:** logar tentativas de login, criação/edição/cancelamento de eventos, operações de admin. Nunca logar senhas, tokens ou CPF/RG completo.

**Variáveis de Ambiente** — todos os segredos vêm de `.env`. Zero hardcode:
```env
JWT_PRIVATE_KEY=   # PEM RS256
JWT_PUBLIC_KEY=    # PEM RS256
AES_SECRET_KEY=    # 32 bytes hex
DATABASE_URL=
REDIS_URL=
ALLOWED_ORIGINS=
SWAGGER_USER=      # Swagger em produção
SWAGGER_PASS=
```

---

## LGPD — Diretrizes Obrigatórias

- Coletar apenas dados estritamente necessários para a finalidade declarada.
- CPF/RG: base legal = cumprimento de obrigação legal. Peso/altura/foto: base legal = consentimento explícito (checkbox não pré-marcado no cadastro).
- Armazenar `consent_version` e `consent_given_at` na tabela `users`.
- Usuário pode solicitar exportação (`GET /users/me/data-export`) e exclusão (`DELETE /users/me`) de seus dados a qualquer momento.
- Exclusão: anonimização irreversível (não deleção física) — manter apenas o necessário para obrigações fiscais.
- Nunca enviar CPF/RG para APIs de terceiros sem consentimento específico.

---

## Padrões de Resposta

**Sucesso:**
```json
{ "success": true, "data": {}, "meta": { "page": 1, "per_page": 20, "total": 0, "total_pages": 0 } }
```

**Erro:**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Mensagem amigável.", "details": [] } }
```

> `details` apenas em erros `422`. Em `401`/`403`: mensagem genérica, nunca revelar o motivo real.

**Base URL:** `/api/v1` | **Timestamps:** ISO 8601 UTC | **Paginação:** `?page=1&per_page=20` (máx 100)

---

## Swagger — Documentação Interativa

**Bibliotecas:** `swagger-ui-express` + `swagger-jsdoc`

**URLs:**
```
Desenvolvimento : http://localhost:3000/api/docs
Produção        : https://api.extremecompetition.com.br/api/docs  ← HTTP Basic Auth obrigatório
```

**Proteção em produção:** Swagger deve exigir autenticação HTTP Basic com `SWAGGER_USER` / `SWAGGER_PASS`. Nunca expor documentação pública em produção.

**Tema customizado** — aplicar identidade visual da Extreme Competition:

```javascript
// swagger.config.js
const swaggerUiOptions = {
  customCss: `
    body { background-color: #0A0A0A !important; }
    .swagger-ui { color: #FFFFFF; font-family: 'DM Sans', sans-serif; }

    .swagger-ui .topbar {
      background-color: #0d1310;
      border-bottom: 2px solid #00FF87;
    }
    .swagger-ui .topbar .download-url-wrapper { display: none; }

    .swagger-ui .info .title {
      color: #00FF87;
      font-family: 'Manrope', sans-serif;
      font-weight: 800;
      font-size: 2rem;
      letter-spacing: -0.04em;
    }
    .swagger-ui .info p, .swagger-ui .info li { color: #888888; }

    .swagger-ui .opblock-tag {
      color: #FFFFFF !important;
      font-family: 'Manrope', sans-serif;
      font-weight: 700;
      border-bottom: 1px solid #1a2e25 !important;
    }

    .swagger-ui .opblock { border-radius: 4px; margin-bottom: 6px; border: none !important; }
    .swagger-ui .opblock.opblock-get    { background: rgba(0,255,135,0.05); border-left: 3px solid #00FF87 !important; }
    .swagger-ui .opblock.opblock-post   { background: rgba(0,120,255,0.05); border-left: 3px solid #0078FF !important; }
    .swagger-ui .opblock.opblock-put    { background: rgba(255,165,0,0.05);  border-left: 3px solid #FFA500 !important; }
    .swagger-ui .opblock.opblock-patch  { background: rgba(138,43,226,0.05); border-left: 3px solid #8A2BE2 !important; }
    .swagger-ui .opblock.opblock-delete { background: rgba(255,77,0,0.05);   border-left: 3px solid #FF4D00 !important; }

    .swagger-ui .btn.authorize {
      background: transparent; border: 2px solid #00FF87;
      color: #00FF87; font-weight: 700; border-radius: 3px;
    }
    .swagger-ui .btn.authorize:hover { background: #00FF87; color: #0A0A0A; }
    .swagger-ui .btn.execute { background: #00FF87 !important; color: #0A0A0A !important; font-weight: 700; }

    .swagger-ui input, .swagger-ui textarea, .swagger-ui select {
      background: #0d1310 !important; border: 1px solid #1a2e25 !important; color: #FFFFFF !important;
    }
    .swagger-ui input:focus { border-color: #00FF87 !important; outline: none !important; }

    .swagger-ui .microlight { background: #111 !important; color: #00FF87; padding: 12px; border-radius: 3px; }
    .swagger-ui .prop-type { color: #00FF87 !important; }
    .swagger-ui .response-col_status { color: #00FF87 !important; font-weight: 700; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #00FF87; border-radius: 3px; }
    ::-webkit-scrollbar-track { background: #0A0A0A; }
  `,
  customSiteTitle: '⚡ Extreme Competition — API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: 'list',
    tryItOutEnabled: false,
    syntaxHighlight: { theme: 'monokai' },
  },
};
```

**Definição OpenAPI:**
```javascript
const openApiDefinition = {
  openapi: '3.0.3',
  info: {
    title: '⚡ Extreme Competition API',
    version: '1.0.0',
    description: `
Marketplace de eventos esportivos — maratonas, campeonatos e desafios.

### Autenticação
Clique em **Authorize** e insira: \`Bearer SEU_ACCESS_TOKEN\`
O token expira em **15 minutos** — use \`POST /auth/refresh\` para renovar.

| Contexto | Rate Limit |
|---|---|
| Rotas públicas | 60 req/min |
| Rotas autenticadas | 120 req/min |
| Login / Registro | 5 req/min |
    `,
  },
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: '🔐 Auth',          description: 'Autenticação e gestão de sessão' },
    { name: '👤 Users',         description: 'Perfil do usuário autenticado' },
    { name: '📅 Events',        description: 'Eventos esportivos' },
    { name: '🏅 Professionals', description: 'Profissionais da plataforma' },
  ],
};
```

---

## Autenticação

**Prefix:** `/api/v1/auth` | **Tag:** `🔐 Auth`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Cadastra novo usuário |
| `POST` | `/auth/verify-email` | Público | Ativa conta via token de e-mail |
| `POST` | `/auth/login` | Público | Autentica e retorna tokens |
| `POST` | `/auth/refresh` | Cookie | Renova access token |
| `POST` | `/auth/logout` | Autenticado | Encerra sessão atual |
| `POST` | `/auth/logout-all` | Autenticado | Encerra todas as sessões |
| `POST` | `/auth/forgot-password` | Público | Solicita redefinição de senha |
| `POST` | `/auth/reset-password` | Público | Redefine senha via token |

### Notas de segurança críticas

**`POST /auth/register`**
- Hash da senha com bcrypt (custo 12) antes de persistir.
- Criptografar `document_number` com AES-256-GCM.
- Validar dígito verificador do CPF/RG.
- Em conflito de e-mail: retornar resposta **genérica** — nunca confirmar se o e-mail existe.
- Nunca logar o body desta rota.

**`POST /auth/login`**
- Se e-mail não encontrado: simular `bcrypt.compare` com hash dummy (tempo constante) e retornar `401` genérico — nunca revelar se o e-mail existe.
- Após 5 falhas: bloquear por 30 min com backoff progressivo.
- `refresh_token` enviado **exclusivamente** via `Set-Cookie: HttpOnly; Secure; SameSite=Strict` — jamais no body.

**`POST /auth/refresh`**
- Extrair token **somente do cookie**, nunca do body.
- Comparar `SHA-256(token)` com o hash armazenado — tempo constante.
- Rotação obrigatória: invalidar token atual e emitir novo par.
- Token antigo reapresentado → detectar roubo → revogar toda a família de tokens.

**`POST /auth/forgot-password`**
- Resposta **sempre idêntica**, independente de o e-mail existir ou não.
- Token armazenado como `SHA-256`, expira em 1 hora, one-time use.

---

## Users

**Prefix:** `/api/v1/users` | **Tag:** `👤 Users`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/users/me` | Autenticado | Retorna perfil completo |
| `PUT` | `/users/me` | Autenticado | Atualiza perfil |
| `POST` | `/users/me/change-email` | Autenticado | Solicita troca de e-mail |
| `POST` | `/users/me/avatar` | Autenticado | Upload de foto de perfil |
| `DELETE` | `/users/me` | Autenticado | Solicita exclusão da conta (LGPD) |
| `GET` | `/users/me/sport-preferences` | Autenticado | Lista preferências esportivas |
| `POST` | `/users/me/sport-preferences` | Autenticado | Adiciona preferência esportiva |
| `PUT` | `/users/me/sport-preferences/:id` | Autenticado | Atualiza preferência esportiva |
| `DELETE` | `/users/me/sport-preferences/:id` | Autenticado | Remove preferência esportiva |
| `GET` | `/users/me/tickets` | Autenticado | Lista ingressos comprados |

### Notas de segurança críticas

- `user_id` **sempre** vem do JWT (`req.user.id`). Nunca aceitar `id` do body.
- `document_number` sempre mascarado nas respostas. `password_hash` nunca incluído.
- Campos imutáveis via `PUT /users/me`: `email` (fluxo próprio), `password` (reset), `document_number` (suporte manual).
- Upload de avatar: validar MIME type via **magic bytes** (não extensão). Aceitar apenas `jpeg`, `png`, `webp`. Renomear com UUID gerado no servidor. Nunca servir o arquivo original.
- Preferências: verificar que o `preference_id` pertence ao `req.user.id` antes de UPDATE/DELETE. Máximo de 5 modalidades por usuário.
- `DELETE /users/me`: verificar senha antes de prosseguir. Não deletar imediatamente — período de carência de 7 dias com link de cancelamento. Revogar todos os tokens imediatamente.

---

## Events

**Prefix:** `/api/v1/events` | **Tag:** `📅 Events`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/events` | Público | Lista eventos com filtros e paginação |
| `GET` | `/events/:id` | Público | Detalhe de um evento |
| `POST` | `/events` | `organizer`, `admin` | Cria novo evento |
| `PUT` | `/events/:id` | Organizer dono, `admin` | Atualiza evento |
| `DELETE` | `/events/:id` | Organizer dono, `admin` | Cancela evento (soft delete) |
| `POST` | `/events/:id/enroll` | Autenticado | Inscreve usuário no evento |
| `DELETE` | `/events/:id/enroll` | Autenticado | Cancela inscrição |
| `GET` | `/events/me/organized` | `organizer`, `admin` | Lista eventos do organizador |

### Notas de segurança críticas

- Filtrar sempre `WHERE deleted_at IS NULL` em todas as queries.
- `organizer_id` vem do JWT, **nunca do body**.
- Antes de UPDATE/DELETE: verificar `events.organizer_id == req.user.id`. Retornar `403` se não pertencer.
- `POST /events`: `start_datetime` deve ser mínimo 24h no futuro. Sanitizar HTML de `description` e `rules`.
- `DELETE /events/:id`: soft delete (`status = "cancelado"`, `deleted_at = NOW()`). Se houver inscritos: criar jobs de reembolso e notificar por e-mail.
- `POST /events/:id/enroll`: usar `SELECT FOR UPDATE` (lock) para evitar race condition em inscrições simultâneas. Incrementar `enrolled` atomicamente dentro de transação.
- Nunca retornar dados privados do organizador além de `id` e `name`.

**Query params aceitos em `GET /events`:**
```
?sport=corrida&modality=presencial&city=Pelotas&state=RS
&status=aberto&date_from=2025-05-01&price_max=10000
&sort=start_datetime&order=asc&page=1&per_page=20
```
Validar todos os params contra os enums do `schedule.md` — rejeitar valores não mapeados.

---

## Professionals

**Prefix:** `/api/v1/professionals` | **Tag:** `🏅 Professionals`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/professionals` | Público | Lista profissionais ativos |
| `GET` | `/professionals/:id` | Público | Detalhe de um profissional |
| `POST` | `/professionals` | `admin` | Cadastra profissional (moderado) |
| `PUT` | `/professionals/:id` | `admin`, `professional` vinculado | Atualiza profissional |
| `DELETE` | `/professionals/:id` | `admin` | Desativa profissional |
| `POST` | `/professionals/:id/specialties` | `admin` | Adiciona especialidade |
| `DELETE` | `/professionals/:id/specialties/:sid` | `admin` | Remove especialidade |

### Notas de segurança críticas

- Cadastro moderado por `admin` para garantir verificação do registro profissional (CREF, CRN, CRM etc.) antes de exibição pública.
- `PUT`: se role `professional`, verificar `professionals.user_id == req.user.id`. Campos `registration_number` e `registration_type` imutáveis sem aprovação de `admin`.
- Verificar `active = true` e `deleted_at IS NULL` em todas as rotas públicas.
- Nunca retornar `user_id` vinculado ou campos internos nas respostas públicas.
- `DELETE`: soft delete (`active = false`, `deleted_at = NOW()`). Nunca deleção física.
- Remoção de especialidade: profissional deve manter ao menos 1 especialidade.

---

## Códigos de Erro

| HTTP | Code | Uso |
|---|---|---|
| `400` | `BAD_REQUEST` | Requisição malformada |
| `401` | `UNAUTHORIZED` | Token ausente, inválido ou expirado |
| `403` | `FORBIDDEN` | Sem permissão para este recurso |
| `404` | `NOT_FOUND` | Recurso não encontrado |
| `409` | `CONFLICT` | Conflito de estado (ex: já inscrito) |
| `422` | `VALIDATION_ERROR` | Falha de validação (inclui `details`) |
| `423` | `ACCOUNT_LOCKED` | Conta bloqueada por tentativas de login |
| `429` | `RATE_LIMIT_EXCEEDED` | Limite de requisições atingido |
| `500` | `INTERNAL_ERROR` | Erro interno — mensagem genérica ao cliente |

> Erros `401`/`403`: **nunca detalhar o motivo real**. Recurso privado de outro usuário: sempre `403`, nunca `404`. Erros `500`: logar stack trace no servidor, retornar apenas mensagem genérica.

---

## Checklist — antes de cada rota ser considerada pronta

- [ ] Autenticação via JWT validada em middleware (nunca inline)
- [ ] `user_id` vem do JWT — nunca do body ou params
- [ ] Propriedade do recurso verificada antes de UPDATE/DELETE
- [ ] RBAC: papel do usuário confere com o exigido
- [ ] Validação de schema em todos os inputs — campos extras rejeitados
- [ ] Dados sensíveis mascarados — `password_hash` nunca na resposta
- [ ] Rate limiting aplicado
- [ ] Soft delete usado — nunca `DELETE FROM` em tabelas principais
- [ ] Queries 100% parametrizadas — zero concatenação SQL
- [ ] Headers de segurança via middleware global
- [ ] Erros `401`/`403` com mensagem genérica
- [ ] Todos os segredos em variáveis de ambiente — zero hardcode
- [ ] Swagger protegido por HTTP Basic Auth em produção
