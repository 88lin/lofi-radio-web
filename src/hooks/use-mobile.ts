import * as React from "react"

const MOBILE_BREAKPOINT = 768

// MediaQueryList 只需要建一次：subscribe 会在每个组件挂载/依赖变化时被调用，
// 每次都新建一个对象是没必要的开销。放在模块级并惰性初始化，避免 SSR 期间访问 window。
let mediaQueryList: MediaQueryList | null = null

function getMediaQueryList() {
  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  }
  return mediaQueryList
}

function subscribe(onStoreChange: () => void) {
  const mql = getMediaQueryList()
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

// 服务端渲染与首次 hydration 时统一按桌面端处理，避免 hydration 不一致
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
