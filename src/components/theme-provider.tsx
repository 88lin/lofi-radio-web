'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { MotionConfig } from 'framer-motion';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {/* framer-motion 默认不读 prefers-reduced-motion，光靠 CSS 媒体查询
          管不到 JS 驱动的 motion 组件。reducedMotion="user" 会在用户开启
          「减少动态效果」时跳过 transform / layout 动画、只保留透明度过渡，
          元素直接落在终态，不会出现内容停在不可见状态。 */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}
