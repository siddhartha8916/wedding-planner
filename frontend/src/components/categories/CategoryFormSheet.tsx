import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCategoryMutations } from '../../hooks/useCategories.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { Category } from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { Button } from '../ui/Button.tsx';
import { CurrencyInput } from '../ui/CurrencyInput.tsx';
import { Input } from '../ui/Input.tsx';
import { ResponsiveSheet } from '../ui/ResponsiveSheet.tsx';
import { CategoryIconPicker } from './CategoryIconPicker.tsx';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(60),
  description: z.string().max(180).optional(),
  icon: z.string().min(1),
  allocatedBudget: z.number().min(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategoryFormSheetProps {
  open: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
}

export function CategoryFormSheet({
  open,
  onClose,
  editingCategory = null,
}: CategoryFormSheetProps) {
  const { createCategory, updateCategory } = useCategoryMutations();
  const { showToast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'sparkles',
      allocatedBudget: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editingCategory) {
      reset({
        name: editingCategory.name,
        description: editingCategory.description ?? '',
        icon: editingCategory.icon,
        allocatedBudget: editingCategory.allocatedBudget ?? 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        icon: 'sparkles',
        allocatedBudget: 0,
      });
    }
  }, [open, editingCategory, reset]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          payload: {
            name: values.name,
            description: values.description ?? '',
            icon: values.icon,
            allocatedBudget: values.allocatedBudget > 0 ? values.allocatedBudget : 0,
          },
        });
        showToast(`Updated "${values.name}".`);
      } else {
        await createCategory.mutateAsync({
          name: values.name,
          description: values.description || undefined,
          icon: values.icon,
          allocatedBudget: values.allocatedBudget > 0 ? values.allocatedBudget : undefined,
        });
        showToast(`Created category "${values.name}".`);
      }
      onClose();
    } catch {
      showToast('Could not save category. Please try again.', 'terracotta');
    }
  };

  return (
    <ResponsiveSheet
      open={open}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : 'New Budget Category'}
      subtitle="Organize related line items like Catering, Decor, or Attire."
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Category Name"
          placeholder="e.g., Catering & Mithai"
          error={errors.name?.message}
          {...register('name')}
        />

        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <CategoryIconPicker value={field.value} onChange={field.onChange} />
          )}
        />

        <Controller
          name="allocatedBudget"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Optional Category Budget Cap"
              value={field.value}
              onChange={field.onChange}
              placeholder="5,00,000"
              helperText={
                field.value > 0
                  ? `Target limit: ${formatINR(field.value)}`
                  : 'Leave blank if you do not need a cap for this category.'
              }
            />
          )}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="category-notes"
            className="block text-sm font-medium text-botanical-text-secondary"
          >
            Short Note (optional)
          </label>
          <textarea
            id="category-notes"
            rows={2}
            placeholder="e.g., Includes main wedding banquet and mehendi sweets"
            className="w-full rounded-lg border border-botanical-beige bg-botanical-white px-3.5 py-2 text-base sm:text-sm text-botanical-text placeholder:text-botanical-disabled focus:outline-none focus:ring-2 focus:ring-botanical-forest/20 focus:border-botanical-forest"
            {...register('description')}
          />
        </div>
      </form>
    </ResponsiveSheet>
  );
}
