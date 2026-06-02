/**
 * Tiny dependency-free controller for the recipient page. Attaches to the data-*
 * attributes from ViewerPage, so the identical script works whether the page was
 * server-rendered by Next or written to a standalone HTML file. Selecting days
 * and hitting "Copy these" copies the chosen times to the clipboard.
 *
 * Exported as a string so it can be dropped into a <script> tag in both places.
 */

export const CONTROLLER_JS = String.raw`
(function () {
  var selected = new Map();
  var bar = document.querySelector(".suggest-bar");
  var countEl = document.querySelector(".suggest-count");
  var sendEl = document.querySelector(".suggest-send");
  var idle = sendEl ? sendEl.textContent : "Copy these";

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

  function copy() {
    if (!selected.size) return;
    var text = Array.from(selected.values()).sort().join("\n");
    var done = function () {
      if (!sendEl) return;
      sendEl.textContent = "Copied ✓";
      setTimeout(function () { sendEl.textContent = idle; }, 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
    else done();
  }

  if (sendEl) sendEl.addEventListener("click", copy);
  render();
})();
`;
