import type { Context } from 'hono';
import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (val === undefined || val === null) return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const nonEmptyTrimmed = z.string().trim().min(1);

export const ceremonySchema = z.enum([
  'general',
  'engagement',
  'haldi',
  'mehendi',
  'sangeet',
  'wedding',
  'reception',
]);

export const paymentMethodSchema = z.enum([
  'upi',
  'bank_transfer',
  'cash',
  'card',
  'cheque',
]);

export const contributorSideSchema = z.enum(['joint', 'bride', 'groom']);

export const expenseStatusSchema = z.enum(['unpaid', 'partial', 'paid', 'overdue']);

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const saveWeddingSchema = z.object({
  brideName: nonEmptyTrimmed,
  groomName: nonEmptyTrimmed,
  weddingDate: nonEmptyTrimmed,
  totalBudget: z.number().int().min(0),
  contingencyPercent: z.number().int().min(0).max(50),
  isOnboarded: z.boolean().nullable().optional(),
});

export const createCategorySchema = z.object({
  name: nonEmptyTrimmed,
  description: optionalTrimmedString,
  icon: nonEmptyTrimmed,
  allocatedBudget: z.number().int().nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: nonEmptyTrimmed.optional(),
  description: optionalTrimmedString,
  icon: nonEmptyTrimmed.optional(),
  allocatedBudget: z.number().int().nullable().optional(),
});

export const createPaymentSchema = z.object({
  amount: z.number().int().min(1),
  paidDate: nonEmptyTrimmed,
  label: z
    .string()
    .optional()
    .default('')
    .transform((v) => v.trim()),
  method: paymentMethodSchema,
  paidBy: contributorSideSchema,
  note: optionalTrimmedString,
});

export const createExpenseSchema = z.object({
  categoryId: nonEmptyTrimmed,
  title: nonEmptyTrimmed,
  description: optionalTrimmedString,
  estimatedAmount: z.number().int().min(0),
  dueDate: optionalTrimmedString,
  ceremony: ceremonySchema.nullable().optional(),
  vendorName: optionalTrimmedString,
  vendorPhone: optionalTrimmedString,
  advancePayment: createPaymentSchema.nullable().optional(),
});

export const updateExpenseSchema = z.object({
  categoryId: nonEmptyTrimmed.optional(),
  title: nonEmptyTrimmed.optional(),
  description: optionalTrimmedString,
  estimatedAmount: z.number().int().min(0).optional(),
  dueDate: optionalTrimmedString,
  ceremony: ceremonySchema.nullable().optional(),
  vendorName: optionalTrimmedString,
  vendorPhone: optionalTrimmedString,
});

export async function parseBody<T extends z.ZodType>(
  c: Context,
  schema: T,
): Promise<{ ok: true; data: z.infer<T>; rawKeys: Set<string> } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return {
      ok: false,
      response: c.json({ detail: 'Invalid JSON request body' }, 422),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: c.json({ detail: parsed.error.issues }, 422),
    };
  }

  const rawKeys = new Set(
    raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.keys(raw) : [],
  );
  return { ok: true, data: parsed.data, rawKeys };
}
