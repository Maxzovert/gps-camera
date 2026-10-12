export type FacingMode = "user" | "environment";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

export type LocationSource = "automatic" | "manual";

export interface AddressParts {
  country: string;
  region: string;
  city: string;
  area: string;
  street: string;
  postcode: string;
  countryCode: string;
}

export interface Place {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: LocationSource;
  address: AddressParts | null;
}

export type StampTemplateId =
  | "classic"
  | "minimal"
  | "coordinates"
  | "field"
  | "custom";

export type StampPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

export type StampBackground = "transparent" | "black" | "white";

export type TimezoneDisplay = "offset" | "short" | "hidden";

export type CameraMode = "share" | "photo" | "video" | "reports";

export type ImageMime = "image/jpeg" | "image/png";

export type PanelId =
  | "location"
  | "datetime"
  | "stamp"
  | "settings"
  | "note"
  | "storage"
  | "preview";

export interface StampSettings {
  template: StampTemplateId;
  position: StampPosition;
  background: StampBackground;
  textColor: string;
  fontScale: number;
  density: "compact" | "detailed";
  showMap: boolean;
  showAddress: boolean;
  showCoordinates: boolean;
  showDate: boolean;
  showTime: boolean;
  showAccuracy: boolean;
  showSource: boolean;
  showNote: boolean;
  showWatermark: boolean;
}

export interface DateTimeSettings {
  mode: "automatic" | "manual";
  manualDate: string;
  manualTime: string;
  hour12: boolean;
  timezone: TimezoneDisplay;
}

export interface Preferences {
  stamp: StampSettings;
  dateTime: DateTimeSettings;
  locationMode: LocationSource;
  manualPlace: Place | null;
  geocodingEnabled: boolean;
  imageFormat: ImageMime;
  jpegQuality: number;
  selfTimer: 0 | 3 | 10;
}

export interface StampModel {
  title: string;
  flag: string;
  address: string;
  coordinates: string | null;
  dateTime: string | null;
  accuracy: string | null;
  note: string | null;
  watermark: string | null;
  showMap: boolean;
}

export interface CaptureResult {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  filename: string;
  kind: "image" | "video";
  capturedAt: string;
  stampedAt: string;
  source: LocationSource | "none";
  latitude: number | null;
  longitude: number | null;
}

export interface StoredPhoto {
  id: string;
  blob: Blob;
  filename: string;
  kind: "image" | "video";
  width: number;
  height: number;
  capturedAt: string;
  stampedAt: string;
  source: LocationSource | "none";
  latitude: number | null;
  longitude: number | null;
}

export interface SearchHit {
  label: string;
  latitude: number;
  longitude: number;
  address: AddressParts;
}
