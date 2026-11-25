import { NavLink } from 'react-router-dom';
import { CalendarClock, FolderKanban, LayoutDashboard, Settings } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/categories', label: 'Categories', icon: FolderKanban, end: false },
  { to: '/upcoming', label: 'Upcoming', icon: CalendarClock, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="no-print md:hidden fixed inset-x-0 bottom-0 z-30 bg-botanical-ivory border-t border-botanical-beige safe-pb"
    >
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-botanical-forest' : 'text-botanical-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      'px-3 py-1 rounded-full transition-colors',
                      isActive ? 'bg-botanical-forest/12' : '',
                    ].join(' ')}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </span>
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
