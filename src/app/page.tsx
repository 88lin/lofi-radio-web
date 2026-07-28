import { AppShell } from '@/components/app-shell';
import { BackgroundDecor } from '@/components/sections/background-decor';
import { CtaSection } from '@/components/sections/cta-section';
import { FaqSection } from '@/components/sections/faq-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { HeroSection } from '@/components/sections/hero-section';
import { NavBar } from '@/components/sections/nav-bar';
import { ScenesSection } from '@/components/sections/scenes-section';
import { SiteFooter } from '@/components/sections/site-footer';
import { StationsSection } from '@/components/sections/stations-section';

/**
 * Landing page shell.
 *
 * Previously a single 788-line `'use client'` component holding the clock, nav,
 * hero, four card grids, the FAQ accordion, the keyboard handler and ~200 inline
 * `isDark ? … : …` style objects. It is now a Server Component that composes
 * section components; `AppShell` is the only client boundary.
 *
 * The section order is deliberately unchanged: hero copy, features, scenes,
 * station grid, CTA and FAQ are the site's indexable content and its only
 * traffic source, so the SEO surface must stay byte-comparable.
 */
export default function Home() {
  return (
    <AppShell>
      <BackgroundDecor />

      <div className="relative z-10">
        <NavBar />
        <HeroSection />
        <FeaturesSection />
        <ScenesSection />
        <StationsSection />
        <CtaSection />
        <FaqSection />
        <SiteFooter />
      </div>
    </AppShell>
  );
}
