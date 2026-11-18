// A project's buttons, on the Compose list and its page, as a container row's: Restart all, Stop all or
// Start all, and Remove project, which asks first; ⋯ only while it runs in part, for Stop all.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
// Return on a focused button: the keydown, then the click the browser makes of it (detail 0).
const enter = (el) => { el.focus(); const k = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }); el.dispatchEvent(k); if (!k.defaultPrevented) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 })); };
ui.vm = "running";
const C = (p, n) => ({ Id: p + n, Names: [`/${p}-${n}-1`], Image: n, State: "running", Status: "Up 1 hour", Created: 1, Ports: [], Labels: { "com.docker.compose.project": p, "com.docker.compose.service": n } });
const proj = { name: "shop", dir: "/w/shop", files: ["/w/shop/compose.yaml"], readable: true, updated: 1, services: [{ name: "web", image: "web", build: "", ports: [], volumes: [], depends: [], networks: [], kinds: [] }], containers: [{ service: "web", id: "shopweb", name: "shop-web-1", image: "web", state: "running", status: "Up" }] };
kiri.on({ type: "lists", containers: [C("shop", "web")], images: [], volumes: [], networks: [] });
show("compose");
kiri.on({ type: "composeprojects", logos: {}, projects: [proj] });
const menuNames = () => [...document.querySelectorAll(".menu button")].map((b) => b.textContent);
const asks = (where) => {
  const d = document.querySelector(".scrim [role=alertdialog]");
  eq([!!d, /Remove shop\?/.test(d?.textContent || "")], [true, true], where + ": the confirm");
  document.querySelector(".scrim").remove();
};
// Its buttons, as a container row's: Restart all, Stop all (or Start all), Remove project; ⋯ only while it runs in part.
const btns = (box) => [...box.querySelectorAll(".acts-row > *")].map((b) => b.classList.contains("slot") ? "" : b.getAttribute("aria-label") || b.title);
const where = { list: () => $("content").querySelector("tr[data-cmpopen]"), page: () => $("cmp-head") };
for (const [how, act] of [["click", click], ["Return", enter]]) for (const [name, go] of [["list", () => { show("compose"); cmp.open = null; render(); }], ["page", () => cmpOpen("shop")]]) {
  t(`the ${name}: Restart all, Stop all and Remove project are buttons, no ⋯; Remove project asks (${how})`, () => {
    go();
    eq(btns(where[name]()).filter((x, i) => x || name === "list"), name === "list" ? [tr("Restart all"), tr("Stop all"), tr("Remove project"), ""] : [tr("Restart all"), tr("Stop all"), tr("Remove project")], "the buttons");
    for (const b of where[name]().querySelectorAll(".acts-row button")) eq(getComputedStyle(b).cursor, "pointer", "a hand: " + b.title);
    act(where[name]().querySelector('[data-g="remove"]'));
    asks(name);
  });
}
// Part running: Start all in its slot, and ⋯ holds Stop all.
const part = { ...proj, services: [...proj.services, { ...proj.services[0], name: "api" }], containers: [...proj.containers, { ...proj.containers[0], service: "api", id: "shopapi", name: "shop-api-1", state: "exited" }] };
kiri.on({ type: "lists", containers: [C("shop", "web"), { ...C("shop", "api"), State: "exited" }], images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: [part] });
for (const [how, act] of [["click", click], ["Return", enter]]) t(`part running: Start all in its slot, and ⋯ (${how}) holds Stop all, on the list and the page`, () => {
  show("compose"); cmp.open = null; render();
  eq(btns(where.list()), [tr("Restart all"), tr("Start all"), tr("Remove project"), tr("More actions for {name}", { name: "shop" })], "the list's buttons");
  act(where.list().querySelector("[data-gmore]"));
  eq(menuNames(), [tr("Stop all")], "the menu, on the list"); closeMenu();
  cmpOpen("shop");
  act(document.querySelector("#cmp-head [data-gmore]"));
  eq([cmp.open, menuNames()], ["shop", [tr("Stop all")]], "the menu, on the page"); closeMenu();
});
t("Escape closes the menu and puts focus back on its ⋯, on the page and on the list", () => {
  const esc = () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  cmpOpen("shop");
  const page = document.querySelector("[data-gmore]"); click(page); document.querySelector(".menu button").focus(); esc();
  eq([!!document.querySelector(".menu"), document.activeElement?.dataset.gmore], [false, "shop"], "the page's ⋯");
  show("compose"); cmp.open = null; render();
  const row = $("content").querySelector("tr[data-cmpopen] [data-gmore]"); click(row); document.querySelector(".menu button").focus();
  render(); esc();
  eq([!!document.querySelector(".menu"), document.activeElement === $("content").querySelector("tr[data-cmpopen] [data-gmore]")], [false, true], "the row's ⋯, drawn again");
});
t("Remove on an opened file's project: said, and its network no longer named", () => {
  kiri.on({ type: "composeaction", name: "shop", removed: true });
  eq([...document.querySelectorAll(".toast")].pop()?.textContent.includes("Removed shop"), true, "the toast");
  kiri.on({ type: "lists", containers: [], images: [], volumes: [], networks: [] });
  kiri.on({ type: "composeprojects", logos: {}, projects: [{ ...proj, containers: [], fresh: true }] });
  cmpOpen("shop");
  eq([$("content").textContent.includes("shop_default")], [false], "no network named");
});
report(R);
