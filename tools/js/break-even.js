TK.tool({
  slug: "break-even", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "Break-even and make-or-buy",
  intro: "Find the volume where revenue covers cost, or compare two options with different fixed and variable costs.",
  useWhen: "You are deciding whether to insource or outsource, buy a machine, or quote a price at an uncertain volume.",
  fields: [
    { k: "price", label: "Selling price per unit", unit: "$", value: 14.00, step: 0.5, min: 0, group: "Revenue" },
    { k: "FA", label: "A: fixed cost per year", unit: "$", value: 90000, step: 1000, min: 0, group: "Option A — make" },
    { k: "VA", label: "A: variable cost per unit", unit: "$", value: 6.50, step: 0.1, min: 0 },
    { k: "FB", label: "B: fixed cost per year", unit: "$", value: 0, step: 1000, min: 0, group: "Option B — buy" },
    { k: "VB", label: "B: variable cost per unit", unit: "$", value: 9.00, step: 0.1, min: 0 },
    { k: "Q", label: "Expected volume", unit: "units/yr", value: 40000, step: 1000, min: 0, group: "Your expectation" }
  ],
  compute: function (v) {
    var cmA = v.price - v.VA, cmB = v.price - v.VB;
    var beA = cmA > 0 ? v.FA / cmA : NaN, beB = cmB > 0 ? v.FB / cmB : NaN;
    var cross = (v.VB - v.VA) !== 0 ? (v.FA - v.FB) / (v.VB - v.VA) : NaN;
    var mosA = v.Q > 0 && TK.isNum(beA) ? (v.Q - beA) / v.Q * 100 : NaN;
    var pA = cmA * v.Q - v.FA, pB = cmB * v.Q - v.FB;
    var better = pA >= pB ? "A" : "B";
    var st = Math.max(pA, pB) > 0 ? "good" : "bad";

    var ptsA = [], ptsB = [], hi = Math.max(v.Q, TK.isNum(cross) ? cross : 0, TK.isNum(beA) ? beA : 0) * 1.4 || 1;
    for (var i = 0; i <= 40; i++) {
      var q = hi * i / 40;
      ptsA.push([q, cmA * q - v.FA]); ptsB.push([q, cmB * q - v.FB]);
    }

    return {
      verdict: { state: st, html: !TK.isNum(beA) && !TK.isNum(beB)
        ? "Neither option has a positive contribution margin at this price, so neither can break even."
        : "At <b>" + TK.n(v.Q, 0) + " units</b> option <b>" + better + "</b> earns <b>$" +
          TK.n(Math.max(pA, pB), 0) + "</b> against $" + TK.n(Math.min(pA, pB), 0) + " for the other." +
          (TK.isNum(cross) && cross > 0 ? " They cost the same at " + TK.n(cross, 0) + " units." : "") },
      results: [
        { label: "A break-even volume", value: TK.isNum(beA) ? TK.n(beA, 0) : "never", unit: "units", big: true },
        { label: "B break-even volume", value: TK.isNum(beB) ? TK.n(beB, 0) : "never", unit: "units", big: true },
        { label: "A and B cost the same at", value: TK.isNum(cross) && cross >= 0 ? TK.n(cross, 0) : "—", unit: "units",
          note: TK.isNum(cross) && cross >= 0 ? "Above this volume the lower variable cost wins." : "The two never cross." },
        { label: "Margin of safety (A)", value: TK.isNum(mosA) ? TK.n(mosA, 0) : "—", unit: "%",
          state: mosA >= 30 ? "good" : mosA >= 0 ? "warn" : "bad",
          note: "How far volume can fall before A loses money." },
        { label: "Profit A / B at expected volume", value: "$" + TK.n(pA, 0) + " / $" + TK.n(pB, 0), big: true,
          state: st },
        { label: "Contribution margin A / B", value: "$" + TK.n(cmA, 2) + " / $" + TK.n(cmB, 2), unit: "per unit" }
      ],
      tables: [{
        title: "Profit at different volumes",
        head: ["Volume", "A profit ($)", "B profit ($)", "Better"],
        rows: [0.25, 0.5, 0.75, 1, 1.25, 1.5].map(function (m) {
          var q = v.Q * m, a = cmA * q - v.FA, b = cmB * q - v.FB;
          return { cls: m === 1 ? "hl" : "", cells: [TK.n(q, 0), TK.n(a, 0), TK.n(b, 0), a >= b ? "A" : "B"] };
        })
      }],
      charts: [TK.line({
        series: [{ pts: ptsA, color: "var(--blue)" }, { pts: ptsB, color: "var(--copper)", dash: true }],
        markers: TK.isNum(cross) && cross > 0 && cross < hi ? [{ x: cross, label: "crossover" }] : [],
        points: [{ x: v.Q, y: pA, label: "expected" }],
        xLabel: "Volume (units/yr)", yLabel: "Profit ($)",
        title: "Profit against volume for both options",
        caption: "Solid blue = A (make), dashed brown = B (buy). Where each line crosses zero is its break-even point."
      })],
      notes: ["A large fixed cost is fine if you are sure of the volume; otherwise prefer the variable-cost option.",
              "Fixed costs are only fixed within a volume range — a step change in capacity breaks the straight line."]
    };
  },
  howRead: [
    "Margin of safety shows how far volume can fall before losing money.",
    "A large fixed cost is fine if you are sure of the volume; otherwise prefer variable cost.",
    "The crossover volume is the decision point: below it, buy; above it, make."
  ],
  formulas: ["Break-even = Fixed / (Price − Variable)", "Crossover = (F_A − F_B) / (V_B − V_A)",
             "Profit = (Price − V)·Q − F"],
  watch: ["Fixed costs are only fixed within a volume range.",
          "Do not forget quality, lead-time and risk differences in make-or-buy.",
          "Outsourcing also transfers know-how, which no break-even chart prices."],
  source: ["Standard cost-volume-profit analysis; IIM Sirmaur managerial-accounting coursework. Default values are illustrative."]
});
