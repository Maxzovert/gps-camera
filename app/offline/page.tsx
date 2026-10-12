import Image from "next/image";
import Link from "next/link";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <Image src={LOGO_SRC} alt="" width={96} height={96} className="size-24 rounded-3xl object-cover" priority />
      <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
      <p className="max-w-sm text-sm leading-6 text-white/70">
        You&apos;re offline. The app shell can open, and a manual location still works after the page loads. Camera, GPS, and address lookup need a connection or a permission you already granted. Not every feature works offline.
      </p>
      <Link href="/" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black">
        Try again
      </Link>
    </main>
  );
}
