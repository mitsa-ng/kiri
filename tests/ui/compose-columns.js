// parity: macos windows linux
// window: 1440x900
// Compose's tables sort and resize as the other lists do: the list (projects, each
// with its services folded under it) and a project's Services tab. A heading sorts on
// click and the other way on a second; a column's edge drags, the widths are kept
// over a redraw, and a double-click puts them back. Ports is as wide as "19101→9101 +3".
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const box = (el) => el.getBoundingClientRect();
const now = Math.floor(Date.now() / 1000);
const svc = (name, ports, o) => ({ name, image: name + ":latest", build: "", ports, volumes: [], depends: [], networks: ["default"], kinds: [], ...o });
const proj = (name, updated, svcs, up) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated, services: svcs,
  containers: svcs.map((s) => ({ service: s.name, id: `${name}-${s.name}`, name: `${name}-${s.name}-1`, image: s.image, state: up.includes(s.name) ? "running" : "exited", status: "Up" })) });
const P = [
  proj("mid", now - 7200, [svc("web", ["18080:80"]), svc("api", ["19101:9101", "19102:9102", "19103:9103", "19104:9104"])], ["web", "api"]),
  proj("alpha", now - 86400, [svc("worker", []), svc("cache", ["16379:6379"]), svc("db", ["15432:5432"])], ["db"]),
  proj("zeta", now - 60, [svc("app", ["13000:3000"])], []),
];
ui.vm = "running";
kiri.on({ type: "lists", containers: P.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: c.state === "running" ? "Up 1 hour" : "Exited (0)", Created: 1, Ports: [], Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))), images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: P });
show("compose");
const th = (tbl, key) => document.querySelector(`${tbl} th[data-sort="${key}"]`);
const projects = () => [...document.querySelectorAll("table.clist tr.group")].map((r) => r.dataset.cmpopen);
// Each project's services, in the order shown, from the rows under its own row.
const under = () => {
  const out = {}; let cur = null;
  for (const r of document.querySelectorAll("table.clist tbody tr")) {
    if (r.classList.contains("group")) out[cur = r.dataset.cmpopen] = [];
    else { eq(r.dataset.cmpsvc, cur, "a service under its own project"); out[cur].push(r.dataset.svc); }
  }
  return out;
};
const drag = (grip, dx) => {
  const x = box(grip).left + 2, y = box(grip).top + 4;
  const ptr = (type, d) => new PointerEvent(type, { bubbles: true, button: 0, clientX: x + d, clientY: y, pointerId: 1 });
  grip.dispatchEvent(ptr("pointerdown", 0));
  document.dispatchEvent(ptr("pointermove", dx));
  document.dispatchEvent(ptr("pointerup", dx));
  ui.resizedAt = 0;
};
const saved = () => sent.filter((m) => m.type === "setpref" && m.name === "columnWidths").at(-1)?.value;

