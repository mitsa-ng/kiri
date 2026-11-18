// parity: macos windows linux
// window: 760x520
// Compose's tables at 760 px, after sorting and resizing as compose-columns.js does at
// 1440: nothing runs off the page sideways; the list keeps Name and State (its count and
// time under the name); the Services tab scrolls in its own box, Name staying at the start.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const click = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
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
const noSideScroll = () => eq([document.scrollingElement.scrollWidth <= innerWidth + 1, $("content").scrollWidth <= $("content").clientWidth + 1], [true, true], "no sideways scroll");
const drag = (grip, dx) => {
  const x = box(grip).left + 2, y = box(grip).top + 4, ptr = (type, d) => new PointerEvent(type, { bubbles: true, button: 0, clientX: x + d, clientY: y, pointerId: 1 });
  grip.dispatchEvent(ptr("pointerdown", 0)); document.dispatchEvent(ptr("pointermove", dx)); document.dispatchEvent(ptr("pointerup", dx));
  ui.resizedAt = 0;
};
const inPage = (sel) => { const c = box($("content")); for (const el of document.querySelectorAll(sel)) if (box(el).width && (box(el).right > c.right + 1 || box(el).left < c.left - 1)) throw new Error("off the page: " + el.textContent); };

t("the list: Name and State show and sort, the count and time are under the name, nothing off the page", () => {
  const shown = [...document.querySelectorAll("table.clist th")].filter((h) => box(h).width).map((h) => h.dataset.sort || "");
  eq(shown, ["name", "state", ...(shareOn() ? [""] : []), ""], "Name, State, Share where it is on, and the actions");
  eq(getComputedStyle(document.querySelector("table.clist .cdu")).display !== "none", true, "the count under the name");
  click(document.querySelector('table.clist th[data-sort="name"]'));
  eq([...document.querySelectorAll("table.clist tr.group")].map((r) => r.dataset.cmpopen), ["api", P.name], "sorted");
  drag(document.querySelector('table.clist th[data-sort="name"] .col-resize'), 400);
  inPage("table.clist th, table.clist td, table.clist .pill");
  noSideScroll();
  render();
  inPage("table.clist th, table.clist td");
  noSideScroll();
});
t("Services tab: sorted and resized, only its own box scrolls; Name sticks, Ports reads 19101→9101 +3", () => {
  cmpOpen(P.name);
  click(document.querySelector('[data-cmptab="services"]'));
  click(document.querySelector('table.cmp-svcs th[data-sort="ports"]'));
  eq([...document.querySelectorAll("table.cmp-svcs tbody tr[data-svc]")].map((r) => r.dataset.svc), [names[0], names[1], names[2], names[3]], "lowest port first");
  const wrap = document.querySelector(".cmp-svwrap"), first = document.querySelectorAll("table.cmp-svcs tbody tr")[0];
  eq([getComputedStyle(first.cells[2]).display, first.querySelector(".sub-name .cdp").textContent], ["none", " · 19101→9101 +3"], "Ports gives its room; the first port and how many more sit under the name");
  eq(getComputedStyle(document.querySelector("table.cmp-svcs th")).position, "sticky", "Name sticks");
  noSideScroll();
  wrap.scrollLeft = 120; wrap.dispatchEvent(new Event("scroll"));
  eq(Math.round(box(wrap.querySelector("tbody td")).left) === Math.round(box(wrap).left), true, "Name stays at the start");
  wrap.scrollLeft = 0;
  noSideScroll();
  inPage("#cmp-head, #cmp-tabs");
});
report(R);
