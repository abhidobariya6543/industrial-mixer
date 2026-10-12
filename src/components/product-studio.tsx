"use client";

import type { ModelViewerElement } from "@google/model-viewer";
import { useEffect, useRef, useState } from "react";
import {
  cameraAngles,
  paintParts,
  finishes,
  type Finish,
  type PaintPart,
} from "@/data/product";

const initialOrbit = cameraAngles[0].orbit;
const pageScale = "1 1 1";

const arSizes = [
  { id: "auto", label: "Auto", scale: null },
  { id: "small", label: "Small", scale: "0.35 0.35 0.35" },
  { id: "medium", label: "Medium", scale: "0.55 0.55 0.55" },
  { id: "large", label: "Large", scale: "0.85 0.85 0.85" },
] as const;

type ArSizeId = (typeof arSizes)[number]["id"];

function ArSizePicker({
  value,
  onChange,
}: {
  value: ArSizeId;
  onChange: (id: ArSizeId) => void;
}) {
  return (
    <div className="mt-4" aria-label="AR size">
      <p className="text-sm text-[#6f6a62]">Size</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {arSizes.map((size) => {
          const selected = size.id === value;
          return (
            <button
              key={size.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(size.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                selected
                  ? "bg-[#1a1916] text-white"
                  : "bg-[#f4f1eb] text-[#1a1916]"
              }`}
            >
              {size.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isHandheld() {
  const agent = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(agent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

async function qrDataUrl(url: string) {
  const mod = await import("qrcode");
  const encoder = mod as typeof import("qrcode") & {
    default?: typeof import("qrcode");
  };
  const toDataURL = encoder.toDataURL ?? encoder.default?.toDataURL;
  if (!toDataURL) throw new Error("QR encoder missing");
  return toDataURL(url, {
    margin: 1,
    width: 196,
    color: { dark: "#1a1916", light: "#ffffff" },
  });
}

type PartColors = Record<PaintPart["id"], Finish | null>;

type SavedMaterial = {
  color: [number, number, number, number];
  metallic: number;
};

const paintedMetals = new Set([
  "carbon steel",
  "chromium plate",
  "satin finish stainless steel",
  "matte steel",
  "polished steel",
]);

function untouchedColors(): PartColors {
  return { body: null, motors: null, frame: null };
}

function captureOriginals(viewer: ModelViewerElement) {
  const saved = new Map<string, SavedMaterial>();
  for (const material of viewer.model?.materials ?? []) {
    const name = material.name ?? "";
    if (saved.has(name)) continue;
    const factor = material.pbrMetallicRoughness.baseColorFactor;
    saved.set(name, {
      color: [factor[0], factor[1], factor[2], factor[3] ?? 1],
      metallic: material.pbrMetallicRoughness.metallicFactor,
    });
  }
  return saved;
}

function restorePart(
  viewer: ModelViewerElement,
  part: PaintPart,
  originals: Map<string, SavedMaterial>,
) {
  const names = new Set(part.materials);
  for (const material of viewer.model?.materials ?? []) {
    const name = material.name ?? "";
    if (!names.has(name)) continue;
    const saved = originals.get(name);
    if (!saved) continue;
    material.pbrMetallicRoughness.setBaseColorFactor(saved.color);
    material.pbrMetallicRoughness.setMetallicFactor(saved.metallic);
  }
}

function paintPart(viewer: ModelViewerElement, part: PaintPart, hex: string) {
  const names = new Set(part.materials);
  for (const material of viewer.model?.materials ?? []) {
    if (!names.has(material.name ?? "")) continue;
    material.pbrMetallicRoughness.setBaseColorFactor(hex);
    if (paintedMetals.has(material.name ?? "")) {
      material.pbrMetallicRoughness.setMetallicFactor(0.25);
    }
  }
}

function applyColors(
  viewer: ModelViewerElement,
  colors: PartColors,
  originals: Map<string, SavedMaterial> | null,
) {
  if (!originals) return;
  for (const part of paintParts) {
    const finish = colors[part.id];
    if (finish) paintPart(viewer, part, finish.hex);
    else restorePart(viewer, part, originals);
  }
}

export function ProductStudio() {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [partId, setPartId] = useState<PaintPart["id"]>("body");
  const [colors, setColors] = useState<PartColors>(untouchedColors);
  const [angleId, setAngleId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [arSize, setArSize] = useState<ArSizeId>("auto");
  const [arGuide, setArGuide] = useState(false);
  const [openingAr, setOpeningAr] = useState(false);
  const [arHelp, setArHelp] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [localPage, setLocalPage] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const [arUnsupported, setArUnsupported] = useState(false);
  const originalsRef = useRef<Map<string, SavedMaterial> | null>(null);
  const spinningRef = useRef(spinning);
  spinningRef.current = spinning;
  const activePart = paintParts.find((part) => part.id === partId) ?? paintParts[0];

  useEffect(() => {
    let active = true;
    void import("@google/model-viewer")
      .then(() => {
        if (active) setViewerReady(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady) return;

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress: number }>).detail;
      setProgress(Math.round((detail?.totalProgress ?? 0) * 100));
    };
    const onLoad = () => {
      if (!originalsRef.current) originalsRef.current = captureOriginals(viewer);
      setLoaded(true);
      setFailed(false);
      if (!viewer.dataset.orbitReady) {
        viewer.cameraOrbit = initialOrbit;
        viewer.dataset.orbitReady = "true";
      }
      viewer.autoRotateDelay = 700;
      viewer.setAttribute("rotation-per-second", "16deg");
      viewer.autoRotate = spinningRef.current;
    };
    const onError = () => setFailed(true);

    viewer.addEventListener("progress", onProgress);
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    if (viewer.loaded) onLoad();

    return () => {
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [viewerReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded) return;
    applyColors(viewer, colors, originalsRef.current);
  }, [colors, loaded]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded) return;
    viewer.autoRotate = spinning;
  }, [spinning, loaded]);

  useEffect(() => {
    if (!arHelp && !arGuide) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setArHelp(false);
        setArGuide(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [arHelp, arGuide]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !loaded) return;
    const onStatus = (event: Event) => {
      const status = (event as CustomEvent<{ status: string }>).detail?.status;
      if (status === "not-presenting") viewer.scale = pageScale;
      if (status === "failed") {
        viewer.scale = pageScale;
        setOpeningAr(false);
        setArError("AR could not start. Try again on this device.");
        setArGuide(true);
      }
    };
    viewer.addEventListener("ar-status", onStatus);
    return () => viewer.removeEventListener("ar-status", onStatus);
  }, [loaded, viewerReady]);

  function chooseColor(finish: Finish) {
    setColors((current) => ({ ...current, [partId]: finish }));
  }

  function showAngle(angle: (typeof cameraAngles)[number]) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraTarget = "auto auto auto";
    viewer.fieldOfView = "auto";
    viewer.cameraOrbit = angle.orbit;
    viewer.jumpCameraToGoal();
    viewer.autoRotate = spinning;
    setAngleId(angle.id);
  }

  function showPhoneNotice() {
    const url = window.location.href;
    const local = isLocalHost(window.location.hostname);
    setPageUrl(url);
    setLocalPage(local);
    setQrUrl(null);
    setQrFailed(false);
    setArGuide(false);
    setArHelp(true);
    if (local) return;
    void qrDataUrl(url)
      .then((code) => setQrUrl(code))
      .catch(() => setQrFailed(true));
  }

  async function openCamera() {
    const viewer = viewerRef.current;
    if (!viewer || openingAr) return;
    if (!isHandheld()) {
      showPhoneNotice();
      return;
    }
    if (!viewer.canActivateAR) {
      setArError(
        "This device cannot open AR. On iPhone, iPad, or iPod, use Safari. On an Android phone or tablet, use Chrome.",
      );
      return;
    }
    const choice = arSizes.find((size) => size.id === arSize) ?? arSizes[0];
    setArError(null);
    setOpeningAr(true);
    if (choice.scale) {
      viewer.arScale = "fixed";
      viewer.scale = choice.scale;
    } else {
      viewer.arScale = "auto";
      viewer.scale = pageScale;
    }
    try {
      await viewer.updateComplete;
      await viewer.activateAR();
      if (viewer.getAttribute("ar-status") === "failed") {
        throw new Error("AR failed");
      }
      setArGuide(false);
    } catch {
      viewer.scale = pageScale;
      setArError("AR could not start. Try again on this device.");
    } finally {
      if (viewer.getAttribute("ar-status") !== "session-started") {
        viewer.scale = pageScale;
      }
      setOpeningAr(false);
    }
  }

  function viewInAr() {
    const viewer = viewerRef.current;
    setArError(null);
    if (!isHandheld()) {
      showPhoneNotice();
      return;
    }
    const ready = Boolean(viewer?.canActivateAR);
    setArUnsupported(!ready);
    if (!ready) {
      setArError(
        "This device cannot open AR. On iPhone, iPad, or iPod, use Safari. On an Android phone or tablet, use Chrome.",
      );
    }
    setArGuide(true);
  }

  function resetAll() {
    const viewer = viewerRef.current;
    setColors(untouchedColors());
    setPartId("body");
    setAngleId(null);
    setSpinning(true);
    setArSize("auto");
    if (!viewer) return;
    viewer.scale = pageScale;
    viewer.autoRotate = true;
    viewer.cameraTarget = "auto auto auto";
    viewer.fieldOfView = "auto";
    viewer.cameraOrbit = initialOrbit;
    viewer.jumpCameraToGoal();
  }

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#eceae4] text-[#1a1916]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#fbfbfa_0%,#e8e4dc_58%,#d9d4ca_100%)]" />
      {viewerReady ? (
        <model-viewer
          ref={viewerRef}
          className="absolute inset-0 h-full w-full"
          src="/models/mixer.glb"
          alt="Industrial mixer with inclined conveyor"
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1.15"
          environment-image="neutral"
          exposure="1.05"
          interaction-prompt="none"
          loading="eager"
          min-field-of-view="16deg"
          max-field-of-view="42deg"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
        />
      ) : null}

      {!loaded && !failed ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-56 text-center">
            <p className="text-xs tracking-[0.18em] text-[#6f6a62] uppercase">
              Loading model
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#d5d0c7]">
              <div
                className="h-full bg-[#1a1916] transition-[width] duration-200"
                style={{ width: `${Math.max(progress, 8)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-[#6f6a62]">{progress}%</p>
          </div>
        </div>
      ) : null}

      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="max-w-sm text-sm text-[#6f6a62]">
            The 3D model could not be loaded. Refresh the page and try again.
          </p>
        </div>
      ) : null}

      <div className="absolute inset-x-0 top-4 flex justify-center px-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex gap-1 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur">
          {cameraAngles.map((angle) => {
            const selected = angle.id === angleId;
            return (
              <button
                key={angle.id}
                type="button"
                aria-pressed={selected}
                onClick={() => showAngle(angle)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  selected
                    ? "bg-[#1a1916] text-white"
                    : "text-[#1a1916] hover:bg-black/5"
                }`}
              >
                {angle.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={spinning}
          aria-label="Auto rotate"
          onClick={() => setSpinning((on) => !on)}
          className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pr-1.5 pl-3 text-sm text-[#1a1916] shadow-sm backdrop-blur hover:bg-white"
        >
          Rotate
          <span
            className={`relative h-5 w-9 rounded-full transition ${
              spinning ? "bg-[#1a1916]" : "bg-[#d6d1c8]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${
                spinning ? "translate-x-4" : ""
              }`}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-full bg-white/90 px-3 py-1.5 text-sm text-[#1a1916] shadow-sm backdrop-blur hover:bg-white"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={viewInAr}
          disabled={!loaded}
          className="rounded-full bg-[#1a1916] px-3 py-1.5 text-sm text-white shadow-sm hover:bg-black disabled:opacity-40"
        >
          View in AR
        </button>
        </div>
      </div>

      {arGuide ? (
        <div
          className="absolute inset-0 z-20 flex items-end justify-center bg-[#1a1916]/30 p-4 sm:items-center"
          onClick={() => {
            if (!openingAr) setArGuide(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ar-guide-title"
            className="w-full max-w-sm rounded-3xl bg-white px-5 py-5 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="ar-guide-title" className="text-base font-medium">
              {arUnsupported ? "AR is not available" : "Place the mixer"}
            </h2>
            {arUnsupported ? (
              <p className="mt-3 text-sm leading-6 text-[#9a3412]" role="alert">
                {arError}
              </p>
            ) : (
              <>
                <ArSizePicker value={arSize} onChange={setArSize} />
                <ul className="mt-3 space-y-1 text-sm leading-6 text-[#5c574f]">
                  <li>Drag to move it.</li>
                  <li>Walk closer to see it.</li>
                  <li>Tap the screen to set it down.</li>
                </ul>
                {arError ? (
                  <p className="mt-3 text-sm leading-6 text-[#9a3412]" role="alert">
                    {arError}
                  </p>
                ) : null}
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (arUnsupported) setArGuide(false);
                else void openCamera();
              }}
              disabled={openingAr}
              className="mt-4 rounded-full bg-[#1a1916] px-4 py-1.5 text-sm text-white disabled:opacity-40"
            >
              {arUnsupported ? "Close" : openingAr ? "Opening camera" : "Open camera"}
            </button>
          </div>
        </div>
      ) : null}

      {arHelp ? (
        <div
          className="absolute inset-0 z-20 flex items-end justify-center bg-[#1a1916]/30 p-4 sm:items-center"
          onClick={() => setArHelp(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ar-title"
            className="w-full max-w-sm rounded-3xl bg-white px-5 py-5 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="ar-title" className="text-base font-medium">
              Use a mobile device
            </h2>
            {localPage ? (
              <p className="mt-2 text-sm leading-6 text-[#5c574f]">
                View in AR does not run on a computer or laptop. Open this page
                on a phone, iPad, iPod, or tablet, then tap View in AR.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-[#5c574f]">
                  View in AR does not run on a computer or laptop. Scan this
                  code with a phone, iPad, iPod, or tablet, then tap View in AR.
                </p>
                <div className="mx-auto mt-4 flex h-52 w-52 items-center justify-center rounded-2xl bg-[#f4f1eb]">
                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrUrl}
                      alt=""
                      width={196}
                      height={196}
                      className="h-48 w-48"
                    />
                  ) : (
                    <p className="px-4 text-sm text-[#6f6a62]">
                      {qrFailed
                        ? "The code could not be created. Open the address below on a phone, iPad, iPod, or tablet."
                        : "Preparing code"}
                    </p>
                  )}
                </div>
                {pageUrl ? (
                  <p className="mt-3 break-all text-xs text-[#6f6a62]">{pageUrl}</p>
                ) : null}
              </>
            )}
            <button
              type="button"
              onClick={() => setArHelp(false)}
              className="mt-4 rounded-full bg-[#1a1916] px-4 py-1.5 text-sm text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <p className="pointer-events-none absolute bottom-3 left-4 z-10 text-xs text-[#6f6a62]">
        Abhi Dobariya
      </p>

      <div className="absolute inset-x-4 bottom-8 flex justify-center sm:bottom-10">
        <div className="w-full max-w-md rounded-3xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <div className="mb-3 flex justify-center gap-1">
            {paintParts.map((part) => {
              const selected = part.id === partId;
              return (
                <button
                  key={part.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPartId(part.id)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    selected
                      ? "bg-[#1a1916] text-white"
                      : "text-[#5c574f] hover:bg-black/5"
                  }`}
                >
                  {part.label}
                </button>
              );
            })}
          </div>
          <p className="mb-2 text-center text-sm font-medium">
            {colors[partId]?.name ?? "Original"}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              aria-label={`${activePart.label} original color`}
              aria-pressed={colors[partId] === null}
              onClick={() =>
                setColors((current) => ({ ...current, [partId]: null }))
              }
              className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white text-[#1a1916] shadow-sm ${
                colors[partId] === null
                  ? "border-[#1a1916] ring-2 ring-[#1a1916] ring-offset-2 ring-offset-white"
                  : "border-black/10 hover:scale-105"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                />
                <path
                  d="M7.4 16.6 16.6 7.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {finishes.map((option) => {
              const selected = option.id === colors[partId]?.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`${activePart.label} ${option.name}`}
                  aria-pressed={selected}
                  onClick={() => chooseColor(option)}
                  className={`h-9 w-9 rounded-full border shadow-sm transition ${
                    selected
                      ? "border-[#1a1916] ring-2 ring-[#1a1916] ring-offset-2 ring-offset-white"
                      : "border-black/10 hover:scale-105"
                  }`}
                  style={{ backgroundColor: option.hex }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
