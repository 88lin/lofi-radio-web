import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

/**
 * Shared heading block for the marketing sections. Previously each of the five
 * sections repeated the same motion wrapper plus a pair of `isDark ? … : …`
 * colour ternaries.
 *
 * Server Component: the only client code is the `Reveal` wrapper.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn('text-center mb-10', className)}>
      {eyebrow && (
        <div className="mb-3 flex justify-center">
          <span className="inline-flex items-center rounded-full border border-hairline bg-surface-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-subtle sm:text-xs">
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="mb-3 text-2xl font-bold text-fg sm:text-3xl">{title}</h2>
      {description && (
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
