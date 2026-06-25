import { useEffect } from 'react'

/**
 * Suppresses ONLY the bottom rubber-band overscroll on touch devices while
 * leaving the native top pull-to-refresh gesture intact.
 *
 * Why JS: `overscroll-behavior-y` is per-axis — it affects both ends at once, so
 * pure CSS can't allow the top bounce (pull-to-refresh) while blocking the bottom
 * one. We instead watch touch drags and `preventDefault()` a single, specific
 * case: the page is already scrolled to the bottom AND the finger is dragging the
 * content further up (past the end). Everything else — normal scrolling, the top
 * pull-to-refresh, nested scroll containers, pinch/zoom, horizontal swipes — is
 * left untouched.
 *
 * No-op when there's no window (SSR) or on non-touch devices, so desktop is
 * unaffected.
 */
export function useSuppressBottomOverscroll() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!isTouch) return

    let startX = 0
    let startY = 0

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      startX = t.clientX
      startY = t.clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      // Ignore multi-touch gestures (e.g. pinch-zoom).
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (!t) return

      const dy = t.clientY - startY
      const dx = t.clientX - startX

      // Only act on predominantly-vertical drags.
      if (Math.abs(dy) <= Math.abs(dx)) return

      // dy > 0 means the finger is moving down (scrolling content toward the top /
      // pull-to-refresh). Never interfere with that — only the bottom matters here.
      if (dy >= 0) return

      // If the gesture is inside a nested scrollable element, let it scroll natively.
      if (getScrollableAncestor(e.target as Element | null)) return

      const el = document.scrollingElement || document.documentElement
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
      if (atBottom) {
        // At the very bottom and still dragging content up => bottom bounce. Block it.
        e.preventDefault()
      }
    }

    // touchmove must be non-passive so preventDefault() is honored.
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [])
}

/**
 * Walks up from `node` looking for an actually-scrollable ancestor (overflow-y
 * auto/scroll with content taller than the box) so we don't block scrolling that
 * a nested container should handle. Stops at body/html, which are the page-level
 * scrollers handled by the bottom check itself.
 */
function getScrollableAncestor(node: Element | null): Element | null {
  let el: Element | null = node
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el)
    const overflowY = style.overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el
    }
    el = el.parentElement
  }
  return null
}
