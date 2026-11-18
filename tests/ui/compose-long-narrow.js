// parity: macos windows linux
// window: 760x520
// Long names in Compose in the narrowest window (760 px): as compose-long.js, which
// has the same checks at 1440 px.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const inside = (el, box) => { const a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return a.left >= b.left - 1 && a.right <= b.right + 1; };
const apart = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return x.right <= y.left + 1 || y.right <= x.left + 1 || x.bottom <= y.top + 1 || y.bottom <= x.top + 1; };
// Words of their own: cut only with "…" and a title above them (or in a box that scrolls),
// and inside every box around them up to one that scrolls or ends in "…".
const fits = (root) => {
  const bad = [], sc = (cs) => cs.overflowX === "auto" || cs.overflowX === "scroll", ell = (cs) => cs.overflowX !== "visible" && cs.textOverflow === "ellipsis";
  const tip = (el) => !!el.closest("[title]")?.title;
  for (const el of root.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || cs.visibility === "hidden") continue;
    const what = `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${el.textContent.trim().slice(0, 40)}"`;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth && !sc(cs)) { if (!ell(cs)) bad.push("cut without …: " + what); else if (!tip(el)) bad.push("cut without a title: " + what); continue; }
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const ar = a.getBoundingClientRect(), as = getComputedStyle(a);
      if (r.right > ar.right + 1 || r.left < ar.left - 1) {
        if (!ell(as) && !sc(as)) bad.push(`runs out of ${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}.${[...a.classList].join(".")}: ` + what);
        else if (ell(as) && !tip(el)) bad.push("cut without a title: " + what);
        break;
      }
      if (sc(as) || ell(as)) break;
    }
  }
  return bad;
};
// Each long name on the page: whole, or ending in … with the whole of it in a title.
const named = (root, names) => {
  const bad = [];
  for (const el of root.querySelectorAll("*")) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    const n = names.find((x) => own && x.startsWith(own.replace(/…$/, "")) && own.length >= 6);
    if (!n || !el.getBoundingClientRect().width) continue;
    const cut = el.scrollWidth > el.clientWidth + 1 || [...Array(6)].reduce((a, _, i, __, p = a.p?.parentElement) => p && !a.s ? { p, s: ["auto", "scroll"].includes(getComputedStyle(p).overflowX), c: a.c || (getComputedStyle(p).overflowX === "hidden" && p.getBoundingClientRect().right < el.getBoundingClientRect().right - 1) } : a, { p: el, c: false, s: false }).c;
    if (cut && !(el.closest("[title]")?.title || "").includes(n)) bad.push(`"${own.slice(0, 30)}" is cut, and no title says ${n}`);
  }
  return bad;
};
const noSideScroll = () => eq([document.scrollingElement.scrollWidth <= innerWidth + 1, $("content").scrollWidth <= $("content").clientWidth + 1], [true, true], "no sideways scroll");
const P = "customer-analytics-and-reporting-platform-staging";
const NAMES = ["notification-delivery-worker-for-transactional-emails", "payments-reconciliation-and-settlement-service", "customer-analytics-event-ingestion-pipeline-consumer",
  "dashboard-frontend-with-a-really-long-service-name", "db", "cache", "search-indexer", "api-gateway", "auth", "scheduler", "metrics-exporter", "object-storage-proxy", "mailer"];
const CN = (n) => `${P}-${n}-1`;
const ALL = [P, ...NAMES, ...NAMES.map(CN)];
const LL = (svc) => ({ "com.docker.compose.project": P, "com.docker.compose.service": svc });
const IMG = (n) => n.startsWith("payments") ? "public.ecr.aws/docker/library/alpine:3.20" : n + ":latest";
ui.vm = "running";
kiri.on({ type: "lists", containers: NAMES.map((n, i) => ({ Id: "c" + i, Names: ["/" + CN(n)], Image: IMG(n), State: i % 5 ? "running" : "exited", Status: i % 5 ? "Up 1 hour" : "Exited (1) 2 minutes ago", Created: 1,
  Ports: n.startsWith("payments") ? [19101, 19102, 19103, 19104].map((p) => ({ IP: "0.0.0.0", PrivatePort: p - 10000, PublicPort: p, Type: "tcp" })) : [], Labels: LL(n) })), images: [], volumes: [], networks: [] });
