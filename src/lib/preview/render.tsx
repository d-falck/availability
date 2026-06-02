/**
 * Renders the real ViewerPage component to a single, self-contained HTML file
 * (compiled CSS inlined, no network needed) so the page can be shared and
 * judged without running a server. Adds a preview-only priority-tier switcher
 * so all three views can be compared in one file.
 *
 *   npx tsx src/lib/preview/render.tsx   ->   data/preview.html
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "@/config";
import { ViewerPage } from "@/components/viewer/ViewerPage";
import { CONTROLLER_JS } from "@/components/viewer/controller";
import type { Snapshot } from "@/types/snapshot";

const root = process.cwd();
const snapshot: Snapshot = JSON.parse(
  readFileSync(resolve(root, "data", "snapshot.json"), "utf8"),
);

// Render the full (tier 3) set; the switcher hides higher-openness cards client-side.
const markup = renderToStaticMarkup(
  React.createElement(ViewerPage, { snapshot, config }),
);

// Compile Tailwind for real, so the file is faithful and offline-safe.
const cssTmp = resolve(root, "data", "_preview.css");
execSync(`npx tailwindcss -i ./src/app/globals.css -o ${cssTmp} --minify`, {
  cwd: root,
  stdio: "ignore",
});
const css = readFileSync(cssTmp, "utf8");
rmSync(cssTmp, { force: true });

const viewerGlobals = {
  ownerName: config.owner.name,
  contactEmail: config.owner.contactEmail,
};

// Preview-only: a segmented control + CSS that hides cards above the chosen tier.
const SWITCHER_CSS = `
  .tierbar{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:50;
    display:flex;gap:2px;padding:4px;border-radius:999px;background:rgba(255,255,255,.9);
    border:1px solid #e7e5e4;box-shadow:0 8px 28px -16px rgb(0 0 0/.3);backdrop-filter:blur(8px);
    font-size:13px}
  .tierbar button{border:0;background:transparent;padding:6px 14px;border-radius:999px;
    color:#78716c;cursor:pointer;font:inherit}
  .tierbar button.active{background:#1c1917;color:#fff}
  body[data-tier="1"] .slot[data-openness="2"],
  body[data-tier="1"] .slot[data-openness="3"],
  body[data-tier="2"] .slot[data-openness="3"]{display:none}
`;

const SWITCHER_HTML = `
  <div class="tierbar" role="group" aria-label="Preview priority view">
    <button data-tier="1">Low priority</button>
    <button data-tier="2">Medium</button>
    <button data-tier="3" class="active">High priority</button>
  </div>`;

const SWITCHER_JS = String.raw`
  (function(){
    var btns = document.querySelectorAll(".tierbar button");
    btns.forEach(function(b){
      b.addEventListener("click", function(){
        document.body.setAttribute("data-tier", b.getAttribute("data-tier"));
        btns.forEach(function(x){ x.classList.toggle("active", x===b); });
      });
    });
  })();
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${config.owner.name}'s availability — preview</title>
<style>${css}${SWITCHER_CSS}</style>
</head>
<body data-tier="3">
${SWITCHER_HTML}
${markup}
<script>window.__VIEWER__=${JSON.stringify(viewerGlobals)}</script>
<script>${CONTROLLER_JS}</script>
<script>${SWITCHER_JS}</script>
</body>
</html>`;

const out = resolve(root, "data", "preview.html");
writeFileSync(out, html);
console.log("wrote", out, `(${(html.length / 1024).toFixed(0)} kb)`);
