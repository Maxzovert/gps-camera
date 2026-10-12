"use client";

import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatStampDate } from "@/lib/format";
import type { CaptureResult } from "@/types";

export function PhotoPreview({
  item,
  open,
  onClose,
  onSave,
  onDownload,
  onShare,
  saved,
}: {
  item: CaptureResult | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onDownload: () => void;
  onShare: () => void;
  saved: boolean;
}) {
  if (!open) return null;
  const captured = item ? new Date(item.capturedAt) : null;
  const stamped = item ? new Date(item.stampedAt) : null;
  const differs =
    captured && stamped ? Math.abs(captured.getTime() - stamped.getTime()) > 30_000 : false;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className="grid size-11 place-items-center" aria-label="Back to camera">
          <X className="size-6" />
        </button>
        <p className="text-sm font-semibold">Preview</p>
        <span className="size-11" />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3">
        {!item ? (
          <p className="text-center text-sm text-white/70">Take a photo to preview it here.</p>
        ) : item.kind === "video" ? (
          <video src={item.url} controls playsInline className="max-h-full max-w-full" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="Stamped photograph" className="max-h-full max-w-full object-contain" />
          </>
        )}
      </div>
      {item && differs && captured && stamped ? (
        <div className="px-4 pb-2 text-center text-xs leading-5 text-white/70">
          <p>Stamp shows {formatStampDate(stamped, { hour12: true, showDate: true, showTime: true, timezone: "offset" })}</p>
          <p>Captured {formatStampDate(captured, { hour12: true, showDate: true, showTime: true, timezone: "offset" })}</p>
          <p>Source: {item.source === "none" ? "No location" : item.source === "manual" ? "Manual" : "GPS"}</p>
        </div>
      ) : null}
      {item ? (
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {saved ? (
            <p className="mb-2 text-center text-xs text-white/70">
              Saved in the gallery. Download or Share adds it to your phone photos.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="outline" onClick={onSave}>
            {saved ? "Saved" : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={onDownload}>
            <Download className="size-4" />
            Download
          </Button>
          <Button type="button" onClick={onShare}>
            <Share2 className="size-4" />
            Share
          </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
