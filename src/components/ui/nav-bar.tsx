import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useConvexAuth } from '@convex-dev/react-query';
import { Loader2, Menu, X } from 'lucide-react';
import { cn } from '@/utils/misc';
import { buttonVariants } from '@/components/ui/button';
import siteConfig from '~/site.config';
import { Route as DashboardRoute } from '@/routes/_app/_auth/dashboard/_layout.index';
import { Route as AuthLoginRoute } from '@/routes/_app/login/_layout.index';
import { Logo } from '@/components/ui/logo';

export interface NavBarProps {
  variant?: 'transparent' | 'solid';
  showAuthCta?: boolean;
  className?: string;
  sticky?: boolean;
  maxWidth?: string; // container width utility
}

const NAV_LINKS: Array<{ label: string; href: string; external?: boolean }>= [
  { label: 'Overview', href: '#overview' },
  { label: 'Features', href: '#features' },
  { label: 'Galactic Map', href: '#galactic-map' },
];

export function NavBar({
  variant = 'transparent',
  showAuthCta = true,
  className,
  sticky = true,
  maxWidth = 'max-w-screen-xl',
}: NavBarProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [open, setOpen] = useState(false);

  const containerStyles = cn(
    'w-full mx-auto flex items-center justify-between gap-4 px-4 md:px-6',
    maxWidth
  );

  const baseStyles = cn(
    'top-0 z-50 w-full transition-colors',
    sticky && 'sticky',
    variant === 'transparent'
      ? 'bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/30 border-b border-white/5'
      : 'bg-background/80 backdrop-blur border-b border-border',
    className
  );

  return (
    <header className={baseStyles}>
      <nav aria-label="Main" className={containerStyles}>
        <div className="flex items-center gap-3 h-12">
          <Link to="/" className="flex h-10 items-center gap-2 font-semibold tracking-tight">
            <Logo />
            <span className="hidden sm:inline text-sm font-medium text-primary/70">{siteConfig.siteTitle}</span>
          </Link>
        </div>
        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary/70 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-primary/70 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            )
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {showAuthCta && (
            <Link
              to={isAuthenticated ? DashboardRoute.fullPath : AuthLoginRoute.fullPath}
              className={cn(buttonVariants({ size: 'sm' }), 'min-w-[110px]')}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {!isLoading && isAuthenticated && 'Dashboard'}
              {!isLoading && !isAuthenticated && 'Play Now'}
            </Link>
          )}
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-background/60 backdrop-blur text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {/* Mobile panel */}
      <div
        className={cn(
          'lg:hidden px-6 pb-6 pt-2 space-y-4 origin-top animate-in fade-in-50 slide-in-from-top-4',
          !open && 'hidden'
        )}
      >
        <div className="flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary/80 hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ) : (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-primary/80 hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            )
          ))}
          {showAuthCta && (
            <Link
              to={isAuthenticated ? DashboardRoute.fullPath : AuthLoginRoute.fullPath}
              className={cn(buttonVariants({ size: 'sm' }), 'w-full justify-center')}
              disabled={isLoading}
              onClick={() => setOpen(false)}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {!isLoading && isAuthenticated && 'Dashboard'}
              {!isLoading && !isAuthenticated && 'Play Now'}
            </Link>
          )}
        </div>
      </div>
      {/* Decorative subtle starfield overlay (optional) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(9,9,11,0.6),transparent_60%)]" />
      </div>
    </header>
  );
}
