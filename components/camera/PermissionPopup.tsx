"use client";

import { Camera, MapPin, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { usePermissionHost } from "@/lib/permission-host";

export function PermissionPopup({
  open,
  cameraBusy,
  locationBusy,
  cameraDenied,
  locationDenied,
  cameraError,
  locationError,
  onAllowCamera,
  onAllowLocation,
  onOpenSettings,
  onClose,
}: {
  open: boolean;
  cameraBusy: boolean;
  locationBusy: boolean;
  cameraDenied: boolean;
  locationDenied: boolean;
  cameraError: string | null;
  locationError: string | null;
  onAllowCamera: () => void;
  onAllowLocation: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  const host = usePermissionHost();
  if (!open) return null;
  const android = host === "android";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-title"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-5 text-white shadow-2xl"
      >
        <h2 id="permission-title" className="text-lg font-semibold">
          {android ? "Allow Android camera and location" : "Allow Chrome camera and location"}
        </h2>
        <p className="mt-2 text-sm leading-5 text-white/70">
          {android
            ? "Android will show its own permission popup for the camera, then for location."
            : "Chrome will show its own permission popup for the camera, then for location."}
        </p>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onAllowCamera}
            disabled={cameraBusy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-black disabled:opacity-60"
          >
            <Camera className="size-4" />
            {cameraBusy ? "Waiting for the camera popup…" : cameraDenied ? "Try camera again" : android ? "Allow Android camera" : "Allow Chrome camera"}
          </button>
          {android && cameraDenied ? (
            <ol className="list-decimal space-y-1 pl-4 text-xs leading-4 text-white/80">
              <li>Tap Open Android settings.</li>
              <li>Open {APP_NAME}.</li>
              <li>Permissions, then Camera, then Allow.</li>
              <li>Come back and tap Try camera again.</li>
            </ol>
          ) : cameraError ? (
            <p className="text-xs leading-4 text-red-300">{cameraError}</p>
          ) : null}
          <button
            type="button"
            onClick={onAllowLocation}
            disabled={locationBusy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold disabled:opacity-60"
          >
            <MapPin className="size-4" />
            {locationBusy ? "Waiting for the location popup…" : android ? "Allow Android location" : "Allow Chrome location"}
          </button>
          {locationError ? <p className="text-xs leading-4 text-red-300">{locationError}</p> : null}
          {android && (cameraDenied || locationDenied) ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 text-sm font-semibold"
            >
              <Settings className="size-4" />
              Open Android settings
            </button>
          ) : null}
        </div>
        <button type="button" onClick={onClose} className="mt-3 h-11 w-full text-sm text-white/70">
          Not now
        </button>
      </div>
    </div>
  );
}
