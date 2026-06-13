import { useLocation, Link } from 'wouter';
import { Home, Library, Search, Settings } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home',     Icon: Home },
  { path: '/library', label: 'Library',  Icon: Library },
  { path: '/search',  label: 'Search',   Icon: Search },
  { path: '/settings',label: 'Settings', Icon: Settings },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border"
      style={{ background: 'var(--surface-container)' }}
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
        {tabs.map(({ path, label, Icon }) => {
          const isActive = path === '/' ? location === '/' : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center gap-1 flex-1 py-3"
              data-testid={`nav-${label.toLowerCase()}`}
            >
              {/* Indicator pill */}
              <div
                className={`relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-secondary' : ''
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-colors ${
                    isActive ? 'text-secondary-foreground' : 'text-muted-foreground'
                  }`}
                />
              </div>
              {/* Label */}
              <span
                className={`m3-label-medium transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
