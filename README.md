# availability

A minimal, beautiful, single-user calendar-sharing tool. You compose a
per-recipient availability page from a few event types (or a custom
description), send the link (or paste the times), and it **stays up to date**
with your calendar. It never lets anyone book — it shows the *shape* of your
free time so scheduling is easy.

## Architecture (LLM-brain)

```
Google Calendar(s) ─► GEOMETRY (deterministic) ─► schedule.json ─► BRAIN (LLM, per share) ─► validate ─► /v/[share]
   (private, full)     free windows minus           (server-only:    reasons over events +     no overlap    (sanitized
                       confirmed timed events       windows+events)  whole horizon + prefs     w/ confirmed   slots only)
                       (all-day/tentative = context)                 → proposes slots          events
```

- **Geometry** (`src/lib/generate/geometry.ts`): exact free windows = the daily span minus *confirmed timed* events. All-day / tentative events are passed through as **context**, not blocks. Deterministic and precise (also the basis for Mode A booking).
- **Brain** (`src/lib/llm/brain.ts`): per share, sees the whole-horizon schedule (free windows + real events) + the meet-up + soft preferences, and proposes slots — reasoning about all-day holds, deadlines, busy weeks, energy. Output **validated** to sit inside a free window. **Cached** (`refinecache.ts`) by a fingerprint of (schedule + types + description + preferences). Needs `ANTHROPIC_API_KEY`.
- **Preferences** (`src/lib/prefs.ts`): the Settings (reserve, windows, all-day handling, free-text guidance) become *soft* prompt text — no hard-coded reserve.
- **Recipient page**: minimal, chronological, casual labels derived from precise bounds.

<details><summary>(superseded earlier design)</summary>

## Architecture

```
Google Calendar(s) ─► Stage 1: RULES ─► snapshot.json ─► Stage 2: REFINE ─► recipient page /v/[share]
   (private, full)     gap-finder +      (sanitized,      per share: filter    (minimal, chronological,
                       reserve rules     no titles)       by event type/desc    stays up to date)
                                                          — LLM-refined+cached)
        ▲                                                         ▲
        └──── change webhook (Phase 4) re-runs Stage 1           shares composed on /me (private)
```

- **Stage 1 — rules** (`src/lib/generate/`): deterministic gap-finder over the
  horizon. Each free window gets its real bounds, an "if need be" flag, and the
  event types it could suit. The evening-reserve and pinned-night rules are
  enforced here. Output is the sanitized `snapshot.json` — the privacy boundary,
  no event titles. Regenerated on calendar change.
- **Stage 2 — refine** (`src/lib/refine.ts`): resolves a share into the windows
  its recipient should see. Today a deterministic filter by event type; this is
  the seam where an LLM filters/orders more tastefully, **cached per (event
  types / description + snapshot version)** — the LLM swaps in with no
  downstream change.
- **Shares** (`src/lib/shares.ts`, `/me`): you pick event types + a note or a
  custom description; each share is stored server-side and gets a stable
  `/v/[share]` link plus **Copy as text**. Resolved against the *latest*
  snapshot at view time, so links never go stale.
- **Recipient page** (`/v/[share]`): minimal, chronological, same-day windows
  combined ("from 10am / evening"), specific times where the data allows ("from
  7:15pm"), a quiet "if need be" on times to avoid. No categories, no copy.

## Config

All tunables live in [`src/config.ts`](src/config.ts): day/evening windows,
durations, evening-reserve rule, pinned nights, the standard **event types**,
and owner/contact.

## Roadmap

1. ✅ Config, type contracts, mock calendar
2. ✅ Stage 1 rules pipeline → `snapshot.json`
3. ✅ Stage 2 refine + shares + `/me` + recipient pages + text export
4. ⬜ Plug in the LLM refine pass (needs `ANTHROPIC_API_KEY`) with caching
5. ⬜ Google Calendar: read-only OAuth, real fetch, change webhook
6. ⬜ Auth on `/me` before any public deploy

## Develop

```bash
npm install
npm run dev          # app: / , /me , /v/[share]
npm run generate     # Stage 1: regenerate data/snapshot.json from the mock calendar
npx tsx src/lib/preview/render.tsx   # write self-contained preview HTML to data/
```

> Previews (`data/preview-*.html`) are generated artifacts, committed only for
> easy viewing. GitHub shows `.html` as source — download to view rendered.

</details>
