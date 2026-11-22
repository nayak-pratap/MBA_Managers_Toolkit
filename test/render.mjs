/* Loads every calculator page in a real DOM and checks it renders, computes,
   responds to input, and survives hostile values. Usage: node test/render.mjs [slug] */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(import.meta.dirname, "..");
const filter = process.argv[2] || "";
const slugs = readdirSync(path.join(ROOT, "tools", "js")).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3));

let pass = 0; const fails = [];

for (const slug of slugs) {
  if (filter && slug !== filter) continue;
  const problems = [];
  try {
    const html = readFileSync(path.join(ROOT, "tools", `${slug}.html`), "utf8");
    const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.test/tools/" });
    const { window } = dom;
    window.eval(readFileSync(path.join(ROOT, "tools", "tk.js"), "utf8"));
    window.eval(readFileSync(path.join(ROOT, "tools", "js", `${slug}.js`), "utf8"));
    const d = window.document;

    // 1. the shell replaced the mount point
    if (d.getElementById("tk-root")) problems.push("#tk-root was not replaced by the shell");
    if (!d.querySelector("h1.sub-title")) problems.push("no page heading rendered");
    const form = d.getElementById("tk-f"), out = d.getElementById("tk-out");
    if (!form) problems.push("no form rendered");
    if (!out) problems.push("no output container rendered");

    if (form && out) {
      // 2. every field rendered, and every visible field has a label
      const inputs = form.querySelectorAll("input,select,textarea");
      if (!inputs.length) problems.push("no inputs rendered");
      for (const el of inputs) {
        const id = el.getAttribute("id");
        if (!id || !form.querySelector(`label[for="${id}"]`)) problems.push(`input ${id || "(no id)"} has no label`);
      }
      // 3. results actually rendered from the default example
      const res = out.querySelectorAll(".res");
      if (!res.length) problems.push("no result cards rendered for the default example");
      if (out.querySelector(".tk-err")) problems.push("default example produced an error: " + out.querySelector(".tk-err").textContent.trim().slice(0, 80));
      for (const r of res) {
        const val = r.querySelector(".rv");
        if (!val || !val.textContent.trim()) problems.push("a result card rendered with no value");
        if (val && /NaN|undefined|Infinity/.test(val.textContent)) problems.push(`result "${(r.querySelector(".rl")||{}).textContent}" shows ${val.textContent.trim()}`);
      }
      // 4. charts, if any, are well-formed SVG
      for (const svg of out.querySelectorAll("svg.chart")) {
        if (/NaN|Infinity|undefined/.test(svg.innerHTML)) problems.push("a chart contains NaN/Infinity in its geometry");
        if (!svg.getAttribute("viewBox")) problems.push("a chart has no viewBox");
      }
      // 5. live recompute: nudge the first number field. Either the results change, or the tool
      //    rejects the new combination with a readable message — both are correct behaviour.
      const num = form.querySelector('input[type="number"]');
      if (num) {
        const before = out.innerHTML;
        num.value = String((parseFloat(num.value) || 1) * 1.37 + 1.7);
        form.dispatchEvent(new window.Event("input", { bubbles: true }));
        const err = out.querySelector(".tk-err");
        if (err) {
          const msg = err.textContent.trim();
          if (msg.length < 20) problems.push("rejected a plausible input with too terse a message: " + msg);
          if (/NaN|Infinity/.test(msg)) problems.push("an error message contained NaN/Infinity");
        } else if (out.innerHTML === before) {
          problems.push("changing an input neither changed the results nor raised an error");
        }
      }
      // 6. hostile values must not crash, hang, or print NaN in a rendered value
      const badToken = (el) => /NaN|Infinity|undefined/.test(el.textContent || "");
      for (const bad of ["0", "-1", "", "1e9", "abc"]) {
        for (const el of form.querySelectorAll('input[type="number"]')) el.value = bad;
        form.dispatchEvent(new window.Event("input", { bubbles: true }));
        if (!out.innerHTML.trim()) { problems.push(`inputs all "${bad}" rendered nothing at all`); continue; }
        // only rendered values and table cells count — explanatory prose may legitimately use these words
        for (const el of out.querySelectorAll(".rv, .rn, .tbl td, .tbl th")) {
          if (badToken(el)) { problems.push(`inputs all "${bad}" rendered "${el.textContent.trim().slice(0, 40)}"`); break; }
        }
        for (const svg of out.querySelectorAll("svg.chart")) {
          if (/NaN|Infinity/.test(svg.innerHTML)) { problems.push(`inputs all "${bad}" produced a chart with NaN geometry`); break; }
        }
      }
      // 7. buttons exist and the reset restores a clean state
      if (!d.getElementById("tk-reset")) problems.push("no reset button");
      else {
        d.getElementById("tk-reset").dispatchEvent(new window.Event("click", { bubbles: true }));
        if (out.querySelector(".tk-err")) problems.push("reset left the calculator in an error state");
        if (!out.querySelectorAll(".res").length) problems.push("reset produced no results");
      }
    }
  } catch (e) {
    problems.push("threw: " + e.message);
  }
  if (problems.length) fails.push([slug, problems]);
  else { pass++; console.log(`  PASS  ${slug}`); }
}

if (fails.length) {
  console.log("\nFAILURES");
  for (const [slug, ps] of fails) { console.log(`  FAIL  ${slug}`); ps.forEach(p => console.log("          - " + p)); }
}
console.log(`\nrendered ${pass + fails.length}   pass ${pass}   fail ${fails.length}`);
process.exit(fails.length ? 1 : 0);
