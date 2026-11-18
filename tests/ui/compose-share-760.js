// parity: macos windows linux
// window: 760x600
// The Share column on Compose's list (each service's row) and on a project's Services
// tab: the same cell as Containers have, for the service's first running container.
// A project shared anywhere says how many links it has live, which opens its Services.
// With Share off, neither table has the column.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const now = Math.floor(Date.now() / 1000);
const svc = (name, ports) => ({ name, image: "nginx:latest", build: "", ports, volumes: [], depends: [], networks: ["default"], kinds: [] });
const m = (svcName, n, state) => ({ service: svcName, id: `c-${svcName}-${n}`, name: `shop-${svcName}-${n}`, image: "nginx", state, status: "Up" });
const P = [{ name: "shop", dir: "/w/shop", files: ["/w/shop/compose.yaml"], readable: true, updated: now - 60,
  services: [svc("web", ["18080:80"]), svc("api", ["19101:9101", "19102:9102"]), svc("worker", []), svc("ghost", []), svc("busy", ["18081:80"]), svc("bad", ["18082:80"])],
  containers: [m("web", 1, "exited"), m("web", 2, "running"), m("api", 1, "running"), m("worker", 1, "exited"), m("busy", 1, "running"), m("bad", 1, "running")] },
  { name: "quiet", dir: "/w/quiet", files: ["/w/quiet/compose.yaml"], readable: true, updated: now - 60, services: [svc("app", [])], containers: [m("app", 1, "exited")] }];
const port = (p) => ({ IP: "0.0.0.0", PrivatePort: +p.split(":")[1], PublicPort: +p.split(":")[0], Type: "tcp" });
const lists = () => kiri.on({ type: "lists", images: [], volumes: [], networks: [], containers: P.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: c.state === "running" ? "Up 1 hour" : "Exited (0)", Created: 1,
  Ports: c.state === "running" ? (p.services.find((s) => s.name === c.service).ports || []).map(port) : [], Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))) });
const on = (share) => kiri.on({ type: "status", version: "0.1.4", dev: share, share, app: "Kiri", ours: "kiri", context: "kiri" });
ui.vm = "running"; on(true); lists();
kiri.on({ type: "composeprojects", logos: {}, projects: P });
kiri.on({ type: "share", id: 41, source: "shop-web-2", state: "live", url: "https://web-x.runkiri.cloud" });
kiri.on({ type: "share", id: 42, source: "shop-bad-1", state: "ended", reason: "No network", error: true });
sh.starting.add("shop-busy-1");
sh.account = { signedIn: true };
show("compose");
const cell = (tbl, name) => [...document.querySelectorAll(`${tbl} tbody tr`)].find((r) => (r.dataset.svc || r.querySelector("b")?.textContent) === name)?.querySelector("td.col-share");
const states = (tbl) => {
  eq(cell(tbl, "web").textContent.trim(), "Live", "the running one of two, live");
  eq(!!cell(tbl, "web").querySelector("[data-shmodal]"), true, "Live opens the link's dialog");
  eq([cell(tbl, "api").textContent.trim(), !!cell(tbl, "api").querySelector("[data-sharec]")], ["Share", true], "Share, yellow");
  for (const n of ["worker", "ghost"]) eq([!!cell(tbl, n).querySelector(".shc.off"), cell(tbl, n).querySelector(".shc.off").title], [true, "Start it to share it"], n + ": grey");
  eq([cell(tbl, "busy").textContent.trim(), !!cell(tbl, "busy").querySelector(".sh-spin")], ["Sharing…", true], "starting: the spinner");
  eq([cell(tbl, "bad").textContent.trim(), !!cell(tbl, "bad").querySelector(".shc.bad")], ["Couldn't share", true], "failed: red");
};
const noScroll = () => eq([document.scrollingElement.scrollWidth <= innerWidth + 1, $("content").scrollWidth <= $("content").clientWidth + 1], [true, true], "no sideways scroll");

t("the list: each service's Share cell, as on Containers", () => {
  eq([...document.querySelectorAll("table.clist thead th")].some((h) => h.textContent.trim() === "Share"), true, "a Share column");
  states("table.clist");
  noScroll();
});
t("the list: a project with links live says how many, which opens its Services", () => {
  eq(document.querySelector('tr[data-cmpopen="shop"] td.col-share').textContent.trim(), "", "open: its services say it, the project's cell is empty");
  click(document.querySelector('[data-cmpfold="shop"]'));
  const live = document.querySelector('tr[data-cmpopen="shop"] td.col-share .shc.live');
  eq([live?.textContent.trim(), !!live?.querySelector(".led")], ["1 live", true], "the count, in Live's green");
  eq(document.querySelector('tr[data-cmpopen="quiet"] td.col-share').textContent.trim(), "", "none shared: empty");
  click(live); cmp.folded.clear();
  eq([cmp.open, cmp.tab, !!document.querySelector("table.cmp-svcs")], ["shop", "services", true], "the project's Services");
});
t("Services tab: the same cells", () => {
  eq([...document.querySelectorAll("table.cmp-svcs thead th")].some((h) => h.textContent.trim() === "Share"), true, "a Share column");
  states("table.cmp-svcs");
  noScroll();
});
t("Share on a service sends what Containers send for its container, and opens nothing", () => {
  cmp.open = null; render();
  sh.starting.clear(); render(); sent.length = 0;
  click(cell("table.clist", "busy").querySelector("button"));
  const ours = sent.filter((x) => x.type === "share" || x.type === "shares");
  eq([ours.length > 0, cmp.open], [true, null], "sent, stayed on the list");
  sh.starting.clear(); show("containers"); sent.length = 0;
  click(document.querySelector('tr[data-key="c-busy-1"] td.col-share button'));
  eq(sent.filter((x) => x.type === "share" || x.type === "shares"), ours, "the same event");
  sh.starting.clear(); show("compose");
});
t("Share off: neither table has the column", () => {
  on(false); render();
  eq([...document.querySelectorAll("table.clist th")].some((h) => h.textContent.trim() === "Share") || !!document.querySelector("table.clist td.col-share"), false, "the list");
  cmpOpen("shop"); click(document.querySelector('[data-cmptab="services"]'));
  eq(!!document.querySelector("table.cmp-svcs td.col-share"), false, "Services");
  noScroll();
  on(true); cmp.open = null; render();
});
report(R);
