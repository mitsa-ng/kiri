// parity: macos windows linux
// lang: fr
// window: 760x520
// Compose fits its header to the window (cmpHeadFit: icons, tight, wrapped). Those classes are its own:
// after a visit to Compose, Containers', Images' and Volumes' toolbars are as tall as on a fresh load.
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const svc = (name) => ({ name, image: `registry.example.com/team/${name}:2026.11.16`, build: "", ports: ["8080:80"], volumes: [], depends: [], networks: ["default"], kinds: [] });
const P = { name: "customer-analytics-platform", dir: "/w/c", files: ["/w/c/compose.yaml"], readable: true, services: [svc("web"), svc("db")], containers: [] };
ui.vm = "running";
kiri.on({ type: "lists", containers: [{ Id: "c1", Names: ["/web"], Image: "nginx", State: "running", Status: "Up", Created: 1, Ports: [], Labels: {} }], images: [{ Id: "sha256:1", RepoTags: ["nginx:latest"], Size: 1, Created: 1 }], volumes: [{ Name: "data", Driver: "local", Mountpoint: "/v" }], networks: [] });
kiri.on({ type: "composeprojects", logos: {}, projects: [P, { ...P, name: "api" }] });
const bar = () => $("hright").parentElement;
const heights = () => ["containers", "images", "volumes"].map((v) => { show(v); render(); return [v, Math.round(bar().getBoundingClientRect().height), bar().className]; });
const fresh = heights();
t("after Compose, the other views' toolbars are as on a fresh load", () => {
  show("compose"); render();
  dispatchEvent(new Event("resize"));
  eq(heights(), fresh, "toolbar heights and classes");
});
report(R);
