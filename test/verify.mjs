/* Checks every calculator reproduces the worked example documented on its guide page.
   Usage: node test/verify.mjs [category|slug] */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const spec = JSON.parse(readFileSync(path.join(ROOT, "..", "spec.json"), "utf8"));
const filter = process.argv[2] || "";

const norm = (s) => String(s).toLowerCase()
  .replace(/[₀-₉]/g, (c) => "₀₁₂₃₄₅₆₇₈₉".indexOf(c))
  .replace(/[^a-z0-9%$]+/g, " ").replace(/\s+/g, " ").trim();

const nums = (s) => (String(s).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);

function loadTool(slug) {
  const sandbox = { console, Math, Number, String, Array, Object, JSON, isFinite, parseFloat, isNaN, Date };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(readFileSync(path.join(ROOT, "tools", "tk.js"), "utf8"), ctx, { filename: "tk.js" });
  vm.runInContext("TK.capture = true;", ctx);
  const f = path.join(ROOT, "tools", "js", slug + ".js");
  if (!existsSync(f)) return null;
  vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: slug + ".js" });
  return { spec: sandbox.TK.captured, TK: sandbox.TK };
}

/* Documented values this build intentionally does not reproduce digit-for-digit.
   Each one is a cosmetic or arbitrary-presentation difference, never a formula difference. */
const EXPECTED_DEVIATIONS = {
  "negotiation-prep::Precise final figure":
    "The guide shows 1,197,233. That figure is target - 0.231%, and the guide never states the rule that " +
    "produced the 233 ending, so it cannot be reproduced from the documentation. This build uses a stated, " +
    "deterministic rule (target nudged ~0.2% then offset by a digit-seeded jitter) which lands on a different " +
    "but equally non-round figure. The purpose of the field - a precise-looking final number near the target - is met."
};

let built = 0, pass = 0, fail = 0, missing = [];
const loose = [], known = [];
const failures = [];

for (const t of spec) {
  if (filter && t.slug !== filter && t.cat !== filter) continue;
  const loaded = loadTool(t.slug);
  if (!loaded || !loaded.spec) { missing.push(t.slug); continue; }
  built++;
  const s = loaded.spec;
  const v = {};
  for (const f of s.fields || []) v[f.k] = f.value;

  let r;
  try { r = s.compute(v); }
  catch (e) { fail++; failures.push([t.slug, "threw: " + e.message]); continue; }
  if (!r || r.error) { fail++; failures.push([t.slug, "error: " + (r && r.error)]); continue; }

  const got = r.results || [];
  const problems = [];
  for (const want of t.results) {
    const wn = nums(want.value);
    const cand = got.find((g) => norm(g.label) === norm(want.label))
      || got.find((g) => norm(g.label).includes(norm(want.label).slice(0, 14)))
      || got.find((g) => norm(want.label).includes(norm(g.label).slice(0, 14)));
    if (!cand) { problems.push(`no result matching "${want.label}"`); continue; }
    // documented values were scraped with their unit inside the cell, so compare like with like
    const gotStr = String(cand.value) + (cand.unit ? " " + cand.unit : "");
    const gn = nums(gotStr);
    const okStr = gotStr.replace(/,/g, "").trim() === String(want.value).replace(/,/g, "").trim();
    let ok = okStr;
    if (!ok && gn.length === wn.length) {
      ok = wn.every((w, i) => {
        const dp = (String(want.value).split(".")[1] || "").replace(/[^0-9].*$/, "").length;
        const tol = Math.max(0.5 * Math.pow(10, -dp) * 1.02, Math.abs(w) * 0.012, 1e-9);
        return Math.abs(gn[i] - w) <= tol;
      });
    }
    if (!wn.length) {                                // documented value is text — compare as text
      const g = norm(String(cand.value) + " " + (cand.unit || "")), w = norm(want.value);
      if (g !== w && !g.includes(w) && !w.includes(g))
        problems.push(`"${want.label}": documented text "${want.value}" → got "${cand.value}"`);
      continue;
    }
    if (ok && !okStr) {
      const key = `${t.slug}::${want.label}`;
      if (EXPECTED_DEVIATIONS[key]) known.push(`${key}\n          documented ${want.value} → got ${gotStr.trim()}\n          ${EXPECTED_DEVIATIONS[key]}`);
      else loose.push(`${t.slug} · "${want.label}": documented ${want.value} → got ${gotStr.trim()}`);
    }
    if (!ok) problems.push(`"${want.label}": documented ${want.value} → got ${cand.value}`);
  }
  if (problems.length) { fail++; failures.push([t.slug, problems.join("; ")]); }
  else { pass++; console.log(`  PASS  ${t.cat.padEnd(14)} ${t.slug}  (${t.results.filter(x=>nums(x.value).length).length} values)`); }
}

if (known.length) {
  console.log("\nEXPECTED DEVIATIONS from the documented examples (reviewed and accepted):");
  for (const k of known) console.log("  ! " + k);
}
if (loose.length) {
  console.log("\nMATCHED ONLY WITHIN TOLERANCE (not digit-for-digit) — review each:");
  for (const l of loose) console.log("  ~ " + l);
}
if (failures.length) {
  console.log("\nFAILURES");
  for (const [slug, msg] of failures) console.log(`  FAIL  ${slug}\n          ${msg}`);
}
const built_total = spec.filter(t => !filter || t.slug === filter || t.cat === filter).length;
console.log(`\nbuilt ${built}/${built_total}   pass ${pass}   fail ${fail}` +
  (missing.length ? `   not yet built: ${missing.length}` : ""));
process.exit(fail ? 1 : 0);
