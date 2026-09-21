import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { pullTabLayout } from "../src/lib/label.ts"
import { templates } from "../src/lib/settings.ts"

test("all four supplied image templates have bundled artwork and small thumbnails", () => {
  assert.equal(templates.length, 4)
  assert.equal(new Set(templates.map((template) => template.id)).size, 4)
  for (const template of templates) {
    const image = readFileSync(
      new URL(`../public${template.image}`, import.meta.url),
    )
    const thumbnail = readFileSync(
      new URL(`../public${template.thumbnail}`, import.meta.url),
    )
    assert.equal(image.subarray(1, 4).toString(), "PNG")
    assert.ok(
      Math.abs(image.readUInt32BE(16) / image.readUInt32BE(20) - 1600 / 1040) <
        0.01,
    )
    assert.equal(thumbnail.readUInt32BE(16), 320)
    assert.ok(thumbnail.length < image.length)
    assert.equal(template.settings.wear, 0)
  }
})

test("image templates restore the tab placements specified in their prompts", () => {
  const expected = [
    { x: 240, y: 520, rotation: 0, metal: "gold" },
    { x: 1332.01, y: 267.99, rotation: 135, metal: "silver" },
    { x: 1360, y: 520, rotation: 180, metal: "silver" },
    { x: 267.99, y: 267.99, rotation: 45, metal: "silver" },
  ]
  templates.forEach((template, index) => {
    const layout = pullTabLayout(template.settings)
    assert.equal(layout.x, expected[index].x)
    assert.equal(layout.y, expected[index].y)
    assert.equal(layout.rotation, expected[index].rotation)
    assert.equal(template.settings.metal, expected[index].metal)
    assert.equal(template.settings.pullTabSize, 1)
  })
})
