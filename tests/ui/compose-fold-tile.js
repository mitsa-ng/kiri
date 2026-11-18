// parity: macos windows linux
// window: 1440x900
// A project's tile folds it, as its arrow does: the arrow and the tile are one
// button, with the hand, a tip and a name for screen readers. The project's name
// and the rest of its row still open its page; a service's tile is only a picture.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
// What a key does to a focused button: its own click, unless a handler takes the key first.
const keyOn = (el, k) => { el.focus(); const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); if (!e.defaultPrevented) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 })); };
const L = (svc) => ({ "com.docker.compose.project": "shop", "com.docker.compose.service": svc });
ui.vm = "running";
kiri.on({ type: "lists", containers: [
  { Id: "w1", Names: ["/shop-web-1"], Image: "shop-web", State: "running", Status: "Up 1 hour", Created: 1, Ports: [], Labels: L("web") },
  { Id: "d1", Names: ["/shop-db-1"], Image: "postgres:16", State: "running", Status: "Up 1 hour", Created: 1, Ports: [], Labels: L("db") }], images: [], volumes: [], networks: [] });
const svc = (name, o) => ({ name, image: "", build: "", ports: [], volumes: [], depends: [], networks: ["default"], kinds: [], ...o });
const PROJECTS = { type: "composeprojects", projects: [{
  name: "shop", dir: "/w/shop", files: ["/w/shop/compose.yaml"], readable: true, updated: 1,
  services: [svc("db", { image: "postgres:16" }), svc("web", { build: "/w/shop/web" })],
  containers: [{ service: "db", id: "d1", name: "shop-db-1", image: "postgres:16", state: "running", status: "Up" }, { service: "web", id: "w1", name: "shop-web-1", image: "shop-web", state: "running", status: "Up" }] }] };
show("compose"); kiri.on(PROJECTS);
const pTile = () => document.querySelector('tr[data-cmpopen="shop"] .tile.cmp');
const pFold = () => document.querySelector('[data-cmpfold="shop"]');
const members = () => document.querySelectorAll('#content tr.member[data-cmpsvc="shop"]').length;
// The tile as a pointer finds it: what is on top at its middle.
const atTile = () => { const r = pTile().getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); };

t("the tile is inside the fold button, with the hand, a tip and a name", () => {
  const b = pTile().closest("button");
  eq([b === pFold(), b.getAttribute("aria-expanded"), b.title, b.getAttribute("aria-label")], [true, "true", "Hide its services", "Hide its services: shop"], "one button");
  eq([getComputedStyle(pTile()).cursor, getComputedStyle(atTile()).cursor], ["pointer", "pointer"], "the hand on the tile");
  const r = b.getBoundingClientRect(), tb = pTile().getBoundingClientRect(), c = b.querySelector(":scope > svg").getBoundingClientRect();
  eq([r.left <= c.left && r.right >= tb.right, r.width >= 50, r.height >= tb.height], [true, true, true], "the hit area is the arrow and the whole tile");
});
t("clicking the tile folds and unfolds, and does not open the page", () => {
  eq(members(), 2, "open: its services show");
  sent.length = 0; click(atTile());
  eq([members(), cmp.open, sent.some((m) => m.type === "composefile"), pFold().getAttribute("aria-expanded"), pFold().title], [0, null, false, "false", "Show its services"], "folded, still on the list");
  click(atTile());
  eq([members(), cmp.open, pFold().getAttribute("aria-expanded"), pFold().title], [2, null, "true", "Hide its services"], "unfolded, still on the list");
});
t("Return and Space on the focused tile button fold it", () => {
  keyOn(pFold(), "Enter");
  eq([members(), cmp.open, document.activeElement === pFold()], [0, null, true], "Return folds; focus stays");
  keyOn(pFold(), " ");
  eq([members(), cmp.open, document.activeElement === pFold()], [2, null, true], "Space unfolds; focus stays");
});
t("a folded project stays folded when the list refreshes", () => {
  click(atTile());
  kiri.on(PROJECTS); kiri.on(PROJECTS);
  eq([members(), pFold().getAttribute("aria-expanded")], [0, "false"], "still folded");
  click(atTile()); kiri.on(PROJECTS);
  eq([members(), pFold().getAttribute("aria-expanded")], [2, "true"], "still open");
});
t("a service's tile is only a picture", () => {
  const st = document.querySelector('#content tr.member[data-svc="web"] .name .tile');
  eq([!!st, !!st?.closest("button")], [true, false], "not in a button");
});
t("the project's name still opens its page", () => {
  sent.length = 0; click(document.querySelector('tr[data-cmpopen="shop"] .link'));
  eq([cmp.open, sent.some((m) => m.type === "composefile")], ["shop", true], "opens the page");
  cmp.open = null; render();
  sent.length = 0; click(document.querySelector('tr[data-cmpopen="shop"] td:nth-child(2)'));
  eq(cmp.open, "shop", "the rest of the row opens it too");
});
report(R);
