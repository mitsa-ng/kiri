// parity: macos windows linux
// window: 1440x900
// Compose grouped like Containers: the list's columns are Name, State, Ports, Share,
// Created and Actions, a project's Services tab Service, State, Ports, Share, Created and
// Actions. Share is a word, with no globe. What a service is (its language or image, a database's or cache's role) and
// its container sit under its name. Share is yellow only for a running service with a
// web port that isn't a database or cache; otherwise grey, with the reason in its tip.
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

t("the list: Name, State, Ports, Share, Created, Actions", () => {
  eq(cols("table.clist"), ["Name", "State", "Ports", "Share", "Created", "Actions"], "columns");
  eq([...document.querySelectorAll("table.clist th.sortable")].map((h) => h.dataset.sort), ["name", "state", "ports", "created"], "sortable");
  const g = document.querySelector('tr[data-cmpopen="shop"]'), sub = g.querySelector(".sub-name");
  eq([sub.innerText.trim(), sub.title], ["8 services · compose.yaml", "/w/shop/compose.yaml"], "a project's second line: its count and file, the path in the title");
  eq([g.cells[2].textContent.trim(), g.cells[3].textContent.trim(), g.cells[4].textContent.trim(), g.cells[4].title], ["", "", "1 h ago", "Newest container created 1 h ago"], "open: Ports and Share empty; Created, the newest container's");
  eq(row("table.clist", "web").cells[4].textContent.trim(), "9 h ago", "a service's Created: its container's");
  eq(row("table.clist", "web").cells[2].textContent.trim(), "13000→3000", "a service's Ports");
});
t("the list: what each service is, and its container, under its name", () => subs("table.clist"));
t("the list: Share yellow only for a running web port; grey with the reason otherwise", () => shares("table.clist"));
t("the list: Share on web sends what Containers send for its container", () => {
  sent.length = 0;
  click(cell("table.clist", "web").querySelector("button"));
  const ours = sent.filter((x) => x.type === "share" || x.type === "shares");
  eq([ours.length > 0, cmp.open], [true, null], "sent, stayed on the list");
  sh.starting.clear(); show("containers"); sent.length = 0;
  eq(!!document.querySelector('tr[data-key="c-web"] td.col-share button svg'), true, "Containers keep their globe");
  click(document.querySelector('tr[data-key="c-web"] td.col-share button'));
  eq(sent.filter((x) => x.type === "share" || x.type === "shares"), ours, "the same event");
  sh.starting.clear(); show("compose");
});
t("the list: the buttons' four slots line up; nothing is cut at 1440", () => { slots("table.clist"); whole("table.clist"); noScroll(); });
t("the list, folded: the ports and how many are live", () => {
  click(document.querySelector('[data-cmpfold="shop"]'));
  const g = document.querySelector('tr[data-cmpopen="shop"]');
  eq([g.cells[2].querySelector(".port")?.textContent, g.cells[3].textContent.trim(), !!g.cells[3].querySelector(".led")], ["13000→3000", "1 live", true], "ports summary and 1 live");
  click(document.querySelector('[data-cmpfold="shop"]'));
});
t("Services tab: Service, State, Ports, Share, Created, Actions", () => {
  tab();
  eq(cols("table.cmp-svcs"), ["Service", "State", "Ports", "Share", "Created", "Actions"], "columns");
  const link = row("table.cmp-svcs", "web").querySelector('.sub-name [data-detail="c-web"]');
  eq([link?.textContent, link && getComputedStyle(link).cursor], ["shop-web-1", "pointer"], "the container is a link to its page");
});
t("Services tab: second lines and Share", () => { subs("table.cmp-svcs"); shares("table.cmp-svcs"); });
t("Services tab: the pills filter", () => {
  const pills = () => [...document.querySelectorAll("#cmp-tabs [data-cmpsf]")].map((b) => b.textContent.trim());
  eq(pills(), ["All8", "Running6", "Failed2"], "All, Running, Failed with counts");
  const shown = () => [...document.querySelectorAll("table.cmp-svcs tbody tr")].map((r) => r.dataset.svc);
  click(document.querySelector('[data-cmpsf="run"]'));
  eq(shown(), ["web", "api", "db", "redis", "worker", "site"], "Running");
  click(document.querySelector('[data-cmpsf="down"]'));
  eq(shown(), ["jobs", "nightly"], "Failed: what isn't running");
  click(document.querySelector('[data-cmpsf="all"]'));
  eq(shown().length, 8, "All");
  eq(getComputedStyle(document.querySelector('[data-cmpsf="run"]')).cursor, "pointer", "a hand");
});
t("Services tab: the slots line up; nothing is cut at 1440", () => { slots("table.cmp-svcs"); whole("table.cmp-svcs"); noScroll(); });
t("focus stays on the header's controls over a refresh, as on Containers", () => {
  const keep = (sel, where) => {
    const el = document.querySelector(sel); el.focus();
    eq(document.activeElement === el, true, "focused: " + sel);
    kiri.on(LISTS_EV()); kiri.on(PROJ_EV);
    eq([document.activeElement?.tagName, document.activeElement?.matches(sel)], ["BUTTON", true], `${where}: still on ${sel}`);
  };
  keep('#cmp-tabs [data-cmpsf="run"]', "Services tab pill");
  back();
  keep('#ltabs [data-cmpf="run"]', "the list's pill");
  keep("#hright [data-cmpopenfile]", "Open a compose file…");
  show("containers");
  keep('#ltabs [data-ltab="running"]', "Containers' pill");
  show("compose");
});
t("Share off: no Share column on either", () => {
  on(false); render();
  eq(cols("table.clist"), ["Name", "State", "Ports", "Created", "Actions"], "the list");
  tab();
  eq(cols("table.cmp-svcs"), ["Service", "State", "Ports", "Created", "Actions"], "Services");
  slots("table.cmp-svcs"); noScroll();
  on(true); back();
});
report(R);
