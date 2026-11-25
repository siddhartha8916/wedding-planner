import { NavLink } from 'react-router-dom';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.ts';
import type { WeddingProfile } from '../../types/wedding.ts';
import { getDaysRemaining } from '../../utils/date.ts';
import { Button } from '../ui/Button.tsx';

export interface SidebarProps {
  profile: WeddingProfile;
  onQuickAddExpense: () => void;
  tabletExpanded: boolean;
  onToggleTabletExpanded: () => void;
}

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/categories', label: 'Categories', icon: FolderKanban, end: false },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarClock, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function Sidebar({
  profile,
  onQuickAddExpense,
  tabletExpanded,
  onToggleTabletExpanded,
}: SidebarProps) {
  const { logout } = useAuth();
  const daysLeft = getDaysRemaining(profile.weddingDate);
  const brideInitial = profile.brideName.trim().charAt(0).toUpperCase() || 'B';
  const groomInitial = profile.groomName.trim().charAt(0).toUpperCase() || 'G';

  return (
    <>
      {tabletExpanded ? (
        <div
          className="fixed inset-0 z-30 bg-botanical-text/20 lg:hidden"
          onClick={onToggleTabletExpanded}
        />
      ) : null}

      <aside
        aria-label="Primary navigation"
        className={[
          'no-print hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-botanical-ivory border-r border-botanical-beige transition-all duration-200',
          tabletExpanded ? 'w-60' : 'md:w-18 lg:w-60',
        ].join(' ')}
      >
        <div className="p-4 border-b border-botanical-taupe flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-botanical-white border border-botanical-beige flex items-center justify-center shrink-0 font-serif text-base font-semibold text-botanical-forest">
              {brideInitial}&amp;{groomInitial}
            </div>
            <div className={['min-w-0', tabletExpanded ? 'block' : 'md:hidden lg:block'].join(' ')}>
              <p className="font-serif text-lg font-semibold text-botanical-text truncate leading-tight">
                {profile.brideName} &amp; {profile.groomName}
              </p>
              <p className="text-xs text-botanical-muted tabular-nums mt-0.5">
                {daysLeft > 0
                  ? `${daysLeft} days to go`
                  : daysLeft === 0
                    ? 'Wedding day!'
                    : 'Celebrated'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTabletExpanded}
            aria-label={tabletExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="lg:hidden min-w-9 min-h-9 rounded-lg flex items-center justify-center text-botanical-muted hover:text-botanical-text hover:bg-botanical-surface cursor-pointer"
          >
            {tabletExpanded ? (
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => {
                  if (tabletExpanded) onToggleTabletExpanded();
                }}
                title={item.label}
                className={({ isActive }) =>
                  [
                    'min-h-11 rounded-lg flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
                    tabletExpanded ? 'justify-start' : 'md:justify-center lg:justify-start',
                    isActive
                      ? 'bg-botanical-forest text-botanical-white'
                      : 'text-botanical-text-secondary hover:bg-botanical-surface/80',
                  ].join(' ')
                }
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                <span className={tabletExpanded ? 'block' : 'md:hidden lg:block'}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-botanical-taupe space-y-2">
          {tabletExpanded ? (
            <>
              <Button
                variant="primary"
                fullWidth
                icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
                onClick={onQuickAddExpense}
              >
                Add Expense
              </Button>
              <Button
                variant="ghost"
                fullWidth
                icon={<LogOut className="w-4 h-4" strokeWidth={1.5} />}
                onClick={logout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onQuickAddExpense}
                title="Add Expense"
                aria-label="Add Expense"
                className="hidden md:flex lg:hidden w-full min-h-11 rounded-lg bg-botanical-forest text-botanical-white items-center justify-center hover:bg-botanical-forest/90 cursor-pointer"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Log Out"
                aria-label="Log Out"
                className="hidden md:flex lg:hidden w-full min-h-11 rounded-lg text-botanical-text-secondary hover:bg-botanical-surface/80 items-center justify-center cursor-pointer"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <div className="hidden lg:block space-y-2">
                <Button
                  variant="primary"
                  fullWidth
                  icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
                  onClick={onQuickAddExpense}
                >
                  Add Expense
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  icon={<LogOut className="w-4 h-4" strokeWidth={1.5} />}
                  onClick={logout}
                >
                  Log Out
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
