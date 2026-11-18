// parity: macos windows linux
// window: 760x700
// Zoom Out, Zoom In and Actual Size (the View menu's ⌘−, ⌘+, ⌘0): after each, the Compose list and a
// project's Services tab fit their box, with the widths a fresh window has at that size.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const now = Math.floor(Date.now() / 1000);
const tech = (o) => ({ slug: "", lang: null, fw: null, role: "Image", app: false, how: "", ...o });
const S = [
  { name: "web", image: "", build: "./web", ports: ["13000:3000"], tech: tech({ slug: "nodedotjs", lang: "Node.js", fw: "Express", role: "Web", app: true }), st: "running" },
  { name: "api", image: "", build: "./api", ports: ["18080:8080"], tech: tech({ slug: "go", lang: "Go", role: "API", app: true }), st: "running" },
  { name: "db", image: "postgres:16", build: "", ports: ["15432:5432"], tech: tech({ slug: "postgresql", role: "Database" }), st: "running" },
  { name: "redis", image: "redis:7-alpine", build: "", ports: [], tech: tech({ slug: "redis", role: "Cache" }), st: "running" },
  { name: "worker", image: "alpine:3.20", build: "", ports: [], tech: tech({}), st: "running" },
  { name: "site", image: "nginx:1.27", build: "", ports: ["18081:80"], tech: tech({ role: "Proxy" }), st: "running" },
  { name: "jobs", image: "", build: "./jobs", ports: [], tech: tech({ slug: "go", lang: "Go", role: "Worker", app: true }), st: "failed" },
  { name: "nightly", image: "alpine:3.20", build: "", ports: [], tech: tech({}), st: "" },
].map((s) => ({ volumes: [], depends: [], networks: ["default"], kinds: [], ...s }));
const made = S.filter((s) => s.st);
const P = { name: "shop", dir: "/w/shop", files: ["/w/shop/compose.yaml"], readable: true, updated: now - 3600, services: S,
  containers: made.map((s) => ({ service: s.name, id: "c-" + s.name, name: `shop-${s.name}-1`, image: s.image || "shop-" + s.name, state: s.st === "running" ? "running" : "exited", status: "Up" })) };
const port = (p) => ({ IP: "0.0.0.0", PrivatePort: +p.split(":")[1], PublicPort: +p.split(":")[0], Type: "tcp" });
const LISTS_EV = () => ({ type: "lists", images: [], volumes: [], networks: [], containers: made.map((s) => ({ Id: "c-" + s.name, Names: [`/shop-${s.name}-1`], Image: s.image || "shop-" + s.name,
  State: s.st === "running" ? "running" : "exited", Status: s.st === "running" ? "Up 9 hours" : "Exited (1) 2 minutes ago", Created: now - 9 * 3600,
  Ports: s.st === "running" ? s.ports.map(port) : [], Labels: { "com.docker.compose.project": "shop", "com.docker.compose.service": s.name } })) });
const PROJ_EV = { type: "composeprojects", logos: { nodedotjs: ["5FA04E", "M2 2h20v20H2z"], go: ["00ADD8", "M2 2h20v20H2z"], postgresql: ["4169E1", "M2 2h20v20H2z"], redis: ["FF4438", "M2 2h20v20H2z"] }, projects: [P] };
const on = (share) => kiri.on({ type: "status", version: "0.1.4", dev: share, share, app: "Kiri", ours: "kiri", context: "kiri" });
ui.vm = "running"; on(true); kiri.on(LISTS_EV()); kiri.on(PROJ_EV);
kiri.on({ type: "share", id: 51, source: "shop-site-1", state: "live", url: "https://site-x.runkiri.cloud" });
sh.account = { signedIn: true };
show("compose");
const cols = (tbl) => [...document.querySelectorAll(`${tbl} thead th`)].map((h) => h.textContent.trim());
const row = (tbl, n) => document.querySelector(`${tbl} tbody tr[data-svc="${n}"]`);
const cell = (tbl, n) => row(tbl, n)?.querySelector("td.col-share");
const tab = () => { cmpOpen("shop"); click(document.querySelector('[data-cmptab="services"]')); };
const back = () => { cmp.open = null; render(); };
const look = (sel) => { const tbl = document.querySelector(sel); return { over: Math.round(tbl.offsetWidth - tbl.parentElement.clientWidth), scroll: document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth, w: [...tbl.tHead.rows[0].cells].map((c) => c.offsetWidth), cls: tbl.className }; };
const fresh = (sel) => { cmpGiven.clear(); tableShown.key = ""; render(); return look(sel); };
const cls = (c) => c.split(" ").sort().join(" ");
const SEQS = [[-1, 0], [1, 0], [-1, 1, 0], [-1, -1, 0], [1, 1, 0, -1, 0]];
const at = (z) => { prefs.scale = z; applyPrefs(); };
for (const [where, sel, open] of [["list", "table.clist", back], ["services", "table.cmp-svcs", tab]]) {
  // What a fresh window shows at each text size.
  open();
  const want = Object.fromEntries(SIZES.map((z) => { at(z); return [z, fresh(sel)]; }));
  for (const seq of SEQS) {
    t(`${where}: ${seq.map((s) => s === 0 ? "⌘0" : s < 0 ? "⌘−" : "⌘+").join(" ")} fits as a fresh window does`, () => {
      at(1); open(); fresh(sel);
      // As the View menu sends them: the page redraws itself, nothing else.
      for (const s of seq) {
        kiri.on({ type: "textsize", step: s });
        const got = look(sel), z = prefs.scale, step = `after ${s === 0 ? "⌘0" : s < 0 ? "⌘−" : "⌘+"} (${z})`;
        if (got.over > 0 && where === "list") throw new Error(`${step}: the table is ${got.over} px wider than its box`);
        eq(got.scroll, 0, `${step}: no sideways scroll`);
        eq(got.w, want[z].w, `${step}: the widths a fresh window has`);
        eq(cls(got.cls), cls(want[z].cls), `${step}: the same level`);
      }
    });
  }
}
back(); at(1); render();
report(R);
