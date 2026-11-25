import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExpenseFormSheet } from './components/expenses/ExpenseFormSheet.tsx';
import { AppShell } from './components/layout/AppShell.tsx';
import { Skeleton } from './components/ui/Skeleton.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { useWedding } from './hooks/useWedding.ts';
import { CategoriesPage } from './pages/CategoriesPage.tsx';
import { CategoryDetailPage } from './pages/CategoryDetailPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { UpcomingPaymentsPage } from './pages/UpcomingPaymentsPage.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { data: profile, isLoading } = useWedding();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  if (isLoading || !profile) {
    return (
      <div className="min-h-dvh bg-botanical-cream p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton variant="card" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </div>
    );
  }

  if (!profile.isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <AppShell profile={profile} onQuickAddExpense={() => setQuickAddOpen(true)}>
        <Routes>
          <Route
            path="/"
            element={<DashboardPage onOpenAddExpense={() => setQuickAddOpen(true)} />}
          />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
          <Route path="/upcoming" element={<UpcomingPaymentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      <ExpenseFormSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
