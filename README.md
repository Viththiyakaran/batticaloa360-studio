# Batticaloa360 AI Content Studio

A private, mobile-responsive editorial workspace for discovering Batticaloa news, verifying sources, drafting natural Tamil content, and composing branded graphics. This repository currently implements the Phase 1 MVP and leaves later external publishing and video modules visibly locked rather than simulating success.

## Implemented in Phase 1

- Responsive admin shell with desktop/mobile navigation and light/dark themes
- Supabase-ready private login, with a clearly labelled local demo mode
- Editorial dashboard and workflow status cards
- Manual public URL import with validation, timeouts, private-network blocking and duplicate URL checks
- Source management UI and approved-source model
- News filtering, evidence links and manual verification
- Server-side Gemini or OpenAI caption/article generation with grounded prompts
- Deterministic no-credential mock content that is explicitly labelled
- Editable Facebook caption and Blogger article views
- Working full-caption clipboard copy with feedback
- Tamil-safe Canvas image compositor, templates, photo upload and native-resolution PNG/JPG download
- Supabase schema for all requested entities, indexes, RLS and Storage policies
- Hourly Vercel cron entry, health route, environment template and prompt tests

## Local setup

Requirements: Node.js 22 LTS or 24 LTS, npm, and optionally a Supabase project.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With `NEXT_PUBLIC_DEMO_MODE=true`, the login screen accepts the prefilled development values and all paid/external operations remain in safe mock mode.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202610110001_initial_schema.sql` using the Supabase CLI or SQL editor.
3. Create the first Auth user in the Supabase dashboard.
4. Insert a matching `profiles` row with role `admin`.
5. Fill the Supabase values in `.env.local` and set `NEXT_PUBLIC_DEMO_MODE=false`.

The service-role key is server-only. OAuth tokens are modelled as encrypted credentials; configure a proper key-management service before enabling publishing.

## AI configuration

For Gemini, set `GEMINI_API_KEY` and optionally `GEMINI_TEXT_MODEL`. Gemini is preferred when both providers are configured. Alternatively, set `OPENAI_API_KEY` and optionally `OPENAI_TEXT_MODEL`. Requests are made only in the server Route Handler, so no API key reaches the browser. Without either key, the application returns labelled deterministic drafts so the UI can be evaluated without cost.

## Deployment

1. Create Supabase production resources and apply the migration.
2. Deploy the repository to Vercel or a compatible Next.js host.
3. Configure all environment values in the hosting dashboard.
4. Set a strong `CRON_SECRET`; ensure the scheduler sends it as `Authorization: Bearer …`.
5. Verify Auth redirect URLs and disable demo mode.
6. Test source ingestion and paid generation against a small budget before inviting users.

Long video renders must run in a separate worker and are not implemented in Phase 1. Blogger and Meta OAuth/publishing are also intentionally deferred; no claim of successful external publishing is made.

## Verification commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Current limitations / next phases

- RSS/API adapters and durable CRUD need to be connected to the Supabase repositories (the schema and UI contracts are ready).
- The generated background button currently uses an economical procedural template; paid AI backgrounds are not yet connected.
- Draft save is session-only until Supabase persistence is enabled.
- Video/TTS/Remotion rendering is Phase 3 and requires a separate worker.
- Blogger and Facebook OAuth/publishing are Phase 4 and require verified provider permissions.
- Source similarity matching is represented by `content_fingerprint`; semantic similarity processing is pending.
