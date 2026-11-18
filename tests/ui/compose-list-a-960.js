// parity: macos windows linux
// window: 960x700
// compose-list-a.js in a narrower window: Name keeps at least 220 px. Created, then
// Ports, give up their room and show under the name; Share is always its whole word;
// the header's buttons and the row buttons stay in the window, and nothing scrolls sideways.
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
const SUB = { web: "Node.js · Express · shop-web-1", db: "postgres:16 · database · shop-db-1", worker: "alpine:3.20 · shop-worker-1", nightly: "alpine:3.20", jobs: "Go · shop-jobs-1" };
const subs = (tbl) => {
  for (const [n, want] of Object.entries(SUB)) {
    const sub = row(tbl, n).querySelector(".sub-name");
    eq([sub.innerText.trim(), sub.title], [want, want], `${n}'s second line, whole in its title`);
  }
  eq(!!row(tbl, "web").querySelector(".role"), false, "no role tag after the name");
  eq(!!row(tbl, "web").querySelector(".tile svg use"), true, "its tech logo tile");
};
const shares = (tbl) => {
  const off = (n) => { const c = cell(tbl, n).querySelector(".shc.off"); return c && [c.textContent.trim(), c.title]; };
  eq(off("worker"), ["Share", "It publishes no web port"], "a worker: grey, no port");
  eq(off("db"), ["Share", "A database isn't shared as a web link"], "a database with 5432 published: grey");
  eq(off("redis"), ["Share", "A cache isn't shared as a web link"], "a cache: grey");
  eq(off("jobs"), ["Share", "Start it to share it"], "a stopped one: grey");
  eq(off("nightly"), ["Share", "Start it to share it"], "not created: grey");
  const web = cell(tbl, "web").querySelector("button.shc");
  eq([!!web, web?.classList.contains("off"), !!web?.querySelector("[data-sharec]") || web?.hasAttribute("data-sharec"), web?.textContent.trim()], [true, false, true, "Share"], "web on 3000: yellow Share");
  eq([cell(tbl, "site").textContent.trim(), !!cell(tbl, "site").querySelector(".shc.live .led")], ["Live", true], "a shared one: Live");
  eq([...document.querySelectorAll(`${tbl} td.col-share svg, ${tbl} th.col-share svg`)].length, 0, "Share is a word: no globe in any state");
};
const slots = (tbl) => {
  const rows = [...document.querySelectorAll(`${tbl} tbody tr`)].filter((r) => r.querySelector("td.actions .acts-row"));
  for (const r of rows) eq(r.querySelector(".acts-row").children.length, 4, "four slots: " + (r.dataset.svc || r.dataset.cmpopen));
  for (let i = 0; i < 4; i++) eq(new Set(rows.map((r) => Math.round(r.querySelector(".acts-row").children[i].getBoundingClientRect().left))).size, 1, `slot ${i + 1} lines up`);
};
const whole = (tbl) => {
  for (const el of document.querySelectorAll(`${tbl} tbody .link, ${tbl} tbody .sub-name, ${tbl} tbody .pill, ${tbl} tbody .shc, ${tbl} tbody td.cx`))
    if (el.getBoundingClientRect().width) eq(el.scrollWidth <= el.clientWidth + 1, true, "not cut at 1440: " + el.textContent.trim());
};
const noScroll = () => eq([document.scrollingElement.scrollWidth <= innerWidth + 1, $("content").scrollWidth <= $("content").clientWidth + 1], [true, true], "no sideways scroll");

const room = (tbl, shareCol) => {
  const t = document.querySelector(tbl), name = t.tHead.rows[0].cells[0];
  eq(name.offsetWidth >= 220, true, `Name at least 220 px: ${name.offsetWidth}`);
  for (const el of document.querySelectorAll(`${tbl} th, ${tbl} td.col-share .shc, ${tbl} tbody .link, ${tbl} td .pill`)) {
    if (!el.getBoundingClientRect().width) continue;
    const short = el.textContent.trim().length <= 8 && !el.matches(".pill");
    if (short) eq(el.scrollWidth <= el.clientWidth + 1, true, "a short label whole: " + el.textContent.trim());
  }
  if (shareCol) for (const c of document.querySelectorAll(`${tbl} td.col-share .shc`)) eq(c.scrollWidth <= c.clientWidth + 1 && /^(Share|Live|\d+ live|Sharing…|Couldn't share)$/.test(c.textContent.trim()), true, "Share's whole word: " + c.textContent.trim());
  const hidPorts = getComputedStyle(t.tHead.querySelector("th.cp")).display === "none";
  if (hidPorts && row(tbl, "api")) eq(row(tbl, "api").querySelector(".sub-name").innerText.includes("18080→8080"), true, "Ports hidden: the port under the name");
  const edge = Math.min($("content").getBoundingClientRect().right, t.parentElement.getBoundingClientRect().right);
  for (const r of document.querySelectorAll(`${tbl} tbody .acts-row`)) eq(r.lastElementChild.getBoundingClientRect().right <= edge + 1, true, "the buttons in sight");
  const bar = $("hright").parentElement;
  for (const x of bar.children) if (!x.hidden) eq(x.getBoundingClientRect().right <= bar.getBoundingClientRect().right + 1, true, "the header in the window: " + (x.id || x.tagName));
  slots(tbl); noScroll();
};
for (const share of [true, false]) {
  t(`the list, Share ${share ? "on" : "off"}`, () => { on(share); back(); room("table.clist", share); });
  t(`Services tab, Share ${share ? "on" : "off"}`, () => { on(share); tab(); room("table.cmp-svcs", share); back(); });
}
on(true);
report(R);
