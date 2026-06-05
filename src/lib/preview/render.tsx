/**
 * Renders the pages to self-contained HTML for offline viewing. The recipient
 * preview is built from the geometry's raw free windows (the LLM curation needs
 * the API key, which lives on Fly), so it shows layout/labels, not the final
 * curation.
 *
 *   npx tsx src/lib/preview/render.tsx   ->   data/preview-*.html
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "@/config";
import { ViewerPage } from "@/components/viewer/ViewerPage";
import { Composer } from "@/app/me/Composer";
import { CONTROLLER_JS } from "@/components/viewer/controller";
import { loadSchedule } from "@/lib/schedule";
import type { Slot } from "@/types/snapshot";

const root = process.cwd();
const schedule = loadSchedule();
if (!schedule) throw new Error("No schedule — run `npm run generate` first.");

const cssTmp = resolve(root, "data", "_preview.css");
execSync(`npx tailwindcss -i ./src/app/globals.css -o ${cssTmp} --minify`, { cwd: root, stdio: "ignore" });
const css = readFileSync(cssTmp, "utf8");
rmSync(cssTmp, { force: true });

function doc(title: string, body: string, withController = false): string {
  const scripts = withController ? `<script>${CONTROLLER_JS}</script>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title><style>${css}</style></head>
<body class="bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">${body}${scripts}</body></html>`;
}

// Recipient preview: raw free windows as slots (geometry only, no curation).
const slots: Slot[] = schedule.days.flatMap((d) =>
  d.freeWindows.map((w) => ({ id: `${d.date}-${w.startISO}`, date: d.date, startISO: w.startISO, endISO: w.endISO, ifNeedBe: false })),
);
const recipient = renderToStaticMarkup(React.createElement(ViewerPage, { slots }));
writeFileSync(resolve(root, "data", "preview-recipient.html"), doc("Availability", recipient, true));

const meBody = renderToStaticMarkup(
  React.createElement(
    "main",
    { className: "min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100" },
    React.createElement(
      "div",
      { className: "mx-auto max-w-lg px-6 py-14" },
      React.createElement(
        "h1",
        { className: "text-[15px] italic tracking-tight text-stone-400 dark:text-stone-500" },
        `${config.owner.name} · availability`,
      ),
      React.createElement(Composer, {
        eventTypes: config.eventTypes.map((t) => ({ id: t.id, label: t.label })),
        initialShares: [
          { id: "demo1", recipient: "Sam", typeIds: ["coffee"], createdAt: "" },
          { id: "demo2", recipient: "Priya", typeIds: ["dinner"], createdAt: "" },
        ],
        updatedAt: { demo1: Date.now(), demo2: null },
      }),
    ),
  ),
);
writeFileSync(resolve(root, "data", "preview-me.html"), doc("Your page", meBody));

console.log("wrote data/preview-{recipient,me}.html");
