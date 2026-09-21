import assert from "node:assert/strict"
import test from "node:test"
import {
  escapeXml,
  guideSvg,
  labelSvg,
  LABEL_WIDTH,
  LABEL_HEIGHT,
  LABEL_RADIUS,
  SAFE_INSET,
  PULL_TAB,
  pullTabLayout,
} from "../src/lib/label.ts"
import { defaultSettings, templates } from "../src/lib/settings.ts"

test("labels and placement guides share the same lid coordinate system", () => {
  assert.equal(LABEL_WIDTH, 1600)
  assert.equal(LABEL_HEIGHT, 1040)
  assert.equal(LABEL_RADIUS, 190)
  assert.equal(SAFE_INSET, 100)
  for (const template of templates) {
    const svg = labelSvg(template.settings)
    assert.match(svg, /viewBox="0 0 1600 1040"/)
    assert.match(svg, /<rect width="1600" height="1040" rx="190"/)
    for (const group of [
      "brand",
      "product",
      "origin",
      "detail",
      "illustration",
    ])
      assert.ok(svg.includes(`id="${group}"`))
    assert.ok(svg.includes(escapeXml(template.settings.brand)))
    assert.ok(!svg.includes("guides-delete-before-export"))
  }
  assert.match(guideSvg(), /viewBox="0 0 1600 1040"/)
  assert.match(guideSvg(), /id="guides-delete-before-export"/)
  assert.match(guideSvg(), /x="100" y="100" width="1400" height="840"/)
})

test("user text remains text rather than SVG markup", () => {
  const svg = labelSvg({
    ...defaultSettings,
    brand: '<script>alert("fish")</script> & friends',
  })
  assert.ok(!svg.includes("<script>"))
  assert.ok(
    svg.includes(
      "&lt;script&gt;alert(&quot;fish&quot;)&lt;/script&gt; &amp; friends",
    ),
  )
  assert.equal(escapeXml("'<>\"&"), "&apos;&lt;&gt;&quot;&amp;")
  assert.equal(escapeXml("fish\u0000\u000b\ud800"), "fish")
})

test("an uploaded map replaces lettering and wear is deterministic", () => {
  const image = "data:image/png;base64,Zm9v"
  const svg = labelSvg({ ...defaultSettings, wear: 0 }, image)
  assert.match(svg, /id="uploaded-label"/)
  assert.ok(svg.includes(image))
  assert.ok(!svg.includes('id="brand"'))
  assert.match(svg, /id="print-wear"[^>]*opacity="0"/)
  assert.equal(labelSvg(defaultSettings), labelSvg(defaultSettings))
})

test("pull-tab position and size keep the guide inside the lid", () => {
  for (const pullTabPosition of [
    "top-left",
    "top",
    "top-right",
    "left",
    "right",
    "bottom-left",
    "bottom",
    "bottom-right",
  ] as const) {
    for (const pullTabSize of [0.6, 1, 1.5]) {
      const settings = { ...defaultSettings, pullTabPosition, pullTabSize }
      const tab = pullTabLayout(settings)
      assert.ok(tab.x - tab.width / 2 >= PULL_TAB.inset - 0.001)
      assert.ok(tab.y - tab.height / 2 >= PULL_TAB.inset - 0.001)
      assert.ok(tab.x + tab.width / 2 <= LABEL_WIDTH - PULL_TAB.inset + 0.001)
      assert.ok(tab.y + tab.height / 2 <= LABEL_HEIGHT - PULL_TAB.inset + 0.001)
      assert.ok(
        guideSvg(settings).includes(
          `cx="${tab.x}" cy="${tab.y}" rx="${tab.length / 2}" ry="${tab.breadth / 2}" transform="rotate(${tab.rotation} ${tab.x} ${tab.y})"`,
        ),
      )
    }
  }
  assert.equal(pullTabLayout(defaultSettings).rotation, 45)
  assert.ok(pullTabLayout(defaultSettings).x < LABEL_WIDTH / 2)
  assert.ok(pullTabLayout(defaultSettings).y < LABEL_HEIGHT / 2)
  assert.ok(
    !guideSvg({ ...defaultSettings, pullTab: false }).includes("<ellipse"),
  )
})

test("angled pull tabs keep their rotated bounds inside the lid", () => {
  for (const pullTabPosition of [
    "top-left",
    "top",
    "top-right",
    "left",
    "right",
    "bottom-left",
    "bottom",
    "bottom-right",
  ] as const) {
    for (const pullTabAngle of [-180, -45, 0, 45, 180]) {
      const settings = {
        ...defaultSettings,
        pullTabPosition,
        pullTabAngle,
        pullTabSize: 1.5,
      }
      const tab = pullTabLayout(settings)
      assert.ok(tab.x - tab.width / 2 >= PULL_TAB.inset - 0.001)
      assert.ok(tab.y - tab.height / 2 >= PULL_TAB.inset - 0.001)
      assert.ok(tab.x + tab.width / 2 <= LABEL_WIDTH - PULL_TAB.inset + 0.001)
      assert.ok(tab.y + tab.height / 2 <= LABEL_HEIGHT - PULL_TAB.inset + 0.001)
      assert.ok(
        guideSvg(settings).includes(
          `rotate(${tab.rotation} ${tab.x} ${tab.y})`,
        ),
      )
    }
  }
})

test("print scaling is centered and leaves the physical placement guide unchanged", () => {
  for (const printScale of [0.5, 1, 1.5]) {
    const settings = { ...defaultSettings, printScale }
    for (const artwork of [undefined, "data:image/png;base64,Zm9v"]) {
      const svg = labelSvg(settings, artwork)
      assert.ok(
        svg.includes(
          `id="printed-artwork" transform="translate(800 520) scale(${printScale}) translate(-800 -520)"`,
        ),
      )
      assert.ok(svg.includes('clip-path="url(#lid)"'))
    }
    assert.equal(guideSvg(settings), guideSvg(defaultSettings))
  }
})
