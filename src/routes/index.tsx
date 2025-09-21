import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/utils/misc';
import { createFileRoute, Link } from '@tanstack/react-router';
import siteConfig from '~/site.config';
import { NavBar } from '@/components/ui/nav-bar';
import ShadowPNG from '/images/shadow.png';

export const Route = createFileRoute('/')({
  component: Index
});

function Index() {
  return (
  <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-transparent text-foreground">
      {/* Global background: deep space gradient + starfield */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black dark:from-black dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute inset-0 opacity-[0.35] mix-blend-screen [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:50px_50px]" />
        <div className="absolute inset-0 opacity-40 blur-3xl [background:conic-gradient(at_20%_30%,rgba(56,189,248,0.15),rgba(167,139,250,0.12),rgba(236,72,153,0.15),transparent_70%)]" />
      </div>
      <NavBar />
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pb-40 pt-32 md:pt-40">
        {/* Local hero decorative layers */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(99,102,241,0.25),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.18),transparent_70%)]" />
        </div>
        {/* Hero planet / nebula image (covers center) */}
        <img
          src={ShadowPNG}
          alt="stellar glow"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 scale-110 opacity-70 mix-blend-screen object-cover"
          loading="lazy"
        />
        <Button
          variant="outline"
          className="hidden h-8 rounded-full border-primary/30 bg-background/40 px-3 text-xs font-semibold tracking-wide backdrop-blur hover:text-primary md:flex"
        >
          Welcome Commander
        </Button>
        <h1 className="mt-6 max-w-4xl bg-gradient-to-br from-indigo-200 via-sky-200 to-fuchsia-300 bg-clip-text text-center text-5xl font-extrabold leading-tight text-transparent drop-shadow md:text-6xl lg:text-7xl">
          Conquer the Stars in
          <br className="hidden sm:block" /> {siteConfig.siteTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          A real-time 4X strategy experience: explore procedurally generated galaxies, expand your empire, exploit rich planetary systems, and outmaneuver rival factions.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/_app/login" className={cn(buttonVariants({ size: 'lg' }))}>
            Play Free
          </Link>
          <a
            href="https://github.com/n8urm8/4x-convex"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'dark:bg-secondary/40 dark:hover:bg-secondary/60')}
          >
            View Source
          </a>
        </div>
        {/* Spacer to visually separate hero from next section */}
        <div className="mt-20 h-px w-40 rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto w-full max-w-screen-xl px-6 pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="bg-gradient-to-r from-indigo-300 via-sky-200 to-fuchsia-300 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Forge Your Galactic Legacy
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to build, optimize, and dominate. Designed for strategic depth and rapid iteration.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Procedural Galaxy Generation',
              body: 'Unique star systems, resource distributions, and strategic chokepoints every campaign.'
            },
            {
              title: 'Research & Tech Trees',
              body: 'Unlock advanced propulsion, planetary engineering, and fleet doctrines.'
            },
            {
              title: 'Fleet Command',
              body: 'Design ship blueprints and orchestrate large-scale engagements with tactical precision.'
            },
            {
              title: 'Economic Expansion',
              body: 'Optimize extraction, logistics, and manufacturing across multi-planet networks.'
            },
            {
              title: 'Persistent Multiplayer (Planned)',
              body: 'Long-form galactic campaigns with diplomacy, rivalry, and emergent meta.'
            },
            {
              title: 'Instant Reactive Backend',
              body: 'Powered by Convex for real-time updates without complex infrastructure.'
            }
          ].map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-background/60 to-background/20 p-5 shadow-sm backdrop-blur transition hover:border-primary/30 hover:shadow-lg"
            >
              <div className="absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-100 [background-image:radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_60%)]" />
              <h3 className="text-lg font-semibold tracking-tight text-primary">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto mb-28 w-full max-w-screen-lg px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-indigo-900/40 via-slate-900/60 to-fuchsia-900/40 p-10 backdrop-blur">
          <div className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.4),transparent_60%)]" />
          <h2 className="text-2xl font-semibold text-primary md:text-3xl">
            Ready to Expand Your Civilization?
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Jump into a living galaxy and carve out your destiny. Your empire awaits—adaptive AI and rival players will test every decision.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/_app/login" className={cn(buttonVariants({ size: 'default' }))}>
              Begin Conquest
            </Link>
            <a
              href="https://github.com/n8urm8/4x-convex"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }), 'dark:bg-secondary/30 dark:hover:bg-secondary/50')}
            >
              Star Map (Repo)
            </a>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {siteConfig.siteTitle}. Built with Convex + TanStack.{" "}
          <a
            href="https://github.com/n8urm8/4x-convex"
            className="underline decoration-dotted underline-offset-4 hover:text-primary"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
        </p>
      </footer>
    </div>
  );
}

