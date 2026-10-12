"use client";

import Image from "next/image";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { readableTextColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StampModel, StampPosition, StampSettings } from "@/types";

const positionClass: Record<StampPosition, string> = {
  "bottom-left": "bottom-3 left-3 right-3",
  "bottom-right": "right-3 bottom-3 left-12",
  "top-left": "top-16 left-3 right-14",
  "top-right": "top-16 right-3 left-12",
};

export function StampPreview({
  model,
  settings,
  mapUrl,
  zoom,
  onZoom,
  showZoom = false,
  className,
}: {
  model: StampModel;
  settings: StampSettings;
  mapUrl: string | null;
  zoom?: 1 | 2;
  onZoom?: (zoom: 1 | 2) => void;
  showZoom?: boolean;
  className?: string;
}) {
  const color = readableTextColor(settings.textColor, settings.background);
  const shadow = settings.background === "transparent";
  const right = settings.position.endsWith("right");

  return (
    <div className={cn("pointer-events-none absolute z-30 flex items-end justify-between gap-3", positionClass[settings.position], className)}>
      <div
        className={cn(
          "w-fit max-w-full",
          right && "ml-auto",
          settings.background === "black" && "rounded-xl bg-black/65 p-2",
          settings.background === "white" && "rounded-xl bg-white/92 p-2",
        )}
        style={{ color }}
      >
        {model.watermark ? (
          <div className="mb-1 flex items-center justify-end gap-1 text-white">
            <Image src={LOGO_SRC} alt="" width={18} height={18} className="size-[18px] rounded-[4px] object-cover shadow-[0_1px_2px_rgba(0,0,0,0.65)]" />
            <span className="text-[12px] leading-none font-medium tracking-normal [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
              {model.watermark || APP_NAME}
            </span>
          </div>
        ) : null}
        <div className={cn("flex items-end gap-2", right && "flex-row-reverse text-right")}>
          {model.showMap ? (
            <div className="relative h-[72px] w-[92px] shrink-0 overflow-hidden rounded-md bg-zinc-800">
              {mapUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mapUrl} alt="" className="h-full w-full object-cover" />
                </>
              ) : (
                <div className="grid h-full place-items-center text-[10px] text-white/70">Map</div>
              )}
            </div>
          ) : null}
          <div
            className="min-w-0"
            style={{ textShadow: shadow ? "0 1px 2px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.55)" : undefined }}
          >
            {model.title || model.flag ? (
              <p className="text-[15px] leading-tight font-semibold">
                {model.title} {model.flag}
              </p>
            ) : null}
            {model.address ? <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug">{model.address}</p> : null}
            {model.coordinates ? <p className="text-[11px] leading-snug">{model.coordinates}</p> : null}
            {model.dateTime ? <p className="text-[11px] leading-snug tabular-nums">{model.dateTime}</p> : null}
            {model.accuracy ? <p className="text-[11px] leading-snug">{model.accuracy}</p> : null}
            {model.note ? <p className="line-clamp-2 text-[11px] leading-snug">{model.note}</p> : null}
          </div>
        </div>
      </div>
      {showZoom && onZoom && zoom ? (
        <div className="pointer-events-auto mb-0.5 flex shrink-0 items-center gap-1">
          <ZoomButton active={zoom === 1} onClick={() => onZoom(1)}>
            1x
          </ZoomButton>
          <ZoomButton active={zoom === 2} onClick={() => onZoom(2)}>
            2x
          </ZoomButton>
        </div>
      ) : null}
    </div>
  );
}

function ZoomButton({
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
        "rounded px-1.5 py-0.5 text-[11px] font-bold",
        active ? "bg-primary text-black" : "text-primary",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
