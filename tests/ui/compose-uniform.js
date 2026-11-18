// parity: macos windows linux
// window: 1440x900
// Compose's list is laid out like the other lists: an Actions heading at the end, right-aligned; the
// buttons in the same slots on every row, so each kind lines up; the Actions column as wide as its
// buttons, right after Share (or Ports); and the header, cells and page spacing as on Containers,
// Images and Pods (whose own table runs past a 760 window, so not its right edge there). With Share on and off.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const near = (a, b, d, m) => { if (!(Math.abs(a - b) <= d)) throw new Error(`${m}: ${a} vs ${b}`); };
const box = (el) => el.getBoundingClientRect(), cs = (el) => getComputedStyle(el);
const wide = innerWidth > 1000;
const now = Math.floor(Date.now() / 1000);
const svc = (name, ports, image = "alpine:3.20") => ({ name, image, build: "", ports, volumes: [], depends: [], networks: ["default"], kinds: [] });
const proj = (name, svcs, up, o = {}) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated: now - 25000, services: svcs,
  containers: svcs.filter((s) => up[s.name] !== undefined).map((s) => ({ service: s.name, id: `${name}-${s.name}`, name: `${name}-${s.name}-1`, image: s.image, state: up[s.name] ? "running" : "exited", status: "Up" })), ...o });
const P = [
  proj("customer-analytics-and-reporting-platform-staging", [svc("clickhouse-event-warehouse-primary-replica", []), svc("dashboard-frontend-with-a-really-long-service-name", [])], { "clickhouse-event-warehouse-primary-replica": 1, "dashboard-frontend-with-a-really-long-service-name": 1 }),
  proj("shop", [svc("db", [], "postgres:16"), svc("api", ["18080:8080"]), svc("payments", ["19101:9101", "19102:9102", "19103:9103", "19104:9104"], "public.ecr.aws/docker/library/alpine:3.20"), svc("web", ["13000:3000"]), svc("later", [])], { db: 1, api: 1, payments: 1, web: 0 }),
  proj("draft", [svc("app", [])], {}, { fresh: true }),
];
const port = (p) => ({ IP: "0.0.0.0", PrivatePort: +p.split(":")[1], PublicPort: +p.split(":")[0], Type: "tcp" });
const ctrs = P.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: c.state === "running" ? "Up 7 hours" : "Exited (0)", Created: now - 25000,
  Ports: c.state === "running" ? (p.services.find((s) => s.name === c.service).ports || []).map(port) : [], Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } })));
const images = [{ Id: "sha256:" + "a".repeat(64), RepoTags: ["alpine:3.20"], Size: 8e6, Created: now - 9e5 }, { Id: "sha256:" + "b".repeat(64), RepoTags: ["postgres:16"], Size: 4e8, Created: now - 9e5 }];
ui.vm = "running";
ui.containers.push({ Id: "k8s1", Names: ["/kiri-k8s"], Image: "rancher/k3s:v1.37.1-k3s1", State: "running", Ports: [], Labels: { "dev.kiri.k8s": "1" }, KiriStartedAt: now - 600 });
const on = (share) => kiri.on({ type: "status", version: "0.1.4", dev: share, share, app: "Kiri", ours: "kiri", context: "kiri" });
kiri.on({ type: "lists", containers: ctrs, images, volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: P });
const pod = (ns, name) => ({ ns, name, ip: "10.42.0.17", labels: {}, owner: "ReplicaSet", status: "Running", phase: "Running", ready: "1/1", allReady: true, restarts: 0, created: "2026-10-28T00:00:00Z", containers: [{ name: "c", image: "nginx", ready: true, restarts: 0, state: "running", ports: [] }] });
kiri.on({ type: "k8s", state: "running", ready: true, services: [], pods: [pod("default", "web-5fc9-cdl9f"), pod("default", "debug")], context: "kiri" });

