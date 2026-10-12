"use client";

import { Camera, MapPin } from "lucide-react";

export function PermissionPopup({
  open,
  cameraBusy,
  locationBusy,
  cameraError,
  locationError,
  onAllowCamera,
  onAllowLocation,
  onClose,
}: {
  open: boolean;
  cameraBusy: boolean;
  locationBusy: boolean;
  cameraError: string | null;
  locationError: string | null;
  onAllowCamera: () => void;
  onAllowLocation: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-title"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-5 text-white shadow-2xl"
      >
        <h2 id="permission-title" className="text-lg font-semibold">
          Allow camera and location
        </h2>
        <p className="mt-2 text-sm leading-5 text-white/70">
          Your phone will show a permission popup for each. The same popups appear in the browser and in the installed app.
        </p>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onAllowCamera}
            disabled={cameraBusy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-black disabled:opacity-60"
          >
            <Camera className="size-4" />
            {cameraBusy ? "Waiting for the camera popup…" : "Allow camera"}
          </button>
          {cameraError ? <p className="text-xs leading-4 text-red-300">{cameraError}</p> : null}
          <button
            type="button"
            onClick={onAllowLocation}
            disabled={locationBusy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold disabled:opacity-60"
          >
            <MapPin className="size-4" />
            {locationBusy ? "Waiting for the location popup…" : "Allow location"}
          </button>
          {locationError ? <p className="text-xs leading-4 text-red-300">{locationError}</p> : null}
        </div>
        <p className="mt-3 text-xs leading-4 text-white/50">
          If no popup appears, tap the lock icon in the address bar and set Camera and Location to Allow.
        </p>
        <button type="button" onClick={onClose} className="mt-3 h-11 w-full text-sm text-white/70">
          Not now
        </button>
      </div>
    </div>
  );
}
