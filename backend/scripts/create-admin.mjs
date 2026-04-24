/**
 * Script para criar um usuário administrador diretamente no banco.
 *
 * Uso:
 *   node --env-file=.env scripts/create-admin.mjs
 *
 * Ou passe os dados via variáveis de ambiente:
 *   ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=Senha@123 ADMIN_NAME="Seu Nome" \
 *   node --env-file=.env scripts/create-admin.mjs
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createCipheriv, createHmac, randomBytes } from "crypto";
import * as readline from "readline/promises";

const prisma = new PrismaClient();

// ---- Crypto helpers (replica de src/lib/crypto.ts) ----
const AES_KEY = Buffer.from(process.env.AES_SECRET_KEY, "hex");
const HMAC_KEY = process.env.HMAC_SECRET_KEY;

function hmac(value) {
  return createHmac("sha256", HMAC_KEY).update(value).digest("hex");
}

// ---- Prompt helper ----
async function prompt(rl, question, defaultValue) {
  const answer = (await rl.question(question)).trim();
  return answer || defaultValue;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n⚡ Extreme Competition — Criar usuário Admin\n");

  const email = process.env.ADMIN_EMAIL
    || await prompt(rl, "E-mail do admin: ", "");

  const name = process.env.ADMIN_NAME
    || await prompt(rl, "Nome completo: ", "Admin");

  const password = process.env.ADMIN_PASSWORD
    || await prompt(rl, "Senha (mín. 8 chars, 1 maiúscula, 1 número): ", "");

  rl.close();

  if (!email || !password) {
    console.error("❌ E-mail e senha são obrigatórios.");
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("❌ E-mail inválido.");
    process.exit(1);
  }

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    console.error("❌ Senha deve ter ao menos 8 caracteres, 1 maiúscula e 1 número.");
    process.exit(1);
  }

  // Verificar se já existe
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role === "admin") {
      console.log(`⚠️  Usuário ${email} já é admin. Nenhuma alteração feita.`);
      await prisma.$disconnect();
      return;
    }

    // Promover para admin
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin" },
    });
    console.log(`✅ Usuário ${email} promovido para admin com sucesso!`);
    await prisma.$disconnect();
    return;
  }

  // Criar novo usuário admin
  const normalizedDoc = "00000000000"; // CPF placeholder para admin técnico
  const docHash = hmac(normalizedDoc);
  const passwordHash = await bcrypt.hash(password, 12);

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(normalizedDoc, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedDoc = [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");

  await prisma.user.create({
    data: {
      full_name: name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: "admin",
      email_verified: true,
      email_verified_at: new Date(),
      document_type: "cpf",
      document_number: encryptedDoc,
      document_number_hash: docHash,
      birth_date: new Date("1990-01-01"),
      zip_code: "00000000",
      street: "Admin",
      city: "Admin",
      state: "SP",
      number: "0",
      shirt_size: "M",
      education_level: "superior_completo",
      profession: "profissional_ti",
    },
  });

  console.log(`\n✅ Admin criado com sucesso!`);
  console.log(`   E-mail : ${email.toLowerCase()}`);
  console.log(`   Role   : admin`);
  console.log(`\n   Faça login em POST /api/v1/auth/login\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Erro:", err.message);
  prisma.$disconnect();
  process.exit(1);
});
