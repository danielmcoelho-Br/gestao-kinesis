import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().min(3, "Nome do paciente deve ter pelo menos 3 caracteres.").max(100),
  age: z.coerce.number().min(0, "A idade não pode ser negativa.").max(130, "Idade inválida."),
  weight: z.coerce.number().min(0).max(300).optional().nullable(),
  height: z.coerce.number().min(0).max(300).optional().nullable(),
  gender: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  activity_level: z.string().optional().nullable(),
});

export const updatePatientSchema = z.object({
  id: z.string().uuid("ID de paciente inválido."),
  name: z.string().min(3).optional(),
  age: z.coerce.number().min(0).max(130).optional(),
  weight: z.coerce.number().min(0).max(300).optional().nullable(),
  height: z.coerce.number().min(0).max(300).optional().nullable(),
  gender: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  activity_level: z.string().optional().nullable(),
});

export const addPatientDocumentSchema = z.object({
  patient_id: z.string().uuid("ID de paciente inválido."),
  description: z.string().min(3, "A descrição do documento é muito curta."),
  file_url: z.string().url("URL de arquivo inválida."),
  file_type: z.string(),
});
