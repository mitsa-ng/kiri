// window: 760x520
// The room given to names is measured again for a new text size or font, the last 50 levels are kept,
// and a resize's end measures afresh once (a level kept through a drag differs a little from a fresh one).
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const names = ["notification-delivery-worker", "payments-reconciliation-service"];
const P = { name: "customer-analytics-platform", dir: "/w/c", files: ["/w/c/compose.yaml"], readable: true, updated: 1,
  services: names.map((n, i) => ({ name: n, image: `registry.example.com/team/${n}:2026.11.16`, build: "", ports: [`1810${i}:80`], volumes: [], depends: [], networks: ["default"], kinds: [] })),
  containers: names.map((n, i) => ({ service: n, id: "c" + i, name: `customer-analytics-platform-${n}-1`, image: n, state: "running", status: "Up" })) };
ui.vm = "running";
kiri.on({ type: "lists", containers: P.containers.map((c) => ({ Id: c.id, Names: ["/" + c.name], Image: c.image, State: c.state, Status: "Up", Created: 1, Ports: [], Labels: { "com.docker.compose.project": P.name, "com.docker.compose.service": c.service } })), images: [], volumes: [], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: [P] });
show("compose");
t("a new text size or font is measured again", () => {
  cmpGiven.clear();
  cmpGive();
  const n = cmpGiven.size, was = [prefs.scale, prefs.font];
  eq(n, 1, "one level measured");
  prefs.scale = 1.25; cmpGive();
  eq(cmpGiven.size, n + 1, "a level for the new text size");
  prefs.font = "Georgia"; cmpGive();
  eq(cmpGiven.size, n + 2, "a level for the new font");
  [prefs.scale, prefs.font] = was;
});
t("only the last 50 levels are kept, the oldest go", () => {
  cmpGiven.clear();
  for (let i = 0; i < 60; i++) cmpGiven.set("old" + i, { k: 0, short: 0 });
  cmpGive();
  eq(cmpGiven.size, 50, "the cap");
  eq([cmpGiven.has("old0"), cmpGiven.has("old10"), cmpGiven.has("old59")], [false, false, true], "the oldest dropped");
});
cmpGiven.clear();
dispatchEvent(new Event("resize"));
cmpGiven.set("kept through the drag", { k: 0, short: 0 });
setTimeout(() => {
  t("a resize's end measures afresh, once", () => {
    eq(cmpGiven.has("kept through the drag"), false, "the drag's levels cleared");
    eq(cmpGiven.size, 1, "one fresh measure");
  });
  report(R);
}, 700);
