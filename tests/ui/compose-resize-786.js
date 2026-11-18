// parity: macos windows linux
// window: 786x520
// A resize at this width keeps every row's buttons inside the window, on the list and on a
// project's Services tab: the room cmpGive gave names holds after the event as before it.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const box = (el) => el.getBoundingClientRect();
const svc = (name, ports) => ({ name, image: `registry.example.com/team/${name}:2026.11.16`, build: "", ports, volumes: [], depends: [], networks: ["default"], kinds: [] });
const names = ["notification-delivery-worker", "payments-reconciliation-service", "web", "db"];
const svcs = names.map((n, i) => svc(n, i ? [`1910${i}:910${i}`] : ["19101:9101", "19102:9102", "19103:9103", "19104:9104"]));
const P = { name: "customer-analytics-platform", dir: "/w/c", files: ["/w/c/compose.yaml"], readable: true, updated: Math.floor(Date.now() / 1000) - 300, services: svcs,
  containers: names.map((n, i) => ({ service: n, id: "c" + i, name: `customer-analytics-platform-${n}-1`, image: n, state: i % 2 ? "running" : "exited", status: "Up" })) };
ui.vm = "running";
kiri.on({ type: "lists", containers: P.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: "Up 1 hour", Created: 1, Ports: [], Labels: { "com.docker.compose.project": P.name, "com.docker.compose.service": c.service } })), images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: [P, { ...P, name: "api", dir: "/w/api", files: ["/w/api/compose.yaml"], services: svcs.slice(2), containers: [] }] });
show("compose");
const inWindow = (what) => {
  for (const el of document.querySelectorAll(`${what} td.actions button, ${what} td.actions .acts-row`)) {
    const r = box(el);
    if (r.width && (r.right > innerWidth + 1 || r.left < -1)) throw new Error(`a button off the window (${Math.round(r.right)} > ${innerWidth}): ${el.title || el.textContent}`);
  }
  const tbl = document.querySelector(what), wrap = tbl.parentElement;
  if (what === "table.clist" && tbl.offsetWidth > wrap.clientWidth + 1) throw new Error(`the table is ${tbl.offsetWidth} px in a ${wrap.clientWidth} px box`);
};
const resize = () => { dispatchEvent(new Event("resize")); };
t("the list: after a resize the buttons stay in the window", () => {
  inWindow("table.clist");
  resize();
  inWindow("table.clist");
  resize(); resize();
  inWindow("table.clist");
});
t("Services tab: after a resize the buttons stay in the window", () => {
  cmpOpen(P.name);
  document.querySelector('[data-cmptab="services"]').dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  inWindow("table.cmp-svcs");
  resize();
  inWindow("table.cmp-svcs");
});
report(R);
