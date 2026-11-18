// parity: macos windows linux
// lang: ar
// window: 760x700
// A project's warnings on the list wrap under its name, across the row: a short one whole, a long one
// over 2 or 3 lines (then …), the whole of it in its title; the row's buttons stay where they are.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
ui.vm = "running";
const ctr = (p) => ({ Id: p + "-app", Names: [`/${p}-app-1`], Image: "alpine:3.20", State: "running", Status: "Up 1 hour", Created: 1, Ports: [], Labels: { "com.docker.compose.project": p, "com.docker.compose.service": "app" } });
kiri.on({ type: "lists", containers: [ctr("short"), ctr("long"), ctr("plain")], images: [], volumes: [], networks: [] });
const services = [{ name: "app", image: "alpine:3.20", build: "", ports: [], volumes: [], depends: [], networks: ["default"], kinds: [] }];
const proj = (name, o = {}) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated: 1, services, containers: [{ service: "app", id: name + "-app", name: `${name}-app-1`, image: "alpine:3.20", state: "running", status: "Up" }], ...o });
const nw = (names) => ({ text: "x", errkey: "nameSecret", errargs: { name: names.join(" and "), names } });
const many = ["${DEPLOY_TOKEN}", "${TAG_SECRET}", "${DB_PASSWORD}", "${API_KEY}", "${REDIS_PASSWORD}", "${GITHUB_TOKEN}", "${STRIPE_SECRET}", "${SMTP_PASSWORD}"];
kiri.on({ type: "composeprojects", logos: {}, projects: [proj("short", { namewarn: nw(["${A_TOKEN}"]) }), proj("long", { warn: { text: "x", errkey: "byName", errargs: {} }, namewarn: nw(many) }), proj("plain")] });
show("compose");
const warns = (n) => [...document.querySelectorAll(`tr[data-cmpopen="${n}"] .cmp-pwarn`)];
const lines = (el) => Math.round(el.clientHeight / parseFloat(getComputedStyle(el).lineHeight || 0) || 0);
const cut = (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
t("a short warning shows whole", () => {
  const [w] = warns("short");
  eq(!!w, true, "short's warning");
  eq(cut(w), false, "not cut: " + w.textContent);
  eq(w.title, w.textContent, "its title");
});
t("a long one wraps to 2 or 3 lines, then …, the whole in its title", () => {
  const ws = warns("long");
  eq(ws.length, 2, "both warnings");
  const nameW = ws[1];
  eq(nameW.title.includes("${SMTP_PASSWORD}"), true, "the whole in its title");
  const n = lines(nameW);
  if (n < 2 || n > 3) throw new Error(`${n} lines: ${nameW.textContent}`);
  // It takes the row's width under the name, not just the Name column's.
  const td = nameW.closest("td"), name = document.querySelector("table.clist thead th");
  if (td.offsetWidth <= name.offsetWidth) throw new Error(`the warning's cell ${td.offsetWidth} is no wider than Name ${name.offsetWidth}`);
});
t("a project with no warning has no warning row; nothing scrolls sideways", () => {
  eq(warns("plain").length, 0, "plain");
  eq(document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth, 0, "sideways scroll");
  const tbl = document.querySelector("table.clist");
  if (tbl.offsetWidth > tbl.parentElement.clientWidth + 1) throw new Error("the table is wider than its box");
});
t("the rows' buttons line up, with or without a warning", () => {
  const x = (n) => Math.round(document.querySelector(`tr.group[data-cmpopen="${n}"] td.actions`).getBoundingClientRect().left);
  eq([x("short"), x("long")], [x("plain"), x("plain")], "Actions' left edge");
});
report(R);
