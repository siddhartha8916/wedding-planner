import type { CreateExpensePayload } from '../types/api.ts';
import type { CeremonyTag, PaymentMethod } from '../types/wedding.ts';
import { getTodayIso } from './date.ts';

export type ExpenseEntryMode = 'planned' | 'upfront';

export interface ExpenseFormSubmitValues {
  categoryId: string;
  title: string;
  description?: string;
  estimatedAmount: number;
  dueDate?: string;
  ceremony: CeremonyTag;
  vendorName?: string;
  vendorPhone?: string;
}

export interface BuildCreateExpenseInput {
  mode: ExpenseEntryMode;
  values: ExpenseFormSubmitValues;
  hasAdvance: boolean;
  advanceAmount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
}

/**
 * Builds the API payload for creating an expense in either Planned/Booking
 * mode or Paid Upfront mode (where a single entered amount is recorded as both
 * the total expense cost and a completed upfront payment with no due date).
 */
export function buildCreateExpensePayload({
  mode,
  values,
  hasAdvance,
  advanceAmount,
  paymentDate,
  paymentMethod,
}: BuildCreateExpenseInput): CreateExpensePayload {
  const effectiveDate = paymentDate || getTodayIso();

  const basePayload: CreateExpensePayload = {
    categoryId: values.categoryId,
    title: values.title,
    description: values.description || undefined,
    estimatedAmount: values.estimatedAmount,
    ceremony: values.ceremony,
    vendorName: values.vendorName || undefined,
    vendorPhone: values.vendorPhone || undefined,
  };

  if (mode === 'upfront') {
    return {
      ...basePayload,
      dueDate: undefined,
      advancePayment: {
        amount: values.estimatedAmount,
        paidDate: effectiveDate,
        label: 'Direct Purchase',
        method: paymentMethod,
      },
    };
  }

  return {
    ...basePayload,
    dueDate: values.dueDate || undefined,
    advancePayment:
      hasAdvance && advanceAmount > 0
        ? {
            amount: advanceAmount,
            paidDate: effectiveDate,
            label:
              advanceAmount >= values.estimatedAmount
                ? 'Full Settlement'
                : 'Advance Deposit',
            method: paymentMethod,
          }
        : undefined,
  };
}
