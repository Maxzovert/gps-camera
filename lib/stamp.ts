import { APP_NAME } from "@/lib/brand";
import { addressDetails, addressTitle, countryFlag, formatCoordinates, formatStampDate } from "@/lib/format";
import type { DateTimeSettings, Place, StampModel, StampSettings } from "@/types";

export function buildStampModel(input: {
  place: Place | null;
  stampedAt: Date | null;
  settings: StampSettings;
  dateTime: DateTimeSettings;
  note: string;
}): StampModel {
  const { place, stampedAt, settings, dateTime, note } = input;
  const compact = settings.density === "compact";
  const title = settings.showAddress
    ? addressTitle(place?.address ?? null) || (place ? "" : "Location not set")
    : "";
  const details = settings.showAddress && !compact ? addressDetails(place?.address ?? null) : "";
  const sourceLabel =
    place && (settings.showSource || place.source === "manual")
      ? place.source === "manual"
        ? "Manual"
        : "GPS"
      : null;
  const coordinates = settings.showCoordinates
    ? place
      ? `${formatCoordinates(place.latitude, place.longitude)}${sourceLabel ? ` · ${sourceLabel}` : ""}`
      : "Lat — Long —"
    : sourceLabel
      ? sourceLabel
      : null;
  const dateTimeLine = stampedAt
    ? formatStampDate(stampedAt, {
        hour12: dateTime.hour12,
        showDate: settings.showDate,
        showTime: settings.showTime,
        timezone: dateTime.timezone,
      })
    : null;
  const accuracy =
    settings.showAccuracy && place?.source === "automatic" && place.accuracy != null
      ? `Accuracy ±${Math.round(place.accuracy)} m`
      : null;
  const trimmedNote = note.trim();

  return {
    title,
    flag: settings.showAddress && place?.address ? countryFlag(place.address.countryCode) : "",
    address: details === title ? "" : details,
    coordinates,
    dateTime: dateTimeLine,
    accuracy,
    note: settings.showNote && trimmedNote ? trimmedNote : null,
    watermark: settings.showWatermark ? APP_NAME : null,
    showMap: settings.showMap,
  };
}
