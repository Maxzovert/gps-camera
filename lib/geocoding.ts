import { readGeocode, writeGeocode } from "@/lib/db";
import type { AddressParts, SearchHit } from "@/types";

const ENDPOINT = "https://nominatim.openstreetmap.org";

let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

function schedule<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastCall));
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCall = Date.now();
    return task();
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (response.status === 429) {
      throw new Error("The address service is busy. Wait a moment and try again.");
    }
    if (!response.ok) throw new Error("Address lookup failed.");
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Address lookup timed out.");
    }
    if (error instanceof Error) throw error;
    throw new Error("Address lookup failed.");
  } finally {
    clearTimeout(timer);
  }
}

export function mapNominatimAddress(raw: Record<string, unknown>): AddressParts {
  const address = isRecord(raw.address) ? raw.address : {};
  const city =
    text(address, "city") ||
    text(address, "town") ||
    text(address, "village") ||
    text(address, "hamlet") ||
    text(address, "municipality");
  const area =
    text(address, "suburb") ||
    text(address, "neighbourhood") ||
    text(address, "city_district") ||
    text(address, "quarter");
  const street = [text(address, "house_number"), text(address, "road")].filter(Boolean).join(" ");
  const display = text(raw, "display_name");
  return {
    country: text(address, "country"),
    region: text(address, "state") || text(address, "region") || text(address, "state_district"),
    city: city || (display && !text(address, "country") ? display : ""),
    area,
    street,
    postcode: text(address, "postcode"),
    countryCode: text(address, "country_code").toUpperCase(),
  };
}

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<AddressParts | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const key = cacheKey(latitude, longitude);
  const cached = await readGeocode(key);
  if (cached) return cached;

  const url = new URL(`${ENDPOINT}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");

  const payload = await schedule(() => fetchJson(url.toString()));
  if (!isRecord(payload)) return null;
  const address = mapNominatimAddress(payload);
  if (!address.city && !address.country && !address.street) return null;
  await writeGeocode(key, address);
  return address;
}

export async function searchAddress(query: string): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const url = new URL(`${ENDPOINT}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", trimmed);
  const payload = await schedule(() => fetchJson(url.toString()));
  if (!Array.isArray(payload)) return [];
  const hits: SearchHit[] = [];
  for (const item of payload) {
    if (!isRecord(item)) continue;
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    hits.push({
      label: text(item, "display_name") || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
      address: mapNominatimAddress(item),
    });
  }
  return hits;
}
