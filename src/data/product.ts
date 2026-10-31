export type Finish = {
  id: string;
  name: string;
  hex: string;
};

export type PaintPart = {
  id: string;
  label: string;
  materials: readonly string[];
};

export const finishes: Finish[] = [
  { id: "red", name: "Candy Apple Red", hex: "#d01218" },
  { id: "navy", name: "Navy", hex: "#163a6b" },
  { id: "blue", name: "Signal Blue", hex: "#1d6fd4" },
  { id: "green", name: "Industrial Green", hex: "#1f7a43" },
  { id: "yellow", name: "Safety Yellow", hex: "#e2b007" },
  { id: "orange", name: "Safety Orange", hex: "#e36a12" },
  { id: "grey", name: "Machine Grey", hex: "#b7bcc2" },
  { id: "graphite", name: "Graphite", hex: "#2c3136" },
];

const mixerParts: PaintPart[] = [
  {
    id: "body",
    label: "Body",
    materials: [
      "color-4",
      "candy apple red",
      "siena",
      "polished steel",
      "color-1",
      "color-3",
      "color-5",
      "color-6",
      "color-7",
      "color-8",
      "color-9",
      "light grey medium gloss plastic",
    ],
  },
  {
    id: "motors",
    label: "Motors",
    materials: [
      "metallic gold",
      "metallic gold-1",
      "metallic gold-2",
      "color",
      "color-10",
      "glossy rubber",
      "chromium plate",
    ],
  },
  {
    id: "frame",
    label: "Frame",
    materials: [
      "black",
      "black-1",
      "black-2",
      "black-3",
      "black-4",
      "black-5",
      "black medium gloss plastic",
      "black low gloss plastic",
      "carbon steel",
      "matte steel",
      "satin finish stainless steel",
      "",
    ],
  },
];

const assemblyParts: PaintPart[] = [
  {
    id: "housing",
    label: "Housing",
    materials: [
      "color",
      "color-1",
      "color-2",
      "color-3",
      "color-4",
      "color-5",
      "color-6",
      "candy apple red",
      "siena",
      "siena-1",
      "blue soft touch plastic",
      "white soft touch plastic",
      "white soft touch plastic-1",
      "beige medium gloss plastic",
      "light grey medium gloss plastic",
      "glossy rubber",
      "white",
    ],
  },
  {
    id: "motors",
    label: "Motors",
    materials: [
      "metallic gold",
      "metallic gold-1",
      "metallic gold-2",
      "metallic gold-3",
      "metallic gold-4",
      "polished brass",
    ],
  },
  {
    id: "structure",
    label: "Structure",
    materials: [
      "black medium gloss plastic",
      "black medium gloss plastic-1",
      "black low gloss plastic",
      "black-6",
      "black-7",
      "black-8",
      "black-9",
      "black-10",
      "black-11",
      "black-12",
      "black-13",
      "black-14",
      "black-15",
      "black-16",
      "black-17",
      "black-18",
      "black-19",
      "black-20",
      "black-21",
      "black-22",
      "black-23",
      "black-24",
      "black-25",
      "black-26",
      "black-31",
      "chromium plate-2",
      "polished steel",
      "polished steel-1",
      "polished steel-2",
      "metallic cool grey",
    ],
  },
  {
    id: "conveyor",
    label: "Conveyor",
    materials: [
      "black",
      "black-1",
      "black-2",
      "black-3",
      "black-4",
      "black-5",
      "black-27",
      "black-28",
      "black-29",
      "black-30",
      "black-32",
      "black-33",
      "black-35",
      "black-36",
      "chromium plate",
      "chromium plate-1",
      "blue",
      "green",
      "matte steel",
    ],
  },
];

export const products = [
  {
    id: "mixer",
    label: "Mixer",
    src: "/models/mixer.glb",
    alt: "Industrial mixer with inclined conveyor",
    parts: mixerParts,
  },
  {
    id: "assembly",
    label: "Assembly",
    src: "/models/assembly_final.glb",
    alt: "Industrial assembly",
    parts: assemblyParts,
  },
] as const;

export function productById(id: ProductId) {
  return products.find((item) => item.id === id) ?? products[0];
}

export type ProductId = (typeof products)[number]["id"];

export const cameraAngles = [
  { id: "three-quarter", label: "3/4", orbit: "28deg 68deg auto" },
  { id: "side", label: "Side", orbit: "0deg 78deg auto" },
  { id: "end", label: "End", orbit: "90deg 72deg auto" },
  { id: "top", label: "Top", orbit: "24deg 12deg auto" },
];
