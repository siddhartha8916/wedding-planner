import { type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { WeddingProfile } from '../../types/wedding.ts';
import { MobileBottomNav } from './MobileBottomNav.tsx';
import { MobileHeader } from './MobileHeader.tsx';
import { Sidebar } from './Sidebar.tsx';

export interface AppShellProps {
  profile: WeddingProfile;
  onQuickAddExpense: () => void;
  children: ReactNode;
}

function getMobileTitle(pathname: string): string {
  if (pathname === '/') return 'Overview';
  if (pathname.startsWith('/categories/')) return 'Category Ledger';
  if (pathname.startsWith('/categories')) return 'Categories';
  if (pathname.startsWith('/upcoming')) return 'Upcoming Dues';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Bandhan';
}

export function AppShell({ profile, onQuickAddExpense, children }: AppShellProps) {
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const location = useLocation();
  const mobileTitle = getMobileTitle(location.pathname);

  return (
    <div className="min-h-dvh bg-botanical-cream text-botanical-text">
      <Sidebar
        profile={profile}
        onQuickAddExpense={onQuickAddExpense}
        tabletExpanded={tabletExpanded}
        onToggleTabletExpanded={() => setTabletExpanded((prev) => !prev)}
      />

      <MobileHeader
        profile={profile}
        title={mobileTitle}
        onQuickAddExpense={onQuickAddExpense}
      />

      <main className="md:pl-[72px] lg:pl-60 print-full-width">
        <div className="px-4 py-5 pb-24 sm:px-5 sm:py-6 sm:pb-24 md:px-6 md:py-8 md:pb-10 lg:px-8 lg:py-9 lg:max-w-5xl xl:px-10 xl:py-10 xl:max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
