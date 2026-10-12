const TILE_SIZE = 256;
const ZOOM = 16;
const tileCache = new Map<string, HTMLImageElement>();

function wrapTileX(x: number, zoom: number): number {
  const size = 2 ** zoom;
  return ((x % size) + size) % size;
}

function project(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
  const size = 2 ** zoom;
  const x = ((longitude + 180) / 360) * size;
  const sine = Math.sin((latitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * size;
  return { x, y };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = tileCache.get(url);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      tileCache.set(url, image);
      if (tileCache.size > 48) {
        const first = tileCache.keys().next().value;
        if (first) tileCache.delete(first);
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error("tile"));
    image.src = url;
  });
}

async function loadTile(x: number, y: number, zoom: number): Promise<HTMLImageElement | null> {
  const max = 2 ** zoom;
  if (y < 0 || y >= max) return null;
  const wrapped = wrapTileX(x, zoom);
  const urls = [
    `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrapped}/${y}@2x.png`,
    `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${wrapped}/${y}.png`,
  ];
  for (const url of urls) {
    try {
      return await loadImage(url);
    } catch {
      continue;
    }
  }
  return null;
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#e11d48";
  ctx.beginPath();
  ctx.arc(0, -14, 10, Math.PI, 0);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFallback(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = "#16324a";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const offset = (size / 4) * i;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(size, offset);
    ctx.stroke();
  }
  drawPin(ctx, size / 2, size / 2 + 8, 1.4);
}

function canvasIsClean(canvas: HTMLCanvasElement): boolean {
  try {
    canvas.getContext("2d")?.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

export async function renderMapThumbnail(latitude: number, longitude: number, size = 320): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    if (ctx) drawFallback(ctx, size);
    return canvas;
  }

  const world = project(latitude, longitude, ZOOM);
  const centerX = Math.floor(world.x);
  const centerY = Math.floor(world.y);
  const tiles: { x: number; y: number; image: HTMLImageElement | null }[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      tiles.push({ x, y, image: await loadTile(x, y, ZOOM) });
    }
  }

  if (tiles.every((tile) => !tile.image)) {
    drawFallback(ctx, size);
    return canvas;
  }

  const scratch = document.createElement("canvas");
  scratch.width = size;
  scratch.height = size;
  const scratchCtx = scratch.getContext("2d");
  if (!scratchCtx) {
    drawFallback(ctx, size);
    return canvas;
  }
  scratchCtx.fillStyle = "#d7e4ee";
  scratchCtx.fillRect(0, 0, size, size);
  const worldPx = world.x * TILE_SIZE;
  const worldPy = world.y * TILE_SIZE;
  const scale = size / (TILE_SIZE * 1.15);
  for (const tile of tiles) {
    if (!tile.image) continue;
    const dx = (tile.x * TILE_SIZE - worldPx) * scale + size / 2;
    const dy = (tile.y * TILE_SIZE - worldPy) * scale + size / 2;
    scratchCtx.drawImage(tile.image, dx, dy, TILE_SIZE * scale, TILE_SIZE * scale);
  }
  if (!canvasIsClean(scratch)) {
    drawFallback(ctx, size);
    return canvas;
  }
  ctx.drawImage(scratch, 0, 0);
  drawPin(ctx, size / 2, size / 2 + 6, 1.15);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "12px sans-serif";
  ctx.fillText("© OSM", 8, size - 10);
  return canvas;
}
