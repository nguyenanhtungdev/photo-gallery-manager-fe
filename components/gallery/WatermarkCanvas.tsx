'use client'

import { useEffect, useRef } from 'react'
import { maskPhone } from '@/lib/utils'

interface WatermarkCanvasProps {
  clientName: string
  clientPhone: string
  projectId: string
  className?: string
}

export default function WatermarkCanvas({ clientName, clientPhone, projectId, className }: WatermarkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!canvas || !ctx) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const now = new Date().toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })

      const lines = [
        clientName,
        maskPhone(clientPhone),
        `Mã: ${projectId}`,
        now,
        '⚠ Chưa thanh toán',
      ]

      ctx.save()
      ctx.font = 'bold 14px Inter, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.30)'
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 3

      const step = 200
      const angle = -Math.PI / 6 // -30 degrees

      for (let x = -canvas.height; x < canvas.width + canvas.height; x += step) {
        for (let y = 0; y < canvas.height + step; y += step) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(angle)
          lines.forEach((line, i) => {
            ctx.strokeText(line, 0, i * 18)
            ctx.fillText(line, 0, i * 18)
          })
          ctx.restore()
        }
      }

      ctx.restore()
    }

    draw()

    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    // Redraw every minute to update timestamp
    const timer = setInterval(draw, 60000)

    return () => {
      ro.disconnect()
      clearInterval(timer)
    }
  }, [clientName, clientPhone, projectId])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none watermark-animate ${className || ''}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10 }}
    />
  )
}
