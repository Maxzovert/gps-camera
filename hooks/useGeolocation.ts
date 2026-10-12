"use client";

import { useCallback, useRef, useState } from "react";
import { permissionHost } from "@/lib/permission-host";

export interface GeoReading {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export type GeoStatus = "idle" | "loading" | "ready" | "denied" | "unavailable" | "timeout" | "error";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<GeoReading | null>(null);
  const onReadingRef = useRef<((reading: GeoReading) => void) | null>(null);

  const subscribe = useCallback((listener: (reading: GeoReading) => void) => {
    onReadingRef.current = listener;
  }, []);

  const request = useCallback(() => {
    if (!window.isSecureContext) {
      setStatus("unavailable");
      setError("On a phone, GPS only works on https://. An http:// Wi-Fi address is blocked, and a network guess is not used.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("This browser doesn't provide GPS location. Set the place manually instead.");
      return;
    }
    setStatus("loading");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        };
        setReading(next);
        setStatus("ready");
        onReadingRef.current?.(next);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setStatus("denied");
          setError(
            permissionHost() === "android"
              ? "Android blocked location. Open this app's permissions and allow Location."
              : "Chrome blocked location. Tap the lock icon, then set Location to Allow.",
          );
          return;
        }
        if (geoError.code === geoError.TIMEOUT) {
          setStatus("timeout");
          setError("GPS timed out. Move outdoors with a clear view of the sky and try again.");
          return;
        }
        setStatus("unavailable");
        setError("GPS is unavailable right now. You can set the location manually.");
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 15000 },
    );
  }, []);

  return { status, error, reading, request, subscribe };
}
