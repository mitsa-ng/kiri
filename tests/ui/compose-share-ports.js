// Share's colour on Compose: yellow only for one published TCP web port Kiri is sure of. A port range, a
// bare container port (no host port of its own), UDP or a database's port stay grey, "It publishes no web port".
const R = [];
const t = (name, fn) => { try { fn(); R.push("PASS " + name); } catch (e) { R.push("FAIL " + name + ": " + e.message); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ": got " + JSON.stringify(a) + " want " + JSON.stringify(b)); };
const up = { State: "running" };
const why = (ports) => cmpShareWhy({ ports, tech: {} }, up);
t("ports are read as Compose writes them", () => {
  eq(cmpPortOf("8080:80"), { protocol: "TCP", port: 8080, targetPort: 80 }, "host:container");
  eq(cmpPortOf("127.0.0.1:8080:80"), { protocol: "TCP", port: 8080, targetPort: 80 }, "ip:host:container");
  eq(cmpPortOf("[::1]:8081:80/tcp"), { protocol: "TCP", port: 8081, targetPort: 80 }, "an IPv6 address, /tcp");
  eq(cmpPortOf("53:53/udp").protocol, "UDP", "/udp");
  eq(Number.isNaN(cmpPortOf("5432").port), true, "a bare port publishes none of its own");
  eq(Number.isNaN(cmpPortOf("8000-8005:8000-8005").port), true, "a range is no one port");
});
t("only one sure web port is yellow", () => {
  for (const p of [["8000-8005:8000-8005"], ["5432"], ["80"], ["53:53/udp"], ["15432:5432"], ["x:80"]]) eq(why(p), "It publishes no web port", JSON.stringify(p));
  for (const p of [["8080:80"], ["127.0.0.1:18090:8080"], ["[::1]:8081:80/tcp"], ["5432", "3000:3000"]]) eq(why(p), "", JSON.stringify(p));
});
report(R);
