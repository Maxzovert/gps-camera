"use client";

import { ImagePlus, SwitchCamera } from "lucide-react";
import Image from "next/image";
import { forwardRef, type RefObject } from "react";
import { ExposureSlider } from "@/components/camera/ExposureSlider";
import { StampPreview } from "@/components/stamp/StampPreview";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { formatDuration } from "@/lib/format";
import type { CameraStatus, FacingMode, StampModel, StampSettings } from "@/types";

export const CameraView = forwardRef<
  HTMLDivElement,
  {
    videoRef: RefObject<HTMLVideoElement | null>;
    status: CameraStatus;
    error: string | null;
    facing: FacingMode;
    zoom: 1 | 2;
    exposure: number;
    grid: boolean;
    recording: boolean;
    elapsed: number;
    countdown: number | null;
    model: StampModel;
    settings: StampSettings;
    mapUrl: string | null;
    onZoom: (zoom: 1 | 2) => void;
    onExposure: (value: number) => void;
    onSwitchCamera: () => void;
    onEnableCamera: () => void;
    onOpenPhoneCamera: () => void;
    onImport: () => void;
  }
>(function CameraView(
  {
    videoRef,
    status,
    error,
    facing,
    zoom,
    exposure,
    grid,
    recording,
    elapsed,
    countdown,
    model,
    settings,
    mapUrl,
    onZoom,
    onExposure,
    onSwitchCamera,
    onEnableCamera,
    onOpenPhoneCamera,
    onImport,
  },
  ref,
) {
  return (
    <div ref={ref} className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        style={{
          transform: `scale(${facing === "user" ? -zoom : zoom}, ${zoom})`,
          filter: `brightness(${(1 + exposure * 0.18).toFixed(3)})`,
        }}
        playsInline
        muted
        autoPlay
        controls={false}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/45 to-transparent" />
      {grid ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/3 h-full w-px bg-white/30" />
          <div className="absolute top-0 left-2/3 h-full w-px bg-white/30" />
          <div className="absolute top-1/3 left-0 h-px w-full bg-white/30" />
          <div className="absolute top-2/3 left-0 h-px w-full bg-white/30" />
        </div>
      ) : null}
      {status !== "ready" ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-6 pb-24 text-center">
          <div className="pointer-events-auto max-w-xs">
            <Image src={LOGO_SRC} alt="" width={96} height={96} className="mx-auto size-24 rounded-3xl object-cover shadow-lg" priority />
            <h1 className="mt-3 text-xl font-semibold">{APP_NAME}</h1>
            <p className="mt-2 text-sm leading-5 text-white/70">
              {status === "requesting"
                ? "Starting the camera…"
                : error ||
                  "The camera stays on this device. Photos are stamped in your browser and are not uploaded."}
            </p>
            {status !== "requesting" ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={onEnableCamera}
                  className="h-12 rounded-full bg-primary px-6 text-sm font-semibold text-black"
                >
                  {status === "idle" ? "Enable camera" : "Try again"}
                </button>
                {status === "denied" ? (
                  <button
                    type="button"
                    onClick={onOpenPhoneCamera}
                    className="h-12 rounded-full bg-white px-6 text-sm font-semibold text-black"
                  >
                    Open phone camera
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onImport}
                  className="h-12 rounded-full border border-white/25 px-6 text-sm font-semibold text-white"
                >
                  Stamp a gallery photo
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <h1 className="sr-only">{APP_NAME}</h1>
      )}
      <button
        type="button"
        onClick={onSwitchCamera}
        className="absolute top-[22%] left-3 z-30 grid size-11 place-items-center rounded-full bg-black/45 text-white"
        aria-label={facing === "environment" ? "Switch to front camera" : "Switch to rear camera"}
      >
        <SwitchCamera className="size-5" />
      </button>
      {status === "ready" ? (
        <button
          type="button"
          onClick={onImport}
          className="absolute top-[calc(22%+3.25rem)] left-3 z-30 grid size-11 place-items-center rounded-full bg-black/45 text-white"
          aria-label="Stamp a photo from your gallery"
        >
          <ImagePlus className="size-5" />
        </button>
      ) : null}
      <ExposureSlider value={exposure} onChange={onExposure} />
      {recording ? (
        <div className="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold">
          <span className="size-2 animate-pulse rounded-full bg-red-500" />
          {formatDuration(elapsed)}
        </div>
      ) : null}
      {countdown != null ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/25">
          <span className="text-7xl font-semibold text-primary tabular-nums">{countdown}</span>
        </div>
      ) : null}
      <StampPreview model={model} settings={settings} mapUrl={mapUrl} zoom={zoom} onZoom={onZoom} showZoom />
    </div>
  );
});
