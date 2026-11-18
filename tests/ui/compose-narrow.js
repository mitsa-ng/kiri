// parity: macos windows linux
// window: 760x520
// Compose in a narrow window (760 px, the smallest Windows and Linux open at):
// the list's bar, a project's row, the plan and the tabs fit, ending in … where
// they must, with nothing over anything else. No words in the Compose pages run
// out of their box uncut or are cut without "…": the list, a project's head, the
// file tab after a failed Apply, and the Services tab (whose table scrolls in
// its own box, every column still there).
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const inside = (el, box) => { const a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return a.left >= b.left - 1 && a.right <= b.right + 1; };
const apart = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return x.right <= y.left + 1 || y.right <= x.left + 1 || x.bottom <= y.top + 1 || y.bottom <= x.top + 1; };
// Each element with words of its own: cut only with "…" (or in a box that scrolls),
// and inside every box around it up to one that scrolls or ends in "…".
const fits = (root) => {
  const bad = [], sc = (cs) => cs.overflowX === "auto" || cs.overflowX === "scroll", ell = (cs) => cs.overflowX !== "visible" && cs.textOverflow === "ellipsis";
  for (const el of root.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || cs.visibility === "hidden") continue;
    const what = `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${el.textContent.trim().slice(0, 40)}"`;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth && !sc(cs) && !ell(cs)) { bad.push("cut without …: " + what); continue; }
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const ar = a.getBoundingClientRect(), as = getComputedStyle(a);
      if (r.right > ar.right + 1 || r.left < ar.left - 1) {
        if (!ell(as) && !sc(as)) bad.push(`runs out of ${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}.${[...a.classList].join(".")}: ` + what);
        break;
      }
      if (sc(as) || ell(as)) break;
    }
  }
  return bad;
};
const L = (svc) => ({ "com.docker.compose.project": "shop", "com.docker.compose.service": svc });
ui.vm = "running";
const names = ["web", "api", "db", "cache", "worker"];
kiri.on({ type: "lists", containers: names.map((n, i) => ({ Id: n + "1", Names: [`/shop-${n}-1`], Image: n, State: i ? "running" : "exited", Status: i ? "Up 1 hour" : "Exited (0)", Created: 1, Ports: [], Labels: L(n) })), images: [], volumes: [], networks: [] });
const svc = (name, o) => ({ name, image: name + ":latest", build: "", ports: ["8080:80"], volumes: [], depends: [], networks: ["default"], kinds: [], ...o });
kiri.on({ type: "composeprojects", logos: {}, projects: [{ name: "shop", dir: "/w/shop", files: ["/w/shop/compose.yaml"], readable: true, updated: 1,
  services: names.map((n) => svc(n)), containers: names.map((n, i) => ({ service: n, id: n + "1", name: `shop-${n}-1`, image: n, state: i ? "running" : "exited", status: "Up" })) }] });
show("compose");
t("the list's header keeps Open a compose file… in the window: its icon, its words in the title", () => {
  const b = document.querySelector("#hright [data-cmpopenfile]");
  eq([inside(b, document.querySelector(".toolbar")), b.scrollWidth <= b.clientWidth + 1, b.title, getComputedStyle(b).cursor], [true, true, tr("Open a compose file…"), "pointer"], "in the page, not cut");
});
t("a project's row: its buttons stay clear of its state", () => {
  const row = document.querySelector('tr[data-cmpopen="shop"]'), pill = row.querySelector(".pill"), acts = row.querySelector(".acts-row");
  const cs = getComputedStyle(pill);
  eq([apart(pill, acts.firstElementChild), pill.getBoundingClientRect().right <= pill.closest("td").getBoundingClientRect().right + 1], [true, true], "no overlap");
  eq([cs.textOverflow, cs.overflow], ["ellipsis", "hidden"], "a long state ends in …");
});
t("the tabs keep one line each, and the plan's words end in …", () => {
  cmpOpen("shop");
  kiri.on({ type: "composefile", name: "shop", path: "/w/shop/compose.yaml", text: "services:\n" + names.map((n) => `  ${n}:\n    image: ${n}:latest\n`).join(""), hash: "h", mtime: 1 });
  click(document.querySelector('[data-cmptab="file"]'));
  const tab = document.querySelector('[data-cmptab="file"]');
  eq(tab.getBoundingClientRect().height < 40 && getComputedStyle(tab).whiteSpace === "nowrap", true, "Compose file on one line");
  kiri.on({ type: "composeplan", name: "shop", seq: cmp.seq, steps: [{ n: "a-very-long-service-name-indeed", act: "add", what: [], from: "", to: "x" }, ...names.map((n) => ({ n, act: "same", what: [] }))].slice(0, 3), services: [] });
  for (const a of document.querySelectorAll("#cmp-plan li .act, #cmp-plan li .what")) {
    const cs = getComputedStyle(a);
    eq([cs.textOverflow, cs.whiteSpace, inside(a, a.closest("li"))], ["ellipsis", "nowrap", true], "ends in … inside its row: " + a.textContent);
  }
});
t("the list: State never goes, and nothing runs out of its box", () => {
  cmp.open = null; render();
  const heads = [...document.querySelectorAll("table.clist th")].map((h) => h.textContent);
  const state = document.querySelectorAll("table.clist th")[heads.indexOf("State")];
  eq([!!state, state && state.getBoundingClientRect().width > 50], [true, true], "the State column shows");
  for (const p of document.querySelectorAll("table.clist tr.row .pill")) eq(p.getBoundingClientRect().width > 30 && inside(p, $("content")), true, "a state shows: " + p.textContent);
  eq(fits($("content")), [], "everything fits");
});
const longP = { type: "composeprojects", logos: {}, projects: [{ name: "shop", dir: "C:\\Users\\someone\\projects\\shop", files: ["C:\\Users\\someone\\projects\\shop\\deploy\\compose.production.override.yaml"], readable: true, updated: Math.floor(Date.now() / 1000) - 200,
  services: names.map((n) => svc(n, { ports: ["8080:80", "8443:443"], tech: { slug: "", role: "Web", app: true, lang: "Node.js", fw: "Next.js", how: "Dockerfile FROM node:22-alpine" } })), containers: names.map((n, i) => ({ service: n, id: n + "1", name: `shop-${n}-1`, image: n, state: i ? "running" : "exited", status: "Up" })) }] };
