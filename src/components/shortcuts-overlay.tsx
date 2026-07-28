'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { shortcutGroups } from '@/lib/home-content';
import { useUiStore } from '@/store/uiStore';

/** Keyboard reference opened with `?` (or from the command palette). */
export function ShortcutsOverlay() {
  const open = useUiStore((s) => s.isShortcutsOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-lg border-hairline bg-surface">
        <DialogHeader>
          <DialogTitle className="text-fg">键盘快捷键</DialogTitle>
          <DialogDescription className="text-fg-muted">
            输入框获得焦点时快捷键自动让行，浏览器与系统组合键不会被拦截。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {shortcutGroups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 text-xs font-semibold tracking-[0.16em] uppercase text-fg-subtle">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-fg-muted">{item.label}</span>
                    <kbd className="shrink-0 rounded-md border border-hairline bg-surface-2 px-2 py-0.5 font-mono text-xs font-semibold text-fg">
                      {item.key}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
