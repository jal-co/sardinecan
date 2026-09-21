import { useId } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover } from "radix-ui"
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorThumb,
  Input,
  SliderTrack,
} from "react-aria-components"
import { Label } from "@/components/ui/label"

const thumbClass =
  "size-6 rounded-full border-2 border-white shadow-[0_0_0_1px_black,inset_0_0_0_1px_black] outline-none focus-visible:ring-3 focus-visible:ring-ring"

export function ColorPickerField({
  label,
  value,
  swatches,
  onChange,
}: {
  label: string
  value: string
  swatches: string[]
  onChange: (hex: string) => void
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Popover.Root>
        <Popover.Trigger
          id={id}
          aria-label={`${label}, ${value.toUpperCase()}`}
          className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-transparent px-2 text-xs outline-none transition-[color,background-color,border-color,transform] duration-150 ease-out hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99]"
        >
          <span
            className="size-4 shrink-0 rounded-[4px] inset-ring-1 inset-ring-black/15"
            style={{ backgroundColor: value }}
          />
          <span className="tabular-nums">{value.toUpperCase()}</span>
          <ChevronDown className="ml-auto size-3.5 opacity-60" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            aria-label={`${label} picker`}
            className="z-50 w-[17rem] rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg outline-none"
          >
            <ColorPicker
              value={value}
              onChange={(color) => onChange(color.toString("hex"))}
            >
              <div className="space-y-3">
                <ColorArea
                  aria-label={`${label} saturation and brightness`}
                  colorSpace="hsb"
                  xChannel="saturation"
                  yChannel="brightness"
                  className="h-32 w-full rounded-lg"
                >
                  <ColorThumb className={thumbClass} />
                </ColorArea>
                <ColorSlider
                  aria-label={`${label} hue`}
                  colorSpace="hsb"
                  channel="hue"
                  className="py-2"
                >
                  <SliderTrack className="h-3 w-full rounded-full">
                    <ColorThumb className={thumbClass} />
                  </SliderTrack>
                </ColorSlider>
                <ColorField aria-label={`${label} hex`}>
                  <Input className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs uppercase tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                </ColorField>
              </div>
            </ColorPicker>
            <div
              role="group"
              aria-label={`${label} presets`}
              className="mt-3 flex flex-wrap gap-1.5"
            >
              {swatches.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`${label} ${color}`}
                  aria-pressed={value.toLowerCase() === color.toLowerCase()}
                  onClick={() => onChange(color)}
                  className="relative flex size-6 items-center justify-center rounded-md inset-ring-1 inset-ring-black/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  style={{ backgroundColor: color }}
                >
                  {value.toLowerCase() === color.toLowerCase() && (
                    <Check
                      className="size-3.5 text-white drop-shadow"
                      aria-hidden
                    />
                  )}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
