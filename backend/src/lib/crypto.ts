import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { env } from "./env";

// ============================================================
// AES-256-GCM — criptografia de dados sensíveis em repouso
// Formato armazenado: iv:authTag:ciphertext (tudo em hex)
// ============================================================

const AES_KEY = Buffer.from(env.AES_SECRET_KEY, "hex");

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96 bits — tamanho recomendado para GCM
  const cipher = createCipheriv("aes-256-gcm", AES_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 128 bits de autenticação

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Formato de dado criptografado inválido.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", AES_KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// ============================================================
// HMAC-SHA256 determinístico — usado para unicidade de documentos
// Não expõe o valor real, mas é consistente para o mesmo input
// ============================================================

export function hmac(value: string): string {
  return createHmac("sha256", env.HMAC_SECRET_KEY).update(value).digest("hex");
}

// ============================================================
// SHA-256 — hash de tokens (refresh, verificação, reset)
// ============================================================

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// ============================================================
// Token seguro — 32 bytes via crypto.randomBytes (nunca Math.random)
// ============================================================

export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

// ============================================================
// Comparação de tempo constante — evita timing attacks
// ============================================================

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

// ============================================================
// Validação de CPF — algoritmo dos dígitos verificadores
// ============================================================

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos iguais (ex: 111.111.111-11)

  const calcDigit = (d: string, len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * (len + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return (
    calcDigit(digits, 9) === parseInt(digits[9]) &&
    calcDigit(digits, 10) === parseInt(digits[10])
  );
}

// ============================================================
// Normalização de documento (remove pontuação, apenas dígitos)
// ============================================================

export function normalizeDocument(doc: string): string {
  return doc.replace(/\D/g, "");
}

// ============================================================
// Mascaramento de documento para respostas da API
// CPF: ***.***.123-45 | RG: *****123
// ============================================================

export function maskDocument(doc: string, type: "cpf" | "rg"): string {
  const digits = normalizeDocument(doc);
  if (type === "cpf" && digits.length === 11) {
    return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return `*****${digits.slice(-3)}`;
}
