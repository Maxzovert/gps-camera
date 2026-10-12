"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cameraErrorMessage } from "@/lib/media";
import type { CameraStatus, FacingMode } from "@/types";

interface TorchConstraint extends MediaTrackConstraintSet {
  torch?: boolean;
}

interface ZoomCapability {
  min: number;
  max: number;
}

interface ExtendedCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: ZoomCapability;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const facingRef = useRef<FacingMode>("environment");
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const release = useCallback(() => {
    requestRef.current += 1;
    stopTracks();
    setTorchOn(false);
    setTorchSupported(false);
    setStatus("idle");
    setError(null);
  }, [stopTracks]);

  const start = useCallback(
    async (nextFacing: FacingMode) => {
      if (!window.isSecureContext) {
        setStatus("unsupported");
        setError("On a phone, camera and GPS only work on https://. An http:// address on your Wi-Fi is blocked.");
        return false;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        setError("This browser doesn't support camera access.");
        return false;
      }

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setStatus("requesting");
      setError(null);
      stopTracks();

      try {
        const stream = await openCameraStream(nextFacing);
        if (requestId !== requestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return false;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as ExtendedCapabilities | undefined;
        setTorchSupported(Boolean(capabilities?.torch));
        setTorchOn(false);
        facingRef.current = nextFacing;
        setFacing(nextFacing);
        const video = videoRef.current;
        if (video) {
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.srcObject = stream;
          if (video.readyState < 1) {
            await new Promise<void>((resolve) => {
              const done = () => {
                video.removeEventListener("loadedmetadata", done);
                resolve();
              };
              video.addEventListener("loadedmetadata", done);
              window.setTimeout(done, 1500);
            });
          }
          if (requestId !== requestRef.current) {
            stream.getTracks().forEach((item) => item.stop());
            return false;
          }
          await video.play().catch(() => undefined);
        }
        if (requestId !== requestRef.current) {
          stream.getTracks().forEach((item) => item.stop());
          return false;
        }
        setStatus("ready");
        return true;
      } catch (caught) {
        if (requestId !== requestRef.current) return false;
        stopTracks();
        const result = cameraErrorMessage(caught);
        setStatus(result.status);
        setError(result.message);
        return false;
      }
    },
    [stopTracks],
  );

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return false;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraint] });
      setTorchOn(next);
      return true;
    } catch {
      setTorchSupported(false);
      setTorchOn(false);
      return false;
    }
  }, [torchOn, torchSupported]);

  useEffect(() => () => {
    requestRef.current += 1;
    stopTracks();
  }, [stopTracks]);

  return {
    videoRef,
    streamRef,
    status,
    facing,
    facingRef,
    torchSupported,
    torchOn,
    error,
    start,
    release,
    toggleTorch,
  };
}

async function openCameraStream(facing: FacingMode): Promise<MediaStream> {
  const attempts: MediaTrackConstraints[] = [
    { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    { facingMode: { ideal: facing } },
    { facingMode: facing },
  ];
  let last: unknown;
  for (const video of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video });
    } catch (error) {
      last = error;
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") throw error;
    }
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  } catch (error) {
    throw last ?? error;
  }
}
