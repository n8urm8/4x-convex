import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-util';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Route as DashboardRoute } from '@/routes/_app/_auth/dashboard/_layout.index';
import { Route as BillingSettingsRoute } from '@/routes/_app/_auth/dashboard/_layout.settings.billing';
import { Route as SettingsRoute } from '@/routes/_app/_auth/dashboard/_layout.settings.index';
import { cn, useSignOut } from '@/utils/misc';
import { PLANS } from '@cvx/schema';
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { LogOut, Settings } from 'lucide-react';
import { User } from '~/types';

export function Navigation({
  user,
  showSecondaryNav = false
}: {
  user: User;
  showSecondaryNav?: boolean;
}) {
  const signOut = useSignOut();
  const matchRoute = useMatchRoute();
  const navigate = useNavigate();
  const isDashboardPath = matchRoute({ to: DashboardRoute.fullPath });
  const isSettingsPath = matchRoute({ to: SettingsRoute.fullPath });
  const isBillingPath = matchRoute({ to: BillingSettingsRoute.fullPath });
  const isMapPath = matchRoute({ to: '/game/map' });
  const isBasesPath = matchRoute({ to: '/game/bases' });

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 flex w-full flex-col border-b border-border bg-card px-6">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between py-3">
        <div className="flex h-10 items-center gap-4">
          <Link
            to={DashboardRoute.fullPath}
            className="flex h-10 items-center gap-1"
          >
            <Logo />
          </Link>
          <div className="h-6 w-px bg-border" />
          <Link
            to="/game/map"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-primary/80',
              isMapPath && 'font-semibold text-primary'
            )}
          >
            Map
          </Link>
          <Link
            to="/game/bases"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-primary/80',
              isBasesPath && 'font-semibold text-primary'
            )}
          >
            Bases
          </Link>
        </div>

        <div className="flex h-10 items-center gap-3">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                {user.avatarUrl ? (
                  <img
                    className="min-h-8 min-w-8 rounded-full object-cover"
                    alt={user.username ?? user.email}
                    src={user.avatarUrl}
                  />
                ) : (
                  <span className="min-h-8 min-w-8 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="fixed -right-4 min-w-56 bg-card p-2"
            >
              <DropdownMenuItem className="group flex-col items-start focus:bg-transparent">
                <p className="text-sm font-medium text-primary/80 group-hover:text-primary group-focus:text-primary">
                  {user?.username || ''}
                </p>
                <p className="text-sm text-primary/60">{user?.email}</p>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="group h-9 w-full cursor-pointer justify-between rounded-md px-2"
                onClick={() => navigate({ to: SettingsRoute.fullPath })}
              >
                <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                  Settings
                </span>
                <Settings className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60 group-hover:text-primary group-focus:text-primary" />
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  'group flex h-9 justify-between rounded-md px-2 hover:bg-transparent'
                )}
              >
                <span className="w-full text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                  Theme
                </span>
                <ThemeSwitcher />
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  'group flex h-9 justify-between rounded-md px-2 my-1 hover:bg-transparent'
                )}
              >
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    navigate({ to: BillingSettingsRoute.fullPath })
                  }
                >
                  {user.subscription?.planKey === PLANS.FREE
                    ? 'Upgrade to PRO'
                    : 'Manage Subscription'}
                </Button>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-0 my-2" />

              <DropdownMenuItem
                className="group h-9 w-full cursor-pointer justify-between rounded-md px-2"
                onClick={() => signOut()}
              >
                <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                  Log Out
                </span>
                <LogOut className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60 group-hover:text-primary group-focus:text-primary" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showSecondaryNav && (
        <div className="mx-auto flex w-full max-w-screen-xl items-center gap-3">
          <div
            className={cn(
              `flex h-12 items-center border-b-2`,
              isDashboardPath ? 'border-primary' : 'border-transparent'
            )}
          >
            <Link
              to={DashboardRoute.fullPath}
              className={cn(
                `${buttonVariants({ variant: 'ghost', size: 'sm' })} text-primary/80`
              )}
            >
              Dashboard
            </Link>
          </div>
          <div
            className={cn(
              `flex h-12 items-center border-b-2`,
              isSettingsPath ? 'border-primary' : 'border-transparent'
            )}
          >
            <Link
              to={SettingsRoute.fullPath}
              className={cn(
                `${buttonVariants({ variant: 'ghost', size: 'sm' })} text-primary/80`
              )}
            >
              Settings
            </Link>
          </div>
          <div
            className={cn(
              `flex h-12 items-center border-b-2`,
              isBillingPath ? 'border-primary' : 'border-transparent'
            )}
          >
            <Link
              to={BillingSettingsRoute.fullPath}
              className={cn(
                `${buttonVariants({ variant: 'ghost', size: 'sm' })} text-primary/80`
              )}
            >
              Billing
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
