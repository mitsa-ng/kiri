// parity: macos windows linux
// The project's real networks in its header and the Structure footer (one, several, none, a custom
// name); the notice for a name Kiri won't take, on the row and the page, the row described by it;
// the name warning in the plan box with nothing to apply; Kiri's own Compose errors in words.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
ui.vm = "running";
kiri.on({ type: "lists", containers: [], images: [], volumes: [], networks: [] });
const services = [{ name: "app", image: "alpine:3.20", build: "", ports: [], volumes: [], depends: [], networks: ["default"], kinds: [] }];
const proj = (name, o = {}) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated: 1, services, containers: [{ service: "app", id: name + "-app", name: name + "-app-1", image: "alpine:3.20", state: "running", status: "Up" }], ...o });
const LONG = "net-" + "x".repeat(80);
const FOLDER = { text: "x", errkey: "nameFolder", errargs: { vars: "${A_SECRET}", name: "m-pname-env" } };
const NW = { text: "x", errkey: "nameSecret", errargs: { name: "${A_SECRET}", names: ["${A_SECRET}"] } };
kiri.on({ type: "composeprojects", logos: {}, projects: [
  proj("one", { networks: ["one_default"] }), proj("many", { networks: ["many_front", "many_back", "many_db"] }), proj("none", { networks: [] }),
  proj("custom", { networks: ["net-${NET_SECRET}"] }), proj("long", { networks: [LONG] }), proj("m-pname-env", { namewarn: NW, namefolder: FOLDER }),
  proj("m-pname-bad", { readable: false, error: "Compose rejects this file. A required variable may not be set: ${A_SECRET}.", errkey: "reqUnset", errargs: { name: "${A_SECRET}" }, namefolder: { ...FOLDER, errargs: { vars: "${A_SECRET}", name: "m-pname-bad" } } })] });
show("compose");
const fact = () => [...document.querySelectorAll("#cmp-head .dfacts > div")].find((d) => d.querySelector("dt").textContent === "Network").querySelector("dd");
const foot = () => { click(document.querySelector('[data-cmptab="structure"]')); return document.querySelector(".mapfoot span"); };
t("one network, several, none, and a custom-named one", () => {
  for (const [n, text, title] of [["one", "one_default", "one_default"], ["many", "many_front +2", "many_front\nmany_back\nmany_db"], ["custom", "net-${NET_SECRET}", "net-${NET_SECRET}"]]) {
    cmpOpen(n);
    eq([fact().textContent, fact().querySelector(".cnet").title], [text, title], n + " header");
    eq([...fact().querySelectorAll("[title]")].map((x) => x.title), text.includes("+") ? [title, title] : [title], n + ": the +N has the same tooltip");
    const f = foot();
    eq([f.textContent, f.querySelector(".cnet").title], ["Network" + text, title], n + " footer");
  }
  cmpOpen("none");
  eq(fact().textContent, "—", "none header");
  eq(foot().textContent, "Network—", "none footer");
  eq($("content").textContent.includes("_default"), false, "no made-up network");
});
t("a long name is cut, with the whole in its tooltip", () => {
  cmpOpen("long");
  const c = fact().querySelector(".cnet");
  eq([c.title, getComputedStyle(c).textOverflow, c.scrollWidth > c.clientWidth], [LONG, "ellipsis", true], "cut");
});
t("a name Kiri won't take: the notice on the row and the page, and the row points at it", () => {
  cmp.open = null; render();
  const w = document.querySelector('tr.gwarn[data-cmpopen="m-pname-env"]');
  const text = "This file's name uses ${A_SECRET}. Kiri uses the folder's name, m-pname-env, so it never puts a secret in a name.";
  eq([...w.querySelectorAll(".cmp-pwarn")].map((x) => x.textContent).includes(text), true, "the row");
  eq(document.querySelector('tr.group[data-cmpopen="m-pname-env"]').getAttribute("aria-describedby"), w.id, "described by");
  eq(document.querySelector('tr.group[data-cmpopen="one"]').hasAttribute("aria-describedby"), false, "no warning, no link");
  cmpOpen("m-pname-env");
  eq([...$("cmp-warn").querySelectorAll("p.warn")].map((p) => p.textContent).includes(text), true, "the page");
  // Compose rejects the file too: the notice is on the page as well as the row.
  cmp.open = null; render();
  const bad = text.replace("m-pname-env", "m-pname-bad");
  eq([...document.querySelectorAll('tr.gwarn[data-cmpopen="m-pname-bad"] .cmp-pwarn')].map((x) => x.textContent).includes(bad), true, "the rejected one's row");
  cmpOpen("m-pname-bad");
  const ps = [...$("cmp-warn").querySelectorAll("p.warn")].map((p) => p.textContent);
  eq([ps.some((p) => p.includes("A required variable may not be set")), ps.includes(bad)], [true, true], "the rejected one's page");
});
t("the plan box repeats the name warning with nothing to apply", () => {
  cmpOpen("m-pname-env");
  kiri.on({ type: "composefile", name: "m-pname-env", path: "/w/m-pname-env/compose.yaml", mtime: 1, hash: "h1", text: "services:\n  app:\n    image: alpine:3.20\n" });
  click(document.querySelector('[data-cmptab="file"]'));
  const el = $("cmp-plan");
  eq(el.querySelector(".lede").textContent.startsWith("Nothing yet"), true, "nothing yet");
  eq([...el.querySelectorAll(".err.warn")].map((e) => e.textContent), ["${A_SECRET} is used in a name or folder path. Docker shows those in plain text."], "the warning");
});
t("Kiri's own Compose errors read as its words", () => {
  eq(cmpErr({ errkey: "reqUnset", errargs: { name: "${A}, ${B}" } }), "Compose rejects this file. A required variable may not be set: ${A}, ${B}.", "required");
  eq(cmpErr({ errkey: "rejectReal", errargs: {} }), "Compose rejects this file with its real values. Kiri can't show why with secrets hidden.", "real");
  eq(cmpErr({ errkey: "yamlLine", errargs: { n: "6" } }), "Compose rejects this file: YAML error on line 6", "yaml");
});
report(R);
