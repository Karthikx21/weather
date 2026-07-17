import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, BarChart2, Map as MapIcon, GitCompare, BrainCircuit, MessageSquare, AlertTriangle, Menu, X, Sun, Moon } from 'lucide-react';
import { LocationSearch } from '../LocationSearch';
import { useTheme } from 'next-themes';
import logoImg from '@/assets/logo.png';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/ml', label: 'Predictions', icon: BrainCircuit },
  { href: '/assistant', label: 'Assistant', icon: MessageSquare },
  { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col md:flex-row font-sans selection:bg-primary/30 overflow-hidden">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 min-h-[56px]">
        <Link href="/" className="flex items-center gap-2 min-h-[44px]">
          <img src={logoImg} alt="AERISYN" className="w-7 h-7 object-contain" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">AERISYN</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 text-foreground rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 text-foreground rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-card/95 backdrop-blur-xl border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-[100dvh] md:translate-x-0 md:w-64 md:shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar navigation"
      >
        {/* Sidebar Header */}
        <div className="p-5 hidden md:flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoImg} alt="AERISYN" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <div>
              <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent leading-none">AERISYN</div>
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">Weather Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Mobile sidebar close button row */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={logoImg} alt="AERISYN" className="w-7 h-7 object-contain" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">AERISYN</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 shrink-0">
          <LocationSearch />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] ${isActive ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_0_currentColor]' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                  <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_2px_rgba(6,182,212,0.6)]" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-border bg-card/80 backdrop-blur-xl safe-bottom">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span className="uppercase tracking-wider font-semibold">System</span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></div>
              Online
            </span>
          </div>
          <div className="hidden md:flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm font-medium">Theme</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth">
        {children}
      </main>
    </div>
  );
}
