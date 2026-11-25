import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CEREMONY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../config/presets.ts';
import { useCategories } from '../../hooks/useCategories.ts';
import { useExpenseMutations } from '../../hooks/useExpenses.ts';
import { useToast } from '../../hooks/useToast.ts';
import type {
  Category,
  CeremonyTag,
  Expense,
  PaymentMethod,
} from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { getTodayIso } from '../../utils/date.ts';
import {
  buildCreateExpensePayload,
  type ExpenseEntryMode,
} from '../../utils/expenseForm.ts';
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
  estimatedAmount: z.number().min(1, 'Enter an amount greater than ₹0'),
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

  const [entryMode, setEntryMode] = useState<ExpenseEntryMode>('planned');
  const [hasAdvance, setHasAdvance] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(() => getTodayIso());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const isUpfront = !editingExpense && entryMode === 'upfront';

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
            description: values.description ?? '',
            estimatedAmount: values.estimatedAmount,
            dueDate: values.dueDate ?? '',
            ceremony: values.ceremony as CeremonyTag,
            vendorName: values.vendorName ?? '',
            vendorPhone: values.vendorPhone ?? '',
          },
        });
        showToast(`Updated "${values.title}".`);
      } else {
        await createExpense.mutateAsync(
          buildCreateExpensePayload({
            mode: entryMode,
            values: {
              ...values,
              ceremony: values.ceremony as CeremonyTag,
            },
            hasAdvance,
            advanceAmount,
            paymentDate,
            paymentMethod,
          }),
        );
        showToast(`Added "${values.title}".`);
      }
      onClose();
    } catch {
      showToast('Could not save expense. Please try again.', 'terracotta');
    }
  };

  const subtitle = editingExpense
    ? 'Update expense details, estimated cost, and due date.'
    : isUpfront
      ? 'Log a purchase or expense you already paid in full.'
      : 'Log estimated cost, optional initial advance, and vendor details.';

  return (
    <ResponsiveSheet
      open
      onClose={onClose}
      title={editingExpense ? 'Edit Expense' : 'Add Expense Item'}
      subtitle={subtitle}
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
          {!editingExpense ? (
            <div
              role="tablist"
              aria-label="Expense entry mode"
              className="grid grid-cols-2 rounded-lg border border-botanical-beige bg-botanical-ivory/60 p-0.5"
            >
              {[
                { id: 'planned' as const, label: 'Planned / Booking' },
                { id: 'upfront' as const, label: 'Paid Upfront' },
              ].map((tab) => {
                const active = entryMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setEntryMode(tab.id)}
                    className={[
                      'min-h-9.5 px-3 rounded-md text-xs font-medium cursor-pointer transition-colors',
                      active
                        ? 'bg-botanical-white text-botanical-text border border-botanical-beige'
                        : 'text-botanical-muted hover:text-botanical-text',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : null}

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
            placeholder={
              isUpfront
                ? 'e.g., Bridal Lehenga, Return Gifts, Pooja Samagri'
                : 'e.g., Main Banquet & Buffet or Dining Area Lighting'
            }
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
              placeholder={
                isUpfront
                  ? 'Item details, shop name, or receipt notes...'
                  : 'Deliverables, plate count, lighting zones...'
              }
              className="w-full rounded-lg border border-botanical-beige bg-botanical-white px-3.5 py-2 text-base sm:text-sm text-botanical-text placeholder:text-botanical-disabled focus:outline-none focus:ring-2 focus:ring-botanical-forest/20 focus:border-botanical-forest"
              {...register('description')}
            />
          </div>

          <Controller
            name="estimatedAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={isUpfront ? 'Amount Paid' : 'Total Estimated Amount'}
                value={field.value}
                onChange={field.onChange}
                error={errors.estimatedAmount?.message}
                placeholder={isUpfront ? '25,000' : '2,00,000'}
                helperText={
                  field.value > 0
                    ? isUpfront
                      ? `${formatINR(field.value)} · Marked as Paid in Full`
                      : formatINR(field.value)
                    : undefined
                }
              />
            )}
          />

          {!editingExpense ? (
            isUpfront ? (
              <div className="rounded-xl border border-botanical-beige bg-botanical-ivory/50 p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-botanical-text-secondary">
                    Paid in Full Upfront
                  </span>
                  <p className="text-xs text-botanical-muted">
                    Recorded as a completed payment with no upcoming balance or due date.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-botanical-taupe/70">
                  <Input
                    type="date"
                    label="Paid Date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                  <Select
                    label="Mode"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    options={PAYMENT_METHOD_OPTIONS}
                  />
                </div>
              </div>
            ) : (
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Input
                        type="date"
                        label="Paid Date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                      <Select
                        label="Mode"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        options={PAYMENT_METHOD_OPTIONS}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )
          ) : null}

          {!isUpfront ? (
            <Input
              type="date"
              label="Upcoming Payment Due Date (optional)"
              {...register('dueDate')}
            />
          ) : null}

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
