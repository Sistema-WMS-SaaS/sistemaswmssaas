import { z } from "zod"

export const importXmlSchema = z.object({
  fileName: z.string().min(1, "Nome do arquivo é obrigatório"),
  content: z.string().min(1, "Conteúdo do XML é obrigatório"),
  observations: z.string().optional(),
})

export const xmlHistoryFilterSchema = z.object({
  fileName: z.string().optional(),
  productCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(["active", "archived", "cancelled"]).optional(),
  tenantId: z.string().optional(),
})

export const xmlRecordIdSchema = z.object({
  id: z.string().min(1),
})
