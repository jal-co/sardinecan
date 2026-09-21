import { useEffect, useEffectEvent, useRef } from "react"
import { CanRenderer } from "@/lib/can-renderer"
import type { CanSettings } from "@/lib/settings"

interface Props {
  settings: CanSettings
  svg: string
  locked: boolean
  onReady: (renderer: CanRenderer) => void
  onError: (message: string) => void
}

export function CanCanvas({ settings, svg, locked, onReady, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanRenderer | undefined>(undefined)
  const ready = useEffectEvent(onReady)
  const reportError = useEffectEvent(onError)
  const initialSettings = useRef(settings)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let live = true
    const lost = (event: Event) => {
      event.preventDefault()
      reportError(
        "The 3D preview lost its graphics connection. Reload the page to restart it. You can still download your label.",
      )
    }
    canvas.addEventListener("webglcontextlost", lost)
    try {
      const renderer = new CanRenderer(canvas, initialSettings.current)
      rendererRef.current = renderer
      queueMicrotask(() => {
        if (live) ready(renderer)
      })
    } catch {
      queueMicrotask(() => {
        if (live)
          reportError(
            "The 3D preview needs WebGL. Enable hardware acceleration or use another browser. Label downloads still work.",
          )
      })
    }
    return () => {
      live = false
      canvas.removeEventListener("webglcontextlost", lost)
      rendererRef.current?.dispose()
      rendererRef.current = undefined
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.setLocked(locked)
  }, [locked])

  useEffect(() => {
    rendererRef.current?.update(settings)
  }, [settings])

  useEffect(() => {
    let live = true
    void rendererRef.current?.setLabelSvg(svg).catch((error) => {
      if (live)
        reportError(
          error instanceof Error
            ? error.message
            : "The label could not be rendered.",
        )
    })
    return () => {
      live = false
    }
  }, [svg])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none outline-offset-[-6px]"
      tabIndex={0}
      aria-label={
        locked
          ? "3D sardine can preview. Rotation locked. Scroll to zoom."
          : "3D sardine can preview. Drag to rotate, scroll to zoom, or use arrow keys to rotate."
      }
      onKeyDown={(event) => {
        if (locked) return
        switch (event.key) {
          case "ArrowLeft":
            rendererRef.current?.rotate(-0.12, 0)
            break
          case "ArrowRight":
            rendererRef.current?.rotate(0.12, 0)
            break
          case "ArrowUp":
            rendererRef.current?.rotate(0, -0.12)
            break
          case "ArrowDown":
            rendererRef.current?.rotate(0, 0.12)
            break
          default:
            return
        }
        event.preventDefault()
      }}
    />
  )
}
