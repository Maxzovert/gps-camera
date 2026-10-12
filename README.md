# GPS map camera

A free, mobile-first GPS camera that runs as a Progressive Web App. Photos are stamped in the browser and are not uploaded.

The home-screen icon is generated from `public/logo.jpeg`. The app name is **GPS map camera**.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Localhost is a secure context, so the camera and GPS prompts work during development. Production must be served over HTTPS.

The service worker is registered in production only. To try install and offline startup:

```bash
npm run build
npm start
```

## Deploy

No environment variables or paid APIs are required. Deploy the project to the Vercel free tier:

```bash
npx vercel
```

Or connect the repository in the Vercel dashboard. The build command is `npm run build`.

## What stays on the device

- Camera frames and finished photos are processed with the Canvas API.
- Settings, the last manual place, saved photos, and cached addresses live in IndexedDB.
- Automatic GPS is requested only when you ask for it, and it is not stored as a history.
- Address lookup, when enabled, sends coordinates to [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/). Map thumbnails come from CARTO basemaps. Both are skipped when lookup is off or the network is down.
- The service worker caches the app shell, icon, and logo. It does not cache photos, GPS readings, or geocoding responses.

Clear everything from Settings → Clear saved data.

## Browser notes

- Use the rear camera by default. Flash works only when the active camera exposes a torch, which is typically Android Chrome.
- iOS Safari has no install prompt. Use Share → Add to Home Screen. Video recording depends on `MediaRecorder` and `canvas.captureStream`; if either is missing, photos still work.
- Digital zoom crops the frame when the device has no hardware zoom.
- A manual location is labeled Manual on the stamp so it is not presented as a live GPS reading. Turn on “Location source” in the stamp settings to also label GPS fixes.

## Icons

`npm run icons` rebuilds the PWA icons from `public/logo.jpeg`.