// The header row, a body row's cells and the page's spacing, measured the same way on each list.
const looks = () => {
  const tbl = document.querySelector("#content table[data-view]"), tr = tbl.tHead.rows[0], ths = [...tr.cells].filter((c) => !c.classList.contains("ck") && cs(c).display !== "none");
  const th = ths[1], c = cs(th), last = cs(ths.at(-1));
  const row = [...tbl.tBodies[0].rows].find((r) => !r.classList.contains("group")), td = [...row.cells].filter((x) => !x.classList.contains("ck"))[1], d = cs(td), lt = cs(row.cells[row.cells.length - 1]);
  return { head: Math.round(box(tr).height), size: c.fontSize, weight: c.fontWeight, spacing: c.letterSpacing, colour: c.color, upper: c.textTransform, pad: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].join(" "),
    line: c.borderBottom, lastPad: last.paddingRight, tdPad: [d.paddingLeft, d.paddingRight].join(" "), endPad: lt.paddingRight, tdSize: d.fontSize,
    toTable: Math.round(box(tbl).top - box($("title")).bottom), gutter: Math.round(box(tbl).left - box($("content")).left), right: Math.round(box($("content")).right - box(tbl).right) };
};
const actRows = () => [...document.querySelectorAll("#content tbody td.actions")].map((td) => td.querySelector(".acts-row")).filter(Boolean);
const lefts = (sel) => actRows().map((r) => r.querySelector(sel)).filter(Boolean).map((b) => Math.round(box(b).left));
// What a row of buttons needs: the buttons, their gaps, the fade's padding and the cell's.
const need = (row) => { const kids = [...row.children], r = cs(row), td = cs(row.parentElement);
  return kids.reduce((a, b) => a + box(b).width, 0) + (parseFloat(r.columnGap) || 0) * (kids.length - 1) + parseFloat(r.paddingLeft) + parseFloat(r.paddingRight) + parseFloat(td.paddingLeft) + parseFloat(td.paddingRight); };

