// parity: macos windows linux
// window: 1000x700
// The State column at 1000 px, in English, German, French and Arabic, on the Compose list and the Services tab:
// each cell says its whole text, or its short form (Up, Off, Failed, 4/5) when the column can't hold it, never a cut word.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const now = Math.floor(Date.now() / 1000);
const tech = (o) => ({ slug: "", lang: null, fw: null, role: "Image", app: false, how: "", ...o });
const svc = (name, st, ports = [], o = {}) => ({ name, image: "alpine:3.20", build: "", ports, tech: tech(o), st, volumes: [], depends: [], networks: ["default"], kinds: [] });
const S = {
  "customer-analytics-and-reporting-platform": [svc("web", "running", ["13000:3000"], { slug: "nodedotjs", lang: "Node.js", fw: "Express", role: "Web", app: true }), svc("api", "running", ["18080:8080", "18443:8443"]), svc("db", "running", ["15432:5432"], { role: "Database" }),
    svc("redis", "running"), svc("jobs", "failed"), svc("mailer", "stopped"), svc("nightly", "")],
  shop: [svc("site", "running", ["18081:80"]), svc("cart", "running"), svc("stock", "running"), svc("pay", "running"), svc("audit", "stopped")],
  docs: [svc("www", "running", ["18082:80"])],
  old: [svc("app", "stopped"), svc("worker", "failed")],
};
const ctrs = [], projects = [];
for (const [p, ss] of Object.entries(S)) {
  const made = ss.filter((s) => s.st);
  ctrs.push(...made.map((s) => ({ Id: `${p}-${s.name}`, Names: [`/${p}-${s.name}-1`], Image: s.image, State: s.st === "running" ? "running" : "exited", Created: now - 9 * 3600,
    Status: s.st === "running" ? "Up 3 hours" : s.st === "failed" ? "Exited (1) 2 minutes ago" : "Exited (0) 2 minutes ago", KiriStartedAt: now - 3 * 3600, KiriFinishedAt: now - 120, KiriExitCode: s.st === "failed" ? 1 : 0,
    Ports: s.st === "running" ? s.ports.map((x) => ({ IP: "0.0.0.0", PrivatePort: +x.split(":")[1], PublicPort: +x.split(":")[0], Type: "tcp" })) : [], Labels: { "com.docker.compose.project": p, "com.docker.compose.service": s.name } })));
  projects.push({ name: p, dir: "/w/" + p, files: [`/w/${p}/compose.yaml`], readable: true, updated: now - 3600, services: ss,
    containers: made.map((s) => ({ service: s.name, id: `${p}-${s.name}`, name: `${p}-${s.name}-1`, image: s.image, state: s.st === "running" ? "running" : "exited", status: "Up" })) });
}
ui.vm = "running";
kiri.on({ type: "status", version: "0.1.4", dev: true, share: true, app: "Kiri", ours: "kiri", context: "kiri" });
kiri.on({ type: "lists", images: [], volumes: [], networks: [], containers: ctrs });
kiri.on({ type: "composeprojects", logos: {}, projects });
sh.account = { signedIn: true };
const cut = (where) => {
  const tbl = $("content").querySelector("table.clist, table.cmp-svcs"), bad = [];
  if (!tbl) throw new Error(where + ": no table");
  const st = tbl.tHead.rows[0].cells[1];
  let n = 0;
  for (const r of tbl.tBodies[0].rows) {
    const el = r.cells[st.cellIndex]?.querySelector(".pill");
    if (!el) continue;
    n++;
    if (el.scrollWidth > el.clientWidth) bad.push(`"${el.textContent}" ${el.scrollWidth}>${el.clientWidth}`);
    if (!el.title) bad.push(`"${el.textContent}" has no title`);
    if (el.classList.contains("short") && el.title === el.textContent) bad.push(`"${el.textContent}" short with no whole title`);
  }
  if (!n) throw new Error(where + ": no State cells");
  if (bad.length) throw new Error(`${where} (State ${st.offsetWidth} px, g${[1, 2, 3].filter((i) => tbl.classList.contains("g" + i)).pop() || 0}): ${bad.join(", ")}`);
};
const lang_ = (l) => { prefs.lang = l; setLang(l); setLang(l); if (LANG !== l || document.documentElement.lang !== l) throw new Error("the window isn't in " + l); };
for (const lang of ["en", "de", "fr", "ar"]) {
  t(`${lang}: the window switches to it`, () => lang_(lang));
  t(`${lang}: the Compose list's State cells are whole or short, never cut, each with its whole text in the title`, () => { cmp.open = null; show("compose"); render(); cut("list"); });
  for (const p of ["customer-analytics-and-reporting-platform", "shop"])
    t(`${lang}: ${p}'s Services tab, the same`, () => { cmpOpen(p); click(document.querySelector('[data-cmptab="services"]')); cut("services"); });
}
t("a cell cut by a window that narrows says its short form, and its whole text when it widens again", () => {
  lang_("en"); cmp.open = null; show("compose"); render();
  const pill = () => document.querySelector('tr.group[data-cmpopen="shop"] .pill');
  const full = pill().dataset.full;
  if (pill().title !== full || !/of/.test(full)) throw new Error("title " + pill().title);
  if (pill().classList.contains("short") && pill().textContent !== "4/5") throw new Error("short form " + pill().textContent);
  if (!pill().classList.contains("short") && pill().textContent !== full) throw new Error("whole " + pill().textContent);
});
report(R);
