import { readableTextColor } from "@/lib/format";
import type { StampModel, StampSettings } from "@/types";

export interface FrameRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  outW: number;
  outH: number;
}

const MAX_EDGE = 4096;

export function computeFrame(
  sourceW: number,
  sourceH: number,
  viewW: number,
  viewH: number,
  zoom: number,
): FrameRect {
  const safeViewW = viewW > 0 ? viewW : sourceW;
  const safeViewH = viewH > 0 ? viewH : sourceH;
  const sourceAspect = sourceW / sourceH;
  const viewAspect = safeViewW / safeViewH;
  let cropW = sourceW;
  let cropH = sourceH;
  if (sourceAspect > viewAspect) cropW = sourceH * viewAspect;
  else cropH = sourceW / viewAspect;
  const zoomFactor = zoom > 0 ? zoom : 1;
  cropW /= zoomFactor;
  cropH /= zoomFactor;
  const sx = (sourceW - cropW) / 2;
  const sy = (sourceH - cropH) / 2;
  let outW = Math.max(1, Math.round(cropW));
  let outH = Math.max(1, Math.round(cropH));
  const edge = Math.max(outW, outH);
  if (edge > MAX_EDGE) {
    const scale = MAX_EDGE / edge;
    outW = Math.max(1, Math.round(outW * scale));
    outH = Math.max(1, Math.round(outH * scale));
  }
  return { sx, sy, sw: cropW, sh: cropH, outW, outH };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}…`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || maxWidth <= 0) return [];
  const lines: string[] = [];
  let index = 0;
  while (index < words.length && lines.length < maxLines) {
    let line = words[index] ?? "";
    index += 1;
    while (index < words.length) {
      const next = `${line} ${words[index]}`;
      if (ctx.measureText(next).width > maxWidth) break;
      line = next;
      index += 1;
    }
    if (lines.length === maxLines - 1 && index < words.length) {
      lines.push(fitText(ctx, `${line}…`, maxWidth));
    } else {
      lines.push(fitText(ctx, line, maxWidth));
    }
  }
  return lines;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const source = image as HTMLCanvasElement;
  const sw = "width" in source ? source.width : dw;
  const sh = "height" in source ? source.height : dh;
  const scale = Math.max(dw / sw, dh / sh);
  const cropW = dw / scale;
  const cropH = dh / scale;
  ctx.drawImage(image, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, dx, dy, dw, dh);
}

function drawLegible(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  background: StampSettings["background"],
  weight: number,
) {
  if (background === "transparent") {
    ctx.lineJoin = "round";
    ctx.strokeStyle = color.toLowerCase() === "#111111" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.78)";
    ctx.lineWidth = Math.max(2, weight * 0.16);
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export interface PaintInput {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  viewWidth: number;
  viewHeight: number;
  zoom: number;
  exposure: number;
  mirror: boolean;
  model: StampModel;
  settings: StampSettings;
  mapCanvas: HTMLCanvasElement | null;
  logo: HTMLImageElement | null;
  fontFamily: string;
}

export function paintFrame(ctx: CanvasRenderingContext2D, input: PaintInput) {
  const frame = computeFrame(
    input.sourceWidth,
    input.sourceHeight,
    input.viewWidth,
    input.viewHeight,
    input.zoom,
  );
  const destW = ctx.canvas.width || frame.outW;
  const destH = ctx.canvas.height || frame.outH;
  ctx.save();
  if (input.mirror) {
    ctx.translate(destW, 0);
    ctx.scale(-1, 1);
  }
  const brightness = 1 + input.exposure * 0.18;
  ctx.filter = `brightness(${brightness.toFixed(3)})`;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(input.source, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, destW, destH);
  ctx.filter = "none";
  ctx.restore();
  drawStamp(ctx, destW, destH, input);
  return frame;
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  input: PaintInput,
) {
  const { model, settings } = input;
  const color = readableTextColor(settings.textColor, settings.background);
  const margin = Math.round(Math.min(width, height) * 0.035);
  const shortSide = Math.min(width, height);
  const titleSize = clamp(Math.round(shortSide * 0.034 * settings.fontScale), 16, 72);
  const bodySize = clamp(Math.round(shortSide * 0.026 * settings.fontScale), 13, 52);
  const mapW = model.showMap ? clamp(Math.round(shortSide * 0.24), 88, 360) : 0;
  const mapH = model.showMap ? Math.round(mapW * 0.78) : 0;
  const gap = Math.round(Math.max(8, mapW * 0.1));
  const textW = Math.max(120, Math.min(width - margin * 2 - mapW - (mapW ? gap : 0), Math.round(shortSide * 0.62)));
  const font = input.fontFamily || "sans-serif";

  ctx.textBaseline = "top";
  ctx.font = `500 ${bodySize}px ${font}`;
  const addressLines = model.address ? wrapText(ctx, model.address, textW, 3) : [];
  const noteLines = model.note ? wrapText(ctx, model.note, textW, 2) : [];
  const lines: { text: string; size: number; weight: number }[] = [];
  if (model.title || model.flag) {
    lines.push({
      text: [model.title, model.flag].filter(Boolean).join(" "),
      size: titleSize,
      weight: 700,
    });
  }
  for (const line of addressLines) lines.push({ text: line, size: bodySize, weight: 500 });
  if (model.coordinates) lines.push({ text: model.coordinates, size: bodySize, weight: 600 });
  if (model.dateTime) lines.push({ text: model.dateTime, size: bodySize, weight: 500 });
  if (model.accuracy) lines.push({ text: model.accuracy, size: bodySize, weight: 600 });
  for (const line of noteLines) lines.push({ text: line, size: bodySize, weight: 500 });
  if (lines.length === 0 && !model.showMap && !model.watermark) return;

  const lineGap = Math.round(bodySize * 0.18);
  const textH = lines.reduce((sum, line) => sum + line.size + lineGap, 0);
  const contentH = Math.max(mapH, textH);
  const markSize = model.watermark ? Math.round(bodySize * 1.05) : 0;
  const markFontSize = Math.max(11, Math.round(markSize * 0.72));
  const markGap = markSize ? Math.round(bodySize * 0.28) : 0;
  const iconGap = Math.round(markSize * 0.28);
  ctx.font = `500 ${markFontSize}px ${font}`;
  const labelW = model.watermark ? ctx.measureText(model.watermark).width : 0;
  const hasLogo = Boolean(input.logo && input.logo.complete && input.logo.naturalWidth > 0);
  const markRowW = model.watermark ? (hasLogo ? markSize + iconGap : 0) + labelW : 0;
  let textColW = markRowW;
  for (const line of lines) {
    ctx.font = `${line.weight} ${line.size}px ${font}`;
    textColW = Math.max(textColW, ctx.measureText(line.text).width);
  }
  const available = width - margin * 2 - (mapW ? mapW + gap : 0);
  textColW = Math.min(available, Math.max(markRowW, Math.min(textW, Math.max(40, textColW))));
  const blockW = textColW + (mapW ? mapW + gap : 0);
  const totalH = markSize + markGap + contentH;
  const x = settings.position.endsWith("right") ? width - margin - blockW : margin;
  const y = settings.position.startsWith("top") ? margin : height - margin - totalH;

  if (settings.background !== "transparent") {
    const pad = Math.round(margin * 0.45);
    ctx.fillStyle = settings.background === "black" ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.9)";
    roundRect(ctx, x - pad, y - pad, blockW + pad * 2, totalH + pad * 2, Math.round(bodySize * 0.45));
    ctx.fill();
  }

  if (model.watermark) {
    const icon = markSize;
    let markX = x + blockW - markRowW;
    const markY = y;
    if (hasLogo && input.logo) {
      ctx.save();
      roundRect(ctx, markX, markY, icon, icon, icon * 0.18);
      ctx.clip();
      ctx.drawImage(input.logo, markX, markY, icon, icon);
      ctx.restore();
      markX += icon + iconGap;
    }
    ctx.save();
    ctx.font = `500 ${markFontSize}px ${font}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    ctx.fillText(model.watermark, markX, markY + icon / 2);
    ctx.restore();
    ctx.textBaseline = "top";
  }

  const rowY = y + markSize + markGap;
  if (mapW > 0) {
    const mapY = rowY + contentH - mapH;
    ctx.save();
    roundRect(ctx, x, mapY, mapW, mapH, Math.round(mapH * 0.1));
    ctx.clip();
    if (input.mapCanvas) drawCover(ctx, input.mapCanvas, x, mapY, mapW, mapH);
    else {
      ctx.fillStyle = "#16324a";
      ctx.fillRect(x, mapY, mapW, mapH);
    }
    ctx.restore();
  }

  let textY = rowY + contentH - textH;
  const textX = x + (mapW ? mapW + gap : 0);
  for (const line of lines) {
    ctx.font = `${line.weight} ${line.size}px ${font}`;
    drawLegible(ctx, line.text, textX, textY, color, settings.background, line.size);
    textY += line.size + lineGap;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function renderStampedBlob(
  input: PaintInput,
  mime: "image/jpeg" | "image/png",
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const frame = computeFrame(
    input.sourceWidth,
    input.sourceHeight,
    input.viewWidth,
    input.viewHeight,
    input.zoom,
  );
  const canvas = document.createElement("canvas");
  canvas.width = frame.outW;
  canvas.height = frame.outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare the photo.");
  paintFrame(ctx, input);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new Error("Couldn't export the photo."));
      },
      mime,
      quality,
    );
  });
  return { blob, width: canvas.width, height: canvas.height };
}

export async function renderStampedImage(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  extras: Pick<PaintInput, "model" | "settings" | "mapCanvas" | "logo" | "fontFamily">,
  mime: "image/jpeg" | "image/png",
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const edge = Math.max(sourceWidth, sourceHeight, 1);
  const scale = edge > 4096 ? 4096 / edge : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare the photo.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  drawStamp(ctx, canvas.width, canvas.height, {
    source,
    sourceWidth,
    sourceHeight,
    viewWidth: canvas.width,
    viewHeight: canvas.height,
    zoom: 1,
    exposure: 0,
    mirror: false,
    ...extras,
  });
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) resolve(value);
        else reject(new Error("Couldn't export the photo."));
      },
      mime,
      quality,
    );
  });
  return { blob, width: canvas.width, height: canvas.height };
}