t("a project's head: its facts fit, each whole or ending in …", () => {
  kiri.on(longP); cmpOpen("shop");
  eq(fits($("cmp-head")), [], "the head fits");
  for (const dd of document.querySelectorAll("#cmp-head .dfacts dd")) eq(inside(dd, $("content")) && (dd.scrollWidth <= dd.clientWidth + 1 || dd.title === dd.textContent), true, "a fact shows, or says itself in its title: " + dd.textContent);
});
t("the file tab after a failed Apply: the reason wraps or ends in … in its box, whole in its title", () => {
  kiri.on({ type: "composefile", name: "shop", path: "/w/shop/compose.yaml", text: "services:\n" + names.map((n) => `  ${n}:\n    image: ${n}:latest\n`).join(""), hash: "h", mtime: 1 });
  click(document.querySelector('[data-cmptab="file"]'));
  const ta = $("cmp-ta"); ta.value = ta.value.replace("web:latest", "web:2"); ta.dispatchEvent(new Event("input"));
  const steps = [{ n: "web", act: "chg", what: ["image"], from: "web:latest", to: "web:2" }, ...names.slice(1).map((n) => ({ n, act: "same", what: [] }))];
  kiri.on({ type: "composeplan", name: "shop", seq: cmp.seq, steps, services: [] });
  click(document.querySelector("[data-cmpapply]"));
  const why = "Error response from daemon: driver failed programming external connectivity on endpoint shop-web-1: Bind for 0.0.0.0:8080 failed: port is already allocated";
  kiri.on({ type: "composeapply", name: "shop", done: true, ok: false, saved: true, error: why });
  kiri.on({ type: "composefile", name: "shop", path: "/w/shop/compose.yaml", text: ta.value, hash: "h2", mtime: 2 });
  kiri.on({ type: "composeplan", name: "shop", seq: cmp.seq, steps, services: [] });
  const st = $("cmp-edstate");
  eq([st.textContent.includes("Bind for"), st.title.includes(why)], [true, true], "says why, whole in its title");
  eq([inside(st, st.closest(".cmp-edcol")), apart(st, $("cmp-plan"))], [true, true], "inside its column, clear of the plan");
  eq(fits($("content")), [], "everything fits");
});
t("the Services tab: every column is there, in a box that scrolls with a cue, and nothing else runs out", () => {
  click(document.querySelector('[data-cmptab="services"]'));
  const tbl = document.querySelector("table.cmp-svcs"), box = tbl.parentElement, cs = getComputedStyle(box);
  eq([...tbl.querySelectorAll("th")].map((h) => h.textContent), ["Service", "State", "Ports", ...(shareOn() ? ["Share"] : []), "Created", "Actions"], "every column");
  eq(inside(box, $("content")), true, "its box is in the page");
  if (box.scrollWidth > box.clientWidth + 1) eq([cs.overflowX, cs.backgroundImage.includes("gradient")], ["auto", true], "it scrolls, its edge shaded where more is");
  for (const p of tbl.querySelectorAll("tbody .pill")) eq(p.getBoundingClientRect().width > 30, true, "a state shows");
  eq(fits($("content")), [], "everything fits");
});
t("a restarting service's state ends in … in the list, the Services tab and its map card", () => {
  const P = (n, i) => ({ Id: n + "1", Names: [`/shop-${n}-1`], Image: n, State: i ? "running" : "restarting", Status: i ? "Up 1 hour" : "Restarting (1) 3 seconds ago", Created: 1, Ports: [], Labels: L(n) });
  kiri.on({ type: "lists", containers: names.map(P), images: [], volumes: [], networks: [] });
  kiri.on({ type: "composeprojects", logos: {}, projects: [{ ...longP.projects[0], containers: names.map((n, i) => ({ service: n, id: n + "1", name: `shop-${n}-1`, image: n, state: i ? "running" : "restarting", status: i ? "Up" : "Restarting (1) 3 seconds ago" })) }] });
  cmp.open = null; render();
  const look = (where) => {
    const pills = [...document.querySelectorAll("#content .pill.restarting")];
    eq(pills.length > 0, true, where + ": the state shows");
    for (const p of pills) {
      const cs = getComputedStyle(p), whole = p.scrollWidth <= p.clientWidth + 1;
      eq([whole || (cs.textOverflow === "ellipsis" && cs.overflow === "hidden"), inside(p, p.closest("td, .card") || $("content"))], [true, true], `${where}: whole or ending in … inside its box: ${p.textContent}`);
    }
    eq(fits($("content")), [], where + ": everything fits");
  };
  look("the list");
  cmpOpen("shop"); click(document.querySelector('[data-cmptab="services"]')); look("Services");
  click(document.querySelector('[data-cmptab="structure"]')); look("Structure");
});
report(R);
