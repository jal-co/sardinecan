import { defaultSettings, type CanSettings } from "./settings.ts"

export const LABEL_WIDTH = 1600
export const LABEL_HEIGHT = 1040
export const LABEL_RADIUS = 190
export const SAFE_INSET = 100
export const PULL_TAB = { width: 340, height: 220, inset: 70 } as const

export function pullTabLayout(settings: CanSettings) {
  const length = PULL_TAB.width * settings.pullTabSize
  const breadth = PULL_TAB.height * settings.pullTabSize
  const rotation =
    {
      "top-left": 45,
      top: 90,
      "top-right": 135,
      left: 0,
      right: 180,
      "bottom-left": -45,
      bottom: -90,
      "bottom-right": -135,
    }[settings.pullTabPosition] + settings.pullTabAngle
  const angle = (rotation * Math.PI) / 180
  const width =
    Math.round(
      (Math.abs(Math.cos(angle)) * length +
        Math.abs(Math.sin(angle)) * breadth) *
        100,
    ) / 100
  const height =
    Math.round(
      (Math.abs(Math.sin(angle)) * length +
        Math.abs(Math.cos(angle)) * breadth) *
        100,
    ) / 100
  const insetX = PULL_TAB.inset + width / 2
  const insetY = PULL_TAB.inset + height / 2
  return {
    x: settings.pullTabPosition.includes("left")
      ? insetX
      : settings.pullTabPosition.includes("right")
        ? LABEL_WIDTH - insetX
        : LABEL_WIDTH / 2,
    y: settings.pullTabPosition.includes("top")
      ? insetY
      : settings.pullTabPosition.includes("bottom")
        ? LABEL_HEIGHT - insetY
        : LABEL_HEIGHT / 2,
    width,
    height,
    length,
    breadth,
    rotation,
  }
}

export function escapeXml(value: string) {
  return value
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu,
      "",
    )
    .replace(/[<>&"']/g, (character) => {
      switch (character) {
        case "<":
          return "&lt;"
        case ">":
          return "&gt;"
        case "&":
          return "&amp;"
        case '"':
          return "&quot;"
        default:
          return "&apos;"
      }
    })
}

function lettering(
  text: string,
  x: number,
  y: number,
  size: number,
  width: number,
  color: string,
  serif = false,
) {
  const fit =
    text.length * size * (serif ? 0.66 : 0.63) > width
      ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"`
      : ""
  return `<text x="${x}" y="${y}" fill="${color}" text-anchor="middle" font-family="${serif ? "Georgia, serif" : "Arial, sans-serif"}" font-size="${size}" font-weight="700"${fit}>${escapeXml(text)}</text>`
}

