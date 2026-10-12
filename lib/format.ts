import type { AddressParts, StampBackground, TimezoneDisplay } from "@/types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function combineLocal(dateValue: string, timeValue: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!dateMatch || !timeMatch) return null;
  const date = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatGmtOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  return `GMT ${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export function formatShortTimezone(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(date);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? formatGmtOffset(date);
}

export function formatClock(date: Date, hour12: boolean): string {
  const minutes = pad(date.getMinutes());
  if (!hour12) return `${pad(date.getHours())}:${minutes}`;
  const hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${pad(hour)}:${minutes} ${suffix}`;
}

export function formatStampDate(
  date: Date,
  options: {
    hour12: boolean;
    showDate: boolean;
    showTime: boolean;
    timezone: TimezoneDisplay;
  },
): string | null {
  const pieces: string[] = [];
  if (options.showDate) {
    pieces.push(
      `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    );
  }
  if (options.showTime) pieces.push(formatClock(date, options.hour12));
  if (pieces.length === 0) return null;
  let line = pieces.join(" ");
  if (options.timezone === "offset") line += ` ${formatGmtOffset(date)}`;
  if (options.timezone === "short") line += ` ${formatShortTimezone(date)}`;
  return line;
}

export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return [...code.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function addressTitle(address: AddressParts | null): string {
  if (!address) return "";
  const city = address.city || address.area;
  return [city, address.region, address.country].filter(Boolean).join(", ");
}

export function addressDetails(address: AddressParts | null): string {
  if (!address) return "";
  const region = [address.region, address.postcode].filter(Boolean).join(" ");
  const parts = [address.street, address.area, address.city, region, address.country].filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique.join(", ");
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `Lat ${latitude.toFixed(6)}° Long ${longitude.toFixed(6)}°`;
}

export function isLightColor(color: string): boolean {
  const hex = color.trim().replace("#", "");
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return true;
  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 160;
}

export function readableTextColor(color: string, background: StampBackground): string {
  const light = isLightColor(color);
  if (background === "white" && light) return "#111111";
  if (background === "black" && !light) return "#ffffff";
  return color;
}

export function photoFilename(date: Date, extension: string): string {
  return `GPS-map-camera_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.${extension}`;
}

export function extensionForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  return "jpg";
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad(minutes)}:${pad(seconds)}`;
}
