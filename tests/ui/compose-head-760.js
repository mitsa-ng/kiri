// parity: macos windows linux
// window: 760x520
// Compose's column names while the list scrolls, at 760 px: as compose-head.js, which has the same checks at 1440.
// between the title and them, or over them; one line under them; a project's tree line stays in its rows.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const box = (el) => el.getBoundingClientRect();
const P = "customer-analytics-platform", NAMES = [...Array(24)].map((_, i) => `customer-analytics-event-ingestion-pipeline-${i}`);
const svc = (name) => ({ name, image: name + ":1", build: "", ports: ["8080:80"], volumes: [], depends: [], networks: ["default"], kinds: [] });
const proj = (name, names) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated: Math.floor(Date.now() / 1000) - 300, services: names.map(svc),
  containers: names.map((n, i) => ({ service: n, id: name + i, name: `${name}-${n}-1`, image: n, state: "running", status: "Up" })) });
const PS = [proj(P, NAMES), proj("api", ["web", "db", "cache"])];
ui.vm = "running";
kiri.on({ type: "lists", containers: PS.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: "running", Status: "Up 1 hour", Created: 1, Ports: [],
  Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))), images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: PS });
show("compose");
const c = $("content");
// What a point shows, across the row (its tree line, icon, name, state and buttons), from just under the
// title to the head's last line: never a row's own element.
const xs = () => { const tree = document.querySelector("tr.member .tree"), th = [...document.querySelectorAll("#content thead th")].filter((h) => box(h).width);
  return [tree && box(tree).left + 7.5, ...th.flatMap((h) => [box(h).left + 4, box(h).left + box(h).width / 2])].filter((x) => x != null && x < innerWidth); };
const over = (top, bottom, sel) => { const bad = [];
  for (const x of xs()) for (let y = top + 1; y < bottom; y += 2) for (const yy of y + 2 >= bottom ? [y, bottom - 0.5] : [y]) {
    const e = document.elementFromPoint(x, yy); if (e?.closest(sel)) bad.push(`${Math.round(x)},${yy}: ${e.tagName.toLowerCase()}.${[...e.classList].join(".")}`); }
  return [...new Set(bad)].slice(0, 4); };
const sticky = (head, rows) => {
  // Once scrolled past where it starts, it sits at the very top of the scrolling box.
  c.scrollTop = 0; const out = [], at = box(head()).top - box(c).top;
  for (const s of [37, 61, 95, 150, 233, 311, c.scrollHeight]) {
    c.scrollTop = s; const h = box(head());
    out.push(...over(box($("title")).bottom, h.bottom, rows), ...(c.scrollTop >= at && h.top > box(c).top + 0.5 ? [`scrolled ${c.scrollTop}: a gap of ${h.top - box(c).top}px over the head`] : []));
  }
  c.scrollTop = 0; return [...new Set(out)].slice(0, 6);
};
const lines = (el) => { const cs = getComputedStyle(el); return { bottom: cs.borderBottomWidth + " " + cs.borderBottomStyle, shadow: cs.boxShadow }; };
t("the list: scrolled, no row shows between the title and its column names, or over them; they sit at the top", () => {
  eq(c.scrollHeight > c.clientHeight + 300, true, "the list scrolls");
  eq(sticky(() => document.querySelector("#content thead th"), "#content tbody"), [], "nothing of a row above or on the head");
});
t("the list: one line under its column names", () => {
  const th = [...document.querySelectorAll("#content thead th")].filter((h) => box(h).width), tb = document.querySelector("table.clist"), first = tb.tBodies[0].rows[0];
  eq([...new Set(th.map((h) => JSON.stringify(lines(h))))], [JSON.stringify({ bottom: "1px solid", shadow: "none" })], "each name: one line");
  eq([tb.tHead, tb.tHead.rows[0], tb].map((e) => getComputedStyle(e).borderBottomWidth + getComputedStyle(e).borderTopWidth), ["0px0px", "0px0px", "0px0px"], "no line of the table's own");
  eq([...first.cells].map((td) => getComputedStyle(td).borderTopWidth).filter((w) => w !== "0px"), [], "none on the first row");
  // Scrolled, the line under them is theirs alone: no row's line or icon drawn on or beside it.
  const bad = [];
  for (const s of [61, 95, 150, 233, 311]) { c.scrollTop = s; const y = box(th[0]).bottom - 0.5;
    for (const x of xs()) { const e = document.elementFromPoint(x, y); if (e?.tagName !== "TH") bad.push(`scrolled ${s}, ${Math.round(x)}: ${e?.tagName.toLowerCase()}.${[...(e?.classList || [])].join(".")}`); } }
  c.scrollTop = 0; eq(bad.slice(0, 3), [], "the line under the names is theirs");
});
t("the list: a project's tree line stays in its own rows", () => {
  // Above its first service, or on the column names it scrolls under (a point within a pixel of the row's top can land on it).
  const m = document.querySelector("tr.member"), g = m.previousElementSibling, x = box(m.querySelector(".tree")).left + 7.5, bad = [];
  for (const s of [0, m.offsetTop - 60, m.offsetTop - 30, m.offsetTop, m.offsetTop + 20]) {
    c.scrollTop = Math.max(0, s);
    const end = Math.max(box(m).top - 1, box(document.querySelector("#content thead th")).bottom);
    for (let y = box($("title")).bottom + 1; y < end; y += 1) if (document.elementFromPoint(x, y)?.closest(".tree")) bad.push(`scrolled ${c.scrollTop}: at ${y}, above its first service (${box(m).top}) or on the head`);
  }
  eq([g.dataset.cmpopen, bad.slice(0, 3)], [P, []], "no line above the first service, or on the names");
  c.scrollTop = 0;
});
t("a project's Services: scrolled, no row shows between the title and the tab bar, or over it; one line under each", () => {
  cmpOpen(P); click(document.querySelector('[data-cmptab="services"]'));
  eq(c.scrollHeight > c.clientHeight + 300, true, "the tab scrolls");
  eq(sticky(() => $("cmp-tabs"), ".cmp-svwrap"), [], "nothing of the table above or on the tab bar");
  const th = [...document.querySelectorAll(".cmp-svcs thead th")], tb = document.querySelector("table.cmp-svcs");
  eq([lines($("cmp-tabs")), [...new Set(th.map((h) => lines(h).bottom))], getComputedStyle(tb.tHead.rows[0]).borderBottomWidth], [{ bottom: "1px solid", shadow: "none" }, ["1px solid"], "0px"], "one line each");
});
report(R);
