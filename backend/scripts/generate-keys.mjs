#!/usr/bin/env node
/**
 * Gera as chaves necessárias para o backend e imprime no formato .env
 * Uso: node scripts/generate-keys.mjs
 */
import { generateKeyPairSync, randomBytes } from "crypto";

// ---- RS256 — par de chaves para JWT ----
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const toEnvLine = (pem) => pem.replace(/\n/g, "\\n");

// ---- AES-256-GCM — chave de criptografia ----
const aesKey = randomBytes(32).toString("hex");

// ---- HMAC — chave determinística para unicidade ----
const hmacKey = randomBytes(32).toString("hex");

console.log("# Cole estas linhas no seu .env:\n");
console.log(`JWT_PRIVATE_KEY="${toEnvLine(privateKey)}"`);
console.log(`JWT_PUBLIC_KEY="${toEnvLine(publicKey)}"`);
console.log(`AES_SECRET_KEY="${aesKey}"`);
console.log(`HMAC_SECRET_KEY="${hmacKey}"`);
console.log("\n# IMPORTANTE: guarde as chaves em local seguro (ex: cofre de senhas).");
console.log("# Nunca commite estas chaves no git.");
