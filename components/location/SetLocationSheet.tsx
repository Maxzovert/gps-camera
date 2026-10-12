"use client";

import { useState } from "react";
import { AutomaticLocation } from "@/components/location/AutomaticLocation";
import { ManualLocationForm } from "@/components/location/ManualLocationForm";
import { Sheet } from "@/components/ui/sheet";
import { useGeolocation } from "@/hooks/useGeolocation";
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
}) {
  const [mode, setMode] = useState<LocationSource>(initialMode);
  const geo = useGeolocation();

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
            if (geo.status === "idle") geo.request();
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
          reading={geo.reading}
          status={geo.status}
          error={geo.error}
          request={geo.request}
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
            if (geo.status === "idle") geo.request();
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
