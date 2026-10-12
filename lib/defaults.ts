import type { Preferences, StampSettings, StampTemplateId } from "@/types";

const classic: Omit<StampSettings, "template" | "position" | "background" | "textColor" | "fontScale"> = {
  density: "detailed",
  showMap: true,
  showAddress: true,
  showCoordinates: true,
  showDate: true,
  showTime: true,
  showAccuracy: false,
  showSource: false,
  showNote: false,
  showWatermark: true,
};

export const STAMP_PRESETS: Record<
  Exclude<StampTemplateId, "custom">,
  Omit<StampSettings, "template" | "position" | "background" | "textColor" | "fontScale">
> = {
  classic,
  minimal: {
    density: "compact",
    showMap: false,
    showAddress: true,
    showCoordinates: false,
    showDate: true,
    showTime: true,
    showAccuracy: false,
    showSource: false,
    showNote: false,
    showWatermark: false,
  },
  coordinates: {
    density: "compact",
    showMap: false,
    showAddress: false,
    showCoordinates: true,
    showDate: true,
    showTime: true,
    showAccuracy: false,
    showSource: false,
    showNote: false,
    showWatermark: false,
  },
  field: {
    density: "detailed",
    showMap: true,
    showAddress: true,
    showCoordinates: true,
    showDate: true,
    showTime: true,
    showAccuracy: true,
    showSource: true,
    showNote: true,
    showWatermark: true,
  },
};

export const TEMPLATE_ORDER: StampTemplateId[] = [
  "classic",
  "minimal",
  "coordinates",
  "field",
  "custom",
];

export const TEMPLATE_COPY: Record<StampTemplateId, { label: string; detail: string }> = {
  classic: {
    label: "Classic GPS",
    detail: "Address, coordinates, date, and time",
  },
  minimal: {
    label: "Minimal",
    detail: "City, date, and time",
  },
  coordinates: {
    label: "Coordinates",
    detail: "Latitude, longitude, and timestamp",
  },
  field: {
    label: "Field report",
    detail: "Address, coordinates, accuracy, and note",
  },
  custom: {
    label: "Custom",
    detail: "Choose which fields are visible",
  },
};

export const DEFAULT_STAMP: StampSettings = {
  template: "classic",
  position: "bottom-left",
  background: "transparent",
  textColor: "#ffffff",
  fontScale: 1,
  ...classic,
};

export const DEFAULT_PREFERENCES: Preferences = {
  stamp: DEFAULT_STAMP,
  dateTime: {
    mode: "automatic",
    manualDate: "",
    manualTime: "",
    hour12: true,
    timezone: "offset",
  },
  locationMode: "automatic",
  manualPlace: null,
  geocodingEnabled: true,
  imageFormat: "image/jpeg",
  jpegQuality: 0.92,
  selfTimer: 0,
};

export function applyTemplate(current: StampSettings, template: StampTemplateId): StampSettings {
  if (template === "custom") {
    return { ...current, template: "custom" };
  }
  return {
    ...current,
    ...STAMP_PRESETS[template],
    template,
  };
}
