import { SectionHeading } from '@/components/sections/section-heading';
import { Reveal } from '@/components/ui/reveal';
import { features, type HomeFeature } from '@/lib/home-content';

/**
 * Server Component: this block is pure indexable copy with no interactivity, so
 * it no longer ships any JS beyond the `Reveal` wrapper. Hover states are plain
 * CSS (`group-hover`) rather than framer-motion.
 */
function FeatureCard({ feature, index }: { feature: HomeFeature; index: number }) {
  return (
    <Reveal delayMs={index * 70}>
      <article
        className="group panel relative h-full overflow-hidden rounded-2xl p-5 transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:elev-lg"
        style={{ '--card-accent': feature.color } as React.CSSProperties}
      >
        <span
          className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-[var(--dur-base)] group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--card-accent), transparent)',
          }}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--dur-slow)] group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--card-accent) 12%, transparent) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />

        <div
          className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: 'color-mix(in oklab, var(--card-accent) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--card-accent) 22%, transparent)',
          }}
        >
          <feature.icon className="h-5 w-5" style={{ color: 'var(--card-accent)' }} />
        </div>

        <h3 className="relative mb-1.5 text-base font-semibold text-fg">{feature.title}</h3>
        <p className="relative text-sm leading-relaxed text-fg-muted">{feature.description}</p>
      </article>
    </Reveal>
  );
}

export function FeaturesSection() {
  return (
    <section className="px-4 sm:px-6 sm:py-2">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title="为什么选择 Lofi Radio"
          description="专为专注设计，让音乐成为你工作和学习的最佳伴侣"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
