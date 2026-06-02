# availability

A minimal, beautiful, single-user calendar-sharing tool. The core mode (**Mode
B**) is a read-only *social availability* page for coffee / walk / dinner /
drinks: it doesn't let anyone book — it shows the **shape** of your free time so
external scheduling negotiations are easy.

## The key architectural idea: generation vs serving

Two halves with opposite constraints, kept strictly apart:

```
Google Calendar(s)  ──fetch full events──►  [ LLM reasoning pass ]  ──►  snapshot.json  ──►  viewer page
   (work + personal)        (PRIVATE)         + deterministic guardrails    (SANITIZED)      (fast, public)
```

- **Generation** (`src/lib/generate/`, Phase 2) is slow, costs money, and sees
  your real calendar — full titles/descriptions — which is how the LLM reasons
  intelligently (skips a coffee on a back-to-back morning, treats a tentative
  evening softly, respects your reserve rules). It runs in the background,
  triggered by a Google calendar-change webhook.
- **Serving** (`src/app/v/[token]/`, Phase 3) only ever reads the sanitized
  `Snapshot`. It has no access to Google or the LLM, so it *cannot* leak event
  details. The privacy boundary is the snapshot, not the API scope.

**Guardrails wrap the LLM:** the model proposes candidate slots; deterministic
code then enforces hard rules (evening reserve cap, pinned reserved nights,
title stripping) before anything becomes a public `Slot`. Trust but verify.

**Priority tiers, one generation:** every slot carries a `minOpenness` (1–3). A
share link encodes a tier; the page shows `slots.filter(s => s.minOpenness <=
tier)`. One LLM pass → low / medium / high views.

## Config

All tunables live in [`src/config.ts`](src/config.ts) — day/evening windows,
durations, evening-reserve rule, pinned nights, preferences, per-tier views.

## Types (the contracts)

- [`src/types/calendar.ts`](src/types/calendar.ts) — `RawEvent` / `CalendarFetch`: the **private** full-detail shape.
- [`src/types/snapshot.ts`](src/types/snapshot.ts) — `Snapshot` / `Slot`: the **sanitized public** contract.

## Roadmap

1. ✅ **Config + types + mock calendar** — schemas and a realistically messy 3-week fake calendar.
2. ⬜ **Generation pipeline** — LLM reasoning → candidates → guardrails → `snapshot.json` (built against mock first).
3. ⬜ **Viewer page** — two lanes, slot cards, "kept for deep work" indicator, tiered links, compose-a-message action.
4. ⬜ **Wire up Google** — read-only OAuth, real fetch, calendar-change webhook.

> Mode A (Calendly-style booking) is intentionally out of scope for now; the
> architecture stays open to it.

## Develop

```bash
npm install
npm run dev        # Next.js app
npm run typecheck
npm run generate   # (Phase 2) regenerate snapshot from the mock calendar
```
