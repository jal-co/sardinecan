import { useId, useRef, useState, type ReactNode } from "react"
import { Copy, Download, ImagePlus, RotateCcw, X } from "lucide-react"
import { RadioGroup } from "radix-ui"
import { ColorPickerField } from "@/components/ColorPickerField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { designPrompt } from "@/lib/design-prompt"
import { templates, type Template, type CanSettings } from "@/lib/settings"
import { cn } from "@/lib/utils"

const tabSpots = [
  { value: "top-left", arrow: "↘" },
  { value: "top", arrow: "↓" },
  { value: "top-right", arrow: "↙" },
  { value: "left", arrow: "→" },
  null,
  { value: "right", arrow: "←" },
  { value: "bottom-left", arrow: "↗" },
  { value: "bottom", arrow: "↑" },
  { value: "bottom-right", arrow: "↖" },
] as const

const swatches = [
  "#eedca5",
  "#173f50",
  "#bd3e2e",
  "#722c24",
  "#dce4da",
  "#376779",
]

interface Props {
  settings: CanSettings
  artworkName?: string
  activeTemplate?: string
  busy: boolean
  previewReady: boolean
  onChange: (patch: Partial<CanSettings>) => void
  onTemplate: (template: Template) => void
  onUpload: (file: File) => void
  onRemove: () => void
  onDownload: (kind: "label" | "guide" | "guide-png" | "label-png") => void
  onView: (view: "perspective" | "top" | "back") => void
  onReset: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function TextRow({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 md:text-xs"
      />
    </div>
  )
}

function SliderRow({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label id={id} className="text-xs">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {format ? format(value) : `${Math.round(value * 100)}%`}
        </span>
      </div>
      <Slider
        aria-labelledby={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  )
}

export function Sidebar({
  settings: s,
  artworkName,
  activeTemplate,
  busy,
  previewReady,
  onChange,
  onTemplate,
  onUpload,
  onRemove,
  onDownload,
  onView,
  onReset,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState("")

  async function copyPrompt() {
    setCopyFeedback("")
    try {
      await navigator.clipboard.writeText(designPrompt(s, artworkName))
      setCopyFeedback("Prompt copied with your current layout and SVG guide.")
    } catch {
      setCopyFeedback("Could not copy. Allow clipboard access and try again.")
    }
  }
  const metalId = useId()
  const backgroundId = useId()
  const tabId = useId()
  return (
    <aside
      aria-label="Can settings"
      className="flex min-h-0 w-full flex-1 flex-col border-t bg-sidebar md:h-full md:w-80 md:flex-none md:shrink-0 md:border-t-0 md:border-r"
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.svg"
            alt=""
            className="size-14 shrink-0"
            width={56}
            height={56}
          />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight">
              Sardine Can
            </h1>
            <p className="text-xs text-muted-foreground">
              Design a vintage tin
            </p>
          </div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 px-4 py-4">
          <Section title="Templates">
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={busy}
                  aria-label={`Apply ${template.name} template`}
                  aria-pressed={activeTemplate === template.id}
                  onClick={() => onTemplate(template)}
                  className="group overflow-hidden rounded-lg border border-input text-left transition-[border-color,transform] duration-150 ease-out hover:border-ring/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="flex aspect-square items-center justify-center overflow-hidden bg-[color-mix(in_oklab,var(--color-muted)_55%,transparent)] p-2">
                    <img
                      src={template.thumbnail}
                      alt=""
                      width={160}
                      height={104}
                      className="max-h-full max-w-full object-contain drop-shadow-[0_1px_2px_rgb(0_0_0/0.18)]"
                    />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-[11px] font-medium">
                    {template.name}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Choose a finished label or upload your own. Template artwork is a
              flat image.
            </p>
          </Section>
          <Separator />
          <Section title="Artwork">
            <input
              ref={fileRef}
              type="file"
              aria-label="Upload artwork file"
              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onUpload(file)
                event.target.value = ""
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault()
                setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setOver(false)
                const file = event.dataTransfer.files[0]
                if (file && !busy) onUpload(file)
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-5 text-center transition-[color,background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
                over
                  ? "border-ring bg-accent text-foreground"
                  : "border-input text-muted-foreground hover:border-ring/60 hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <ImagePlus className="size-5" aria-hidden />
              <span className="text-xs font-medium text-foreground">
                {busy
                  ? "Working…"
                  : artworkName
                    ? "Replace artwork"
                    : "Upload artwork"}
              </span>
              <span className="text-[11px]">
                Drop or click · SVG, PNG, JPG, WebP
              </span>
            </button>
            {artworkName && (
              <>
                <div className="flex items-center gap-1.5 rounded-lg bg-accent/60 py-0.5 pl-2.5 pr-0.5">
                  <span
                    className="min-w-0 flex-1 truncate text-xs"
                    title={artworkName}
                  >
                    {artworkName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove artwork"
                    disabled={busy}
                    onClick={onRemove}
                  >
                    <X className="size-3.5" aria-hidden />
                  </Button>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Artwork is fitted to 1600 × 1040. Its text and colors are
                  baked into the image. Remove it to start an editable label.
                </p>
              </>
            )}
          </Section>
          <Separator />
          <Section title="Design files">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void copyPrompt()}
            >
              <Copy aria-hidden />
              Copy prompt
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {artworkName
                ? "Copy a prompt for this layout. Attach your artwork and Guide PNG to the image generator; images are not included in the copied text."
                : "Generate a flat label with your lettering, colors, and SVG outline. For image generators, attach Guide PNG too."}
            </p>
            {copyFeedback && (
              <p
                role="status"
                className="text-[11px] leading-relaxed text-muted-foreground"
              >
                {copyFeedback}
              </p>
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Edit the SVG in Figma or Illustrator, or use the PNG map as a
              guide layer in Photoshop.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onDownload("label")}
              >
                <Download aria-hidden />
                Label SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onDownload("label-png")}
              >
                <Download aria-hidden />
                Label PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onDownload("guide")}
              >
                <Download aria-hidden />
                Guide SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onDownload("guide-png")}
              >
                <Download aria-hidden />
                Guide PNG
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Keep the 1600 × 1040 canvas. Hide guides before export, then
              upload the finished label. Outline external SVG fonts or export a
              PNG. Uploaded artwork remains a raster image.
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Lid-only mockup map, not a manufacturing dieline or full-can UV
              unwrap. Files stay in your browser.
            </p>
          </Section>
          <Separator />
          {!artworkName && (
            <>
              <Section title="Lettering">
                <fieldset
                  disabled={Boolean(artworkName) || busy}
                  className="space-y-3 disabled:opacity-50"
                >
                  <legend className="sr-only">Template lettering</legend>
                  <TextRow
                    label="Brand name"
                    value={s.brand}
                    maxLength={36}
                    onChange={(brand) => onChange({ brand })}
                  />
                  <TextRow
                    label="Product"
                    value={s.product}
                    maxLength={30}
                    onChange={(product) => onChange({ product })}
                  />
                  <TextRow
                    label="Origin"
                    value={s.origin}
                    maxLength={60}
                    onChange={(origin) => onChange({ origin })}
                  />
                  <TextRow
                    label="Small print"
                    value={s.detail}
                    maxLength={64}
                    onChange={(detail) => onChange({ detail })}
                  />
                </fieldset>
              </Section>
              <Separator />
            </>
          )}
          <Section title="Printing">
            {!artworkName && (
              <fieldset
                disabled={Boolean(artworkName) || busy}
                className="space-y-3 disabled:opacity-50"
              >
                <legend className="sr-only">Print colors</legend>
                <ColorPickerField
                  label="Paper color"
                  value={s.paper}
                  swatches={swatches}
                  onChange={(paper) => onChange({ paper })}
                />
                <ColorPickerField
                  label="Ink color"
                  value={s.ink}
                  swatches={swatches}
                  onChange={(ink) => onChange({ ink })}
                />
                <ColorPickerField
                  label="Accent color"
                  value={s.accent}
                  swatches={swatches}
                  onChange={(accent) => onChange({ accent })}
                />
              </fieldset>
            )}
            <SliderRow
              label="Print scale"
              value={s.printScale}
              min={0.5}
              max={1.5}
              onChange={(printScale) => onChange({ printScale })}
            />
            <SliderRow
              label="Print wear"
              value={s.wear}
              onChange={(wear) => onChange({ wear })}
            />
          </Section>
          <Separator />
          <Section title="Tin">
            <div className="space-y-2">
              <Label htmlFor={metalId} className="text-xs">
                Metal
              </Label>
              <Select
                value={s.metal}
                onValueChange={(value) => {
                  if (value === "silver" || value === "gold")
                    onChange({ metal: value })
                }}
              >
                <SelectTrigger id={metalId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Warm gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-h-8 items-center justify-between gap-3">
              <Label htmlFor={tabId} className="text-xs">
                Pull tab
              </Label>
              <Switch
                id={tabId}
                checked={s.pullTab}
                onCheckedChange={(pullTab) => onChange({ pullTab })}
              />
            </div>
            {s.pullTab && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium">Pull-tab position</p>
                  <RadioGroup.Root
                    aria-label="Pull-tab position"
                    value={s.pullTabPosition}
                    onValueChange={(value) => {
                      const spot = tabSpots.find(
                        (spot) => spot?.value === value,
                      )
                      if (spot) onChange({ pullTabPosition: spot.value })
                    }}
                    className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/30 p-1"
                  >
                    {tabSpots.map((spot, index) =>
                      spot ? (
                        <RadioGroup.Item
                          key={spot.value}
                          value={spot.value}
                          onFocus={() =>
                            onChange({ pullTabPosition: spot.value })
                          }
                          aria-label={spot.value.replaceAll("-", " ")}
                          title={spot.value.replaceAll("-", " ")}
                          className="flex h-11 items-center justify-center rounded-md text-lg text-muted-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        >
                          <span aria-hidden>{spot.arrow}</span>
                        </RadioGroup.Item>
                      ) : (
                        <span
                          key={index}
                          aria-hidden
                          className="flex items-center justify-center text-muted-foreground/40"
                        >
                          ·
                        </span>
                      ),
                    )}
                  </RadioGroup.Root>
                </div>
                <SliderRow
                  label="Pull-tab size"
                  value={s.pullTabSize}
                  min={0.6}
                  max={1.5}
                  onChange={(pullTabSize) => onChange({ pullTabSize })}
                />
                <SliderRow
                  label="Pull-tab angle"
                  value={s.pullTabAngle}
                  min={-180}
                  max={180}
                  step={1}
                  format={(value) => `${value}°`}
                  onChange={(pullTabAngle) => onChange({ pullTabAngle })}
                />
              </>
            )}
            <SliderRow
              label="Metal roughness"
              value={s.roughness}
              min={0.12}
              max={0.8}
              onChange={(roughness) => onChange({ roughness })}
            />
          </Section>
          <Separator />
          <Section title="View & background">
            <div role="group" aria-label="Camera views" className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!previewReady}
                onClick={() => onView("perspective")}
              >
                Perspective
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!previewReady}
                onClick={() => onView("top")}
              >
                Top
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!previewReady}
                onClick={() => onView("back")}
              >
                Back
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor={backgroundId} className="text-xs">
                Background
              </Label>
              <Select
                value={s.background}
                onValueChange={(value) => {
                  if (
                    value === "transparent" ||
                    value === "paper" ||
                    value === "ink"
                  )
                    onChange({ background: value })
                }}
              >
                <SelectTrigger id={backgroundId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transparent">Transparent</SelectItem>
                  <SelectItem value="paper">Paper</SelectItem>
                  <SelectItem value="ink">Ink</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            disabled={busy}
            onClick={onReset}
          >
            <RotateCcw aria-hidden />
            Reset to default
          </Button>
        </div>
      </ScrollArea>
    </aside>
  )
}
