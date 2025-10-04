import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/utils/misc';
import { createFileRoute, Link } from '@tanstack/react-router';
import siteConfig from '~/site.config';
import { NavBar } from '@/components/ui/nav-bar';
import SpaceshipsBG from '@/assets/backgrounds/spaceships_background.jpeg';

export const Route = createFileRoute('/')({
  component: Index
});

function Index() {
  return (
  <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-transparent text-foreground dark">
      {/* Global background: image + readable gradient overlays */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
        <img
          src={SpaceshipsBG}
          alt="spaceships background"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
        />
        {/* Darkening + vignette for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_40%,rgba(0,0,0,0.65)_90%)]" />
        {/* Color atmosphere wash */}
        <div className="absolute inset-0 mix-blend-overlay opacity-40 [background:linear-gradient(120deg,#312e81_0%,#1e3a8a_35%,#4c1d95_55%,#7e22ce_75%,#be185d_95%)]" />
      </div>
      <NavBar />
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pb-40 pt-32 md:pt-40">
        {/* Local hero soft glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl [background:radial-gradient(circle_at_center,rgba(96,165,250,0.5),rgba(168,85,247,0.35),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(99,102,241,0.15),transparent_65%)]" />
        </div>
        <h1 className="mt-6 max-w-4xl bg-gradient-to-br from-indigo-200 via-sky-200 to-fuchsia-300 bg-clip-text text-center text-5xl font-extrabold leading-tight text-transparent drop-shadow md:text-6xl lg:text-7xl">
          Conquer the Stars in
          <br className="hidden sm:block" /> {siteConfig.siteTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          A real-time 4X strategy experience: explore procedurally generated galaxies, expand your empire, exploit rich planetary systems, and outmaneuver rival factions.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login" className={cn(buttonVariants({ size: 'lg' }))}>
            Play Free
          </Link>
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
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {siteConfig.siteTitle}. Built with Convex + TanStack.</p>
      </footer>
    </div>
  );
}