const BUILD = "/home/someone/work/kiri/compose-demo/customer-analytics/services/auth-api";
const lsvc = (name) => ({ name, image: name === "auth" ? "" : IMG(name), build: name === "auth" ? BUILD : "", ports: name.startsWith("payments") ? ["19101:9101", "19102:9102", "19103:9103", "19104:9104"] : [], volumes: [], depends: name === "api-gateway" ? NAMES.slice(0, 4) : [], networks: ["default"], kinds: [],
  tech: { slug: "", role: "Worker", app: true, lang: "Go", fw: "", how: "Dockerfile FROM golang:1.23-alpine" } });
kiri.on({ type: "composeprojects", logos: {}, projects: [{ name: P, dir: "/w/" + P, files: ["/w/" + P + "/compose.yaml"], readable: true, updated: Math.floor(Date.now() / 1000) - 200,
  services: NAMES.map(lsvc), containers: NAMES.map((n, i) => ({ service: n, id: "c" + i, name: CN(n), image: n, state: i % 5 ? "running" : "exited", status: "Up" })) }] });
show("compose");

t("the list, folded out: long names end in … with a title, State and the buttons keep their place", () => {
  const row = document.querySelector(`tr[data-cmpopen="${P}"]`);
  for (const r of [row, ...document.querySelectorAll("#content tr.member")]) {
    const tds = r.querySelectorAll("td"), pill = tds[1].querySelector(".pill"), acts = r.querySelector(".acts-row");
    eq([tds[1].getBoundingClientRect().width > 50, inside(pill, tds[1]), apart(tds[0], acts), apart(pill, acts)], [true, true, true, true], "State stays, clear of the buttons: " + r.textContent.trim().slice(0, 30));
  }
  eq([fits($("content")), named($("content"), ALL)], [[], []], "everything fits");
  noSideScroll();
});
t("the list, folded: its logos and ports stay in their columns", () => {
  click(document.querySelector(`[data-cmpfold="${P}"]`));
  eq([fits($("content")), named($("content"), ALL)], [[], []], "everything fits");
  click(document.querySelector(`[data-cmpfold="${P}"]`));
});
t("many services: the list scrolls in the page, its column names stay put", () => {
  const c = $("content"), th = document.querySelector("table.clist th"), top = th.getBoundingClientRect().top;
  eq([c.scrollHeight > c.clientHeight, c.scrollHeight, c.clientHeight, getComputedStyle(c).overflowY], [true, c.scrollHeight, c.clientHeight, "auto"], "13 services need more than one page");
  c.scrollTop = 300; eq(Math.abs(th.getBoundingClientRect().top - Math.max(top - 300, c.getBoundingClientRect().top)) <= 6, true, "column names stuck at the top");
  c.scrollTop = 0;
});
t("a project's page: the crumb and head end in … with the name in a title; the tab bar stays put", () => {
  cmpOpen(P);
  eq([fits($("title")), named($("title"), [P]), fits($("cmp-head")), named($("cmp-head"), ALL)], [[], [], [], []], "crumb and head fit");
  const pill = document.querySelector("#cmp-head > .pill"), b = document.querySelector("#cmp-head .who b");
  eq([b.getBoundingClientRect().top === pill.getBoundingClientRect().top || Math.abs(b.getBoundingClientRect().top - pill.getBoundingClientRect().top) < 12, inside(pill, $("content"))], [true, true], "its state sits beside the name");
  click(document.querySelector('[data-cmptab="services"]'));
  const c = $("content"), tabs = $("cmp-tabs"), was = tabs.getBoundingClientRect().top;
  c.scrollTop = 1000;
  eq([c.scrollTop > 0, Math.round(tabs.getBoundingClientRect().top) <= Math.round(Math.max(was, c.getBoundingClientRect().top)) + 1 && tabs.getBoundingClientRect().top >= c.getBoundingClientRect().top - 1], [true, true], "the tab bar stays in sight");
  c.scrollTop = 0;
});
t("Services: long names end in …, many ports read 19101→9101 +3 with every one in a title", () => {
  eq([fits($("content")), named($("content"), ALL)], [[], []], "everything fits");
  const row = [...document.querySelectorAll("table.cmp-svcs tbody tr")].find((r) => r.dataset.svc.startsWith("payments"));
  const ports = row.querySelectorAll("td")[2];
  if (getComputedStyle(ports).display === "none") eq(row.querySelector(".sub-name .cdp").textContent, " · 19101→9101 +3", "narrow: the first port and how many more under the name");
  else {
    eq([ports.querySelector(".port").textContent, ports.querySelector(".muted").textContent], ["19101→9101", "+3"], "the first port and how many more");
    eq([ports.querySelector(".port").title, inside(ports.querySelector(".muted"), ports)], ["19101→9101, 19102→9102, 19103→9103, 19104→9104", true], "all of them in the title; +3 shows");
  }
  noSideScroll();
  const box = document.querySelector(".cmp-svwrap"), head = $("cmp-head").getBoundingClientRect().left, tabs = $("cmp-tabs").getBoundingClientRect().left;
  if (box.scrollWidth > box.clientWidth + 1) {
    box.scrollLeft = 200; box.dispatchEvent(new Event("scroll"));
    const first = box.querySelector("tbody td"), second = box.querySelector("tbody td + td");
    eq([box.scrollLeft > 0, box.classList.contains("scrolled"), Math.round(first.getBoundingClientRect().left) === Math.round(box.getBoundingClientRect().left), getComputedStyle(first).backgroundColor !== "rgba(0, 0, 0, 0)"], [true, true, true, true], "only the table moves; its Name column stays, solid, with an edge");
    eq([$("cmp-head").getBoundingClientRect().left, $("cmp-tabs").getBoundingClientRect().left, apart(first, second) || second.getBoundingClientRect().left >= first.getBoundingClientRect().left || first.contains(document.elementFromPoint(first.getBoundingClientRect().left + 4, first.getBoundingClientRect().top + 8))], [head, tabs, true], "the head and the tab bar stay put; the name drawn over what scrolls under it");
    noSideScroll();
    box.scrollLeft = 0; box.dispatchEvent(new Event("scroll"));
  }
  const sub = document.querySelector('table.cmp-svcs tr[data-svc="auth"] .sub-name');
  eq(sub.title, `Go · ${CN("auth")}`, "a built service's second line, whole in its title");
});
t("Structure: map cards end long names in …, normal and compact", () => {
  click(document.querySelector('[data-cmptab="structure"]'));
  for (const nm of document.querySelectorAll(".card .nmt")) {
    const cs = getComputedStyle(nm);
    eq([cs.textOverflow, inside(nm, nm.closest(".card")), nm.closest(".card").title.includes(nm.textContent)], ["ellipsis", true, true], "a card's name: " + nm.textContent);
  }
  eq(document.querySelectorAll(".card .nmt").length, NAMES.length, "a card for each");
  noSideScroll();
});
t("Compose file: the outline and the plan end long names in …, each with its title", () => {
  kiri.on({ type: "composefile", name: P, path: "/w/" + P + "/compose.yaml", text: "services:\n" + NAMES.map((n) => `  ${n}:\n    image: ${IMG(n)}\n`).join(""), hash: "h", mtime: 1 });
  click(document.querySelector('[data-cmptab="file"]'));
  const ta = $("cmp-ta"); ta.value = ta.value.replace("db:latest", "db:2"); ta.dispatchEvent(new Event("input"));
  kiri.on({ type: "composeplan", name: P, seq: cmp.seq, steps: [{ n: NAMES[1], act: "chg", what: ["image", "ports"], from: IMG(NAMES[1]), to: "public.ecr.aws/docker/library/alpine:3.21" }, { n: NAMES[2], act: "add", what: [], to: IMG(NAMES[2]) }, ...NAMES.slice(3).map((n) => ({ n, act: "same", what: [] }))], services: [] });
  eq([fits($("content")), named($("content"), ALL)], [[], []], "everything fits");
  noSideScroll();
});
t("Logs: a long service's label ends in … with its title", () => {
  click(document.querySelector('[data-cmptab="logs"]'));
  kiri.on({ type: "composelogs", name: P, lines: NAMES.map((n, i) => ({ svc: n + "-1", t: `2026-11-16T13:02:${String(i).padStart(2, "0")}.000Z`, text: "listening on :" + (9000 + i) })) });
  render();
  eq([fits($("content")), named($("content"), NAMES.map((n) => n + "-1"))], [[], []], "everything fits");
});
t("Containers: the Compose project under a long container name ends in … with its title", () => {
  cmp.open = null; show("containers");
  for (const b of document.querySelectorAll("#content .cproj")) {
    const cs = getComputedStyle(b);
    eq([b.scrollWidth <= b.clientWidth + 1 || cs.textOverflow === "ellipsis", b.title.includes(P), inside(b, b.closest("td"))], [true, true, true], "the project link fits its cell");
  }
  eq(document.querySelectorAll("#content .cproj").length > 0, true, "the link is there");
  show("compose");
});
report(R);
