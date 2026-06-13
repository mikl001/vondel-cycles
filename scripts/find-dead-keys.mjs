// Dev helper: list message keys with no apparent reference in src.
//
// HEURISTIC, not a rigorous gate: a key is treated as "alive" if its LEAF
// segment appears as a token boundary anywhere in concatenated src, and whole
// dynamic groups (statuses/options/errors/sort/pagination) are skipped because
// they are read via t(`group.${x}`). So a genuinely-dead key whose leaf happens
// to collide with unrelated code (save/total/free/vat) can be a false negative.
// Use it to surface candidates, then confirm each by hand before deleting.
import fs from "node:fs";

const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const leaves = [];
(function walk(o, p) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    const np = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") walk(v, np);
    else leaves.push(np);
  }
})(en, "");

let src = "";
(function rd(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = `${d}/${e.name}`;
    if (e.isDirectory()) {
      if (e.name !== "node_modules" && e.name !== ".next") rd(f);
    } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
      src += fs.readFileSync(f, "utf8");
    }
  }
})("src");

const dynamicGroups = /\.(statuses|options|errors|sort|pagination)\./;
const dead = [];
for (const path of leaves) {
  if (dynamicGroups.test(`.${path}.`)) continue; // referenced via dynamic key
  const leaf = path.split(".").pop();
  // used if the leaf segment appears as a token boundary in src
  const re = new RegExp(`["'\`.]${leaf.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`(]`);
  if (!re.test(src)) dead.push(path);
}
console.log(`candidate dead keys (${dead.length}):`);
for (const d of dead) console.log(`  ${d}`);
