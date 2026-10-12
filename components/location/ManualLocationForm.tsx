"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchAddress } from "@/lib/geocoding";
import { emptyManualLocation, manualLocationSchema, type ManualLocationValues } from "@/lib/validation";
import type { Place } from "@/types";

export function ManualLocationForm({
  initial,
  countryCode,
  postcode,
  onApply,
  onUseAutomatic,
}: {
  initial: ManualLocationValues;
  countryCode: string;
  postcode: string;
  onApply: (place: Place) => void;
  onUseAutomatic: () => void;
}) {
  const form = useForm<ManualLocationValues>({
    resolver: zodResolver(manualLocationSchema),
    defaultValues: initial ?? emptyManualLocation(),
  });
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ label: string; latitude: number; longitude: number; countryCode: string; postcode: string; address: ManualLocationValues }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [extra, setExtra] = useState({ countryCode, postcode });

  async function search() {
    setSearching(true);
    setSearchError(null);
    try {
      const results = await searchAddress(query);
      setHits(
        results.map((hit) => ({
          label: hit.label,
          latitude: hit.latitude,
          longitude: hit.longitude,
          countryCode: hit.address.countryCode,
          postcode: hit.address.postcode,
          address: {
            country: hit.address.country,
            region: hit.address.region,
            city: hit.address.city,
            area: hit.address.area,
            street: hit.address.street,
            latitude: String(hit.latitude),
            longitude: String(hit.longitude),
          },
        })),
      );
      if (results.length === 0) setSearchError("No matches. Enter the address and coordinates yourself.");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <form
      className="space-y-3"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        onApply({
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          accuracy: null,
          source: "manual",
          address: {
            country: values.country,
            region: values.region,
            city: values.city,
            area: values.area,
            street: values.street,
            postcode: extra.postcode,
            countryCode: extra.countryCode,
          },
        });
      })}
    >
      <p className="text-sm text-white/70">
        Manual places are labeled Manual on the stamp, even if GPS is denied. They are not shown as a live GPS reading.
      </p>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search an address"
          aria-label="Search an address"
        />
        <Button type="button" variant="outline" onClick={() => void search()} disabled={searching || query.trim().length < 3}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : "Search"}
        </Button>
      </div>
      {searchError ? <p className="text-sm text-amber-200">{searchError}</p> : null}
      {hits.length > 0 ? (
        <ul className="max-h-36 space-y-1 overflow-y-auto">
          {hits.map((hit) => (
            <li key={`${hit.latitude}-${hit.longitude}-${hit.label}`}>
              <button
                type="button"
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10"
                onClick={() => {
                  form.reset(hit.address);
                  setExtra({ countryCode: hit.countryCode, postcode: hit.postcode });
                  setHits([]);
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <TextField form={form} name="country" label="Country" />
        <TextField form={form} name="region" label="State or region" />
        <TextField form={form} name="city" label="City" />
        <TextField form={form} name="area" label="Area or locality" />
      </div>
      <TextField form={form} name="street" label="Street address (optional)" />
      <div className="grid grid-cols-2 gap-3">
        <TextField form={form} name="latitude" label="Latitude" inputMode="decimal" />
        <TextField form={form} name="longitude" label="Longitude" inputMode="decimal" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onUseAutomatic}>
          Reset to automatic
        </Button>
        <Button type="submit" className="flex-1">
          Confirm location
        </Button>
      </div>
    </form>
  );
}

function TextField({
  form,
  name,
  label,
  inputMode,
}: {
  form: ReturnType<typeof useForm<ManualLocationValues>>;
  name: keyof ManualLocationValues;
  label: string;
  inputMode?: "decimal" | "text";
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <label className="block">
      <Label className="mb-1 block" htmlFor={name}>
        {label}
      </Label>
      <Input id={name} inputMode={inputMode} {...form.register(name)} />
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
