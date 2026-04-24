import { z } from "zod";
import { ShirtSize, EducationLevel, Profession, Sport, SportLevel, PracticeTime } from "@prisma/client";

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "Senha deve conter ao menos um número.");

export const UpdateProfileSchema = z
  .object({
    full_name: z.string().min(3).max(255).trim().optional(),
    birth_date: z.string().date("Data inválida.").optional(),
    zip_code: z
      .string()
      .regex(/^\d{5}-?\d{3}$/, "CEP inválido.")
      .transform((v) => v.replace(/\D/g, ""))
      .optional(),
    street: z.string().min(3).max(255).trim().optional(),
    neighborhood: z.string().max(100).trim().nullable().optional(),
    city: z.string().min(2).max(100).trim().optional(),
    state: z.string().length(2).toUpperCase().optional(),
    number: z.string().min(1).max(10).trim().optional(),
    complement: z.string().max(100).trim().nullable().optional(),
    weight_kg: z.number().positive().max(500).nullable().optional(),
    height_cm: z.number().int().positive().max(300).nullable().optional(),
    shirt_size: z.nativeEnum(ShirtSize).optional(),
    shoe_size: z.number().positive().max(60).nullable().optional(),
    education_level: z.nativeEnum(EducationLevel).optional(),
    profession: z.nativeEnum(Profession).optional(),
    consent_version: z.string().max(10).optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: "Ao menos um campo deve ser fornecido." });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const ChangeEmailSchema = z
  .object({
    new_email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
  })
  .strict();

export type ChangeEmailInput = z.infer<typeof ChangeEmailSchema>;

export const DeleteAccountSchema = z
  .object({
    password: z.string().min(1),
  })
  .strict();

export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;

export const AddSportPreferenceSchema = z
  .object({
    sport: z.nativeEnum(Sport),
    level: z.nativeEnum(SportLevel),
    practice_time: z.nativeEnum(PracticeTime),
  })
  .strict();

export type AddSportPreferenceInput = z.infer<typeof AddSportPreferenceSchema>;

export const UpdateSportPreferenceSchema = z
  .object({
    sport: z.nativeEnum(Sport).optional(),
    level: z.nativeEnum(SportLevel).optional(),
    practice_time: z.nativeEnum(PracticeTime).optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: "Ao menos um campo deve ser fornecido." });

export type UpdateSportPreferenceInput = z.infer<typeof UpdateSportPreferenceSchema>;
