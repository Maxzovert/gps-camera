"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export function useNow(active: boolean) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return now;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function subscribeToNothing() {
  return () => undefined;
}

function installedSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function iosSnapshot() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const standalone = useSyncExternalStore(subscribeToNothing, installedSnapshot, () => false);
  const ios = useSyncExternalStore(subscribeToNothing, iosSnapshot, () => false);
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const onPrompt = (promptEvent: Event) => {
      promptEvent.preventDefault();
      setEvent(promptEvent as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setAccepted(true);
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") setAccepted(true);
    setEvent(null);
  };

  return { canInstall: Boolean(event) && !standalone && !accepted, install, installed: standalone || accepted, ios };
}
