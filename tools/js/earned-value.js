TK.tool({
  slug: "earned-value", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "Earned value: cost and schedule performance",
  intro: "Compare planned value, earned value and actual cost to get SPI, CPI and a forecast of the final cost and finish.",
  useWhen: "A project is mid-flight and you need an honest, numeric answer on whether it will land on budget and on time.",
  fields: [
    { k: "bac", label: "Budget at completion (BAC)", unit: "$", value: 500000, step: 1000, min: 0.01, group: "The plan" },
    { k: "plan", label: "Planned % complete", unit: "%", value: 60.00, step: 1, min: 0, max: 100 },
    { k: "act", label: "Actual % complete", unit: "%", value: 50.00, step: 1, min: 0, max: 100, group: "Where you are" },
    { k: "ac", label: "Actual cost to date (AC)", unit: "$", value: 330000, step: 1000, min: 0 },
    { k: "dur", label: "Planned duration", unit: "months", value: 10.00, step: 1, min: 0.01, group: "Time" },
    { k: "elapsed", label: "Time elapsed", unit: "months", value: 6.00, step: 1, min: 0 }
  ],
  compute: function (v) {
    if (!(v.bac > 0)) return { error: "The budget at completion must be above zero." };
    var PV = v.bac * v.plan / 100, EV = v.bac * v.act / 100;
    if (!(v.ac > 0)) return { error: "Enter the actual cost to date." };
    var CPI = EV / v.ac, SPI = PV > 0 ? EV / PV : NaN;
    var CV = EV - v.ac, SV = EV - PV;
    var EAC = CPI > 0 ? v.bac / CPI : NaN;
    var ETC = EAC - v.ac, VAC = EAC - v.bac;
    var fdur = TK.isNum(SPI) && SPI > 0 ? v.dur / SPI : NaN;
    var TCPI = (v.bac - v.ac) !== 0 ? (v.bac - EV) / (v.bac - v.ac) : NaN;
    var worst = Math.min(CPI, TK.isNum(SPI) ? SPI : 99);
    var st = worst >= 1 ? "good" : worst >= 0.9 ? "warn" : "bad";

    var ptsPV = [], ptsEV = [], ptsAC = [];
    var n = 20;
    for (var i = 0; i <= n; i++) {
      var m = v.dur * i / n;
      ptsPV.push([m, v.bac * Math.min(1, m / v.dur)]);
    }
    if (v.elapsed > 0) {
      ptsEV.push([0, 0]); ptsEV.push([v.elapsed, EV]);
      ptsAC.push([0, 0]); ptsAC.push([v.elapsed, v.ac]);
    }

    return {
      verdict: { state: st, html: "Cost index <b>" + TK.n(CPI, 2) + "</b>, schedule index <b>" +
        (TK.isNum(SPI) ? TK.n(SPI, 2) : "—") + "</b>. At this rate the project ends at <b>$" +
        TK.n(EAC, 0) + "</b> and about <b>" + TK.n(fdur, 1) + " months</b>." +
        (worst < 0.9 ? " That needs a recovery plan, not a watch item." : "") },
      results: [
        { label: "CPI (cost performance)", value: TK.n(CPI, 2), big: true,
          state: CPI >= 1 ? "good" : CPI >= 0.9 ? "warn" : "bad", note: "Above 1 = under budget." },
        { label: "SPI (schedule performance)", value: TK.isNum(SPI) ? TK.n(SPI, 2) : "—", big: true,
          state: SPI >= 1 ? "good" : SPI >= 0.9 ? "warn" : "bad", note: "Above 1 = ahead." },
        { label: "Cost variance", value: TK.n(CV, 0), unit: "$", state: CV >= 0 ? "good" : "bad" },
        { label: "Schedule variance", value: TK.n(SV, 0), unit: "$", state: SV >= 0 ? "good" : "bad" },
        { label: "Forecast cost at completion", value: TK.n(EAC, 0), unit: "$", big: true },
        { label: "Forecast overrun", value: TK.n(VAC, 0), unit: "$", state: VAC <= 0 ? "good" : "bad" },
        { label: "Estimate to complete", value: TK.n(ETC, 0), unit: "$" },
        { label: "Forecast duration", value: TK.n(fdur, 1), unit: "months" },
        { label: "To-complete performance index", value: TK.n(TCPI, 2),
          state: TCPI <= 1.1 ? "good" : "bad",
          note: "Efficiency needed on the remaining work to still hit the original budget." }
      ],
      tables: [{
        title: "The three curves today",
        head: ["Measure", "Value ($)", "What it means"],
        rows: [
          { cells: ["Planned value (PV)", TK.n(PV, 0), "What you planned to have earned by now"] },
          { cells: ["Earned value (EV)", TK.n(EV, 0), "What the completed work was budgeted at"] },
          { cells: ["Actual cost (AC)", TK.n(v.ac, 0), "What you have actually spent"] },
          { cls: "hl", cells: ["<b>Budget (BAC)</b>", "<b>" + TK.n(v.bac, 0) + "</b>", "The original total budget"] }
        ]
      }],
      charts: [TK.line({
        series: [{ pts: ptsPV, color: "var(--blue-dim)" },
                 { pts: ptsEV, color: "var(--blue)" },
                 { pts: ptsAC, color: "var(--copper)", dash: true }],
        markers: [{ x: v.elapsed, label: "today" }],
        xLabel: "Months", yLabel: "Cumulative value ($)", yZero: true,
        title: "Planned value, earned value and actual cost",
        caption: "Light blue = planned, solid blue = earned, dashed brown = actual spend. Earned below planned means late; actual above earned means over budget."
      })],
      notes: ["EV needs an honest measure of % complete. “90% done” is the most expensive sentence in project management.",
              "A TCPI above about 1.1 means the original budget is no longer realistic — reset it rather than promising it."]
    };
  },
  howRead: [
    "CPI and SPI below about 0.9 usually need a recovery plan.",
    "A TCPI well above 1.1 means the original budget is no longer realistic.",
    "CPI is the more stable of the two indices; SPI in money terms gets unreliable near the end."
  ],
  formulas: ["PV = BAC·planned%;  EV = BAC·actual%", "CPI = EV/AC;  SPI = EV/PV",
             "EAC = BAC/CPI;  ETC = EAC − AC", "TCPI = (BAC − EV)/(BAC − AC)"],
  watch: ["EV needs an honest measure of % complete; “90% done” is often optimistic.",
          "SPI in money terms becomes unreliable near the project end, because it returns to 1 whatever happens.",
          "EAC = BAC/CPI assumes past cost performance continues; use a bottom-up estimate if the work changes character."],
  source: ["PMI earned-value method (PMBOK); IIM Sirmaur project-management coursework. Default values are illustrative."]
});
