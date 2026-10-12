"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { reverseGeocode } from "@/lib/geocoding";
import type { GeoReading, GeoStatus } from "@/hooks/useGeolocation";
import type { AddressParts, Place } from "@/types";

const emptyAddress = (): AddressParts => ({
  country: "",
  region: "",
  city: "",
  area: "",
  street: "",
  postcode: "",
  countryCode: "",
});

export function AutomaticLocation({
  reading,
  status,
  error,
  request,
  geocodingEnabled,
  onGeocoding,
  online,
  onConfirm,
}: {
  reading: GeoReading | null;
  status: GeoStatus;
  error: string | null;
  request: () => void;
  geocodingEnabled: boolean;
  onGeocoding: (enabled: boolean) => void;
  online: boolean;
  onConfirm: (place: Place) => void;
}) {
  const [address, setAddress] = useState<AddressParts>(emptyAddress);
  const readingKey = reading
    ? `${reading.latitude.toFixed(6)},${reading.longitude.toFixed(6)}`
    : null;
  const [lookup, setLookup] = useState<{ key: string; error: string | null } | null>(null);

  useEffect(() => {
    if (!reading || !geocodingEnabled || !readingKey) return;
    let cancelled = false;
    const key = readingKey;
    void reverseGeocode(reading.latitude, reading.longitude)
      .then((next) => {
        if (cancelled) return;
        if (next) setAddress(next);
        setLookup({
          key,
          error: next ? null : "No street address was found. Coordinates can still be stamped.",
        });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setLookup({
          key,
          error: caught instanceof Error ? caught.message : "Address lookup failed.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [reading, geocodingEnabled, readingKey]);

  const geoError = lookup?.key === readingKey ? lookup.error : null;
  const lookingUp = Boolean(reading && geocodingEnabled && lookup?.key !== readingKey);

  function patch(key: keyof AddressParts, value: string) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        This reads your device GPS. It does not substitute an approximate network location.
      </p>
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3">
        <div>
          <p className="text-sm font-medium">Look up address</p>
          <p className="text-xs leading-4 text-white/55">
            Sends these coordinates to OpenStreetMap Nominatim. You can leave this off and stamp coordinates only.
          </p>
        </div>
        <Switch checked={geocodingEnabled} onCheckedChange={onGeocoding} aria-label="Look up address" />
      </div>
      {!online && geocodingEnabled ? (
        <p className="text-sm text-amber-300">You&apos;re offline, so the address can&apos;t be looked up. Coordinates still work.</p>
      ) : null}
      {status === "loading" || lookingUp ? (
        <p className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {status === "loading" ? "Fetching GPS…" : "Looking up the address…"}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {geoError ? <p className="text-sm text-amber-200">{geoError}</p> : null}
      {reading ? (
        <>
          <div className="rounded-2xl bg-white/5 p-3 text-sm">
            <p>
              Accuracy: {reading.accuracy == null ? "unavailable" : `±${Math.round(reading.accuracy)} m`}
            </p>
            {reading.accuracy != null && reading.accuracy > 100 ? (
              <p className="mt-1 text-amber-200">
                This reading is coarse. Move outdoors and refresh for a tighter fix.
              </p>
            ) : null}
            <p className="mt-1 tabular-nums text-white/80">
              {reading.latitude.toFixed(6)}, {reading.longitude.toFixed(6)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" value={address.country} onChange={(value) => patch("country", value)} />
            <Field label="State or region" value={address.region} onChange={(value) => patch("region", value)} />
            <Field label="City" value={address.city} onChange={(value) => patch("city", value)} />
            <Field label="Area" value={address.area} onChange={(value) => patch("area", value)} />
          </div>
          <Field label="Street" value={address.street} onChange={(value) => patch("street", value)} />
        </>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={request} disabled={status === "loading"}>
          <RefreshCw className="size-4" />
          {reading ? "Refresh" : "Get current location"}
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!reading || status === "loading"}
          onClick={() => {
            if (!reading) return;
            const hasAddress = Object.values(address).some((value) => value.trim());
            onConfirm({
              latitude: reading.latitude,
              longitude: reading.longitude,
              accuracy: reading.accuracy,
              source: "automatic",
              address: hasAddress ? address : null,
            });
          }}
        >
          Confirm location
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <Label className="mb-1 block">{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
