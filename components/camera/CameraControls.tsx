"use client";

import type { ReactNode } from "react";
import {
  Clock,
  Crosshair,
  FilePlus,
  Folder,
  Images,
  LayoutGrid,
  MapPin,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CameraMode } from "@/types";

const MODES: { id: CameraMode; label: string }[] = [
  { id: "share", label: "Share photo" },
  { id: "photo", label: "Photo" },
  { id: "video", label: "Video" },
  { id: "reports", label: "Reports" },
];

export function CameraControls({
  grid,
  flashOn,
  flashAvailable,
  noteOn,
  manualTime,
  locationState,
  online,
  mode,
  recording,
  templateBadge,
  onGrid,
  onFlash,
  onNote,
  onLocation,
  onDateTime,
  onSettings,
  onMode,
  onPreview,
  onStorage,
  onTemplate,
  onShutter,
  shutterDisabled,
  children,
}: {
  children: ReactNode;
  grid: boolean;
  flashOn: boolean;
  flashAvailable: boolean;
  noteOn: boolean;
  manualTime: boolean;
  locationState: "unset" | "automatic" | "manual";
  online: boolean;
  mode: CameraMode;
  recording: boolean;
  templateBadge: number;
  onGrid: () => void;
  onFlash: () => void;
  onNote: () => void;
  onLocation: () => void;
  onDateTime: () => void;
  onSettings: () => void;
  onMode: (mode: CameraMode) => void;
  onPreview: () => void;
  onStorage: () => void;
  onTemplate: () => void;
  onShutter: () => void;
  shutterDisabled: boolean;
}) {
  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {!online ? (
        <p className="z-30 bg-amber-400 px-3 py-1 text-center text-xs font-semibold text-black">
          Offline. Address lookup needs a connection. Camera and a manual location can still work.
        </p>
      ) : null}
      <header className="relative z-20 flex items-center justify-between px-1 pt-[max(0.25rem,env(safe-area-inset-top))]">
        <IconButton label="Toggle grid" pressed={grid} onClick={onGrid}>
          <Crosshair className="size-5" />
        </IconButton>
        <IconButton label={flashOn ? "Turn flash off" : "Turn flash on"} pressed={flashOn} disabledLook={!flashAvailable} onClick={onFlash}>
          <Zap className={cn("size-5", flashOn && "fill-current")} />
        </IconButton>
        <IconButton label="Stamp note" pressed={noteOn} onClick={onNote}>
          <FilePlus className="size-5" />
        </IconButton>
        <IconButton
          label={
            locationState === "manual"
              ? "Manual location"
              : locationState === "automatic"
                ? "GPS location"
                : "Location not set"
          }
          pressed={locationState !== "unset"}
          onClick={onLocation}
        >
          <MapPin className="size-5" />
          <span
            className={cn(
              "absolute top-1.5 right-1.5 size-1.5 rounded-full",
              locationState === "automatic" && "bg-emerald-400",
              locationState === "manual" && "bg-primary",
              locationState === "unset" && "bg-white/30",
            )}
          />
        </IconButton>
        <IconButton label="Date and time" pressed={manualTime} onClick={onDateTime}>
          <Clock className="size-5" />
        </IconButton>
        <IconButton label={`Settings, ${online ? "online" : "offline"}`} onClick={onSettings}>
          <Settings className="size-5" />
          <span className={cn("absolute top-1.5 right-1.5 size-1.5 rounded-full", online ? "bg-emerald-400" : "bg-amber-400")} />
        </IconButton>
      </header>
      {children}
      <div className="z-20 flex items-center justify-center gap-3 px-2 py-2 text-[11px] font-semibold tracking-wide uppercase">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onMode(item.id)}
            className={cn(
              "rounded-full px-2.5 py-1",
              mode === item.id ? "bg-primary text-black" : "text-white/85",
            )}
            aria-pressed={mode === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
      <nav className="z-20 flex items-end justify-between px-4 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <SideButton label="Preview" onClick={onPreview}>
          <Images className="size-6" />
        </SideButton>
        <SideButton label="Locations" onClick={onLocation}>
          <MapPin className="size-6" />
        </SideButton>
        <button
          type="button"
          onClick={onShutter}
          disabled={shutterDisabled}
          aria-label={mode === "video" ? (recording ? "Stop recording" : "Start recording") : "Take photo"}
          className="grid size-[74px] place-items-center rounded-full border-[5px] border-white transition-transform active:scale-95 disabled:opacity-40"
        >
          {mode === "video" ? (
            <span className={cn("bg-red-500", recording ? "size-6 rounded-sm" : "size-[50px] rounded-full")} />
          ) : null}
        </button>
        <SideButton label="Gallery" onClick={onStorage}>
          <Folder className="size-6" />
        </SideButton>
        <SideButton label="Template" onClick={onTemplate} badge={templateBadge}>
          <LayoutGrid className="size-6" />
        </SideButton>
      </nav>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  pressed,
  disabledLook,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabledLook?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "relative grid size-11 place-items-center rounded-full",
        pressed ? "text-primary" : "text-white",
        disabledLook && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function SideButton({
  children,
  label,
  onClick,
  badge,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-14 flex-col items-center gap-1 text-[10px] text-white">
      <span className="relative">
        {children}
        {badge ? (
          <span className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full bg-red-600 text-[10px] font-bold">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  );
}
