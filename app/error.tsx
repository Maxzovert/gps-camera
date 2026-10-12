"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-white/70">The camera screen hit an unexpected error. Your photos were not uploaded.</p>
      <button type="button" onClick={reset} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-black">
        Try again
      </button>
    </main>
  );
}