for (const share of [true, false]) {
  on(share); show("containers"); const ctr = looks();
  show("images"); const img = looks();
  show("pods"); const pods = looks();
  show("compose"); const cmpL = looks();
  const tag = share ? "Share on" : "Share off";
  const ths = [...document.querySelectorAll("table.clist thead th")].filter((h) => cs(h).display !== "none");
  t(`${tag}: the last heading reads Actions, right-aligned`, () => {
    eq([ths.at(-1).textContent, ["right", "end"].includes(cs(ths.at(-1)).textAlign)], [tr("Actions"), true], "last heading");
  });
  t(`${tag}: Stop/Start sit in one line down the list, and so do the ⋯ buttons`, () => {
    const ss = lefts(":is([data-c=start], [data-c=stop], [data-g=start], [data-g=stop], .go.ghost)"), more = lefts("[data-more], [data-gmore]");
    // ⋯ on every service with a container, and on a project running in part.
    eq([ss.length >= 9, more.length >= 7], [true, true], "every row has them: " + ss.length + " " + more.length);
    near(Math.max(...ss) - Math.min(...ss), 0, 1, "Stop/Start x: " + ss.join());
    near(Math.max(...more) - Math.min(...more), 0, 1, "⋯ x: " + more.join());
    const slots = actRows().map((r) => r.children.length);
    eq(new Set(slots).size, 1, "the same number of slots on every row: " + slots.join());
    for (const b of document.querySelectorAll("#content td.actions button")) eq([!!(b.title || b.getAttribute("aria-label")), b.disabled || cs(b).cursor === "pointer"], [true, true], "tooltip and hand: " + b.outerHTML.slice(0, 80));
  });
  t(`${tag}: the Actions column is as wide as its widest row of buttons`, () => {
    near(box(ths.at(-1)).width, Math.max(...actRows().map(need)), 2, "Actions width");
  });
  if (wide) t(`${tag}: no dead gap between ${share ? "Share" : "Ports"} and the first button`, () => {
    for (const r of document.querySelectorAll("table.clist tbody tr")) {
      const cells = [...r.cells].filter((c) => cs(c).display !== "none"), td = cells.at(-2), first = r.querySelector(".acts-row").firstElementChild;
      const gap = box(first).left - (box(td).right - parseFloat(cs(td).paddingRight));
      eq(gap < 64, true, "gap " + Math.round(gap) + " on " + (r.dataset.svc || r.dataset.cmpopen));
    }
  });
  t(`${tag}: no sideways scroll`, () => {
    eq([document.documentElement.scrollWidth <= innerWidth, $("content").scrollWidth <= $("content").clientWidth], [true, true], "scroll widths " + document.documentElement.scrollWidth + " " + $("content").scrollWidth + "/" + $("content").clientWidth);
  });
  for (const [name, other] of [["Containers", ctr], ["Images", img], ["Pods", pods]]) t(`${tag}: the header row, cells and spacing match ${name}`, () => {
    for (const k of ["head", "size", "weight", "spacing", "colour", "upper", "pad", "line", "lastPad", "tdPad", "endPad", "tdSize", "toTable", "gutter", ...(other === pods && !wide ? [] : ["right"])]) eq(cmpL[k], other[k], k);
  });
}
// A project's Services tab: the same Actions column, the same buttons in the same slots, the same events.
const lastSent = () => JSON.stringify(sent.at(-1));
t("Services tab: an Actions heading; each service's buttons in the list's slots, sending what the list's do", () => {
  on(true); show("compose");
  const listRow = document.querySelector('table.clist tr[data-svc="api"]');
  listRow.querySelector('[data-c="stop"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); const fromList = lastSent();
  cmpOpen("shop"); cmp.tab = "services"; render();
  const tbl = document.querySelector("table.cmp-svcs"), hs = [...tbl.tHead.rows[0].cells];
  eq([hs.at(-1).textContent, ["right", "end"].includes(cs(hs.at(-1)).textAlign)], [tr("Actions"), true], "last heading");
  const rows = [...tbl.tBodies[0].rows].map((r) => r.querySelector("td.actions .acts-row"));
  eq([rows.length, rows.every(Boolean), new Set(rows.map((r) => r.children.length)).size], [5, true, 1], "a row of buttons on every service, the same slots");
  const x = (sel) => rows.map((r) => r.querySelector(sel)).filter(Boolean).map((b) => Math.round(box(b).left));
  const ss = x(":is([data-c=start], [data-c=stop], .go.ghost)"), more = x("[data-more]");
  eq([ss.length, more.length], [5, 4], "Start/Stop on all, ⋯ on each with a container");
  near(Math.max(...ss) - Math.min(...ss), 0, 1, "Stop/Start x: " + ss.join()); near(Math.max(...more) - Math.min(...more), 0, 1, "⋯ x: " + more.join());
  near(box(hs.at(-1)).width, Math.max(...rows.map(need)), 2, "Actions width");
  const apiRow = [...tbl.tBodies[0].rows].find((r) => r.textContent.includes("shop-api-1"));
  sent.length = 0; apiRow.querySelector('[data-c="stop"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
  eq(lastSent(), fromList, "the same event as the list's Stop");
  eq(document.documentElement.scrollWidth <= innerWidth, true, "no sideways page scroll");
  cmp.open = null; render();
});
// A fit or fixed column is as wide as its widest value: nothing in it ends in … while the table has room,
// also when text measures a fraction of a pixel wider (a web view may round otherwise).
const cut = (tbl) => { const out = [], hs = [...tbl.tHead.rows[0].cells];
  for (const r of [tbl.tHead.rows[0], ...tbl.tBodies[0].rows]) for (const td of r.cells) {
    const th = hs[td.cellIndex]; if (td.colSpan > 1 || !th || !(th.dataset.fit || th.dataset.fixed) || cs(td).display === "none") continue;
    for (const el of [td, ...td.querySelectorAll("*")]) if (el.scrollWidth > el.clientWidth + 0 && cs(el).overflow !== "visible" && el.clientWidth) out.push(th.textContent + ": " + el.textContent.trim().slice(0, 30));
  }
  return out; };
if (wide) for (const frac of ["", "0.013em"]) t(`fit and fixed columns show their values whole, on the list and the Services tab${frac ? " (fractional widths)" : ""}`, () => {
  document.body.style.letterSpacing = frac; on(true); cmp.open = null; show("compose");
  eq(cut(document.querySelector("table.clist")), [], "the list");
  cmpOpen("shop"); cmp.tab = "services"; render();
  eq(cut(document.querySelector("table.cmp-svcs")), [], "the Services tab");
  cmp.open = null; document.body.style.letterSpacing = ""; render();
});
t("Escape with no menu open: no error", () => {
  let err = null; const was = window.onerror; window.onerror = (m) => { err = m; return true; };
  for (const v of ["compose", "containers", "images"]) { show(v); document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); }
  window.onerror = was;
  eq(err, null, "a page error");
});
// A dragged width is kept; a heading still sorts.
t("a dragged edge keeps its width, and Name still sorts", () => {
  show("compose");
  const grip = document.querySelector("table.clist .col-resize"), th = grip.closest("th"), was = box(th).width;
  const x = box(grip).left + 2, y = box(grip).top + 4, ptr = (type, d) => new PointerEvent(type, { bubbles: true, button: 0, clientX: x + d, clientY: y, pointerId: 1 });
  grip.dispatchEvent(ptr("pointerdown", 0)); document.dispatchEvent(ptr("pointermove", -40)); document.dispatchEvent(ptr("pointerup", -40)); ui.resizedAt = 0;
  const dragged = box(document.querySelector("table.clist thead th")).width;
  eq(dragged < was - 5, true, "narrower: " + was + " → " + dragged);
  render();
  near(box(document.querySelector("table.clist thead th")).width, dragged, 2, "kept after a redraw");
  document.querySelector('table.clist th[data-sort="name"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
  eq([...document.querySelectorAll("table.clist tr.group")].map((r) => r.dataset.cmpopen), ["customer-analytics-and-reporting-platform-staging", "draft", "shop"], "A to Z");
  near(box(document.querySelector("table.clist thead th")).width, dragged, 2, "kept after sorting");
});
report(R);
