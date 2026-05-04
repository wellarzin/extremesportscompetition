import { z } from "zod";
import { ProfessionalSpecialty } from "@prisma/client";

export const CreateProfessionalSchema = z
  .object({
    full_name: z.string().min(3).max(255).trim(),
    birth_date: z.string().date("Data inválida. Use YYYY-MM-DD."),
    education: z.string().min(3).max(255).trim(),
    registration_number: z.string().min(1).max(50).trim(),
    registration_type: z.string().min(2).max(20).trim().toUpperCase(),
    bio: z.string().max(2000).trim().optional(),
    photo_url: z.string().url().optional(),
    user_id: z.string().uuid("UUID de usuário inválido.").optional(),
    specialties: z
      .array(
        z.object({
          specialty: z.nativeEnum(ProfessionalSpecialty),
          notes: z.string().max(255).trim().optional(),
        })
      )
      .min(1, "Ao menos uma especialidade é obrigatória.")
      .max(10),
  })
  .strict();

export type CreateProfessionalInput = z.infer<typeof CreateProfessionalSchema>;

export const UpdateProfessionalSchema = z
  .object({
    full_name: z.string().min(3).max(255).trim().optional(),
    birth_date: z.string().date().optional(),
    education: z.string().min(3).max(255).trim().optional(),
    bio: z.string().max(2000).trim().nullable().optional(),
    photo_url: z.string().url().nullable().optional(),
    active: z.boolean().optional(),
    // registration_number e registration_type são imutáveis sem aprovação de admin
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: "Ao menos um campo deve ser fornecido." });

export type UpdateProfessionalInput = z.infer<typeof UpdateProfessionalSchema>;

export const AddSpecialtySchema = z
  .object({
    specialty: z.nativeEnum(ProfessionalSpecialty),
    notes: z.string().max(255).trim().optional(),
  })
  .strict();

export type AddSpecialtyInput = z.infer<typeof AddSpecialtySchema>;

// Schema para auto-cadastro via assinatura (qualquer usuário autenticado)
export const ProfessionalSubscribeSchema = z
  .object({
    full_name: z.string().min(3).max(255).trim(),
    birth_date: z.string().date("Data inválida. Use YYYY-MM-DD."),
    education: z.string().min(3).max(255).trim(),
    registration_number: z.string().min(1).max(50).trim(),
    registration_type: z.string().min(2).max(20).trim().toUpperCase(),
    bio: z.string().max(2000).trim().optional(),
    specialties: z
      .array(
        z.object({
          specialty: z.nativeEnum(ProfessionalSpecialty),
          notes: z.string().max(255).trim().optional(),
        })
      )
      .min(1, "Ao menos uma especialidade é obrigatória.")
      .max(10),
  })
  .strict();

export type ProfessionalSubscribeInput = z.infer<typeof ProfessionalSubscribeSchema>;

export const ListProfessionalsQuerySchema = z.object({
  specialty: z.nativeEnum(ProfessionalSpecialty).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

export type ListProfessionalsQueryInput = z.infer<typeof ListProfessionalsQuerySchema>;
