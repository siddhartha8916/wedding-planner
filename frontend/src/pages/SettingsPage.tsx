import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, LogOut, Printer, RotateCcw } from 'lucide-react';
// import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { useDashboardSummary } from '../hooks/useDashboardSummary.ts';
import { useToast } from '../hooks/useToast.ts';
import { useResetWedding, useSaveWedding } from '../hooks/useWedding.ts';
// import { useSeedDemo } from '../hooks/useWedding.ts';
import { formatINR } from '../utils/currency.ts';
import { downloadCSVFile, generateExpensesCSV } from '../utils/export.ts';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { CurrencyInput } from '../components/ui/CurrencyInput.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Select } from '../components/ui/Select.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';

const profileSchema = z.object({
  brideName: z.string().trim().min(1, "Bride's name is required"),
  groomName: z.string().trim().min(1, "Groom's name is required"),
  weddingDate: z.string().min(1, 'Wedding date is required'),
  totalBudget: z.number().min(0),
  contingencyPercent: z.number().min(0).max(50),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SettingsPage() {
  const { logout } = useAuth();
  const { profile, categories, expenses, summary, isLoading } = useDashboardSummary();
  const saveWedding = useSaveWedding();
  // const seedDemo = useSeedDemo();
  const resetWedding = useResetWedding();
  const { showToast } = useToast();

  const [resetModalOpen, setResetModalOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      brideName: profile?.brideName ?? '',
      groomName: profile?.groomName ?? '',
      weddingDate: profile?.weddingDate ?? '',
      totalBudget: profile?.totalBudget ?? 2500000,
      contingencyPercent: profile?.contingencyPercent ?? 10,
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      brideName: profile.brideName,
      groomName: profile.groomName,
      weddingDate: profile.weddingDate,
      totalBudget: profile.totalBudget,
      contingencyPercent: profile.contingencyPercent,
    });
  }, [profile, reset]);

  if (isLoading || !profile || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await saveWedding.mutateAsync({
        brideName: values.brideName,
        groomName: values.groomName,
        weddingDate: values.weddingDate,
        totalBudget: values.totalBudget,
        contingencyPercent: values.contingencyPercent,
        isOnboarded: true,
      });
      showToast('Wedding profile updated.');
    } catch {
      showToast('Could not save profile.', 'terracotta');
    }
  };

  const handleDownloadCSV = () => {
    const csv = generateExpensesCSV(profile, categories, expenses);
    const slug = `${profile.brideName}-${profile.groomName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    downloadCSVFile(`${slug}-wedding-budget.csv`, csv);
    showToast('CSV report downloaded.');
  };

  const handlePrintSummary = () => {
    window.print();
  };

  /* Sample data loading disabled in UI
  const handleLoadDemo = async () => {
    try {
      await seedDemo.mutateAsync();
      showToast('Sample Indian wedding data loaded.');
    } catch {
      showToast('Could not load sample data.', 'terracotta');
    }
  };
  */

  const handleConfirmReset = async () => {
    try {
      await resetWedding.mutateAsync();
      setResetModalOpen(false);
      showToast('Wedding workspace reset.');
    } catch {
      showToast('Could not reset workspace.', 'terracotta');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wedding Settings"
        subtitle="Manage couple details, export family reports, reset workspace data, or sign out."
      />

      <Card padding="lg" className="no-print">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-botanical-text">
            Couple &amp; Budget Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bride's Name"
              error={errors.brideName?.message}
              {...register('brideName')}
            />
            <Input
              label="Groom's Name"
              error={errors.groomName?.message}
              {...register('groomName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Wedding Date"
              error={errors.weddingDate?.message}
              {...register('weddingDate')}
            />

            <Controller
              name="totalBudget"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label="Total Budget Limit"
                  value={field.value}
                  onChange={field.onChange}
                  helperText={formatINR(field.value)}
                />
              )}
            />

            <Controller
              name="contingencyPercent"
              control={control}
              render={({ field }) => (
                <Select
                  label="Contingency Reserve"
                  value={String(field.value)}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  options={[
                    { value: '0', label: '0% (No buffer)' },
                    { value: '5', label: '5% buffer' },
                    { value: '10', label: '10% buffer' },
                    { value: '15', label: '15% buffer' },
                  ]}
                />
              )}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <Card padding="md" className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-botanical-text">
            Export &amp; Family Share
          </h2>
          <p className="text-xs text-botanical-muted">
            Save an offline spreadsheet of all line items, ceremony tags, vendor numbers, and
            installment balances, or print a clean PDF ledger.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" strokeWidth={1.5} />}
              onClick={handleDownloadCSV}
            >
              Download CSV Report
            </Button>
            <Button
              variant="secondary"
              icon={<Printer className="w-4 h-4" strokeWidth={1.5} />}
              onClick={handlePrintSummary}
            >
              Print / Save PDF
            </Button>
          </div>
        </Card>

        <Card padding="md" surface="ivory" className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-botanical-text">
            Workspace &amp; Account
          </h2>
          <p className="text-xs text-botanical-muted">
            Reset your wedding budget data to plan a fresh celebration, or sign out of your ledger
            session.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {/* Sample data loading disabled in UI
            <Button
              variant="secondary"
              loading={seedDemo.isPending}
              icon={<Sparkles className="w-4 h-4" strokeWidth={1.5} />}
              onClick={handleLoadDemo}
            >
              Load Sample Indian Wedding
            </Button>
            */}
            <Button
              variant="danger"
              icon={<RotateCcw className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => setResetModalOpen(true)}
            >
              Reset Data
            </Button>
            <Button
              variant="secondary"
              icon={<LogOut className="w-4 h-4" strokeWidth={1.5} />}
              onClick={logout}
            >
              Log Out
            </Button>
          </div>
        </Card>
      </div>

      {/* Printable summary table (visible in print, subtle preview on screen) */}
      <Card padding="md" className="print-break-avoid space-y-3">
        <div className="flex items-center justify-between border-b border-botanical-taupe pb-2">
          <h2 className="font-serif text-xl font-semibold text-botanical-text">
            {profile.brideName} &amp; {profile.groomName} — Ledger Summary
          </h2>
          <span className="text-xs text-botanical-muted tabular-nums">
            Total Budget: {formatINR(summary.totalBudget)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-botanical-taupe text-botanical-muted">
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 px-3 font-medium text-right">Items</th>
                <th className="py-2 px-3 font-medium text-right">Estimated</th>
                <th className="py-2 px-3 font-medium text-right">Paid</th>
                <th className="py-2 pl-3 font-medium text-right">Upcoming</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-botanical-taupe/60">
              {summary.categoryMetrics.map((m) => (
                <tr key={m.category.id}>
                  <td className="py-2 pr-3 font-medium text-botanical-text">{m.category.name}</td>
                  <td className="py-2 px-3 text-right text-botanical-muted">{m.expenseCount}</td>
                  <td className="py-2 px-3 text-right">{formatINR(m.totalEstimated)}</td>
                  <td className="py-2 px-3 text-right text-botanical-forest">
                    {formatINR(m.totalPaid)}
                  </td>
                  <td className="py-2 pl-3 text-right">{formatINR(m.totalUpcoming)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-botanical-beige font-semibold text-botanical-text">
                <td className="py-2.5 pr-3">Total</td>
                <td className="py-2.5 px-3 text-right">{expenses.length}</td>
                <td className="py-2.5 px-3 text-right">{formatINR(summary.totalEstimated)}</td>
                <td className="py-2.5 px-3 text-right text-botanical-forest">
                  {formatINR(summary.totalPaid)}
                </td>
                <td className="py-2.5 pl-3 text-right">{formatINR(summary.totalUpcoming)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Wedding Data"
        subtitle="Start fresh from Onboarding"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={resetWedding.isPending}
              onClick={handleConfirmReset}
            >
              Confirm Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-botanical-text-tertiary">
          This clears all saved categories, expenses, and payments for this wedding and returns you
          to the Onboarding screen so a new wedding can be planned.
        </p>
      </Modal>
    </div>
  );
}
