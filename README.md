# Quiet Pantry

Quiet Pantry is the clean TypeScript rebuild of **Cook Once, Live Free**: a local-first kitchen world for batch cooking, deal memory, recipes, receipts and a tiny pantry-mouse assistant.

## What is local

Recipes, weekly plans, flyers, receipt images, deal history, pantry state, themes and sounds are browser-local. The app does not use Supabase Storage. The only hosted information is the signed-in account's entitlement and credit ledger.

## Supabase setup

1. Create a new Supabase project named `quiet-pantry` in the EU region.
2. In **Authentication → Providers → Email**, enable Email and enable Magic Link. Disable password sign-in if you do not want passwords.
3. In **Authentication → URL Configuration**, set your Vercel production URL as the Site URL and add that same URL to Redirect URLs.
4. Open **SQL Editor**, paste and run the complete file [`supabase/quiet-pantry.sql`](./supabase/quiet-pantry.sql).
5. In **Project Settings → API**, copy the Project URL and anon key. In **Project Settings → API Keys**, copy the service-role key. The service-role key is server-only.

## Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for Production, Preview and Development as appropriate:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — never prefix with `NEXT_PUBLIC_` |
| `DEEPSEEK_API_KEY` | DeepSeek API key — server only |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` |

You only need to add these values in Vercel for deployment. Never expose or commit the two server-only keys.

## Credit policy

- Free plan: 310 credits monthly = 10 AI actions.
- Pro plan: 3,100 credits monthly = 100 AI actions.
- Every hosted Miro action consumes 31 credits, including a user-initiated messy flyer/receipt interpretation.
- The API atomically debits first; if DeepSeek fails it refunds the 31 credits.
- Anyone can explore the app without signing in. Magic-link identity is required only for the hosted credit allowance.
- Users can alternatively add their own DeepSeek key in Settings. BYOK is stored only in that browser, bypasses Quiet Pantry credits, and is sent only for that user's Miro request.

## Current foundation

- Quiet Pantry world UI: daylight, dark and pantry themes.
- EN/RU/BG interface selection.
- Miro companion and 31-credit AI endpoint.
- Recipe shelf and a quick tap-to-build recipe creator.
- Batch plan room with equipment-aware paths.
- Text and `.txt` deal imports plus local deal-memory confirmation.
- PDF/image/receipt local file selection. Browser OCR and authenticated magic-link UI are the next integration layer; raw uploads will remain local.
- Installable/offline-ready service-worker foundation.

## Next product increment

Implement browser IndexedDB repositories, JSON export/import, Supabase magic-link UI, OCR with a web worker, and the fully structured recipe/portion compiler. Those features are intentionally separated from the privacy-safe product shell delivered here.
