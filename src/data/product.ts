export type Finish = {
  id: string;
  name: string;
  hex: string;
};

export type PaintPart = {
  id: "body" | "motors" | "frame";
  label: string;
  materials: string[];
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

export const paintParts: PaintPart[] = [
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

export const cameraAngles = [
  { id: "three-quarter", label: "3/4", orbit: "28deg 68deg auto" },
  { id: "side", label: "Side", orbit: "0deg 78deg auto" },
  { id: "end", label: "End", orbit: "90deg 72deg auto" },
  { id: "top", label: "Top", orbit: "24deg 12deg auto" },
];
