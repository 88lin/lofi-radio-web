import { Github } from 'lucide-react';

/** Server Component: static links only, so it ships no client JS. */
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="https://github.com/88lin/lofi-radio-web"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>

          <span className="text-fg-faint" aria-hidden="true">
            ·
          </span>

          <span className="font-semibold text-violet-600 dark:text-violet-400">
            Made with ❤️ by{' '}
            <a
              href="https://blog.88lin.eu.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              茉灵智库
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
