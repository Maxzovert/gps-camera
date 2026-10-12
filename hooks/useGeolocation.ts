"use client";

import { useCallback, useState } from "react";

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

  const request = useCallback(() => {
    if (!window.isSecureContext) {
      setStatus("unavailable");
      setError("Location needs HTTPS or localhost. An approximate network location is not used.");
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
        setReading({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        });
        setStatus("ready");
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Location permission was denied. You can set the location manually.");
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  return { status, error, reading, request };
}
