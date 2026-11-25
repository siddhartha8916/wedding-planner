import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CEREMONY_OPTIONS,
  CONTRIBUTOR_SIDE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../config/presets.ts';
import { useCategories } from '../../hooks/useCategories.ts';
import { useExpenseMutations } from '../../hooks/useExpenses.ts';
import { useToast } from '../../hooks/useToast.ts';
import type {
  Category,
  CeremonyTag,
  ContributorSide,
  Expense,
  PaymentMethod,
} from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { getTodayIso } from '../../utils/date.ts';
import { Accordion } from '../ui/Accordion.tsx';
import { Button } from '../ui/Button.tsx';
import { CurrencyInput } from '../ui/CurrencyInput.tsx';
import { Input } from '../ui/Input.tsx';
import { ResponsiveSheet } from '../ui/ResponsiveSheet.tsx';
import { Select } from '../ui/Select.tsx';

const expenseSchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),
  title: z.string().trim().min(1, 'Expense title is required').max(90),
  description: z.string().max(300).optional(),
  estimatedAmount: z.number().min(1, 'Enter an estimated amount greater than ₹0'),
  dueDate: z.string().optional(),
  ceremony: z.enum([
    'general',
    'engagement',
    'haldi',
    'mehendi',
    'sangeet',
    'wedding',
    'reception',
  ]),
  vendorName: z.string().max(80).optional(),
  vendorPhone: z.string().max(30).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export interface ExpenseFormSheetProps {
  open: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
  editingExpense?: Expense | null;
}

