export interface CanSettings {
  layout: "maritime" | "mercato" | "classic"
  brand: string
  product: string
  origin: string
  detail: string
  paper: string
  ink: string
  accent: string
  metal: "silver" | "gold"
  wear: number
  printScale: number
  roughness: number
  pullTab: boolean
  pullTabPosition:
    | "top-left"
    | "top"
    | "top-right"
    | "left"
    | "right"
    | "bottom-left"
    | "bottom"
    | "bottom-right"
  pullTabSize: number
  pullTabAngle: number
  background: "paper" | "transparent" | "ink"
  exportSize: number
}

export const defaultSettings: CanSettings = {
  layout: "maritime",
  brand: "MARÉ ALTA",
  product: "SARDINHAS",
  origin: "MATOSINHOS · PORTUGAL",
  detail: "EM AZEITE · NET WT. 120 g",
  paper: "#fff3df",
  ink: "#18292d",
  accent: "#d52935",
  metal: "gold",
  wear: 0.1,
  printScale: 1,
  roughness: 0.32,
  pullTab: true,
  pullTabPosition: "top-left",
  pullTabSize: 1,
  pullTabAngle: 0,
  background: "transparent",
  exportSize: 2048,
}

export interface Template {
  id: string
  name: string
  place: string
  settings: CanSettings
  image: string
  thumbnail: string
}

export const templates: Template[] = [
  {
    id: "mare",
    image: "/templates/portugal.png",
    thumbnail: "/templates/portugal-thumb.png",
    name: "Maré Alta",
    place: "Portuguese cannery",
    settings: {
      ...defaultSettings,
      product: "SARDINHAS EM TOMATE",
      detail: "CONSERVAS PORTUGUESAS · PESO LÍQUIDO 120 g",
      pullTabPosition: "left",
      wear: 0,
    },
  },
  {
    id: "sole",
    image: "/templates/italian.png",
    thumbnail: "/templates/italian-thumb.png",
    name: "Sole di Sicilia",
    place: "Italian market",
    settings: {
      ...defaultSettings,
      layout: "mercato",
      brand: "SOLE DI SICILIA",
      product: "SARDINE PICCANTI",
      pullTabPosition: "top-right",
      origin: "PESCATE NEL MEDITERRANEO",
      detail: "IN OLIO D’OLIVA · 120 g",
      paper: "#f3cf35",
      ink: "#18363a",
      accent: "#c82f35",
      metal: "silver",
      wear: 0,
    },
  },
  {
    id: "nord",
    image: "/templates/french.png",
    thumbnail: "/templates/french-thumb.png",
    name: "Nord Atlantique",
    place: "French Atlantic",
    settings: {
      ...defaultSettings,
      layout: "classic",
      brand: "NORD ATLANTIQUE",
      product: "SARDINES AU CITRON",
      pullTabPosition: "right",
      origin: "CONCARNEAU · BRETAGNE",
      detail: "À L’HUILE D’OLIVE · 120 g",
      paper: "#f4d139",
      ink: "#174d38",
      accent: "#d34b24",
      metal: "silver",
      wear: 0,
    },
  },
  {
    id: "porto-doro",
    name: "Porto d’Oro",
    place: "Italian typography",
    image: "/templates/porto-doro.png",
    thumbnail: "/templates/porto-doro-thumb.png",
    settings: {
      ...defaultSettings,
      layout: "mercato",
      brand: "PORTO D’ORO",
      pullTabPosition: "top-left",
      product: "SARDINE",
      origin: "DI SICILIA",
      detail: "ALL’OLIO D’OLIVA · SPECIALITÀ DELLA CASA",
      paper: "#f5ce00",
      ink: "#171714",
      accent: "#e3292e",
      metal: "silver",
      wear: 0,
    },
  },
]
