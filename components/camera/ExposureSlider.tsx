"use client";

import { Sun } from "lucide-react";
import { useRef } from "react";

export function ExposureSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ratio = (value + 2) / 4;

  function update(clientY: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    const nextRatio = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const next = Math.round((nextRatio * 4 - 2) * 10) / 10;
    onChange(next);
  }

  return (
    <div className="pointer-events-auto absolute top-[18%] right-2 bottom-[38%] z-30 flex w-10 flex-col items-center">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Exposure"
        aria-valuemin={-2}
        aria-valuemax={2}
        aria-valuenow={value}
        aria-valuetext={value > 0 ? `+${value}` : String(value)}
        className="relative w-8 flex-1 touch-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event.clientY);
        }}
        onDoubleClick={() => onChange(0)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") onChange(Math.min(2, Math.round((value + 0.1) * 10) / 10));
          if (event.key === "ArrowDown") onChange(Math.max(-2, Math.round((value - 0.1) * 10) / 10));
          if (event.key === "Home") onChange(0);
        }}
      >
        <div className="absolute top-2 bottom-2 left-1/2 w-px -translate-x-1/2 bg-white/70" />
        <div
          className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-primary"
          style={{
            top: `${Math.min(ratio, 0.5) * 100}%`,
            bottom: `${(1 - Math.max(ratio, 0.5)) * 100}%`,
          }}
        />
        <Sun className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-white" />
        <div
          className="absolute left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 bg-white shadow"
          style={{ top: `${(1 - ratio) * 100}%` }}
        />
      </div>
      <span className="mt-1 text-[11px] tabular-nums">{value > 0 ? `+${value}` : value}</span>
    </div>
  );
}
