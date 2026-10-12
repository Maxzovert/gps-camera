"use client";

import { useSyncExternalStore } from "react";

export type PermissionHost = "android" | "chrome";

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

export function isInstalledApp(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

export function permissionHost(): PermissionHost {
  if (typeof navigator === "undefined") return "chrome";
  return isAndroid() && isInstalledApp() ? "android" : "chrome";
}

function subscribe(onChange: () => void) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  const fullscreen = window.matchMedia("(display-mode: fullscreen)");
  standalone.addEventListener("change", onChange);
  fullscreen.addEventListener("change", onChange);
  return () => {
    standalone.removeEventListener("change", onChange);
    fullscreen.removeEventListener("change", onChange);
  };
}

export function usePermissionHost(): PermissionHost {
  return useSyncExternalStore(subscribe, permissionHost, () => "chrome");
}

export function openAndroidPermissionSettings(): boolean {
  if (typeof navigator === "undefined" || !isAndroid()) return false;
  const href = isInstalledApp()
    ? "intent:#Intent;action=android.settings.MANAGE_APPLICATIONS_SETTINGS;end"
    : "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;category=android.intent.category.DEFAULT;data=package:com.android.chrome;end";
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}
