"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { deletePhoto, listPhotos } from "@/lib/db";
import type { StoredPhoto } from "@/types";

export function StorageGallery({
  open,
  onOpenChange,
  onOpenPhoto,
  onImport,
  refreshKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenPhoto: (photo: StoredPhoto) => void;
  onImport: () => void;
  refreshKey: number;
}) {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const created: string[] = [];
    void listPhotos()
      .then((items) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const item of items) {
          const url = URL.createObjectURL(item.blob);
          next[item.id] = url;
          created.push(url);
        }
        setPhotos(items);
        setUrls(next);
      })
      .catch(() => toast.error("Couldn't open saved photos."));
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [open, refreshKey]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Gallery" description="Photos saved on this device. Nothing is uploaded.">
      <button
        type="button"
        onClick={onImport}
        className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-black"
      >
        <ImagePlus className="size-4" />
        Stamp a gallery photo
      </button>
      {photos.length === 0 ? (
        <p className="text-sm text-white/70">
          Photos you take are saved here. You can also choose one from your phone gallery and stamp the current location on it.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="relative">
              <button type="button" onClick={() => onOpenPhoto(photo)} className="block w-full">
                {photo.kind === "video" ? (
                  <video src={urls[photo.id]} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urls[photo.id]} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  </>
                )}
              </button>
              <button
                type="button"
                aria-label="Delete saved photo"
                className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-black/70"
                onClick={() => {
                  void deletePhoto(photo.id)
                    .then(() => setPhotos((current) => current.filter((item) => item.id !== photo.id)))
                    .catch(() => toast.error("Couldn't delete that photo."));
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
