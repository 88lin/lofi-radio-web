/**
 * Fixed page backdrop: base wash, station-tinted aurora, film grain, grid.
 *
 * Theme handling moved from `isDark ? a : b` inline strings to
 * `dark:` variants + `--station-accent`, so the whole backdrop re-tints when
 * the listener changes station without any JS re-render.
 */
export function BackgroundDecor() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      {/* Base wash */}
      <div className="absolute inset-0 bg-background transition-colors duration-700" />

      {/* Aurora: the first blob follows the current station accent, the other
          two stay fixed so the palette never collapses to a single hue. */}
      <div
        className="absolute inset-0 opacity-50 dark:opacity-60"
        style={{
          background: [
            'radial-gradient(circle at 15% 10%, color-mix(in oklab, var(--station-accent) 14%, transparent) 0%, transparent 42%)',
            'radial-gradient(circle at 78% 58%, color-mix(in oklab, #06b6d4 11%, transparent) 0%, transparent 46%)',
            'radial-gradient(circle at 28% 88%, color-mix(in oklab, #ec4899 11%, transparent) 0%, transparent 42%)',
          ].join(','),
          transition: 'background 800ms var(--ease-out-soft)',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Blueprint grid, faded out towards the bottom so long pages do not feel
          like graph paper all the way down. */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 85%)',
        }}
      />
    </div>
  );
}
