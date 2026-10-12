import { pickVideoMime } from "@/lib/media";

export interface RecordingHandle {
  stop: () => void;
}

export function startStampedRecording(options: {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
  onStop: (blob: Blob, mime: string) => void;
  onError: (message: string) => void;
  maxMs?: number;
}): RecordingHandle | null {
  const mime = pickVideoMime();
  if (!mime || typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    options.onError("This browser can't record a stamped video. You can still take photos.");
    return null;
  }
  if (options.width < 2 || options.height < 2) {
    options.onError("The camera isn't ready to record yet.");
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    options.onError("Couldn't prepare the recorder.");
    return null;
  }

  let stream: MediaStream;
  try {
    stream = canvas.captureStream(24);
  } catch {
    options.onError("This browser can't record a stamped video. You can still take photos.");
    return null;
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  } catch {
    stream.getTracks().forEach((track) => track.stop());
    options.onError("This browser can't record a stamped video. You can still take photos.");
    return null;
  }

  const chunks: Blob[] = [];
  let stopped = false;
  let frame = 0;
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.onstop = () => {
    window.cancelAnimationFrame(frame);
    stream.getTracks().forEach((track) => track.stop());
    const type = mime.split(";")[0] || "video/webm";
    options.onStop(new Blob(chunks, { type }), type);
  };

  const loop = () => {
    if (stopped) return;
    options.draw(ctx);
    frame = window.requestAnimationFrame(loop);
  };

  recorder.start(500);
  loop();
  const timer = window.setTimeout(() => stop(), options.maxMs ?? 60_000);

  function stop() {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(timer);
    if (recorder.state !== "inactive") recorder.stop();
  }

  return { stop };
}
