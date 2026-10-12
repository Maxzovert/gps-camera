"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import type { CameraStatus, ImageMime, Preferences } from "@/types";

export function GeneralSettings({
  open,
  onOpenChange,
  preferences,
  cameraStatus,
  online,
  canInstall,
  installed,
  ios,
  onInstall,
  onChange,
  onClear,
  onCameraOff,
  onOpenDate,
  onOpenStamp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: Preferences;
  cameraStatus: CameraStatus;
  online: boolean;
  canInstall: boolean;
  installed: boolean;
  ios: boolean;
  onInstall: () => void;
  onChange: (preferences: Preferences) => void;
  onClear: () => Promise<void>;
  onCameraOff: () => void;
  onOpenDate: () => void;
  onOpenStamp: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Settings">
      <div className="mb-4 flex items-center gap-3">
        <Image src={LOGO_SRC} alt="" width={48} height={48} className="size-12 rounded-2xl object-cover" />
        <div>
          <p className="font-semibold">{APP_NAME}</p>
          <p className="text-xs text-white/60">{online ? "Online" : "Offline"} · Camera {cameraStatus}</p>
        </div>
      </div>
      <div className="space-y-2">
        <Button type="button" variant="outline" className="w-full" onClick={onOpenDate}>
          Date and time
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onOpenStamp}>
          Stamp template
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onCameraOff}>
          Turn camera off
        </Button>
      </div>
      <h3 className="mt-5 mb-2 text-sm font-semibold">Photo file</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={preferences.imageFormat === "image/jpeg" ? "default" : "outline"}
          onClick={() => onChange({ ...preferences, imageFormat: "image/jpeg" })}
        >
          JPEG
        </Button>
        <Button
          type="button"
          variant={preferences.imageFormat === "image/png" ? "default" : "outline"}
          onClick={() => onChange({ ...preferences, imageFormat: "image/png" satisfies ImageMime })}
        >
          PNG
        </Button>
      </div>
      {preferences.imageFormat === "image/jpeg" ? (
        <label className="mt-3 block text-sm">
          JPEG quality {Math.round(preferences.jpegQuality * 100)}%
          <Slider
            className="mt-3"
            min={0.7}
            max={1}
            step={0.01}
            value={[preferences.jpegQuality]}
            onValueChange={([value]) => onChange({ ...preferences, jpegQuality: value ?? 0.92 })}
          />
        </label>
      ) : null}
      <h3 className="mt-5 mb-2 text-sm font-semibold">Self-timer</h3>
      <div className="grid grid-cols-3 gap-2">
        {[0, 3, 10].map((seconds) => (
          <Button
            key={seconds}
            type="button"
            variant={preferences.selfTimer === seconds ? "default" : "outline"}
            onClick={() => onChange({ ...preferences, selfTimer: seconds as 0 | 3 | 10 })}
          >
            {seconds === 0 ? "Off" : `${seconds}s`}
          </Button>
        ))}
      </div>
      <label className="mt-5 flex items-start justify-between gap-3">
        <span>
          <span className="block text-sm font-medium">Address lookup</span>
          <span className="block text-xs leading-4 text-white/55">
            When on, coordinates are sent to OpenStreetMap Nominatim to get a street address. The app works with coordinates only if this is off.
          </span>
        </span>
        <Switch
          checked={preferences.geocodingEnabled}
          onCheckedChange={(geocodingEnabled) => onChange({ ...preferences, geocodingEnabled })}
          aria-label="Address lookup"
        />
      </label>
      <h3 className="mt-5 mb-2 text-sm font-semibold">Install</h3>
      {installed ? (
        <p className="text-sm text-white/70">This app is already installed.</p>
      ) : canInstall ? (
        <Button type="button" onClick={onInstall}>
          Install {APP_NAME}
        </Button>
      ) : ios ? (
        <p className="text-sm text-white/70">In Safari, tap Share, then Add to Home Screen.</p>
      ) : (
        <p className="text-sm text-white/70">
          Install is available in the production build on Chrome or Edge. Use the browser menu if you don&apos;t see a prompt.
        </p>
      )}
      <h3 className="mt-5 mb-2 text-sm font-semibold">Privacy</h3>
      <ul className="space-y-2 text-sm leading-5 text-white/70">
        <li>Photos are processed in this browser and are not uploaded.</li>
        <li>Camera and location are requested only after you tap for them.</li>
        <li>Photos you take or stamp are saved in this device gallery until you delete them or clear local data.</li>
        <li>GPS history is not kept. A fresh automatic fix is requested each time.</li>
        <li>Address results may be cached on this device so the same place is not looked up again.</li>
      </ul>
      <div className="mt-5">
        {confirmClear ? (
          <div className="space-y-2">
            <p className="text-sm">This removes saved photos, the manual place, address cache, and settings on this device.</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  void onClear().finally(() => setConfirmClear(false));
                }}
              >
                Confirm clear
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="destructive" onClick={() => setConfirmClear(true)}>
            Clear saved data
          </Button>
        )}
      </div>
    </Sheet>
  );
}
