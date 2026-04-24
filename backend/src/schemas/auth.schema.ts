import { z } from "zod";
import {
  DocumentType,
  ShirtSize,
  EducationLevel,
  Profession,
} from "@prisma/client";

// ============================================================
// Schemas Zod para as rotas de autenticação
// Campos extras desconhecidos são rejeitados com .strict()
// ============================================================

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres.")
  .max(72, "Senha deve ter no máximo 72 caracteres.") // limite do bcrypt
  .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "Senha deve conter ao menos um número.");

export const RegisterSchema = z
  .object({
    full_name: z.string().min(3).max(255).trim(),
    birth_date: z.string().date("Data de nascimento inválida. Use YYYY-MM-DD."),
    document_type: z.nativeEnum(DocumentType),
    document_number: z
      .string()
      .min(8)
      .max(20)
      .transform((v) => v.replace(/\D/g, "")),
    zip_code: z
      .string()
      .regex(/^\d{5}-?\d{3}$/, "CEP inválido.")
      .transform((v) => v.replace(/\D/g, "")),
    street: z.string().min(3).max(255).trim(),
    neighborhood: z.string().max(100).trim().optional(),
    city: z.string().min(2).max(100).trim(),
    state: z
      .string()
      .length(2, "Estado deve ser a UF com 2 letras.")
      .toUpperCase(),
    number: z.string().min(1).max(10).trim(),
    complement: z.string().max(100).trim().optional(),
    weight_kg: z.number().positive().max(500).optional(),
    height_cm: z.number().int().positive().max(300).optional(),
    shirt_size: z.nativeEnum(ShirtSize),
    shoe_size: z.number().positive().max(60).optional(),
    education_level: z.nativeEnum(EducationLevel),
    profession: z.nativeEnum(Profession),
    email: z.string().email().toLowerCase().trim(),
    password: passwordSchema,
    consent_version: z.string().max(10).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const VerifyEmailSchema = z
  .object({
    token: z.string().length(64, "Token inválido."),
  })
  .strict();

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const LoginSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z
  .object({
    email: z.string().email().toLowerCase().trim(),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    token: z.string().length(64, "Token inválido."),
    password: passwordSchema,
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
