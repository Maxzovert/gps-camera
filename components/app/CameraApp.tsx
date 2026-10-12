"use client";

import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { CameraControls } from "@/components/camera/CameraControls";
import { CameraView } from "@/components/camera/CameraView";
import { PermissionPopup } from "@/components/camera/PermissionPopup";
import { SetLocationSheet } from "@/components/location/SetLocationSheet";
import { PhotoPreview } from "@/components/photo/PhotoPreview";
import { StorageGallery } from "@/components/photo/StorageGallery";
import { DateTimeSettings } from "@/components/settings/DateTimeSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { StampSettings as StampSettingsSheet } from "@/components/stamp/StampSettings";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useCamera } from "@/hooks/useCamera";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useInstallPrompt, useNow, useOnlineStatus } from "@/hooks/useDevice";
import { useMapThumbnail } from "@/hooks/useMapThumbnail";
import { usePreferences } from "@/hooks/usePreferences";
import { LOGO_SRC } from "@/lib/brand";
import { openAndroidPermissionSettings, openInChrome } from "@/lib/permission-host";
import { grabPhotoSource } from "@/lib/capture";
import { DEFAULT_PREFERENCES, TEMPLATE_ORDER } from "@/lib/defaults";
import { clearLocalData, savePhoto } from "@/lib/db";
import { reverseGeocode } from "@/lib/geocoding";
import { combineLocal, extensionForMime, photoFilename } from "@/lib/format";
import { computeFrame, paintFrame, renderStampedBlob, renderStampedImage } from "@/lib/image-stamp";
import { downloadBlob, loadImageFile, shareOrDownload } from "@/lib/media";
import { startStampedRecording, type RecordingHandle } from "@/lib/recorder";
import { buildStampModel } from "@/lib/stamp";
import type { CameraMode, CaptureResult, PanelId, Place, StampSettings, StoredPhoto } from "@/types";
import type { ManualLocationValues } from "@/lib/validation";

