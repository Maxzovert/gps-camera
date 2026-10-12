"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { combineLocal, formatStampDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DateTimeSettings as DateTimeValue, TimezoneDisplay } from "@/types";

export function DateTimeSettings({
  open,
  onOpenChange,
  value,
  now,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DateTimeValue;
  now: Date | null;
  onChange: (value: DateTimeValue) => void;
}) {
  const manual = combineLocal(value.manualDate, value.manualTime);
  const previewDate = value.mode === "automatic" ? now : manual;
  const preview = previewDate
    ? formatStampDate(previewDate, {
        hour12: value.hour12,
        showDate: true,
        showTime: true,
        timezone: value.timezone,
      })
    : "Enter a valid date and time";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Date and time"
      description="Automatic time keeps ticking until you take the photo. A custom time stays exactly as you set it."
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
        <ModeButton active={value.mode === "automatic"} onClick={() => onChange({ ...value, mode: "automatic" })}>
          Device time
        </ModeButton>
        <ModeButton active={value.mode === "manual"} onClick={() => onChange({ ...value, mode: "manual" })}>
          Custom time
        </ModeButton>
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 px-3 py-3 text-sm tabular-nums">{preview ?? "—"}</p>
      {value.mode === "automatic" ? (
        <p className="mt-3 text-sm text-white/65">
          Uses this device&apos;s clock and timezone. The stamp freezes at the moment you capture. The file still keeps the real capture time separately.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <Label className="mb-1 block">Date</Label>
            <Input
              type="date"
              value={value.manualDate}
              onChange={(event) => onChange({ ...value, manualDate: event.target.value })}
            />
          </label>
          <label>
            <Label className="mb-1 block">Time</Label>
            <Input
              type="time"
              value={value.manualTime}
              onChange={(event) => onChange({ ...value, manualTime: event.target.value })}
            />
          </label>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant={value.hour12 ? "default" : "outline"} onClick={() => onChange({ ...value, hour12: true })}>
          12-hour
        </Button>
        <Button type="button" variant={!value.hour12 ? "default" : "outline"} onClick={() => onChange({ ...value, hour12: false })}>
          24-hour
        </Button>
      </div>
      <label className="mt-4 block">
        <Label className="mb-1 block">Timezone display</Label>
        <select
          value={value.timezone}
          onChange={(event) => onChange({ ...value, timezone: event.target.value as TimezoneDisplay })}
          className="h-11 w-full rounded-xl border border-border bg-white/5 px-3 text-base"
        >
          <option value="offset">GMT offset</option>
          <option value="short">Short name</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>
      <Button type="button" className="mt-5 w-full" size="lg" onClick={() => onOpenChange(false)}>
        Done
      </Button>
    </Sheet>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-11 rounded-xl text-sm font-semibold", active ? "bg-primary text-black" : "text-white")}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
