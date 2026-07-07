# MediaHub Downloader

A premium, SaaS-quality media downloader for **YouTube** and **Instagram**. Paste a public link, pick a quality or format, and download — with live progress, a download manager, local history, and a polished glassmorphism UI in light/dark mode.

> ⚠️ **Use responsibly.** Only download content you own or have explicit permission to access, and comply with the terms of service of the source platform.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, React Hook Form, Axios |
| Backend | Node.js, Express, TypeScript |
| Media processing | [yt-dlp](https://github.com/yt-dlp/yt-dlp) for metadata + downloads, [FFmpeg](https://ffmpeg.org/) for audio extraction / container conversion |
| Deployment | Docker, Docker Compose |

## Project structure

```
web-downloader/
├── backend/           Express API — analyze, download queue, progress, history
│   └── src/
│       ├── routes/        HTTP route handlers
│       ├── services/      yt-dlp/ffmpeg orchestration, queue, cache, history
│       ├── middleware/     validation, rate limiting, error handling
│       ├── utils/          URL parsing, format selection, formatting helpers
│       └── config/         env-driven configuration
├── frontend/          Next.js app
│   └── src/
│       ├── app/            routes, layout, global styles
│       ├── components/     hero, analyze, results, download-manager, history, settings, ui
│       ├── context/        DownloadManager, Settings, Toast providers
│       ├── hooks/          reusable client hooks
│       └── lib/            API client, types, formatting, storage helpers
└── docker-compose.yml
```

## Prerequisites (local dev)

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [ffmpeg](https://ffmpeg.org/) available on `PATH`
  ```bash
  brew install yt-dlp ffmpeg   # macOS
  ```

## Getting started

```bash
# 1. Backend
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev         # http://localhost:3000
```

Open http://localhost:3000, paste a YouTube or Instagram link, and click **Analyze**.

## Running with Docker

```bash
docker compose up --build
```

This builds the backend image (Node + yt-dlp + ffmpeg preinstalled) and the frontend image (Next.js standalone output), and wires them together. The app is served at `http://localhost:3000`, proxying API calls to the backend at `http://localhost:4000`.

## How it works

1. **Analyze** (`POST /api/analyze`) — validates and normalizes the URL, detects the platform, and runs `yt-dlp -J` to extract metadata. Results are cached in-memory for a few minutes. Video formats are bucketed into a standard quality ladder (144p–2160p); audio-only options are synthesized for MP3 (128/192/256/320 kbps) and source M4A.
2. **Download** (`POST /api/download`) — enqueues a job with bounded concurrency. Video downloads use `yt-dlp -f <format>+bestaudio --merge-output-format mp4` (FFmpeg handles the mux); audio downloads use `yt-dlp -x --audio-format mp3/m4a` (FFmpeg handles extraction/conversion). Instagram carousel images are fetched directly and bypass yt-dlp entirely.
3. **Progress** (`GET /api/progress/:id`) — the frontend polls this every second; yt-dlp's stdout is parsed for `[download]`/`[Merger]`/`[ExtractAudio]` lines to report `downloading` → `converting` → `ready`.
4. **File delivery** (`GET /api/download/file/:id`) — streams the finished file with `Content-Disposition`, then a background cron job cleans up files and job records after a TTL.
5. **History** (`GET/DELETE /api/history`) — the last 20 completed downloads, held server-side and mirrored to `localStorage` for instant loads and offline resilience.

## Security & reliability

- Rate limiting on `/api/analyze` and `/api/download` (plus a general limiter), via `express-rate-limit`
- Request validation with `zod`; URLs are parsed and restricted to `http(s)` YouTube/Instagram hosts before ever reaching yt-dlp
- `helmet` for standard HTTP security headers; CORS locked to the configured frontend origin
- yt-dlp/ffmpeg are invoked with `execFile`/`spawn` and an argument array — never through a shell — so URLs and titles can't inject shell commands
- Friendly, mapped error messages for private/age-restricted/removed content, network failures, and timeouts
- Temporary files and stale jobs are swept on a 5-minute cron cycle

## Known limitations

- Instagram access depends entirely on yt-dlp's extractor and Instagram's own rate limiting; private content, some Reels, and heavily throttled IPs may fail even for content you're authorized to access.
- History and the download queue are in-memory on the backend (by design, for simplicity) — they reset on server restart. Swap in Redis/Postgres for multi-instance or persistent deployments.
- No user accounts/auth — this is a single-tenant, local-first tool. Add an auth layer before exposing it publicly.

## Environment variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list (ports, rate limits, concurrency, cache TTLs, CORS origin, API URL).
