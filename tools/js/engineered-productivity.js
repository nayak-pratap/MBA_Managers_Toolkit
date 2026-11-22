TK.tool({
  slug: "engineered-productivity", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Engineered Productivity (best tool-life window)",
  intro: "Find the tool life for maximum production and for minimum cost, and the cutting speeds that go with them, from your tool-change time, tool cost and machine burden rate.",
  useWhen: "You want a defensible answer to “how fast should we run this tool?” instead of choosing a speed by habit.",
  fields: [
    { k: "n", label: "Tool-life exponent n", unit: "", value: 0.30, step: 0.01, min: 0.02, max: 0.95,
      group: "Tool and machine", hint: "0.15 HSS, 0.2–0.4 carbide, 0.5–0.7 ceramic." },
    { k: "tct", label: "Tool change time", unit: "min", value: 5, step: 0.5, min: 0 },
    { k: "cost", label: "Cost per cutting edge", unit: "$", value: 2.00, step: 0.1, min: 0 },
    { k: "M", label: "Machine burden rate", unit: "$/hour", value: 60, step: 5, min: 0.01 },
    { k: "v1", label: "Known speed", unit: "m/min", value: 250, step: 5, min: 0.01, group: "A cut you have run" },
    { k: "t1", label: "Tool life at that speed", unit: "min", value: 15, step: 0.5, min: 0.01 },
    { k: "tm", label: "Cutting time per part at the known speed", unit: "min", value: 2.40, step: 0.1, min: 0 },
    { k: "tnp", label: "Non-cutting time per part", unit: "min", value: 0.80, step: 0.05, min: 0 }
  ],
  compute: function (v) {
    if (!(v.n > 0 && v.n < 1)) return { error: "The exponent n must be between 0 and 1." };
    if (!(v.v1 > 0 && v.t1 > 0 && v.M > 0)) return { error: "Speed, tool life and burden rate must all be above zero." };
    var k = 1 / v.n - 1;
    var m = v.M / 60;                       // $ per minute
    var Tp = k * v.tct;                     // tool life for maximum production
    var Tc = k * (v.cost / m + v.tct);      // tool life for minimum cost
    var C = v.v1 * Math.pow(v.t1, v.n);
    var Vp = C / Math.pow(Tp, v.n);         // speed at Tp (the faster end)
    var Vc = C / Math.pow(Tc, v.n);         // speed at Tc (the cheaper end)

    // cost and output at any speed, scaling cutting time inversely with speed
    function at(V) {
      var tm = v.tm * v.v1 / V, T = Math.pow(C / V, 1 / v.n);
      var edges = tm / T;
      var cost = m * (tm + v.tnp) + edges * (m * v.tct + v.cost);
      var cycle = tm + v.tnp + edges * v.tct;
      return { V: V, T: T, cost: cost, pph: 60 / cycle, tm: tm };
    }
    var aC = at(Vc), aP = at(Vp), aK = at(v.v1);
    var inRange = v.v1 >= Math.min(Vc, Vp) - 0.5 && v.v1 <= Math.max(Vc, Vp) + 0.5;

    var pts = [], lo = Math.min(Vc, Vp) * 0.6, hi = Math.max(Vc, Vp) * 1.35;
    for (var i = 0; i <= 40; i++) { var V = lo + (hi - lo) * i / 40; pts.push([V, at(V).cost]); }

    return {
      verdict: { state: inRange ? "good" : "warn", html:
        "Run between <b>" + TK.n(Math.min(Vc, Vp), 0) + "</b> and <b>" + TK.n(Math.max(Vc, Vp), 0) +
        " m/min</b>, which means a tool life of about <b>" + TK.n(Math.min(Tp, Tc), 1) + "–" + TK.n(Math.max(Tp, Tc), 1) +
        " min</b>. Below that you pay for slow production, above it you pay for tool changes." +
        (inRange ? "" : " Your known speed of " + TK.n(v.v1, 0) + " m/min sits outside that window.") },
      results: [
        { label: "Tool life for maximum production (Tp)", value: TK.n(Tp, 1), unit: "min", big: true },
        { label: "Tool life for minimum cost (Tc)", value: TK.n(Tc, 1), unit: "min", big: true },
        { label: "EP speed range", value: TK.n(Math.min(Vc, Vp), 0) + " to " + TK.n(Math.max(Vc, Vp), 0), unit: "m/min" },
        { label: "Your known speed", value: TK.n(v.v1, 0), unit: "m/min", state: inRange ? "good" : "warn",
          note: inRange ? "Inside the EP range." : "Outside the EP range." },
        { label: "Cost per part at your speed", value: TK.n(aK.cost, 3), unit: "$" },
        { label: "Cost penalty vs the cheapest speed", value: TK.n((aK.cost / aC.cost - 1) * 100, 1), unit: "%",
          note: "The curve is flat near the minimum." }
      ],
      tables: [{
        title: "Compare the three speeds",
        head: ["Speed", "m/min", "Tool life (min)", "Cost per part ($)", "Parts per hour"],
        rows: [
          { cells: ["Minimum cost", TK.n(aC.V, 0), TK.n(aC.T, 1), TK.n(aC.cost, 3), TK.n(aC.pph, 1)] },
          { cells: ["Maximum production", TK.n(aP.V, 0), TK.n(aP.T, 1), TK.n(aP.cost, 3), TK.n(aP.pph, 1)] },
          { cls: "hl", cells: ["Your known speed", TK.n(aK.V, 0), TK.n(aK.T, 1), TK.n(aK.cost, 3), TK.n(aK.pph, 1)] }
        ]
      }],
      charts: [TK.line({
        series: [{ pts: pts }],
        markers: [{ x: Vc, label: "min cost" }, { x: Vp, label: "max output" }],
        xLabel: "Cutting speed (m/min)", yLabel: "Cost per part ($)",
        title: "Cost per part against cutting speed",
        caption: "The curve is flat between the two lines. That flat zone is the Engineered Productivity range."
      })],
      notes: ["Both tool lives depend only on n, tool-change time, edge cost and burden rate. They do not depend on the part.",
              "Because the curve is flat near the minimum, you can favour output or tool cost with little penalty."]
    };
  },
  howRead: [
    "<b>Tp</b> (maximum production) is the shortest sensible tool life. Faster than this, tool changes steal more time than the speed gains.",
    "<b>Tc</b> (minimum cost) is longer because it also counts the cost of the edge.",
    "A cheaper edge or a higher burden rate pushes the best speed up; a longer tool change pushes it down."
  ],
  formulas: ["Tp = (1/n − 1)·TCT", "Tc = (1/n − 1)·(t/M + TCT)   with t/M in minutes (edge cost ÷ burden rate per minute)",
             "Cost per part = M·(tm + tnp) + (tm/T)·(M·TCT + t)", "V = C / Tⁿ,  C = V₁·T₁ⁿ"],
  watch: [
    "If your real tool change is 5 min but the tool is only checked at the end of a batch, count the true downtime.",
    "Using long tool life because “inserts are expensive” often raises the total cost per part.",
    "A very long tool life can also mean the speed is too low to cover the machine burden rate."
  ],
  source: ["<i>In Cut Optimization – Establishing Operating Conditions</i> (cutting-tool training deck). The Tp and Tc formulas are taken from that deck and reproduce its published chart — for example 11.67 min for a 5 min tool change at n = 0.30."]
});
