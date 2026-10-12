"use client";

import { StampPreview } from "@/components/stamp/StampPreview";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TEMPLATE_COPY, TEMPLATE_ORDER, applyTemplate } from "@/lib/defaults";
import { cn } from "@/lib/utils";
import type { StampBackground, StampModel, StampPosition, StampSettings } from "@/types";

const POSITIONS: StampPosition[] = ["bottom-left", "bottom-right", "top-left", "top-right"];
const BACKGROUNDS: { id: StampBackground; label: string }[] = [
  { id: "transparent", label: "Clear" },
  { id: "black", label: "Black" },
  { id: "white", label: "White" },
];
const COLORS = ["#ffffff", "#111111", "#f5c518"];

export function StampSettings({
  open,
  onOpenChange,
  settings,
  model,
  mapUrl,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: StampSettings;
  model: StampModel;
  mapUrl: string | null;
  onChange: (settings: StampSettings) => void;
}) {
  function patch(partial: Partial<StampSettings>, custom = true) {
    onChange({ ...settings, ...partial, template: custom ? "custom" : settings.template });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Stamp" description="Choose a template, then adjust what is printed on the photo.">
      <div className="relative mb-4 h-48 overflow-hidden rounded-2xl bg-zinc-800">
        <StampPreview model={model} settings={settings} mapUrl={mapUrl} />
      </div>
      <div className="space-y-2">
        {TEMPLATE_ORDER.map((id, index) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(applyTemplate(settings, id))}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left",
              settings.template === id ? "border-primary bg-primary/10" : "border-white/10",
            )}
          >
            <span>
              <span className="block text-sm font-semibold">{TEMPLATE_COPY[id].label}</span>
              <span className="block text-xs text-white/55">{TEMPLATE_COPY[id].detail}</span>
            </span>
            <span className="text-xs text-white/50">{index + 1}</span>
          </button>
        ))}
      </div>
      <h3 className="mt-5 mb-2 text-sm font-semibold">Position</h3>
      <div className="grid grid-cols-2 gap-2">
        {POSITIONS.map((position) => (
          <Button
            key={position}
            type="button"
            variant={settings.position === position ? "default" : "outline"}
            onClick={() => patch({ position }, false)}
          >
            {position.replace("-", " ")}
          </Button>
        ))}
      </div>
      <h3 className="mt-5 mb-2 text-sm font-semibold">Background</h3>
      <div className="grid grid-cols-3 gap-2">
        {BACKGROUNDS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={settings.background === item.id ? "default" : "outline"}
            onClick={() => patch({ background: item.id }, false)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <h3 className="mt-5 mb-2 text-sm font-semibold">Text</h3>
      <div className="flex items-center gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Text color ${color}`}
            onClick={() => patch({ textColor: color }, false)}
            className={cn("size-9 rounded-full border", settings.textColor === color ? "border-primary" : "border-white/20")}
            style={{ background: color }}
          />
        ))}
        <input
          type="color"
          value={settings.textColor}
          aria-label="Custom text color"
          onChange={(event) => patch({ textColor: event.target.value }, false)}
          className="size-9 bg-transparent"
        />
      </div>
      <label className="mt-4 block text-sm">
        Font size
        <Slider
          className="mt-3"
          min={0.85}
          max={1.4}
          step={0.05}
          value={[settings.fontScale]}
          onValueChange={([value]) => patch({ fontScale: value ?? 1 }, false)}
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant={settings.density === "compact" ? "default" : "outline"} onClick={() => patch({ density: "compact" })}>
          Compact
        </Button>
        <Button type="button" variant={settings.density === "detailed" ? "default" : "outline"} onClick={() => patch({ density: "detailed" })}>
          Detailed
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        <Toggle label="Address" checked={settings.showAddress} onChange={(showAddress) => patch({ showAddress })} />
        <Toggle label="Coordinates" checked={settings.showCoordinates} onChange={(showCoordinates) => patch({ showCoordinates })} />
        <Toggle label="Date" checked={settings.showDate} onChange={(showDate) => patch({ showDate })} />
        <Toggle label="Time" checked={settings.showTime} onChange={(showTime) => patch({ showTime })} />
        <Toggle label="GPS accuracy" checked={settings.showAccuracy} onChange={(showAccuracy) => patch({ showAccuracy })} />
        <Toggle label="Location source" checked={settings.showSource} onChange={(showSource) => patch({ showSource })} />
        <Toggle label="Note" checked={settings.showNote} onChange={(showNote) => patch({ showNote })} />
        <Toggle label="Map thumbnail" checked={settings.showMap} onChange={(showMap) => patch({ showMap })} />
        <Toggle label="GPS map camera mark" checked={settings.showWatermark} onChange={(showWatermark) => patch({ showWatermark })} />
      </div>
    </Sheet>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
