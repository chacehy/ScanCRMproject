@AGENTS.md

# web — Next.js dashboard

See root `../CLAUDE.md` for the overall project. This is the CRM dashboard (`app/page.tsx`) plus the `/api/scan` OCR endpoint used by the mobile app.

- `npm run dev` — starts on `localhost:3000`.
- Requires `.env.local` (copy from `.env.example`): Supabase URL/anon key + `GEMINI_API_KEY`. Without `GEMINI_API_KEY`, `/api/scan` returns mock OCR data instead of calling Gemini.
- `lib/supabase.ts` throws at import time if Supabase env vars are missing — don't add hardcoded fallback credentials back in.
