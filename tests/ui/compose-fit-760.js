// parity: macos windows linux
// window: 760x600
// Compose's columns with short content start as wide as it: State, Created and a
// project's Built with fit their widest cell, Services its heading, and the name
// takes the rest. A count starts where its heading does. The row's buttons keep a
// clear gap from the text before them, which ends in "…" with the whole in a title.
// An edge still drags, and the width dragged is kept; the headings still sort.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const box = (el) => el.getBoundingClientRect();
const now = Math.floor(Date.now() / 1000), wide = innerWidth > 900;
const svc = (name, ports, o) => ({ name, image: "alpine:latest", build: "", ports, volumes: [], depends: [], networks: ["default"], kinds: [], tech: { app: "alpine" }, ...o });
const proj = (name, svcs, up) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated: now - 7200, services: svcs,
  containers: svcs.map((s) => ({ service: s.name, id: `${name}-${s.name}`, name: `${name}-${s.name}-1`, image: s.image, state: up.includes(s.name) ? "running" : "exited", status: "Up" })) });
const P = [
  proj("shop", [svc("web", ["0.0.0.0:18080:80"]), svc("api", ["127.0.0.1:19104:9104", "19102:9102", "19103:9103"]), svc("a-service-with-a-very-long-name-that-runs-on", ["10.200.100.50:19104:19104"])], ["web", "api"]),
  proj("folded", [svc("db", ["127.0.0.1:15432:15432", "15433:5433"])], []),
  ...Array.from({ length: 8 }, (_, i) => proj("p" + i, [svc("s" + i, [])], ["s" + i])),
];
ui.vm = "running";
kiri.on({ type: "lists", containers: P.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: c.state === "running" ? "Up 7 hours" : "Exited (1) 2 minutes ago", Created: now - 25200, Ports: [], Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))), images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: P });
show("compose");
click(document.querySelector('[data-cmpfold="folded"]'));
const th = (tbl, key) => document.querySelector(`${tbl} th[data-sort="${key}"]`);
const text = (el) => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()].filter((x) => x.width > 0); };
const noScroll = () => eq([document.scrollingElement.scrollWidth <= innerWidth + 1, $("content").scrollWidth <= $("content").clientWidth + 1], [true, true], "no sideways scroll");
// In every row with buttons: from where the text before them ends (as far as it shows) to the first one.
const gaps = (tbl) => {
  for (const r of document.querySelectorAll(tbl + " tbody tr")) {
    const cells = [...r.cells].filter((c) => getComputedStyle(c).display !== "none"), a = cells.at(-1), b = a.querySelector(".acts-row > *");
    if (!b || !a.classList.contains("actions")) continue;
    const p = cells.at(-2), rs = text(p);
    if (!rs.length) continue;
    const end = Math.min(Math.max(...rs.map((x) => x.right)), box(p).right - parseFloat(getComputedStyle(p).paddingRight));
    if (box(b).left - end < (r.closest("table.g3") ? 12 : 24)) throw new Error(`${r.dataset.svc || r.dataset.cmpopen}: ${Math.round(box(b).left - end)} px before its buttons`);
    // Cut off before the gap, with the whole of it in a title.
    const cut = [...p.querySelectorAll("*")].concat(p).some((e) => e.scrollWidth > e.clientWidth + 1);
    if (cut && !p.querySelector("[title]") && !p.title) throw new Error(`${r.dataset.svc || r.dataset.cmpopen}: cut off with no title`);
  }
  const rights = [...document.querySelectorAll(tbl + " tbody td.actions")].filter((td) => td.querySelector(".acts-row > *")).map((td) => Math.round(box(td.querySelector(".acts-row > :last-child")).right));
  eq(new Set(rights).size <= 1, true, "the buttons end in one place: " + rights);
};

t("the list: State and Created fit their cells, Services its heading; Name takes the rest", () => {
  const st = th("table.clist", "state");
  eq([!!st.dataset.fit, box(st).width < 200, box(th("table.clist", "name")).width > box(st).width * (wide ? 2 : 1)], [true, true, true], `State ${box(st).width}`);
  if (wide) {
    const sv = th("table.clist", "svcs"), head = text(sv)[0].width;
    eq(box(sv).width <= head + 32, true, `Services ${box(sv).width} for a heading of ${head}`);
    const pad = parseFloat(getComputedStyle(sv).paddingLeft), cell = document.querySelector('tr[data-cmpopen="shop"] td:nth-child(3)');
    eq([getComputedStyle(cell).textAlign, getComputedStyle(sv).textAlign].some((a) => /right|end/.test(a)), false, "a count starts at the start");
    eq(Math.abs(text(cell)[0].left - (box(sv).left + pad)) <= 2, true, `the count under its heading's start: ${text(cell)[0].left} vs ${box(sv).left + pad}`);
    eq(box(th("table.clist", "created")).width < 140, true, "Created fits");
  }
  noScroll();
});
t("the list: a clear gap before each row's buttons, which end in one place", () => gaps("table.clist"));
t("the list: a heading sorts, and an edge drags, kept over a redraw", () => {
  click(th("table.clist", "state"));
  eq(th("table.clist", "state").getAttribute("aria-sort"), "ascending", "State sorts");
  const name = () => box(th("table.clist", "name")).width, was = name(), g = th("table.clist", "name").querySelector(".col-resize");
  const x = box(g).left + 2, y = box(g).top + 4, ptr = (type, d) => new PointerEvent(type, { bubbles: true, button: 0, clientX: x + d, clientY: y, pointerId: 1 });
  g.dispatchEvent(ptr("pointerdown", 0)); document.dispatchEvent(ptr("pointermove", -40)); document.dispatchEvent(ptr("pointerup", -40)); ui.resizedAt = 0;
  const now = name();
  eq(now < was - 20, true, `narrower (${was} → ${now})`);
  render();
  eq(Math.abs(name() - now) <= 2, true, "kept over a redraw");
  g.closest("th").querySelector(".col-resize").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  noScroll();
});
t("Services tab: State fits \"Up 7 h\", Built with its longest line; the service takes the rest", () => {
  cmpOpen("shop");
  click(document.querySelector('[data-cmptab="services"]'));
  const st = th("table.cmp-svcs", "state"), bw = th("table.cmp-svcs", "built"), name = th("table.cmp-svcs", "name");
  // Whole, or its short form when the column can't hold it: never cut, the whole always in its title.
  const sp = document.querySelector("table.cmp-svcs tbody tr td:nth-child(2) .pill");
  eq([sp.title, [sp.dataset.full, sp.dataset.short].includes(sp.textContent.trim()), sp.scrollWidth <= sp.clientWidth], ["Up 7 h", true, true], "the state");
  if (wide) eq([box(st).width < 160, box(bw).width < 220, box(name).width > box(bw).width], [true, true, true], `State ${box(st).width}, Built with ${box(bw).width}, Service ${box(name).width}`);
  for (const line of document.querySelectorAll("table.cmp-svcs td.built > div")) eq(line.scrollWidth <= line.clientWidth + 1 || !!line.title, true, "Built with shows whole, or in a title: " + line.textContent);
  click(st);
  eq(st.getAttribute("aria-sort") || th("table.cmp-svcs", "state").getAttribute("aria-sort"), "ascending", "State sorts");
  gaps("table.cmp-svcs");
  noScroll();
});
report(R);