function ExpenseFormSheetInner({
  onClose,
  defaultCategoryId,
  editingExpense,
  categories,
}: {
  onClose: () => void;
  defaultCategoryId?: string;
  editingExpense: Expense | null;
  categories: Category[];
}) {
  const { createExpense, updateExpense } = useExpenseMutations();
  const { showToast } = useToast();

  const [hasAdvance, setHasAdvance] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceDate, setAdvanceDate] = useState(() => getTodayIso());
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>('upi');
  const [advancePaidBy, setAdvancePaidBy] = useState<ContributorSide>('joint');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: editingExpense
      ? {
          categoryId: editingExpense.categoryId,
          title: editingExpense.title,
          description: editingExpense.description ?? '',
          estimatedAmount: editingExpense.estimatedAmount,
          dueDate: editingExpense.dueDate ?? '',
          ceremony: editingExpense.ceremony ?? 'general',
          vendorName: editingExpense.vendorName ?? '',
          vendorPhone: editingExpense.vendorPhone ?? '',
        }
      : {
          categoryId: defaultCategoryId ?? categories[0]?.id ?? '',
          title: '',
          description: '',
          estimatedAmount: 0,
          dueDate: '',
          ceremony: 'general',
          vendorName: '',
          vendorPhone: '',
        },
  });

  const estimatedWatch = useWatch({ control, name: 'estimatedAmount' });
  const remainingPreview = Math.max(0, (estimatedWatch || 0) - (hasAdvance ? advanceAmount : 0));

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          payload: {
            categoryId: values.categoryId,
            title: values.title,
            description: values.description || undefined,
            estimatedAmount: values.estimatedAmount,
            dueDate: values.dueDate || undefined,
            ceremony: values.ceremony as CeremonyTag,
            vendorName: values.vendorName || undefined,
            vendorPhone: values.vendorPhone || undefined,
          },
        });
        showToast(`Updated "${values.title}".`);
      } else {
        await createExpense.mutateAsync({
          categoryId: values.categoryId,
          title: values.title,
          description: values.description || undefined,
          estimatedAmount: values.estimatedAmount,
          dueDate: values.dueDate || undefined,
          ceremony: values.ceremony as CeremonyTag,
          vendorName: values.vendorName || undefined,
          vendorPhone: values.vendorPhone || undefined,
          advancePayment:
            hasAdvance && advanceAmount > 0
              ? {
                  amount: advanceAmount,
                  paidDate: advanceDate,
                  label:
                    advanceAmount >= values.estimatedAmount
                      ? 'Full Settlement'
                      : 'Advance Deposit',
                  method: advanceMethod,
                  paidBy: advancePaidBy,
                }
              : undefined,
        });
        showToast(`Added "${values.title}".`);
      }
      onClose();
    } catch {
      showToast('Could not save expense. Please try again.', 'terracotta');
    }
  };

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={editingExpense ? 'Edit Expense' : 'Add Expense Item'}
      subtitle="Log total cost, optional initial advance, and vendor details."
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            disabled={categories.length === 0}
            onClick={handleSubmit(onSubmit)}
          >
            {editingExpense ? 'Save Changes' : 'Save Expense'}
          </Button>
        </div>
      }
    >
      {categories.length === 0 ? (
        <p className="text-sm text-botanical-terracotta">
          Please create a budget category first before adding expenses.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!defaultCategoryId || editingExpense ? (
            <Select
              label="Category"
              error={errors.categoryId?.message}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              {...register('categoryId')}
            />
          ) : null}

          <Input
            label="Expense Title"
            placeholder="e.g., Main Banquet & Buffet or Dining Area Lighting"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="expense-description"
              className="block text-sm font-medium text-botanical-text-secondary"
            >
              Description / Inclusions (optional)
            </label>
            <textarea
              id="expense-description"
              rows={2}
              placeholder="Deliverables, plate count, lighting zones..."
              className="w-full rounded-lg border border-botanical-beige bg-botanical-white px-3.5 py-2 text-base sm:text-sm text-botanical-text placeholder:text-botanical-disabled focus:outline-none focus:ring-2 focus:ring-botanical-forest/20 focus:border-botanical-forest"
              {...register('description')}
            />
          </div>

          <Controller
            name="estimatedAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Total Estimated Amount"
                value={field.value}
                onChange={field.onChange}
                error={errors.estimatedAmount?.message}
                placeholder="2,00,000"
                helperText={field.value > 0 ? formatINR(field.value) : undefined}
              />
            )}
          />

          {!editingExpense ? (
            <div className="rounded-xl border border-botanical-beige bg-botanical-ivory/50 p-4 space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-botanical-text-secondary">
                    Advance Paid Now?
                  </span>
                  <p className="text-xs text-botanical-muted">
                    Log an initial booking advance and auto-compute upcoming balance.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasAdvance}
                  onChange={(e) => setHasAdvance(e.target.checked)}
                  className="h-4 w-4 rounded border-botanical-beige accent-botanical-forest cursor-pointer"
                />
              </label>

              {hasAdvance ? (
                <div className="space-y-3 pt-2 border-t border-botanical-taupe/70">
                  <CurrencyInput
                    label="Advance Paid Amount"
                    value={advanceAmount}
                    onChange={setAdvanceAmount}
                    placeholder="50,000"
                    helperText={`Remaining upcoming balance: ${formatINR(remainingPreview)}`}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Input
                      type="date"
                      label="Paid Date"
                      value={advanceDate}
                      onChange={(e) => setAdvanceDate(e.target.value)}
                    />
                    <Select
                      label="Mode"
                      value={advanceMethod}
                      onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                      options={PAYMENT_METHOD_OPTIONS}
                    />
                    <Select
                      label="Paid By"
                      value={advancePaidBy}
                      onChange={(e) => setAdvancePaidBy(e.target.value as ContributorSide)}
                      options={CONTRIBUTOR_SIDE_OPTIONS}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <Input
            type="date"
            label="Upcoming Payment Due Date (optional)"
            {...register('dueDate')}
          />

          <Accordion
            title="More Details"
            subtitle="Ceremony tag, vendor name & contact"
            badge="Optional"
            defaultOpen={Boolean(
              editingExpense?.vendorName ||
                editingExpense?.vendorPhone ||
                (editingExpense?.ceremony && editingExpense.ceremony !== 'general'),
            )}
          >
            <Select
              label="Ceremony / Event Tag"
              options={CEREMONY_OPTIONS}
              {...register('ceremony')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Vendor Name"
                placeholder="e.g., Maharaja Kitchens"
                {...register('vendorName')}
              />
              <Input
                type="tel"
                label="Vendor Phone"
                placeholder="+91 98201 44120"
                {...register('vendorPhone')}
              />
            </div>
          </Accordion>
        </form>
      )}
    </ResponsiveSheet>
  );
}

export function ExpenseFormSheet({
  open,
  onClose,
  defaultCategoryId,
  editingExpense = null,
}: ExpenseFormSheetProps) {
  const { data: categories = [] } = useCategories();
  if (!open) return null;

  return (
    <ExpenseFormSheetInner
      key={`${editingExpense?.id ?? 'new'}-${defaultCategoryId ?? 'global'}`}
      onClose={onClose}
      defaultCategoryId={defaultCategoryId}
      editingExpense={editingExpense}
      categories={categories}
    />
  );
}
