"use client";

import { useEffect, useState } from "react";
import { renderMapThumbnail } from "@/lib/map-thumbnail";

export function useMapThumbnail(latitude: number | null, longitude: number | null) {
  const key = latitude != null && longitude != null ? `${latitude.toFixed(5)},${longitude.toFixed(5)}` : null;
  const [result, setResult] = useState<{ key: string; canvas: HTMLCanvasElement; url: string } | null>(null);

  useEffect(() => {
    if (!key || latitude == null || longitude == null) return;
    let cancelled = false;
    let objectUrl = "";
    void renderMapThumbnail(latitude, longitude).then((canvas) => {
      if (cancelled) return;
      canvas.toBlob((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResult({ key, canvas, url: objectUrl });
      });
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, latitude, longitude]);

  if (!key || result?.key !== key) return { canvas: null, url: null };
  return { canvas: result.canvas, url: result.url };
}
