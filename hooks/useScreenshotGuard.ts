'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Detect screenshot attempts và trả về state isBlocked.
 * Phát hiện được:
 *  - Phím PrintScreen
 *  - Win+Shift+S (Snipping Tool) → window blur
 *  - Cmd+Shift+3 / Cmd+Shift+4 (Mac) → window blur
 *  - visibilitychange (một số tool overlay làm hidden tab)
 *
 * Không thể detect: điện thoại chụp màn hình máy tính, OBS, ...
 */
export function useScreenshotGuard(blockDurationMs = 1800) {
  const [isBlocked, setIsBlocked] = useState(false)

  const trigger = useCallback(() => {
    setIsBlocked(true)
    const t = window.setTimeout(() => setIsBlocked(false), blockDurationMs)
    return () => window.clearTimeout(t)
  }, [blockDurationMs])

  useEffect(() => {
    // 1. PrintScreen key
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'PrintScreen') {
        // Ngăn default (một số browser hỗ trợ)
        e.preventDefault()
        trigger()
      }
      // Win+Shift+S (Snipping Tool) — key 'S' với metaKey/shiftKey
      // Không detect được Meta trên Windows, nhưng detect shift+s khi blur xảy ra cùng lúc
    }

    // 2. Mất focus → screenshot tool đang mở overlay (Snipping Tool, Cmd+Shift+3/4)
    function onBlur() {
      trigger()
    }

    // 3. Tab hidden (một số tool)
    function onVisibilityChange() {
      if (document.hidden) {
        trigger()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [trigger])

  return isBlocked
}