t("the list: every heading sorts, with a hand; each edge between two that size has a resize grip", () => {
  eq([...document.querySelectorAll("table.clist th.sortable")].map((h) => h.dataset.sort), ["name", "state", "ports", "created"], "sortable headings");
  for (const h of document.querySelectorAll("table.clist th.sortable")) eq([getComputedStyle(h).cursor, h.getAttribute("aria-sort")], ["pointer", "none"], "a heading: " + h.textContent);
  const grips = document.querySelectorAll("table.clist .col-resize");
  eq(grips.length > 0 && [...grips].every((g) => getComputedStyle(g).cursor === "col-resize" && g.title === tr("Drag to resize, double-click to reset")), true, "grips");
  for (const g of grips) eq(Math.abs(box(g).right - box(g.closest("th")).right) <= 1, true, "a grip on its column's edge: " + g.closest("th").textContent);
  eq(projects(), ["mid", "alpha", "zeta"], "as the engine lists them until a heading is clicked");
});
t("Name sorts A to Z, then Z to A; each project's services stay under it, sorted the same way", () => {
  click(th("table.clist", "name"));
  eq([projects(), th("table.clist", "name").getAttribute("aria-sort"), th("table.clist", "name").querySelector(".arrow").textContent], [["alpha", "mid", "zeta"], "ascending", "↑"], "A to Z");
  eq(under(), { alpha: ["cache", "db", "worker"], mid: ["api", "web"], zeta: ["app"] }, "services A to Z");
  click(th("table.clist", "name"));
  eq([projects(), th("table.clist", "name").getAttribute("aria-sort")], [["zeta", "mid", "alpha"], "descending"], "Z to A");
  eq(under(), { zeta: ["app"], mid: ["web", "api"], alpha: ["worker", "db", "cache"] }, "services Z to A");
});
t("Created, State and Ports sort the projects; services keep their file's order where the key is the project's", () => {
  click(th("table.clist", "created"));
  eq(projects(), ["zeta", "mid", "alpha"], "newest first");
  click(th("table.clist", "created"));
  eq(projects(), ["alpha", "mid", "zeta"], "oldest first");
  click(th("table.clist", "state"));
  eq(projects(), ["zeta", "alpha", "mid"], "stopped, then some running, then all running");
  eq(under().alpha, ["worker", "cache", "db"], "its stopped services, then the running one");
  click(th("table.clist", "ports"));
  eq([projects(), under().mid], [["zeta", "alpha", "mid"], ["web", "api"]], "lowest first port first; a project's services the same way");
  click(th("table.clist", "ports"));
  eq([projects(), under().mid], [["mid", "alpha", "zeta"], ["api", "web"]], "highest first");
});
t("Ports is as wide as its longest, the rest in a title; Name is widest", () => {
  const h = th("table.clist", "ports"), name = th("table.clist", "name");
  eq([!!h.dataset.fixed, box(h).width < 150, box(name).width > box(h).width * 2], [true, true, true], "fixed and narrow");
  click(document.querySelector('[data-cmpfold="mid"]'));
  const cell = document.querySelector('tr[data-cmpopen="mid"] td:nth-child(3)');
  eq([cell.querySelector(".port").textContent, cell.querySelector(".muted").textContent, box(cell.querySelector(".muted")).right <= box(cell).right + 1], ["18080→80", "+4", true], "the first and how many more, inside its cell");
  eq(cell.querySelector(".port").title, "18080→80, 19101→9101, 19102→9102, 19103→9103, 19104→9104", "every one in the title");
  click(document.querySelector('[data-cmpfold="mid"]'));
});
t("the list: dragging an edge narrows its column, kept over a redraw and saved; a double-click puts it back", () => {
  const name = () => box(th("table.clist", "name")).width, was = name();
  drag(th("table.clist", "name").querySelector(".col-resize"), -80);
  const now = name();
  eq([now < was - 60, !!saved()?.compose], [true, true], `narrower (${was} → ${now}) and saved`);
  render();
  eq(Math.abs(name() - now) <= 2, true, "the same after a redraw");
  th("table.clist", "name").querySelector(".col-resize").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  eq([Math.abs(name() - was) <= 2, saved()?.compose], [true, undefined], "back as it was");
});
t("Services tab: every heading sorts both ways; Name stays at the start", () => {
  cmpOpen("alpha");
  click(document.querySelector('[data-cmptab="services"]'));
  const rows = () => [...document.querySelectorAll("table.cmp-svcs tbody tr[data-svc]")].map((r) => r.dataset.svc);
  eq([...document.querySelectorAll("table.cmp-svcs th.sortable")].map((h) => h.dataset.sort), ["name", "state", "ports", "created"], "sortable headings");
  eq(rows(), ["worker", "cache", "db"], "the file's order first");
  click(th("table.cmp-svcs", "name"));
  eq([rows(), th("table.cmp-svcs", "name").getAttribute("aria-sort")], [["cache", "db", "worker"], "ascending"], "A to Z");
  click(th("table.cmp-svcs", "name"));
  eq(rows(), ["worker", "db", "cache"], "Z to A");
  click(th("table.cmp-svcs", "ports"));
  eq(rows(), ["db", "cache", "worker"], "lowest port first, none last");
  click(th("table.cmp-svcs", "state"));
  eq(rows()[2], "db", "running last");
  click(th("table.cmp-svcs", "created"));
  eq(th("table.cmp-svcs", "created").getAttribute("aria-sort"), "descending", "Created sorts, newest first");
  for (const g of document.querySelectorAll("table.cmp-svcs .col-resize")) eq(Math.abs(box(g).right - box(g.closest("th")).right) <= 1, true, "a grip on its column's edge: " + g.closest("th").textContent);
  const first = document.querySelector("table.cmp-svcs th");
  eq(getComputedStyle(first).position, "sticky", "Name sticks");
});
t("Services tab: Ports is narrow; an edge drags, is kept and resets", () => {
  const ports = th("table.cmp-svcs", "ports"), name = () => box(th("table.cmp-svcs", "name")).width, was = name();
  eq([!!ports.dataset.fixed, box(ports).width < 150, was > box(ports).width * 2], [true, true, true], "Ports fixed, Service widest");
  drag(th("table.cmp-svcs", "name").querySelector(".col-resize"), -60);
  const now = name();
  eq([now < was - 40, !!saved()?.cmpsvcs], [true, true], `narrower (${was} → ${now}) and saved`);
  render();
  eq(Math.abs(name() - now) <= 2, true, "the same after a redraw");
  th("table.cmp-svcs", "name").querySelector(".col-resize").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  eq([Math.abs(name() - was) <= 2, saved()?.cmpsvcs], [true, undefined], "back as it was");
  eq([document.scrollingElement.scrollWidth <= innerWidth + 1, $("content").scrollWidth <= $("content").clientWidth + 1], [true, true], "no sideways scroll");
});
report(R);