function fish(
  x: number,
  y: number,
  scale: number,
  ink: string,
  color: string,
  paper: string,
  engraved = false,
) {
  const marks = engraved
    ? Array.from(
        { length: 19 },
        (_, i) => `<path d="M${-280 + i * 27} -72q-32 72 4 145"/>`,
      ).join("")
    : Array.from(
        { length: 6 },
        (_, i) =>
          `<path transform="translate(${-235 + i * 64} ${i % 2 ? 5 : -12})" d="M0-15 4-5 15-5 7 3 10 14 0 8-10 14-7 3-15-5-4-5Z"/>`,
      ).join("")
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round">
    <path d="M-325 0-470-114Q-404 0-470 114ZM-96-86-16-163Q58-137 94-96ZM-44 89 31 150 108 87Z" fill="${ink}"/>
    <path d="M-340 0C-212-149 110-155 346 0C128 148-201 154-340 0Z" fill="${ink}"/>
    <path d="M-314 0C-91-74 136-110 319-4C126 77-99 82-314 0Z" fill="${color}"/>
    <g fill="${engraved ? "none" : ink}" stroke="${engraved ? paper : "none"}" stroke-width="3" opacity=".9">${marks}</g>
    <path d="M194-66Q150 0 198 69M257 28Q296 39 324 9M-408-67-350-6M-417-39-359-3M-413 49-353 7M-411 79-347 13" fill="none" stroke="${ink}" stroke-width="7"/>
    <ellipse cx="264" cy="-19" rx="23" ry="18" fill="${paper}"/><circle cx="272" cy="-19" r="10" fill="${ink}"/>
  </g>`
}

function lemon(
  x: number,
  y: number,
  scale: number,
  ink: string,
  paper: string,
) {
  return `<g transform="translate(${x} ${y}) rotate(-24) scale(${scale})" stroke="${ink}" stroke-width="5" stroke-linejoin="round"><path d="M-78 0Q-13-89 77 0Q1 81-78 0Z" fill="${paper}"/><path d="M-61 0H61M0-41V40M-42-24 40 24M-40 23 40-24" fill="none" stroke-width="3"/><path d="M-8-38Q-75-120-130-77Q-81-40-8-38ZM0-41Q27-114 96-105Q75-49 0-41Z" fill="${ink}"/></g>`
}

function wearMarks(amount: number, color: string) {
  let seed = 2718
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  return `<g id="print-wear" fill="${color}" opacity="${amount * 0.7}">${Array.from(
    { length: 420 },
    () => {
      const x = random() * LABEL_WIDTH
      const y = random() * LABEL_HEIGHT
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(1 + random() * 13).toFixed(1)}" height="${(0.5 + random() * 2).toFixed(1)}"/>`
    },
  ).join("")}</g>`
}

export function labelSvg(settings: CanSettings, artwork?: string) {
  const s = settings
  let design: string
  if (artwork) {
    design = `<image id="uploaded-label" href="${escapeXml(artwork)}" x="0" y="0" width="1600" height="1040" preserveAspectRatio="xMidYMid slice"/>`
  } else if (s.layout === "maritime") {
    const scallops = [
      ...Array.from(
        { length: 14 },
        (_, i) =>
          `<circle cx="${190 + i * 94}" cy="108" r="24"/><circle cx="${190 + i * 94}" cy="932" r="24"/>`,
      ),
      ...Array.from(
        { length: 8 },
        (_, i) =>
          `<circle cx="108" cy="${202 + i * 91}" r="24"/><circle cx="1492" cy="${202 + i * 91}" r="24"/>`,
      ),
    ].join("")
    design = `<g id="borders"><rect x="30" y="30" width="1540" height="980" rx="165" fill="${s.ink}"/><rect x="48" y="48" width="1504" height="944" rx="146" fill="${s.accent}"/><rect x="108" y="108" width="1384" height="824" rx="90" fill="${s.paper}"/><g fill="${s.paper}">${scallops}</g></g>
      <g id="brand">${lettering(s.brand, 800, 257, 146, 1190, s.ink)}</g>
      <g id="origin">${lettering(s.origin, 800, 317, 30, 1100, s.ink)}</g>
      <g id="illustration">${fish(975, 526, 1.13, s.ink, "#08a8bf", s.paper)}
        <g fill="${s.accent}"><circle cx="449" cy="347" r="28"/><circle cx="1197" cy="703" r="32"/><circle cx="429" cy="717" r="23"/><circle cx="1312" cy="338" r="8"/><circle cx="372" cy="340" r="8"/><circle cx="1273" cy="743" r="7"/></g>
        <g fill="${s.ink}"><path d="M449 323l-16-19 17 10 18-15-7 21 20 5-27 5Z"/><path d="M1197 676l-19-21 20 10 18-17-6 24 23 5-29 5Z"/></g>
        <g fill="#08a8bf"><path d="M1338 671l9 28 28 1-22 17 7 28-23-17-24 17 8-28-22-18 29 0Z"/><path d="M600 690l7 21 23 1-18 13 6 22-18-13-19 13 7-22-19-14 24 0Z"/></g>
      </g>
      <g id="product"><rect x="385" y="767" width="830" height="138" rx="29" fill="${s.accent}"/>${lettering(s.product, 800, 867, 100, 760, s.paper)}</g>
      <g id="detail">${lettering(s.detail, 800, 984, 24, 1220, s.paper)}</g>`
  } else if (s.layout === "mercato") {
    const stripes = Array.from(
      { length: 110 },
      (_, i) => `<path d="M58 ${70 + i * 6}H1542"/>`,
    ).join("")
    design = `<g id="borders"><rect x="35" y="35" width="1530" height="970" rx="160" fill="${s.paper}" stroke="${s.ink}" stroke-width="12"/><rect x="63" y="67" width="1474" height="683" rx="125" fill="#f7f0df"/><g stroke="${s.ink}" stroke-width="1" opacity=".33">${stripes}</g><rect x="55" y="55" width="1490" height="930" rx="142" fill="none" stroke="${s.accent}" stroke-width="4"/></g>
      <g id="product" transform="rotate(-3 960 246)">${lettering(s.product, 965, 246, 150, 1010, s.ink)}</g>
      <g id="brand" stroke="${s.ink}" stroke-width="8" paint-order="stroke fill">${lettering(s.brand, 930, 428, 147, 1080, s.accent)}</g>
      <g id="origin">${lettering(s.origin, 930, 497, 31, 1050, s.ink)}</g>
      <g id="illustration">${fish(1000, 630, 0.57, s.ink, s.accent, s.paper, true)}<circle cx="248" cy="239" r="101" fill="${s.paper}" stroke="${s.ink}" stroke-width="5"/>${fish(267, 247, 0.21, s.ink, s.accent, s.paper)}<path d="M490 710q-105-119-73-156 78 9 73 156Zm8 0q9-111 79-110-1 74-79 110" fill="${s.accent}"/></g>
      <g id="detail">${lettering(s.detail, 800, 885, 95, 1320, s.accent)}${lettering("CONSERVE DI MARE", 800, 954, 33, 1150, s.ink)}</g>`
  } else {
    design = `<g id="borders"><rect x="30" y="30" width="1540" height="980" rx="162" fill="none" stroke="${s.ink}" stroke-width="14"/><rect x="55" y="55" width="1490" height="930" rx="145" fill="none" stroke="${s.ink}" stroke-width="3"/></g>
      <g id="product">${lettering(s.product, 800, 241, 173, 1260, s.ink, true)}</g>
      <g id="origin">${lettering(s.origin, 800, 315, 32, 1180, s.ink)}</g>
      <g id="illustration">${fish(990, 536, 1.08, s.ink, s.ink, s.paper, true)}${lemon(296, 735, 1.03, s.ink, s.paper)}${lemon(1330, 358, 0.73, s.ink, s.paper)}<path d="M1345 712q99-74 81-125-84 10-81 125Zm-11 2q-8-88-82-107 5 77 82 107" fill="${s.accent}"/></g>
      <g id="brand">${lettering(s.brand, 877, 866, 103, 1160, s.ink, true)}</g>
      <g id="detail">${lettering(s.detail, 800, 946, 37, 1250, s.ink)}</g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1040" viewBox="0 0 1600 1040"><title>${escapeXml(s.brand)} editable lid label</title><defs><clipPath id="lid"><rect width="1600" height="1040" rx="190"/></clipPath></defs><g clip-path="url(#lid)"><rect id="base-color" width="1600" height="1040" fill="${s.paper}"/><g id="printed-artwork" transform="translate(${LABEL_WIDTH / 2} ${LABEL_HEIGHT / 2}) scale(${s.printScale}) translate(${-LABEL_WIDTH / 2} ${-LABEL_HEIGHT / 2})">${design}</g>${wearMarks(s.wear, s.paper)}</g></svg>`
}

