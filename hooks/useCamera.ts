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
        setError("Camera access needs HTTPS or localhost.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        setError("This browser doesn't support camera access.");
        return;
      }

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setStatus("requesting");
      setError(null);
      stopTracks();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (requestId !== requestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
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
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        if (requestId !== requestRef.current) {
          stream.getTracks().forEach((item) => item.stop());
          return;
        }
        setStatus("ready");
      } catch (caught) {
        if (requestId !== requestRef.current) return;
        stopTracks();
        const result = cameraErrorMessage(caught);
        setStatus(result.status);
        setError(result.message);
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
