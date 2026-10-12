"use client";

import { useState } from "react";
import { AutomaticLocation } from "@/components/location/AutomaticLocation";
import { ManualLocationForm } from "@/components/location/ManualLocationForm";
import { Sheet } from "@/components/ui/sheet";
import type { GeoReading, GeoStatus } from "@/hooks/useGeolocation";
import { cn } from "@/lib/utils";
import type { ManualLocationValues } from "@/lib/validation";
import type { LocationSource, Place } from "@/types";

export function SetLocationSheet({
  open,
  onOpenChange,
  initialMode,
  manualInitial,
  countryCode,
  postcode,
  geocodingEnabled,
  onGeocoding,
  online,
  onConfirm,
  geoStatus,
  geoError,
  geoReading,
  onRequestGps,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode: LocationSource;
  manualInitial: ManualLocationValues;
  countryCode: string;
  postcode: string;
  geocodingEnabled: boolean;
  onGeocoding: (enabled: boolean) => void;
  online: boolean;
  onConfirm: (place: Place) => void;
  geoStatus: GeoStatus;
  geoError: string | null;
  geoReading: GeoReading | null;
  onRequestGps: () => void;
}) {
  const [mode, setMode] = useState<LocationSource>(initialMode);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Set location"
      description="Choose a GPS reading or enter a place yourself. The stamp shows which one you used."
    >
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
        <TabButton
          active={mode === "automatic"}
          onClick={() => {
            setMode("automatic");
            onRequestGps();
          }}
        >
          Use current location
        </TabButton>
        <TabButton active={mode === "manual"} onClick={() => setMode("manual")}>
          Set manually
        </TabButton>
      </div>
      <p className="mb-3 text-xs font-semibold tracking-wide text-primary uppercase">
        {mode === "automatic" ? "Automatic GPS" : "Manual location"}
      </p>
      {mode === "automatic" ? (
        <AutomaticLocation
          reading={geoReading}
          status={geoStatus}
          error={geoError}
          request={onRequestGps}
          geocodingEnabled={geocodingEnabled}
          onGeocoding={onGeocoding}
          online={online}
          onConfirm={onConfirm}
        />
      ) : (
        <ManualLocationForm
          initial={manualInitial}
          countryCode={countryCode}
          postcode={postcode}
          onUseAutomatic={() => {
            setMode("automatic");
            onRequestGps();
          }}
          onApply={onConfirm}
        />
      )}
    </Sheet>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl px-2 text-sm font-semibold",
        active ? "bg-primary text-black" : "text-white",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
