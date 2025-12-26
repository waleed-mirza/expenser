import { z } from "zod";

export const transactionInputSchema = z.object({
  clientId: z.string().min(6),
  amountCents: z.number().int().positive(),
  currencyCode: z.string().length(3).toUpperCase(),
  note: z.string().max(300).optional(),
  occurredAt: z.string().transform((v) => new Date(v)),
  clientUpdatedAt: z.string().transform((v) => new Date(v)),
  source: z.string().optional(),
});

export const categoryInputSchema = z.object({
  clientId: z.string().min(6),
  name: z.string().min(1).max(80),
  color: z.string().optional(),
  clientUpdatedAt: z.string().transform((v) => new Date(v)),
});

export const transactionUpdateSchema = z.object({
  clientId: z.string().min(6),
  amountCents: z.number().int().positive().optional(),
  currencyCode: z.string().length(3).toUpperCase().optional(),
  note: z.string().max(300).optional(),
  occurredAt: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  clientUpdatedAt: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
});

export const transactionDeleteSchema = z.object({
  clientId: z.string().min(6),
  clientUpdatedAt: z.string().transform((v) => new Date(v)),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionDeleteInput = z.infer<typeof transactionDeleteSchema>;
