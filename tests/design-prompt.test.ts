import assert from "node:assert/strict"
import test from "node:test"
import { designPrompt } from "../src/lib/design-prompt.ts"
import { guideSvg } from "../src/lib/label.ts"
import { defaultSettings } from "../src/lib/settings.ts"

test("design prompt includes current artwork text, colors, dimensions, and the real guide", () => {
  const prompt = designPrompt({
    ...defaultSettings,
    brand: "PORTO & FILHOS",
    ink: "#123456",
  })
  assert.ok(prompt.includes('"brand": "PORTO & FILHOS"'))
  assert.ok(prompt.includes("Main ink: #123456"))
  assert.ok(prompt.includes("1600 × 1040 px"))
  assert.ok(prompt.includes("190 px corner radius"))
  assert.ok(prompt.includes("100 px inset"))
  assert.ok(prompt.includes("Orientation preset: top-left"))
  assert.ok(prompt.includes(guideSvg()))
  assert.ok(
    designPrompt({ ...defaultSettings, pullTab: false }).includes(
      "No pull-tab exclusion area is needed",
    ),
  )
})

test("prompt follows the selected tab location, size, and angle", () => {
  const settings = {
    ...defaultSettings,
    pullTabPosition: "bottom" as const,
    pullTabSize: 1.5,
    pullTabAngle: 30,
  }
  const prompt = designPrompt(settings)
  assert.ok(prompt.includes("Orientation preset: bottom"))
  assert.ok(prompt.includes("Tab size: 150%"))
  assert.ok(prompt.includes("Angle adjustment: 30°"))
  assert.ok(prompt.includes("rotated -60° clockwise"))
  assert.ok(prompt.includes(guideSvg(settings)))
})

test("uploaded-artwork prompts omit hidden template lettering and colors", () => {
  const prompt = designPrompt(
    { ...defaultSettings, brand: "HIDDEN BRAND", ink: "#123456" },
    "my-label.png",
  )
  assert.ok(prompt.includes("ARTWORK REFERENCE"))
  assert.ok(!prompt.includes("HIDDEN BRAND"))
  assert.ok(!prompt.includes("#123456"))
  assert.ok(prompt.includes(guideSvg(defaultSettings)))
})

test("prompt follows corner presets", () => {
  const settings = {
    ...defaultSettings,
    pullTabPosition: "bottom-right" as const,
  }
  const prompt = designPrompt(settings)
  assert.ok(prompt.includes("Orientation preset: bottom-right"))
  assert.ok(prompt.includes("rotated -135° clockwise"))
  assert.ok(prompt.includes(guideSvg(settings)))
})
