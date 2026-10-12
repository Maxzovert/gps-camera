import { APP_NAME } from "@/lib/brand";
import { permissionHost } from "@/lib/permission-host";

export async function loadImageFile(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // Fall through to an image element for formats the bitmap decoder rejects.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Couldn't read that photo."));
      element.src = url;
    });
    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
      throw new Error("Couldn't read that photo.");
    }
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error instanceof Error ? error : new Error("Couldn't read that photo.");
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<"shared" | "downloaded" | "aborted"> {
  const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
  if (typeof navigator.share === "function") {
    const payload = { files: [file], title: APP_NAME };
    try {
      const allowed = typeof navigator.canShare !== "function" || navigator.canShare(payload);
      if (allowed) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "aborted";
    }
  }
  downloadBlob(blob, filename);
  return "downloaded";
}

export function pickVideoMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const types = [
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function cameraErrorMessage(error: unknown): { status: "denied" | "unsupported" | "error"; message: string } {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return {
      status: "denied",
      message:
        permissionHost() === "android"
          ? "Android blocked the camera. Open this app's permissions and allow Camera."
          : "Chrome blocked the camera. Tap the lock icon, then set Camera to Allow.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
    return { status: "error", message: "No usable camera was found on this device." };
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return { status: "error", message: "The camera is already in use by another app." };
  }
  if (name === "AbortError") {
    return { status: "error", message: "The camera request was interrupted. Try again." };
  }
  return { status: "error", message: "Couldn't start the camera." };
}
