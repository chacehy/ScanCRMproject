@AGENTS.md

# app — Expo mobile client

See root `../CLAUDE.md` for the overall project. Two tabs: Scan Card (`src/app/index.tsx`) and History (`src/app/explore.tsx`), both talking to the shared Supabase `leads` table.

- `npm start` — Expo dev server. The scan flow calls the web app's `/api/scan`, so run `web/` alongside this in dev.
- Requires `.env.local` (copy from `.env.example`): Supabase URL/anon key must match the `web/` app's project. `EXPO_PUBLIC_API_URL` is optional — only set it to point at a deployed backend; leave unset for LAN dev auto-detection.
- `src/lib/supabase.ts` throws at import time if Supabase env vars are missing — don't add hardcoded fallback credentials back in.
- The `android/` folder is a checked-in prebuild output (not `expo prebuild`-generated fresh each time), so native config changes (e.g. `app.json`'s `android.usesCleartextTraffic`) must also be mirrored manually into `android/app/src/main/AndroidManifest.xml` to take effect without a full prebuild.
