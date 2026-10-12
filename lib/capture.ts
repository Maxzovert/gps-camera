type ImageCaptureLike = { takePhoto: () => Promise<Blob> };

export interface GrabbedFrame {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

export async function grabPhotoSource(
  video: HTMLVideoElement,
  track: MediaStreamTrack | null,
): Promise<GrabbedFrame> {
  const ImageCaptureCtor = (
    window as Window & { ImageCapture?: new (track: MediaStreamTrack) => ImageCaptureLike }
  ).ImageCapture;
  if (track && ImageCaptureCtor) {
    try {
      const blob = await new ImageCaptureCtor(track).takePhoto();
      const bitmap = await createImageBitmap(blob);
      const videoAspect = video.videoWidth / Math.max(1, video.videoHeight);
      const photoAspect = bitmap.width / Math.max(1, bitmap.height);
      if (video.videoWidth > 0 && Math.abs(photoAspect - videoAspect) / videoAspect < 0.08) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // The live video frame is the supported fallback.
    }
  }
  return {
    source: video,
    width: video.videoWidth,
    height: video.videoHeight,
    close: () => undefined,
  };
}
