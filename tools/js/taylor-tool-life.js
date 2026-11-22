TK.tool({
  slug: "taylor-tool-life", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Tool life (Taylor equation)",
  intro: "Predict how tool life changes with cutting speed, find the speed for a target life, or work out your own tool-life exponent from two tests.",
  useWhen: "A customer wants more productivity, a new grade is being compared, or you must explain why a small speed increase shortens tool life a lot.",
  fields: [
    { k: "mode", label: "What do you want to find?", type: "sel", value: "life", wide: true,
      options: [{ v: "life", t: "Tool life at a new speed" }, { v: "speed", t: "Speed for a target tool life" },
                { v: "expo", t: "The exponent n from two tests" }] },
    { k: "n", label: "Tool-life exponent n", unit: "", value: 0.30, step: 0.01, min: 0.01, max: 0.95,
      group: "Reference test", hint: "About 0.15 for HSS, 0.2–0.4 for carbide, 0.5–0.7 for ceramic.",
      show: function (v) { return v.mode !== "expo"; } },
    { k: "v1", label: "Reference cutting speed", unit: "m/min", value: 250, step: 5, min: 0 },
    { k: "t1", label: "Tool life at the reference speed", unit: "min", value: 15, step: 0.5, min: 0 },
    { k: "v2", label: "New cutting speed", unit: "m/min", value: 300, step: 5, min: 0, group: "What you are asking",
      show: function (v) { return v.mode === "life"; } },
    { k: "tTarget", label: "Target tool life", unit: "min", value: 30, step: 1, min: 0,
      show: function (v) { return v.mode === "speed"; } },
    { k: "v2e", label: "Second test: cutting speed", unit: "m/min", value: 300, step: 5, min: 0,
      group: "Second test", show: function (v) { return v.mode === "expo"; } },
    { k: "t2e", label: "Second test: tool life", unit: "min", value: 8.2, step: 0.1, min: 0,
      show: function (v) { return v.mode === "expo"; } }
  ],
  compute: function (v) {
    if (!(v.v1 > 0) || !(v.t1 > 0)) return { error: "The reference speed and tool life must both be above zero." };

    if (v.mode === "expo") {
      if (!(v.v2e > 0) || !(v.t2e > 0)) return { error: "Both second-test values must be above zero." };
      if (v.v2e === v.v1 || v.t2e === v.t1) return { error: "The two tests must use different speeds and give different lives." };
      var nn = Math.log(v.v1 / v.v2e) / Math.log(v.t2e / v.t1);
      var CC = v.v1 * Math.pow(v.t1, nn);
      var kind = nn < 0.18 ? "in the HSS range" : nn < 0.45 ? "in the carbide range" : "in the ceramic range";
      return {
        verdict: { state: nn > 0 ? "good" : "bad", html: nn > 0
          ? "Your exponent is <b>n = " + TK.n(nn, 3) + "</b>, " + kind + ". Every +10% in speed costs about <b>" +
            TK.n((1 - Math.pow(1.1, -1 / nn)) * 100, 0) + "%</b> of the life."
          : "These two tests give a negative exponent, which means the longer life came at the higher speed. Check the data." },
        results: [
          { label: "Tool-life exponent n", value: TK.n(nn, 3), big: true, state: nn > 0 ? "good" : "bad" },
          { label: "Constant C (V·Tⁿ)", value: TK.n(CC, 0), big: true },
          { label: "Life change for +10% speed", value: TK.n((Math.pow(1.1, -1 / nn) - 1) * 100, 0), unit: "%" }
        ],
        charts: [curve(CC, nn, [{ x: v.v1, y: v.t1, label: "test 1" }, { x: v.v2e, y: v.t2e, label: "test 2" }])],
        notes: ["Both tests must use the same wear limit, work material, grade, geometry, feed and depth."]
      };
    }

    var C = v.v1 * Math.pow(v.t1, v.n);
    if (v.mode === "speed") {
      if (!(v.tTarget > 0)) return { error: "Enter a target tool life above zero." };
      var vNew = C / Math.pow(v.tTarget, v.n);
      var dV = (vNew / v.v1 - 1) * 100;
      return {
        verdict: { state: dV >= 0 ? "good" : "warn", html: "For a tool life of <b>" + TK.n(v.tTarget, 1) +
          " min</b> run at <b>" + TK.n(vNew, 0) + " m/min</b>, which is " + (dV >= 0 ? "+" : "") + TK.n(dV, 1) +
          "% against your reference speed." },
        results: [
          { label: "Speed for " + TK.n(v.tTarget, 1) + " min life", value: TK.n(vNew, 0), unit: "m/min", big: true,
            state: dV >= 0 ? "good" : "warn" },
          { label: "Change vs reference speed", value: (dV >= 0 ? "+" : "") + TK.n(dV, 1), unit: "%" },
          { label: "Constant C (V·Tⁿ)", value: TK.n(C, 0) }
        ],
        charts: [curve(C, v.n, [{ x: v.v1, y: v.t1, label: "reference" }, { x: vNew, y: v.tTarget, label: "target" }])],
        notes: ["n and C hold for one work material, grade, geometry, feed and depth only."]
      };
    }

    if (!(v.v2 > 0)) return { error: "Enter a new cutting speed above zero." };
    var t2 = v.t1 * Math.pow(v.v1 / v.v2, 1 / v.n);
    var chg = (t2 / v.t1 - 1) * 100;
    var st = chg < -30 ? "warn" : chg < 0 ? "" : "good";
    return {
      verdict: { state: st === "warn" ? "warn" : st === "good" ? "good" : "", html:
        "At <b>" + TK.n(v.v2, 0) + " m/min</b> the edge should last about <b>" + TK.n(t2, 1) +
        " min</b>, a change of <b>" + (chg >= 0 ? "+" : "") + TK.n(chg, 0) + "%</b> against " + TK.n(v.t1, 1) + " min." },
      results: [
        { label: "Tool life at " + TK.n(v.v2, 0) + " m/min", value: TK.n(t2, 1), unit: "min", big: true, state: st },
        { label: "Change vs reference", value: (chg >= 0 ? "+" : "") + TK.n(chg, 0), unit: "%" },
        { label: "Constant C (V·Tⁿ)", value: TK.n(C, 0) },
        { label: "Metal cut per edge", value: TK.n(v.v2 * t2, 0), unit: "m of cut",
          note: "Against " + TK.n(v.v1 * v.t1, 0) + " m at the reference speed." }
      ],
      charts: [curve(C, v.n, [{ x: v.v1, y: v.t1, label: "reference" }, { x: v.v2, y: t2, label: "new" }])],
      notes: ["Rule of thumb for n = " + TK.n(v.n, 2) + ": every +10% in speed cuts life by about <b>" +
        TK.n((1 - Math.pow(1.1, -1 / v.n)) * 100, 0) + "%</b>.",
        "If metal cut per edge goes <b>down</b>, the faster speed made the edge less efficient, not more."]
    };
  },
  howRead: [
    "A <b>steep drop</b> in the chart means speed is an expensive lever for that grade.",
    "Check metal cut per edge: if it goes <b>down</b>, you made the tool less efficient.",
    "The exponent n is the key number. A higher n means life is less sensitive to speed."
  ],
  formulas: ["V·Tⁿ = C   (Taylor)", "T₂ = T₁·(V₁/V₂)^(1/n)", "V = C / Tⁿ",
             "n = ln(V₁/V₂) / ln(T₂/T₁)", "Life change for a speed change: (1 + Δ)^(−1/n)"],
  watch: [
    "Tool life must be defined by the same wear limit in every test, for example 0.3 mm flank wear.",
    "n and C are valid only for one work material, grade, geometry, feed and depth.",
    "The rule that a speed change changes life by about twice as much holds when n is near 0.5. For carbide at n = 0.3 the effect is about 3.3×."
  ],
  source: ["<i>In Cut Optimization – Establishing Operating Conditions</i> (cutting-tool training deck).",
           "M. C. Shaw, <i>Tool Life</i>, and <i>Metal Cutting</i> (Trent). Default n = 0.30 is a typical carbide value."]
});

/* Taylor curve: life against speed, with the given points marked. */
function curve(C, n, pts) {
  var xs = pts.map(function (p) { return p.x; });
  var lo = Math.max(1, Math.min.apply(null, xs) * 0.6), hi = Math.max.apply(null, xs) * 1.6;
  var series = [];
  for (var i = 0; i <= 40; i++) {
    var V = lo + (hi - lo) * i / 40;
    series.push([V, Math.pow(C / V, 1 / n)]);
  }
  var cap = Math.max.apply(null, pts.map(function (p) { return p.y; })) * 4;
  return TK.line({
    series: [{ pts: series.filter(function (p) { return p[1] <= cap; }) }],
    points: pts, xLabel: "Cutting speed (m/min)", yLabel: "Tool life (min)", yZero: true,
    title: "Tool life against cutting speed",
    caption: "The curve is steep: a small speed rise costs a large share of the life."
  });
}
