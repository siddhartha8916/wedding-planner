import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles } from 'lucide-react';
import { STARTER_CATEGORIES, type StarterCategoryPreset } from '../config/presets.ts';
import { useCategoryMutations } from '../hooks/useCategories.ts';
import { useToast } from '../hooks/useToast.ts';
import { useSaveWedding, useSeedDemo } from '../hooks/useWedding.ts';
import { formatINR } from '../utils/currency.ts';
import { formatLongDate, getDaysRemaining } from '../utils/date.ts';
import { CategoryIcon } from '../components/categories/CategoryIcon.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { CurrencyInput } from '../components/ui/CurrencyInput.tsx';
import { Input } from '../components/ui/Input.tsx';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const saveWedding = useSaveWedding();
  const seedDemo = useSeedDemo();
  const { createCategory } = useCategoryMutations();

  const [step, setStep] = useState<1 | 2>(1);
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState(() => `${new Date().getFullYear() + 1}-02-14`);
  const [totalBudget, setTotalBudget] = useState<number>(2500000);
  const [useContingency, setUseContingency] = useState<boolean>(true);
  const [step1Error, setStep1Error] = useState<string>('');

  const [selectedCategories, setSelectedCategories] = useState<StarterCategoryPreset[]>(() =>
    STARTER_CATEGORIES.filter((c) => c.defaultSelected),
  );
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysToGo = getDaysRemaining(weddingDate);
  const formattedWeddingDate = formatLongDate(weddingDate);
  const contingencyAmount = useContingency ? Math.round(totalBudget * 0.1) : 0;

  const handleNextStep = () => {
    if (!brideName.trim() || !groomName.trim()) {
      setStep1Error("Please enter both the bride's and groom's names.");
      return;
    }
    if (!weddingDate) {
      setStep1Error('Please pick a wedding date.');
      return;
    }
    if (totalBudget <= 0) {
      setStep1Error('Please enter your target wedding budget.');
      return;
    }
    setStep1Error('');
    setStep(2);
  };

  const toggleCategory = (preset: StarterCategoryPreset) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((c) => c.name === preset.name);
      return exists ? prev.filter((c) => c.name !== preset.name) : [...prev, preset];
    });
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryName.trim();
    if (!trimmed) return;
    if (selectedCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCustomCategoryName('');
      return;
    }
    setSelectedCategories((prev) => [
      ...prev,
      {
        name: trimmed,
        icon: 'wallet',
        description: '',
        defaultSelected: true,
      },
    ]);
    setCustomCategoryName('');
  };

  const handleComplete = async (blankWorkspace: boolean) => {
    setIsSubmitting(true);
    try {
      await saveWedding.mutateAsync({
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        weddingDate,
        totalBudget,
        contingencyPercent: useContingency ? 10 : 0,
        isOnboarded: true,
      });

      if (!blankWorkspace) {
        for (const cat of selectedCategories) {
          await createCategory.mutateAsync({
            name: cat.name,
            icon: cat.icon,
            description: cat.description || undefined,
          });
        }
      }

      showToast('Your wedding budget workspace is ready.');
      navigate('/', { replace: true });
    } catch {
      showToast('Could not save your wedding setup. Please try again.', 'terracotta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExploreDemo = async () => {
    try {
      await seedDemo.mutateAsync();
      showToast('Sample Indian wedding loaded.');
      navigate('/', { replace: true });
    } catch {
      showToast('Could not load sample wedding data.', 'terracotta');
    }
  };

  return (
    <div className="min-h-dvh bg-botanical-cream px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-5">
        <div className="text-center space-y-1.5">
          <p className="text-xs uppercase tracking-[0.2em] text-botanical-muted font-medium">
            Bandhan · Wedding Ledger
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-botanical-text">
            {step === 1 ? 'Begin Your Wedding Budget' : 'Choose Starter Categories'}
          </h1>
          <p className="text-sm text-botanical-muted">
            {step === 1
              ? 'Step 1 of 2 — Set your celebration details and target budget.'
              : 'Step 2 of 2 — Pick the areas you want to track right away.'}
          </p>
        </div>

        <Card padding="lg" className="space-y-6">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bride's Name"
                  placeholder="e.g., Aanya"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  required
                />
                <Input
                  label="Groom's Name"
                  placeholder="e.g., Rohan"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Input
                  type="date"
                  label="Wedding Date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  required
                />
                {formattedWeddingDate ? (
                  <p className="text-xs text-botanical-sage-dark tabular-nums">
                    {formattedWeddingDate} ·{' '}
                    {daysToGo > 0
                      ? `${daysToGo} days to go`
                      : daysToGo === 0
                        ? 'Today!'
                        : `${Math.abs(daysToGo)} days ago`}
                  </p>
                ) : null}
              </div>

              <CurrencyInput
                label="Total Wedding Budget"
                value={totalBudget}
                onChange={setTotalBudget}
                placeholder="25,00,000"
                helperText={
                  totalBudget > 0
                    ? `Formatted target: ${formatINR(totalBudget)}`
                    : 'Enter your total estimated celebration budget'
                }
                required
              />

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-botanical-beige bg-botanical-ivory/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useContingency}
                  onChange={(e) => setUseContingency(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-botanical-beige accent-botanical-forest cursor-pointer"
                />
                <div className="text-sm">
                  <p className="font-medium text-botanical-text-secondary">
                    Reserve 10% contingency buffer
                  </p>
                  <p className="text-xs text-botanical-muted mt-0.5 tabular-nums">
                    {useContingency && totalBudget > 0
                      ? `Sets aside ${formatINR(contingencyAmount)} for last-minute rituals & extras (safe ceiling: ${formatINR(totalBudget - contingencyAmount)}).`
                      : 'Keep a quiet emergency cushion visible on your master budget bar.'}
                  </p>
                </div>
              </label>

              {step1Error ? (
                <p className="text-xs text-botanical-terracotta font-medium">{step1Error}</p>
              ) : null}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleNextStep}
                icon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
              >
                Continue to Categories
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {STARTER_CATEGORIES.map((preset) => {
                  const selected = selectedCategories.some((c) => c.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => toggleCategory(preset)}
                      className={[
                        'min-h-[44px] px-3.5 py-2 rounded-xl border text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer',
                        selected
                          ? 'bg-botanical-forest text-botanical-white border-botanical-forest'
                          : 'bg-botanical-white text-botanical-text-secondary border-botanical-beige hover:bg-botanical-surface/70',
                      ].join(' ')}
                    >
                      <CategoryIcon name={preset.icon} className="w-4 h-4" />
                      <span>{preset.name}</span>
                      {selected ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : null}
                    </button>
                  );
                })}
                {selectedCategories
                  .filter((c) => !STARTER_CATEGORIES.some((p) => p.name === c.name))
                  .map((custom) => (
                    <button
                      key={custom.name}
                      type="button"
                      onClick={() => toggleCategory(custom)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border bg-botanical-forest text-botanical-white border-botanical-forest text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
                    >
                      <CategoryIcon name={custom.icon} className="w-4 h-4" />
                      <span>{custom.name}</span>
                      <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add custom category (e.g., Pandit & Rituals)"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleAddCustomCategory}
                  icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-botanical-taupe">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}
                  >
                    Back
                  </Button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleComplete(true)}
                    className="text-xs font-medium text-botanical-muted hover:text-botanical-text underline underline-offset-4 cursor-pointer min-h-[44px] px-2"
                  >
                    Start with blank workspace
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  onClick={() => handleComplete(false)}
                >
                  Create Workspace ({selectedCategories.length})
                </Button>
              </div>
            </>
          )}
        </Card>

        <div className="text-center">
          <button
            type="button"
            disabled={seedDemo.isPending}
            onClick={handleExploreDemo}
            className="inline-flex items-center gap-2 text-sm font-medium text-botanical-forest hover:text-botanical-forest/80 underline underline-offset-4 cursor-pointer min-h-[44px] px-3"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            <span>
              {seedDemo.isPending
                ? 'Loading sample wedding...'
                : 'Explore with sample wedding data'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
