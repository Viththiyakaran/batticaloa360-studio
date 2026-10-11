# Batticaloa360 AI Content Studio Roadmap

This roadmap prioritises a reliable editorial workflow before expensive media generation or external publishing. Every publishing action requires explicit administrator approval.

## Current status

The Phase 1 foundation is deployed on Netlify. The Supabase schema, row-level security policies, Storage buckets and administrator profile are installed. The production publishable key and administrator sign-in are verified, and the editorial screens now use persistent Supabase data.

## Phase 1 - Working editorial MVP

Status: **In progress - production login verified, end-to-end workflow smoke test next**

- [x] Next.js App Router application with TypeScript and Tailwind CSS
- [x] Responsive private dashboard with light and dark themes
- [x] Supabase schema, indexes, row-level security and Storage buckets
- [x] Supabase password-authentication integration
- [x] News-source management and safe public URL import interfaces
- [x] Verification interface with visible source references
- [x] Tamil Facebook caption and Blogger article generator
- [x] Editable content and working full-caption clipboard copy
- [x] Tamil-safe branded image compositor with PNG/JPG downloads
- [x] Safe development mode when paid credentials are unavailable
- [x] Correct and independently verify the Netlify publishable-key value
- [x] Complete an interactive administrator login smoke test
- [x] Replace seeded news with persistent Supabase CRUD
- [x] Persist sources, stories, verification decisions and drafts
- [x] Upload generated images to Supabase Storage
- [ ] Add hourly RSS discovery adapters and automation logs
- [ ] Complete an end-to-end production smoke test

Exit criteria: an authenticated administrator can add a source, import or discover a story, verify it, generate Tamil content, save a draft, create an image and retrieve everything after signing in again.

## Phase 2 - Editorial workflow and content library

Status: **Planned**

- Complete the searchable Content Library with filters and previews
- Add content version history and audit logging
- Improve duplicate detection with URL normalization and content fingerprints
- Add Draft, Ready for Review, Approved and Archived workflows
- Require approval before every publishing action
- Complete Blogger editing, SEO descriptions and label management
- Add all requested image templates and background controls
- Add monthly AI budgets, usage logs and generation limits
- Add integration and authorization tests

Exit criteria: content moves reliably from discovery through approval with a complete audit trail and reusable assets.

## Phase 3 - 60-second Tamil video studio

Status: **Planned after Phase 2**

- Generate and edit grounded Tamil narration scripts
- Divide scripts into timed scenes and storyboards
- Add a configurable Tamil-capable text-to-speech provider
- Add voice previews and selection where supported
- Generate time-aligned Tamil subtitles
- Build a Remotion 1080 x 1920 composition
- Add licensed music, transitions and branding overlays
- Implement a separate secure FFmpeg rendering worker
- Show render progress and support MP4 preview/download
- Enforce render budgets and temporary-file cleanup

Exit criteria: an approved story can produce a reviewed, downloadable 60-second Tamil MP4 without fabricated moving news footage.

## Phase 4 - Blogger and Facebook publishing

Status: **Planned after Phase 3**

- Connect Google OAuth and select the authorised Blogger site
- Save Blogger drafts and publish approved articles with Tamil labels
- Connect Meta OAuth to an authorised Batticaloa360 Facebook Page
- Publish approved captions and images through official APIs
- Support Reels only when account permissions and APIs allow it
- Add duplicate protection, retries and publication history
- Record published URLs and detailed failure logs
- Keep manual fallbacks: copy caption, download assets and open platform

Exit criteria: approved content can be published through authorised official APIs with duplicate prevention and honest fallbacks.

## Phase 5 - Production automation and operations

Status: **Planned**

- Run hourly approved-source discovery and daily editorial suggestions
- Add monitoring, structured error reporting and retry policies
- Harden rate limiting, external URL fetching and OAuth token protection
- Add backup, recovery and asset-retention procedures
- Add accessibility and cross-device regression testing
- Complete deployment runbooks and operational documentation
- Review generation quality, spending and source reliability monthly

Exit criteria: the studio operates safely and affordably as a dependable single-administrator production system.

## Delivery principles

- Never publish automatically.
- Never fabricate facts, dates, quotations or source links.
- Keep Tamil text separate from AI-generated image backgrounds.
- Clearly label AI illustrations; never present them as event photography.
- Keep paid operations disabled until credentials and budgets are configured.
- Finish and verify each phase before starting the next major phase.