export function guideSvg(settings: CanSettings = defaultSettings) {
  const tab = pullTabLayout(settings)
  const tabGuide = settings.pullTab
    ? `<ellipse cx="${tab.x}" cy="${tab.y}" rx="${tab.length / 2}" ry="${tab.breadth / 2}" transform="rotate(${tab.rotation} ${tab.x} ${tab.y})" stroke="#c63838" stroke-dasharray="14 10"/>`
    : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1040" viewBox="0 0 1600 1040"><title>Sardine Can lid placement guide</title><rect width="1600" height="1040" fill="#fff"/><g id="guides-delete-before-export" fill="none" stroke-width="3"><rect x="2" y="2" width="1596" height="1036" rx="190" stroke="#c63838"/><rect x="100" y="100" width="1400" height="840" rx="90" stroke="#28745d" stroke-dasharray="14 10"/><path d="M800 0V1040M0 520H1600" stroke="#bbb" stroke-dasharray="5 12"/>${tabGuide}</g><g id="instructions-delete-before-export" font-family="Arial, sans-serif" text-anchor="middle" fill="#173f50"><text x="800" y="420" font-size="52" font-weight="700">LID LABEL · 1600 × 1040 px</text><text x="800" y="485" font-size="28">Green: text-safe area · Red: visible edge and pull tab</text><text x="800" y="570" font-size="28">Keep artwork to the full canvas. Corners are clipped on the tin.</text><text x="800" y="625" font-size="28">Delete the guide and instruction groups before exporting.</text><text x="800" y="690" font-size="28">Upload PNG, JPG, WebP, or a self-contained SVG.</text><text x="800" y="795" font-size="24">sardinecan.app · Mockup guide, not a manufacturing dieline</text></g></svg>`
}

export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
