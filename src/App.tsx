import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { ChevronDown, Download, History, Moon, Sun } from "lucide-react"
import { DropdownMenu } from "radix-ui"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CanCanvas } from "@/components/CanCanvas"
import { Sidebar } from "@/components/Sidebar"
import { SocialLinks } from "@/components/SocialLinks"
import {
  defaultSettings,
  templates,
  type Template,
  type CanSettings,
} from "@/lib/settings"
import { guideSvg, labelSvg } from "@/lib/label"
import { canvasBlob, download, rasterizeSvg, uploadLabel } from "@/lib/images"
import type { CanRenderer } from "@/lib/can-renderer"

const mobileQuery = matchMedia("(max-width: 767px)")

function subscribeLayout(onChange: () => void) {
  mobileQuery.addEventListener("change", onChange)
  return () => mobileQuery.removeEventListener("change", onChange)
}

const exportItemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"

export default function App() {
  const mobile = useSyncExternalStore(
    subscribeLayout,
    () => mobileQuery.matches,
  )
  const [settings, setSettings] = useState(defaultSettings)
  const [artwork, setArtwork] = useState<{
    url: string
    name: string
    templateId?: string
  }>()
  const [renderer, setRenderer] = useState<CanRenderer>()
  const [busy, setBusy] = useState(true)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [previewError, setPreviewError] = useState("")
  const [dragging, setDragging] = useState(false)
  const [locked, setLocked] = useState(false)
  const [dark, setDark] = useState(
    () =>
      (localStorage.getItem("sardinecan-theme") ??
        (matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")) === "dark",
  )
  const uploadVersion = useRef(0)
  const svg = labelSvg(settings, artwork?.url)

  useEffect(() => {
    void applyTemplate(templates[0])
    return () => {
      uploadVersion.current++
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("sardinecan-theme", dark ? "dark" : "light")
  }, [dark])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      if (
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, button, [role=menu], [role=listbox], [role=slider], [role=switch], [contenteditable]",
        )
      )
        return
      if (event.key.toLowerCase() === "d") {
        event.preventDefault()
        setDark((value) => !value)
      }
      if (event.key.toLowerCase() === "l") {
        event.preventDefault()
        setLocked((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function patch(change: Partial<CanSettings>) {
    setSettings((previous) => ({ ...previous, ...change }))
  }

  async function applyTemplate(template: Template) {
    const version = ++uploadVersion.current
    setBusy(true)
    setError("")
    setStatus(`Loading ${template.name}…`)
    try {
      const response = await fetch(template.image)
      if (!response.ok)
        throw new Error(`Could not load ${template.name}. Try again.`)
      const loaded = await uploadLabel(
        new File([await response.blob()], `${template.id}.png`, {
          type: "image/png",
        }),
      )
      if (version !== uploadVersion.current) return
      setArtwork({ ...loaded, name: template.name, templateId: template.id })
      setSettings((previous) => ({
        ...template.settings,
        background: previous.background,
        exportSize: previous.exportSize,
      }))
      setStatus(`${template.name} template applied.`)
    } catch (cause) {
      if (version === uploadVersion.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "The template could not be loaded.",
        )
        setStatus("")
      }
    } finally {
      if (version === uploadVersion.current) setBusy(false)
    }
  }

  async function upload(file: File) {
    const version = ++uploadVersion.current
    setBusy(true)
    setError("")
    setStatus("")
    try {
      const loaded = await uploadLabel(file)
      if (version !== uploadVersion.current) return
      setArtwork(loaded)
      patch({ wear: 0, printScale: 1 })
      setStatus(`${loaded.name} applied to the lid.`)
    } catch (cause) {
      if (version === uploadVersion.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "The label could not be loaded.",
        )
    } finally {
      if (version === uploadVersion.current) setBusy(false)
    }
  }

  async function exportFile(
    kind: "mockup" | "label" | "guide" | "guide-png" | "label-png",
  ) {
    setBusy(true)
    setError("")
    setStatus("Preparing your download…")
    try {
      if (kind === "mockup") {
        if (!renderer) throw new Error("Wait for the 3D preview to load.")
        download(await renderer.exportPNG(), "sardinecan-mockup.png")
      } else {
        const content =
          kind === "label" || kind === "label-png" ? svg : guideSvg(settings)
        const isPng = kind.endsWith("-png")
        const blob = isPng
          ? await canvasBlob(await rasterizeSvg(content))
          : new Blob([content], { type: "image/svg+xml" })
        download(
          blob,
          `sardinecan-${kind.replace("-png", "")}.${isPng ? "png" : "svg"}`,
        )
      }
      setStatus("Download ready. Check your downloads folder.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The download failed. Try again.",
      )
      setStatus("")
    } finally {
      setBusy(false)
    }
  }

  const sidebar = (
    <Sidebar
      key="sidebar"
      settings={settings}
      artworkName={artwork?.name}
      activeTemplate={artwork?.templateId}
      busy={busy}
      previewReady={Boolean(renderer)}
      onChange={patch}
      onTemplate={(template) => void applyTemplate(template)}
      onUpload={(file) => void upload(file)}
      onRemove={() => {
        uploadVersion.current++
        setArtwork(undefined)
        setStatus("Template lettering restored.")
      }}
      onDownload={(kind) => void exportFile(kind)}
      onView={(view) => renderer?.setView(view)}
      onReset={() => {
        void applyTemplate(templates[0])
        setLocked(false)
        renderer?.setView("perspective")
      }}
    />
  )

  const preview = (
    <main
      key="preview"
      id="preview"
      className="flex h-[52dvh] shrink-0 flex-col md:h-full md:min-w-0 md:flex-1"
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title="Toggle theme (D)"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
          </Button>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <History className="size-3" aria-hidden />
            v0.1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(settings.exportSize)}
            onValueChange={(value) => patch({ exportSize: Number(value) })}
          >
            <SelectTrigger aria-label="Export size" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1024, 2048, 4096].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} × {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button disabled={busy}>
                <Download aria-hidden />
                {busy ? "Working…" : "Export"}
                <ChevronDown className="size-3 opacity-60" aria-hidden />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
              >
                <DropdownMenu.Item
                  className={exportItemClass}
                  disabled={!renderer || Boolean(previewError)}
                  onSelect={() => void exportFile("mockup")}
                >
                  <Download
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                  Mockup PNG
                  <span className="ml-auto text-xs text-muted-foreground">
                    {settings.exportSize} px
                  </span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className={exportItemClass}
                  onSelect={() => void exportFile("label")}
                >
                  Label SVG
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={exportItemClass}
                  onSelect={() => void exportFile("label-png")}
                >
                  Flat label PNG
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className={exportItemClass}
                  onSelect={() => void exportFile("guide")}
                >
                  Placement guide SVG
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={exportItemClass}
                  onSelect={() => void exportFile("guide-png")}
                >
                  Placement guide PNG
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>
      <div
        className={`relative min-h-0 flex-1 overflow-hidden canvas-stage backdrop-${settings.background}`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          const file = event.dataTransfer.files[0]
          if (file && !busy) void upload(file)
        }}
      >
        <CanCanvas
          settings={settings}
          svg={svg}
          locked={locked}
          onReady={setRenderer}
          onError={setPreviewError}
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-xl border-2 border-dashed border-ring bg-background/90 text-sm font-medium">
            Drop your label onto the tin
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={locked}
          disabled={!renderer}
          onClick={() => setLocked((value) => !value)}
          title="Toggle rotation lock (L)"
          className="absolute bottom-4 left-4 gap-1.5 text-xs text-foreground/75"
        >
          <Kbd>L</Kbd>
          {locked ? "Unlock rotation" : "Lock rotation"}
        </Button>
        <SocialLinks />
      </div>
    </main>
  )

  return (
    <div className="studio flex h-dvh flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <a href="#preview" className="skip-link">
        Skip to preview
      </a>
      {mobile ? [preview, sidebar] : [sidebar, preview]}
      <p role="status" className="sr-only">
        {status}
      </p>
      {(error || previewError) && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-lg border bg-background p-3 text-sm shadow-lg"
        >
          <p className="flex-1">{error || previewError}</p>
          {error && (
            <Button variant="ghost" size="sm" onClick={() => setError("")}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
