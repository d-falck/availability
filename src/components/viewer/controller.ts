/**
 * Tiny dependency-free controller for the viewer. It attaches to the data-*
 * attributes rendered by ViewerPage, so the identical script works whether the
 * page was server-rendered by Next or written to a standalone HTML file. It
 * reads owner/contact details from window.__VIEWER__.
 *
 * Exported as a string so it can be dropped into a <script> tag in both places.
 */

export const CONTROLLER_JS = String.raw`
(function () {
  var cfg = (window.__VIEWER__ || { ownerName: "me", contactEmail: "" });
  var selected = new Map();
  var bar = document.querySelector(".suggest-bar");
  var countEl = document.querySelector(".suggest-count");
  var sendEl = document.querySelector(".suggest-send");

  function render() {
    var n = selected.size;
    if (countEl) countEl.textContent = n + " selected";
    if (bar) bar.classList.toggle("is-active", n > 0);
  }

  document.querySelectorAll("[data-slot-id]").forEach(function (el) {
    el.addEventListener("click", function () {
      var id = el.getAttribute("data-slot-id");
      if (selected.has(id)) { selected.delete(id); el.classList.remove("is-selected"); }
      else { selected.set(id, el.getAttribute("data-label") || id); el.classList.add("is-selected"); }
      render();
    });
  });

  function compose() {
    if (!selected.size) return;
    var lines = Array.from(selected.values()).sort();
    var body =
      "Hi " + cfg.ownerName + ",\n\nThese could work for me:\n\n" +
      lines.map(function (l) { return "• " + l; }).join("\n") +
      "\n\nLet me know what suits!";
    // Copy as a friendly fallback, then open the user's mail client.
    if (navigator.clipboard) navigator.clipboard.writeText(body).catch(function () {});
    var subject = "Some times that work for me";
    var href =
      "mailto:" + encodeURIComponent(cfg.contactEmail) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    window.location.href = href;
    if (sendEl) {
      var prev = sendEl.textContent;
      sendEl.textContent = "Copied & opening email…";
      setTimeout(function () { sendEl.textContent = prev; }, 2200);
    }
  }

  if (sendEl) sendEl.addEventListener("click", compose);
  render();
})();
`;
