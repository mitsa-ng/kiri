// parity: macos windows linux
// window: 1440x900
// A project's row opens its page wherever it is clicked but on its buttons: its Share cell too, when it
// holds nothing of its own. A service row's button keeps focus across a refresh that changes it (Stop
// becomes Start) or moves its row: the button in the same slot of the same row.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
const now = Math.floor(Date.now() / 1000);
const svc = (name, ports) => ({ name, image: "nginx:latest", build: "", ports, volumes: [], depends: [], networks: ["default"], kinds: [] });
const m = (p, s, state) => ({ service: s, id: `c-${p}-${s}`, name: `${p}-${s}-1`, image: "nginx", state, status: state === "running" ? "Up" : "Exited (0)" });
const proj = (name, states) => ({ name, dir: "/w/" + name, files: [`/w/${name}/compose.yaml`], readable: true, updated: now - 60,
  services: Object.keys(states).map((s) => svc(s, [])), containers: Object.entries(states).map(([s, st]) => m(name, s, st)) });
const feed = (P) => {
  kiri.on({ type: "lists", images: [], volumes: [], networks: [], containers: P.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: c.status, Created: 1, Ports: [],
    Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))) });
  kiri.on({ type: "composeprojects", logos: {}, projects: P });
};
ui.vm = "running";
kiri.on({ type: "status", version: "0.1.4", dev: true, share: true, app: "Kiri", ours: "kiri", context: "kiri" });
sh.account = { signedIn: true };
feed([proj("shop", { web: "exited", api: "running" })]);
show("compose");
const row = (sel) => document.querySelector(`#content table.clist ${sel}`);

t("a project row's empty Share cell opens the project, as the rest of the row does", () => {
  for (const folded of [false, true]) {
    cmp.open = null; if (folded) cmp.folded.add("shop"); else cmp.folded.delete("shop"); render();
    const cell = row('tr.group[data-cmpopen="shop"] td.col-share');
    eq([!!cell, cell?.textContent.trim()], [true, ""], "the cell is there, empty");
    click(cell);
    eq(cmp.open, "shop", folded ? "folded" : "open");
  }
  cmp.open = null; cmp.folded.clear(); render();
  // A service's own Share cell is Share's: it doesn't open the project.
  click(row('tr[data-cmpsvc="shop"][data-svc="api"] td.col-share'));
  eq(cmp.open, null, "a service's Share cell");
});

t("a service's button keeps focus when it changes and its row moves", () => {
  cmp.open = null; cmp.folded.clear(); show("compose"); render();
  const slot = (r) => [...r.querySelectorAll(".acts-row > *")];
  const web = () => row('tr[data-cmpsvc="shop"][data-svc="web"]');
  const start = slot(web())[1];
  eq(start.dataset.c, "start", "exited: Start in the second slot");
  start.focus();
  eq(document.activeElement, start, "focused");
  // Started outside the window, and a project now sorts before it: its row moves down.
  feed([proj("aaa", { one: "running", two: "running" }), proj("shop", { web: "running", api: "running" })]);
  render();
  const a = document.activeElement, r = a?.closest("tr");
  eq([r?.dataset.cmpsvc, r?.dataset.svc, r ? slot(r).indexOf(a) : -1, a?.dataset.c], ["shop", "web", 1, "stop"], "the same slot of the same row");
  // Stopped again, nothing moves: still there.
  feed([proj("aaa", { one: "running", two: "running" }), proj("shop", { web: "exited", api: "running" })]);
  render();
  const b = document.activeElement, rb = b?.closest("tr");
  eq([rb?.dataset.svc, rb ? slot(rb).indexOf(b) : -1, b?.dataset.c], ["web", 1, "start"], "after it stops");
});
report(R);
