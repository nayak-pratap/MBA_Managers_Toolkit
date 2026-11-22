TK.tool({
  slug: "cost-per-part", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Cost per part: current tool vs proposed tool",
  intro: "Compare two tools or parameter sets on what really matters: total cost per part, parts per hour, and the tool life the new option must reach to still win.",
  useWhen: "A customer asks “is the faster or more expensive insert really cheaper?”, or you need numbers for a trial report.",
  fields: [
    { k: "M", label: "Machine burden rate", unit: "$/hour", value: 60, step: 5, min: 0.01, group: "Shared" },
    { k: "tnp", label: "Non-cutting time per part", unit: "min", value: 0.80, step: 0.05, min: 0 },
    { k: "vol", label: "Parts per year", unit: "", value: 120000, step: 1000, min: 0 },
    { k: "tmA", label: "A: cutting time per part", unit: "min", value: 2.40, step: 0.05, min: 0.001, group: "Option A — current" },
    { k: "TA", label: "A: tool life (edge)", unit: "min", value: 15, step: 0.5, min: 0.001 },
    { k: "cA", label: "A: cost per edge", unit: "$", value: 3.00, step: 0.1, min: 0 },
    { k: "tctA", label: "A: tool change time", unit: "min", value: 2.00, step: 0.1, min: 0 },
    { k: "tmB", label: "B: cutting time per part", unit: "min", value: 1.80, step: 0.05, min: 0.001, group: "Option B — proposed" },
    { k: "TB", label: "B: tool life (edge)", unit: "min", value: 11, step: 0.5, min: 0.001 },
    { k: "cB", label: "B: cost per edge", unit: "$", value: 3.50, step: 0.1, min: 0 },
    { k: "tctB", label: "B: tool change time", unit: "min", value: 2.00, step: 0.1, min: 0 }
  ],
  compute: function (v) {
    if (!(v.M > 0)) return { error: "Enter a machine burden rate above zero." };
    if (!(v.TA > 0 && v.TB > 0)) return { error: "Both tool lives must be above zero." };
    var m = v.M / 60;
    function side(tm, T, c, tct) {
      var edges = tm / T;
      var mach = m * (tm + v.tnp), tcc = m * edges * tct, tool = edges * c;
      var cycle = tm + v.tnp + edges * tct;
      return { edges: edges, mach: mach, tcc: tcc, tool: tool, total: mach + tcc + tool, pph: 60 / cycle };
    }
    var A = side(v.tmA, v.TA, v.cA, v.tctA), B = side(v.tmB, v.TB, v.cB, v.tctB);
    var dPart = A.total - B.total, dYear = dPart * v.vol;
    var gain = (B.pph / A.pph - 1) * 100;
    var denom = A.total - m * (v.tmB + v.tnp);
    var beT = denom > 0 ? v.tmB * (m * v.tctB + v.cB) / denom : NaN;
    var win = dPart > 0, st = win ? "good" : dPart < 0 ? "bad" : "warn";

    return {
      verdict: { state: st, html: win
        ? "Option B is cheaper by <b>$" + TK.n(dPart, 3) + " per part (" + TK.n(dPart / A.total * 100, 1) +
          "%)</b>, about <b>$" + TK.n(dYear, 0) + " a year</b>." +
          (TK.isNum(beT) ? " It still wins as long as its tool life stays above <b>" + TK.n(beT, 1) + " min</b>." : "")
        : "Option B costs <b>$" + TK.n(-dPart, 3) + " more per part</b>, about $" + TK.n(-dYear, 0) +
          " a year. On these numbers the current tool is cheaper." },
      results: [
        { label: win ? "Saving per part" : "Extra cost per part", value: TK.n(Math.abs(dPart), 3), unit: "$", big: true, state: st },
        { label: win ? "Saving per year" : "Extra cost per year", value: TK.n(Math.abs(dYear), 0), unit: "$", big: true, state: st },
        { label: "Output gain", value: TK.n(gain, 1), unit: "% more parts/hour" },
        { label: "Break-even tool life for B", value: TK.isNum(beT) ? TK.n(beT, 1) : "—", unit: "min",
          note: TK.isNum(beT) ? "Compared with " + TK.n(v.TB, 1) + " min measured." : "B cannot break even on machine time alone." }
      ],
      tables: [{
        title: "Cost per part, line by line",
        head: ["", "Option A (current)", "Option B (proposed)", "Difference (B − A)"],
        rows: [
          { cells: ["Edges used per part", TK.n(A.edges, 3), TK.n(B.edges, 3), TK.n(B.edges - A.edges, 3)] },
          { cells: ["Machine time cost ($)", TK.n(A.mach, 3), TK.n(B.mach, 3), TK.n(B.mach - A.mach, 3)] },
          { cells: ["Tool-change downtime cost ($)", TK.n(A.tcc, 3), TK.n(B.tcc, 3), TK.n(B.tcc - A.tcc, 3)] },
          { cells: ["Tool cost ($)", TK.n(A.tool, 3), TK.n(B.tool, 3), TK.n(B.tool - A.tool, 3)] },
          { cls: "hl", cells: ["Total cost per part ($)", TK.n(A.total, 3), TK.n(B.total, 3), TK.n(B.total - A.total, 3)] },
          { cells: ["Parts per hour", TK.n(A.pph, 1), TK.n(B.pph, 1), TK.n(B.pph - A.pph, 1)] }
        ]
      }],
      charts: [TK.bar({
        groups: [
          { label: "Machine time", values: [A.mach, B.mach] },
          { label: "Tool change", values: [A.tcc, B.tcc] },
          { label: "Tool cost", values: [A.tool, B.tool] },
          { label: "Total", values: [A.total, B.total] }
        ],
        seriesLabels: ["A (current)", "B (proposed)"], yLabel: "Cost per part ($)",
        title: "Cost per part by component",
        caption: "Blue = A (current), brown = B (proposed)."
      })],
      notes: ["Machine time cost is only a real saving if the freed machine hours are used or sold. Otherwise count tool cost alone.",
              "The break-even tool life tells you how much B can disappoint in production and still pay off."]
    };
  },
  howRead: [
    "Always compare <b>total cost per part</b>, not tool price or tool life on their own.",
    "The <b>break-even tool life</b> tells you how much the new option can disappoint in production and still pay off.",
    "A higher tool cost per part is fine if the machine-time saving is larger."
  ],
  formulas: ["Edges per part = tm / T", "Machine cost = (M/60)·(tm + tnp)", "Tool-change cost = (M/60)·(tm/T)·TCT",
             "Tool cost = (tm/T)·edge cost",
             "Break-even life of B: T = tmB·(m·TCTB + tB) / (CostA − m·(tmB + tnp)),  m = M/60"],
  watch: ["Use the same wear limit and the same part quality when you measure tool life for A and B.",
          "Do not forget non-cutting time. If it is large, a faster cut saves less than it seems.",
          "Tool life measured in a short trial can be optimistic. Use the break-even figure as your margin."],
  source: ["<i>In Cut Optimization – Establishing Operating Conditions</i> (cutting-tool training deck), and standard machining economics (Kalpakjian and Schmid). Default values are illustrative."]
});
