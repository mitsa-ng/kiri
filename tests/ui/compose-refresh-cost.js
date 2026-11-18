// An unchanged refresh of a Compose list with 90 rows draws nothing again (the same projects, the
// same containers): under 50 ms for both events (about 2 ms here), under 80 ms when something changed (about 35 ms here: each fitted column is measured in one layout); a change of
// type (letter spacing here) fits the columns again.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const svc = (name, i) => ({ name, image: `registry.example.com/team/${name}:2026.11.16`, build: "", ports: [`${18000 + i}:80`], volumes: [], depends: [], networks: ["default"], kinds: [] });
const mk = (status, updated = 1) => Array.from({ length: 30 }, (_, p) => {
  const names = [`notification-delivery-worker-${p}`, `payments-reconciliation-service-${p}`];
  return { name: `customer-analytics-and-reporting-platform-${p}`, dir: `/w/p${p}`, files: [`/w/p${p}/compose.yaml`], readable: true, updated, services: names.map((n, i) => svc(n, p * 2 + i)),
    containers: names.map((n, i) => ({ service: n, id: `c${p}-${i}`, name: `project-number-${p}-${n}-1`, image: n, state: i ? "running" : "exited", status })) };
});
const lists = (projects, status) => ({ type: "lists", containers: projects.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: status, Created: 1, Ports: [], Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))), images: [], volumes: [], networks: [] });
ui.vm = "running";
kiri.on(lists(mk("Up"), "Up"));
kiri.on({ type: "composeprojects", logos: {}, projects: mk("Up") });
show("compose");
const cost = (fn, n = 5) => { fn(); const t0 = performance.now(); for (let i = 0; i < n; i++) fn(); return (performance.now() - t0) / n; };
t("an unchanged refresh of 90 rows: both events under 50 ms, the rows left as they are", () => {
  const rows = document.querySelectorAll("table.clist tbody tr").length;
  if (rows < 90) throw new Error(`${rows} rows`);
  const first = document.querySelector("table.clist tbody tr");
  const ms = cost(() => { kiri.on(lists(mk("Up"), "Up")); kiri.on({ type: "composeprojects", logos: {}, projects: mk("Up") }); });
  if (ms > 50) throw new Error(`${ms.toFixed(1)} ms`);
  eq(document.querySelector("table.clist tbody tr") === first, true, "the same rows");
});
t("a changed refresh of 90 rows: under 80 ms, and it shows", () => {
  let k = 0;
  const ms = cost(() => { k++; render(); kiri.on({ type: "composeprojects", logos: {}, projects: mk("Up", Math.floor(Date.now() / 1000) - k * 3600) }); render(); }, 3);
  if (ms > 80) throw new Error(`${ms.toFixed(1)} ms`);
  const p = mk("Up"); p[0].name = "renamed-project"; kiri.on({ type: "composeprojects", logos: {}, projects: p });
  eq(!!document.querySelector('tr.group[data-cmpopen="renamed-project"]'), true, "the new name");
  eq(document.querySelector("table.clist tbody tr td.cu")?.textContent.length > 0, true, "the time it shows");
});
t("the same rows in another type are fitted again", () => {
  let fits = 0; const fit = fitColumns; fitColumns = () => { fits++; fit(); };
  render(); const quiet = fits;
  document.body.style.letterSpacing = "0.05em"; render(); const one = fits;
  document.body.style.letterSpacing = ""; render();
  fitColumns = fit;
  eq([quiet, one > 0, fits > one], [0, true, true], "fits: none unchanged, some on each change");
});
report(R);
