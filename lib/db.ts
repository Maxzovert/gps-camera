import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AddressParts, Place, Preferences, StoredPhoto } from "@/types";

interface GeocodeRecord {
  address: AddressParts;
  savedAt: number;
}

interface GpsDB extends DBSchema {
  settings: {
    key: string;
    value: Preferences;
  };
  photos: {
    key: string;
    value: StoredPhoto;
  };
  geocode: {
    key: string;
    value: GeocodeRecord;
  };
}

const GEOCODE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
let databasePromise: Promise<IDBPDatabase<GpsDB>> | null = null;

function database(): Promise<IDBPDatabase<GpsDB>> {
  if (!databasePromise) {
    databasePromise = openDB<GpsDB>("gps-map-camera", 1, {
      upgrade(db) {
        db.createObjectStore("settings");
        db.createObjectStore("photos");
        db.createObjectStore("geocode");
      },
    }).catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function loadPreferences(): Promise<Preferences | null> {
  try {
    const db = await database();
    return (await db.get("settings", "preferences")) ?? null;
  } catch {
    return null;
  }
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  const db = await database();
  await db.put("settings", preferences, "preferences");
}

export async function readGeocode(key: string): Promise<AddressParts | null> {
  try {
    const db = await database();
    const record = await db.get("geocode", key);
    if (!record) return null;
    if (Date.now() - record.savedAt > GEOCODE_MAX_AGE) {
      await db.delete("geocode", key);
      return null;
    }
    return record.address;
  } catch {
    return null;
  }
}

export async function writeGeocode(key: string, address: AddressParts): Promise<void> {
  try {
    const db = await database();
    await db.put("geocode", { address, savedAt: Date.now() }, key);
  } catch {
    // Address lookup still works if the cache cannot be written.
  }
}

export async function listPhotos(): Promise<StoredPhoto[]> {
  const db = await database();
  const photos = await db.getAll("photos");
  return photos.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  const db = await database();
  await db.put("photos", photo, photo.id);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await database();
  await db.delete("photos", id);
}

export async function clearLocalData(): Promise<void> {
  const db = await database();
  await Promise.all([db.clear("settings"), db.clear("photos"), db.clear("geocode")]);
}

export function placeFromParts(
  latitude: number,
  longitude: number,
  address: AddressParts | null,
  source: Place["source"],
  accuracy: number | null,
): Place {
  return { latitude, longitude, accuracy, source, address };
}
