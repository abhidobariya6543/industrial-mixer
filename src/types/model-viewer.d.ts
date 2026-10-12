import type { ModelViewerElement } from "@google/model-viewer";

type ModelViewerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<ModelViewerElement>,
  ModelViewerElement
> & {
  src?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: number | string;
  "camera-controls"?: boolean;
  "camera-orbit"?: string;
  exposure?: number | string;
  "environment-image"?: string;
  "field-of-view"?: string;
  "interaction-prompt"?: "auto" | "when-focused" | "none";
  loading?: "auto" | "lazy" | "eager";
  "max-field-of-view"?: string;
  "min-field-of-view"?: string;
  "rotation-per-second"?: string;
  "shadow-intensity"?: number | string;
  "touch-action"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

export {};
