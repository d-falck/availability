/**
 * Renders the real components to self-contained HTML files (compiled CSS inlined,
 * offline-safe) so the pages can be shared and judged without a server. Produces
 * a few example recipient pages plus the private composing page.
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
import { resolveShare } from "@/lib/refine";
import { loadSnapshot } from "@/lib/snapshot";
import type { Share } from "@/types/share";

const root = process.cwd();
const snapshot = loadSnapshot();
if (!snapshot) throw new Error("No snapshot — run `npm run generate` first.");

// Compile Tailwind once for all files.
const cssTmp = resolve(root, "data", "_preview.css");
execSync(`npx tailwindcss -i ./src/app/globals.css -o ${cssTmp} --minify`, {
  cwd: root,
  stdio: "ignore",
});
const css = readFileSync(cssTmp, "utf8");
rmSync(cssTmp, { force: true });

function doc(title: string, body: string, withController = false): string {
  const scripts = withController ? `<script>${CONTROLLER_JS}</script>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title><style>${css}</style></head>
<body class="bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">${body}${scripts}</body></html>`;
}

function mockShare(partial: Partial<Share>): Share {
  return { id: "preview", typeIds: [], createdAt: new Date().toISOString(), ...partial };
}

const recipients: { file: string; title: string; share: Share }[] = [
  {
    file: "preview-coffee.html",
    title: "Coffee / walk",
    share: mockShare({
      recipient: "Sam",
      typeIds: ["coffee", "walk", "lunch"],
      note: "Would be lovely to catch up — any of these work?",
    }),
  },
  {
    file: "preview-dinner.html",
    title: "Dinner / drinks",
    share: mockShare({ typeIds: ["dinner", "drinks"], note: "Dinner sometime soon?" }),
  },
  {
    file: "preview-weekend.html",
    title: "Weekend",
    share: mockShare({ typeIds: ["weekend"] }),
  },
];

for (const r of recipients) {
  const slots = resolveShare(r.share, snapshot);
  const body = renderToStaticMarkup(React.createElement(ViewerPage, { slots }));
  writeFileSync(resolve(root, "data", r.file), doc(r.title, body, true));
}

// Private composing page (static — shows the look; live interactivity needs the dev server).
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
          mockShare({ recipient: "Sam", typeIds: ["coffee", "walk"] }),
          mockShare({ recipient: "Priya", typeIds: ["dinner", "drinks"] }),
        ],
      }),
    ),
  ),
);
writeFileSync(resolve(root, "data", "preview-me.html"), doc("Your page", meBody));

console.log("wrote data/preview-{coffee,dinner,weekend,me}.html");