export function CameraApp() {
  const camera = useCamera();
  const geo = useGeolocation();
  const requestGps = geo.request;
  const subscribeGps = geo.subscribe;
  const online = useOnlineStatus();
  const install = useInstallPrompt();
  const { preferences, update, replace, ready } = usePreferences();
  const now = useNow(preferences.dateTime.mode === "automatic");
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [locationKey, setLocationKey] = useState(0);
  const [mode, setMode] = useState<CameraMode>("photo");
  const [zoom, setZoom] = useState<1 | 2>(1);
  const [exposure, setExposure] = useState(0);
  const [grid, setGrid] = useState(false);
  const [note, setNote] = useState("");
  const [chosenPlace, setChosenPlace] = useState<Place | null | undefined>(undefined);
  const place =
    chosenPlace !== undefined
      ? chosenPlace
      : ready && preferences.locationMode === "manual"
        ? preferences.manualPlace
        : null;
  const [capture, setCapture] = useState<CaptureResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [galleryVersion, setGalleryVersion] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [permissionSkipped, setPermissionSkipped] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const viewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const phoneCameraRef = useRef<HTMLInputElement>(null);
  const wantedRef = useRef(false);
  const retryAfterSettings = useRef(false);
  const cancelTimer = useRef(false);
  const recorderRef = useRef<RecordingHandle | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const fontRef = useRef("sans-serif");
  const stampBeforeReports = useRef<StampSettings | null>(null);
  const map = useMapThumbnail(place?.latitude ?? null, place?.longitude ?? null);

  const liveRef = useRef({
    zoom,
    exposure,
    place,
    preferences,
    note,
    mapCanvas: map.canvas,
  });
  useEffect(() => {
    liveRef.current = { zoom, exposure, place, preferences, note, mapCanvas: map.canvas };
  }, [zoom, exposure, place, preferences, note, map.canvas]);

  useEffect(() => {
    const image = new Image();
    image.src = LOGO_SRC;
    image.onload = () => {
      logoRef.current = image;
    };
    fontRef.current = getComputedStyle(document.body).fontFamily || "sans-serif";
  }, []);

  const { status, release, start, facingRef } = camera;

  useEffect(() => {
    subscribeGps((reading) => {
      if (preferences.locationMode === "manual") return;
      setChosenPlace({
        latitude: reading.latitude,
        longitude: reading.longitude,
        accuracy: reading.accuracy,
        source: "automatic",
        address: null,
      });
      if (preferences.locationMode !== "automatic") update({ locationMode: "automatic" });
      if (!preferences.geocodingEnabled) return;
      void reverseGeocode(reading.latitude, reading.longitude)
        .then((address) => {
          if (!address) return;
          setChosenPlace((current) => {
            if (!current || current.source !== "automatic") return current;
            if (current.latitude !== reading.latitude || current.longitude !== reading.longitude) return current;
            return { ...current, address };
          });
        })
        .catch(() => undefined);
    });
  }, [subscribeGps, preferences.locationMode, preferences.geocodingEnabled, update]);

  useEffect(() => {
    if (geo.error) toast.error(geo.error);
  }, [geo.error]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !retryAfterSettings.current) return;
      retryAfterSettings.current = false;
      if (status === "denied" || status === "error") {
        wantedRef.current = true;
        void start(facingRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status, start, facingRef]);

  useEffect(() => {
    const covered = panel === "preview" || panel === "storage";
    if (covered) {
      if (status === "ready") {
        wantedRef.current = true;
        release();
      }
      return;
    }
    if (wantedRef.current && status === "idle") {
      void start(facingRef.current);
    }
  }, [panel, status, release, start, facingRef]);

  useEffect(() => {
    if (!capture) return;
    const url = capture.url;
    return () => URL.revokeObjectURL(url);
  }, [capture]);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => () => recorderRef.current?.stop(), []);

  const manualDate = combineLocal(preferences.dateTime.manualDate, preferences.dateTime.manualTime);
  const stampedAt = preferences.dateTime.mode === "automatic" ? now : manualDate;
  const model = buildStampModel({
    place,
    stampedAt,
    settings: preferences.stamp,
    dateTime: preferences.dateTime,
    note,
  });

  function openLocation() {
    setLocationKey((value) => value + 1);
    setPanel("location");
    if ((place?.source ?? preferences.locationMode) !== "manual") requestGps();
  }

  function changeMode(next: CameraMode) {
    if (recording) {
      toast("Stop recording before changing modes.");
      return;
    }
    if (mode === "reports" && next !== "reports" && stampBeforeReports.current) {
      update({ stamp: stampBeforeReports.current });
      stampBeforeReports.current = null;
    }
    if (next === "reports" && mode !== "reports") {
      stampBeforeReports.current = preferences.stamp;
      update({ stamp: applyField(preferences.stamp) });
    }
    setMode(next);
  }

  async function captureStill() {
    const video = camera.videoRef.current;
    const box = viewRef.current?.getBoundingClientRect();
    if (!video || video.videoWidth === 0) {
      toast.error("The camera isn't ready yet.");
      return;
    }
    const frozen =
      preferences.dateTime.mode === "automatic"
        ? new Date()
        : combineLocal(preferences.dateTime.manualDate, preferences.dateTime.manualTime);
    if (!frozen) {
      toast.error("Enter a valid date and time.");
      return;
    }
    setProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 40));
    const grabbed = await grabPhotoSource(video, camera.streamRef.current?.getVideoTracks()[0] ?? null);
    try {
      const stamp = buildStampModel({
        place,
        stampedAt: frozen,
        settings: preferences.stamp,
        dateTime: preferences.dateTime,
        note,
      });
      const rendered = await renderStampedBlob(
        {
          source: grabbed.source,
          sourceWidth: grabbed.width,
          sourceHeight: grabbed.height,
          viewWidth: box?.width ?? 0,
          viewHeight: box?.height ?? 0,
          zoom,
          exposure,
          mirror: camera.facing === "user",
          model: stamp,
          settings: preferences.stamp,
          mapCanvas: map.canvas,
          logo: logoRef.current,
          fontFamily: fontRef.current,
        },
        preferences.imageFormat,
        preferences.jpegQuality,
      );
      const capturedAt = new Date();
      const filename = photoFilename(capturedAt, extensionForMime(rendered.blob.type || preferences.imageFormat));
      const result: CaptureResult = {
        id: crypto.randomUUID(),
        blob: rendered.blob,
        url: URL.createObjectURL(rendered.blob),
        width: rendered.width,
        height: rendered.height,
        filename,
        kind: "image",
        capturedAt: capturedAt.toISOString(),
        stampedAt: frozen.toISOString(),
        source: place?.source ?? "none",
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
      };
      setCapture(result);
      setPanel("preview");
      if (typeof navigator.vibrate === "function") navigator.vibrate(20);
      await remember(result);
      if (mode === "share") {
        const outcome = await shareOrDownload(rendered.blob, filename);
        if (outcome === "downloaded") toast("Sharing isn't available here, so the photo was downloaded.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't capture the photo.");
    } finally {
      grabbed.close();
      setProcessing(false);
    }
  }

  async function shutter() {
    if (countdown != null) {
      cancelTimer.current = true;
      return;
    }
    if (camera.status !== "ready" || processing) return;
    if (mode === "video") {
      if (recording) {
        recorderRef.current?.stop();
        return;
      }
      beginRecording();
      return;
    }
    if (preferences.selfTimer > 0) {
      cancelTimer.current = false;
      for (let second = preferences.selfTimer; second >= 1; second -= 1) {
        setCountdown(second);
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        if (cancelTimer.current) {
          setCountdown(null);
          return;
        }
      }
      setCountdown(null);
    }
    await captureStill();
  }

  function beginRecording() {
    const video = camera.videoRef.current;
    const box = viewRef.current?.getBoundingClientRect();
    if (!video || video.videoWidth === 0) {
      toast.error("The camera isn't ready yet.");
      return;
    }
    const frame = computeFrame(video.videoWidth, video.videoHeight, box?.width ?? 0, box?.height ?? 0, zoom);
    const handle = startStampedRecording({
      width: frame.outW,
      height: frame.outH,
      draw: (ctx) => {
        const current = camera.videoRef.current;
        const live = liveRef.current;
        if (!current || current.videoWidth === 0) return;
        const liveBox = viewRef.current?.getBoundingClientRect();
        const when =
          live.preferences.dateTime.mode === "automatic"
            ? new Date()
            : combineLocal(live.preferences.dateTime.manualDate, live.preferences.dateTime.manualTime);
        paintFrame(ctx, {
          source: current,
          sourceWidth: current.videoWidth,
          sourceHeight: current.videoHeight,
          viewWidth: liveBox?.width ?? 0,
          viewHeight: liveBox?.height ?? 0,
          zoom: live.zoom,
          exposure: live.exposure,
          mirror: camera.facingRef.current === "user",
          model: buildStampModel({
            place: live.place,
            stampedAt: when,
            settings: live.preferences.stamp,
            dateTime: live.preferences.dateTime,
            note: live.note,
          }),
          settings: live.preferences.stamp,
          mapCanvas: live.mapCanvas,
          logo: logoRef.current,
          fontFamily: fontRef.current,
        });
      },
      onStop: (blob, mime) => {
        const capturedAt = new Date();
        const filename = photoFilename(capturedAt, extensionForMime(mime));
        const result: CaptureResult = {
          id: crypto.randomUUID(),
          blob,
          url: URL.createObjectURL(blob),
          width: frame.outW,
          height: frame.outH,
          filename,
          kind: "video",
          capturedAt: capturedAt.toISOString(),
          stampedAt: capturedAt.toISOString(),
          source: place?.source ?? "none",
          latitude: place?.latitude ?? null,
          longitude: place?.longitude ?? null,
        };
        setCapture(result);
        setRecording(false);
        recorderRef.current = null;
        setPanel("preview");
        void remember(result);
      },
      onError: (message) => {
        toast.error(message);
        setRecording(false);
        recorderRef.current = null;
      },
    });
    if (!handle) return;
    recorderRef.current = handle;
    setRecording(true);
    setElapsed(0);
  }

  async function remember(result: CaptureResult) {
    try {
      await savePhoto({
        id: result.id,
        blob: result.blob,
        filename: result.filename,
        kind: result.kind,
        width: result.width,
        height: result.height,
        capturedAt: result.capturedAt,
        stampedAt: result.stampedAt,
        source: result.source,
        latitude: result.latitude,
        longitude: result.longitude,
      });
      setSavedId(result.id);
      setGalleryVersion((value) => value + 1);
      toast.success("Saved to gallery");
    } catch {
      toast.error("Couldn't save the photo to the gallery.");
    }
  }

  async function saveCurrent() {
    if (!capture) return;
    await remember(capture);
  }

  function pickGalleryPhoto() {
    fileRef.current?.click();
  }

  function openPhoneCamera() {
    setPermissionSkipped(true);
    phoneCameraRef.current?.click();
  }

  async function stampGalleryFile(file: File) {
    if (file.type && !file.type.startsWith("image/")) {
      toast.error("Choose a photo.");
      return;
    }
    const frozen =
      preferences.dateTime.mode === "automatic"
        ? new Date()
        : combineLocal(preferences.dateTime.manualDate, preferences.dateTime.manualTime);
    if (!frozen) {
      toast.error("Enter a valid date and time.");
      return;
    }
    setProcessing(true);
    let close = () => {};
    try {
      const loaded = await loadImageFile(file);
      close = loaded.close;
      const rendered = await renderStampedImage(
        loaded.source,
        loaded.width,
        loaded.height,
        {
          model: buildStampModel({
            place,
            stampedAt: frozen,
            settings: preferences.stamp,
            dateTime: preferences.dateTime,
            note,
          }),
          settings: preferences.stamp,
          mapCanvas: map.canvas,
          logo: logoRef.current,
          fontFamily: fontRef.current,
        },
        preferences.imageFormat,
        preferences.jpegQuality,
      );
      const capturedAt = new Date();
      const filename = photoFilename(capturedAt, extensionForMime(rendered.blob.type || preferences.imageFormat));
      const result: CaptureResult = {
        id: crypto.randomUUID(),
        blob: rendered.blob,
        url: URL.createObjectURL(rendered.blob),
        width: rendered.width,
        height: rendered.height,
        filename,
        kind: "image",
        capturedAt: capturedAt.toISOString(),
        stampedAt: frozen.toISOString(),
        source: place?.source ?? "none",
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
      };
      setCapture(result);
      setPanel("preview");
      await remember(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't stamp that photo.");
    } finally {
      close();
      setProcessing(false);
    }
  }

  function openStored(photo: StoredPhoto) {
    setCapture({ ...photo, url: URL.createObjectURL(photo.blob) });
    setSavedId(photo.id);
    setPanel("preview");
  }

  const manualInitial = toManualValues(place ?? preferences.manualPlace);

  return (
    <>
      <CameraControls
        grid={grid}
        flashOn={camera.torchOn}
        flashAvailable={camera.torchSupported}
        noteOn={note.trim().length > 0}
        manualTime={preferences.dateTime.mode === "manual"}
        locationState={place?.source ?? "unset"}
        online={online}
        mode={mode}
        recording={recording}
        templateBadge={Math.max(1, TEMPLATE_ORDER.indexOf(preferences.stamp.template) + 1)}
        onGrid={() => setGrid((value) => !value)}
        onFlash={() => {
          if (camera.status !== "ready") {
            toast("Turn the camera on first.");
            return;
          }
          if (!camera.torchSupported) {
            toast("Flash isn't available on this camera.");
            return;
          }
          void camera.toggleTorch();
        }}
        onNote={() => setPanel("note")}
        onLocation={openLocation}
        onDateTime={() => setPanel("datetime")}
        onSettings={() => setPanel("settings")}
        onMode={changeMode}
        onPreview={() => setPanel("preview")}
        onStorage={() => setPanel("storage")}
        onTemplate={() => setPanel("stamp")}
        onShutter={() => void shutter()}
        shutterDisabled={camera.status !== "ready" || processing}
      >
        <CameraView
          ref={viewRef}
          videoRef={camera.videoRef}
          status={camera.status}
          error={camera.error}
          facing={camera.facing}
          zoom={zoom}
          exposure={exposure}
          grid={grid}
          recording={recording}
          elapsed={elapsed}
          countdown={countdown}
          model={model}
          settings={preferences.stamp}
          mapUrl={map.url}
          onZoom={setZoom}
          onExposure={setExposure}
          onSwitchCamera={() => {
            wantedRef.current = true;
            void camera.start(camera.facing === "environment" ? "user" : "environment");
          }}
          onEnableCamera={() => setPermissionSkipped(false)}
          onOpenPhoneCamera={openPhoneCamera}
          onImport={pickGalleryPhoto}
        />
        {mode === "reports" ? (
          <label className="mx-3 mb-1 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <span className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">Note</span>
            <input
              value={note}
              maxLength={140}
              onChange={(event) => {
                const value = event.target.value;
                setNote(value);
                if (value.trim() && !preferences.stamp.showNote) {
                  update({ stamp: { ...preferences.stamp, showNote: true } });
                }
              }}
              placeholder="Field note"
              className="w-full bg-transparent text-base outline-none"
            />
          </label>
        ) : null}
      </CameraControls>

      <SetLocationSheet
        key={locationKey}
        open={panel === "location"}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        initialMode={place?.source ?? preferences.locationMode}
        manualInitial={manualInitial}
        countryCode={place?.address?.countryCode ?? preferences.manualPlace?.address?.countryCode ?? ""}
        postcode={place?.address?.postcode ?? preferences.manualPlace?.address?.postcode ?? ""}
        geocodingEnabled={preferences.geocodingEnabled}
        onGeocoding={(geocodingEnabled) => update({ geocodingEnabled })}
        online={online}
        onConfirm={(next) => {
          setChosenPlace(next);
          update({
            locationMode: next.source,
            manualPlace: next.source === "manual" ? next : preferences.manualPlace,
          });
          setPanel(null);
          toast.success(next.source === "manual" ? "Manual location applied" : "GPS location applied");
        }}
        geoStatus={geo.status}
        geoError={geo.error}
        geoReading={geo.reading}
        onRequestGps={requestGps}
      />
      <DateTimeSettings
        open={panel === "datetime"}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        value={preferences.dateTime}
        now={now}
        onChange={(dateTime) => update({ dateTime })}
      />
      <StampSettingsSheet
        open={panel === "stamp"}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        settings={preferences.stamp}
        model={model}
        mapUrl={map.url}
        onChange={(stamp) => update({ stamp })}
      />
      <GeneralSettings
        open={panel === "settings"}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        preferences={preferences}
        cameraStatus={camera.status}
        online={online}
        canInstall={install.canInstall}
        installed={install.installed}
        ios={install.ios}
        onInstall={() => void install.install()}
        onChange={(next) => update(next)}
        onClear={async () => {
          try {
            await clearLocalData();
            replace(DEFAULT_PREFERENCES);
            setChosenPlace(null);
            setNote("");
            toast.success("Local data cleared");
          } catch {
            toast.error("Couldn't clear local data.");
          }
        }}
        onCameraOff={() => {
          wantedRef.current = false;
          recorderRef.current?.stop();
          camera.release();
          setPanel(null);
        }}
        onOpenDate={() => setPanel("datetime")}
        onOpenStamp={() => setPanel("stamp")}
      />
      <Sheet
        open={panel === "note"}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        title="Stamp note"
        description="This line is drawn onto the photo when note visibility is on."
      >
        <textarea
          value={note}
          maxLength={140}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-base outline-none focus-visible:border-primary"
          placeholder="Optional note"
        />
        <p className="mt-1 text-right text-xs text-white/50">{note.length}/140</p>
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => {
            if (note.trim()) update({ stamp: { ...preferences.stamp, showNote: true } });
            setPanel(null);
          }}
        >
          Done
        </Button>
      </Sheet>
      <StorageGallery
        open={panel === "storage"}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
        onOpenPhoto={openStored}
        onImport={pickGalleryPhoto}
        refreshKey={galleryVersion}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="pointer-events-none absolute size-px opacity-0"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void stampGalleryFile(file);
        }}
      />
      <input
        ref={phoneCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="pointer-events-none absolute size-px opacity-0"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void stampGalleryFile(file);
        }}
      />
      <PhotoPreview
        open={panel === "preview"}
        item={capture}
        onClose={() => setPanel(null)}
        saved={capture?.id === savedId}
        onSave={() => void saveCurrent()}
        onDownload={() => {
          if (!capture) return;
          downloadBlob(capture.blob, capture.filename);
        }}
        onShare={() => {
          if (!capture) return;
          void shareOrDownload(capture.blob, capture.filename).then((outcome) => {
            if (outcome === "downloaded") toast("Sharing isn't available here, so the file was downloaded.");
          });
        }}
      />
      <PermissionPopup
        open={!permissionSkipped && camera.status !== "ready" && panel !== "preview"}
        cameraBusy={camera.status === "requesting"}
        locationBusy={geo.status === "loading"}
        cameraDenied={camera.status === "denied"}
        locationDenied={geo.status === "denied"}
        cameraError={camera.error}
        locationError={geo.error}
        onAllowCamera={() => {
          wantedRef.current = true;
          void camera.start(camera.facingRef.current);
        }}
        onAllowLocation={() => requestGps()}
        onOpenPhoneCamera={openPhoneCamera}
        onOpenInChrome={() => {
          openInChrome();
        }}
        onOpenSettings={() => {
          retryAfterSettings.current = true;
          openAndroidPermissionSettings();
        }}
        onClose={() => setPermissionSkipped(true)}
      />
      {processing ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 text-sm font-semibold">
          Rendering photo…
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {camera.status === "ready" ? "Camera ready" : camera.error || "Camera off"}.
        {place ? ` ${place.source === "manual" ? "Manual" : "GPS"} location.` : " Location not set."}
      </p>
      <Toaster theme="dark" position="top-center" />
    </>
  );
}

function applyField(settings: StampSettings): StampSettings {
  return {
    ...settings,
    template: "field",
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
  };
}

function toManualValues(place: Place | null): ManualLocationValues {
  return {
    country: place?.address?.country ?? "",
    region: place?.address?.region ?? "",
    city: place?.address?.city ?? "",
    area: place?.address?.area ?? "",
    street: place?.address?.street ?? "",
    latitude: place ? String(place.latitude) : "",
    longitude: place ? String(place.longitude) : "",
  };
}
