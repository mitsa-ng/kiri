// window: 760x520
// At 760 px with 90 rows, a refresh of the Compose list costs about what one at 1440 does: the room
// given to names is measured once for the width, and each render after fits the columns once.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const svc = (name, i) => ({ name, image: `registry.example.com/team/${name}:2026.11.16`, build: "", ports: [`${18000 + i}:80`], volumes: [], depends: [], networks: ["default"], kinds: [] });
const projects = Array.from({ length: 30 }, (_, p) => {
  const names = [`notification-delivery-worker-${p}`, `payments-reconciliation-service-${p}`];
  return { name: `customer-analytics-and-reporting-platform-${p}`, dir: `/w/p${p}`, files: [`/w/p${p}/compose.yaml`], readable: true, updated: 1, services: names.map((n, i) => svc(n, p * 2 + i)),
    containers: names.map((n, i) => ({ service: n, id: `c${p}-${i}`, name: `project-number-${p}-${n}-1`, image: n, state: i ? "running" : "exited", status: "Up" })) };
});
ui.vm = "running";
kiri.on({ type: "lists", containers: projects.flatMap((p) => p.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: "Up", Created: 1, Ports: [], Labels: { "com.docker.compose.project": p.name, "com.docker.compose.service": c.service } }))), images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects });
show("compose");
const time = (n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) render(); return (performance.now() - t0) / n; };
t("a refresh at 760 with 90 rows costs under 1.5 times one that fits the columns once", () => {
  const rows = document.querySelectorAll("table.clist tbody tr").length;
  if (rows < 90) throw new Error(`${rows} rows`);
  time(2);
  const full = time(6);
  const give = cmpGive;
  // As at 1440: nothing to give, the columns fitted once.
  cmpGive = () => fitColumns();
  const once = time(6);
  cmpGive = give;
  if (full > once * 1.5) throw new Error(`${full.toFixed(1)} ms a render, ${once.toFixed(1)} ms with one fit`);
});
report(R);
