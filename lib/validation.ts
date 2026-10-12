import { z } from "zod";

export const manualLocationSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80, "Country is too long"),
  region: z.string().trim().min(1, "State or region is required").max(80, "Region is too long"),
  city: z.string().trim().min(1, "City is required").max(80, "City is too long"),
  area: z.string().trim().max(120, "Area is too long"),
  street: z.string().trim().max(160, "Street is too long"),
  latitude: z
    .string()
    .trim()
    .min(1, "Latitude is required")
    .refine((value) => {
      const number = Number(value);
      return Number.isFinite(number) && number >= -90 && number <= 90;
    }, "Latitude must be between -90 and 90"),
  longitude: z
    .string()
    .trim()
    .min(1, "Longitude is required")
    .refine((value) => {
      const number = Number(value);
      return Number.isFinite(number) && number >= -180 && number <= 180;
    }, "Longitude must be between -180 and 180"),
});

export type ManualLocationValues = z.infer<typeof manualLocationSchema>;

export function emptyManualLocation(): ManualLocationValues {
  return {
    country: "",
    region: "",
    city: "",
    area: "",
    street: "",
    latitude: "",
    longitude: "",
  };
}
