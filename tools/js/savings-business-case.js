TK.tool({
  slug: "savings-business-case", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Customer value case for a better solution",
  intro: "Turn a cycle-time, tool-cost and scrap improvement into yearly savings, payback and a multi-year net present value you can show a customer.",
  useWhen: "You are writing a trial report or a proposal and need a number the customer's finance team will accept.",
  fields: [
    { k: "vol", label: "Parts per year", unit: "", value: 120000, step: 1000, min: 0, group: "The job" },
    { k: "M", label: "Machine burden rate", unit: "$/hour", value: 60, step: 5, min: 0 },
    { k: "oldCycle", label: "Old cycle time", unit: "min", value: 3.52, step: 0.01, min: 0, group: "Cycle time" },
    { k: "newCycle", label: "New cycle time", unit: "min", value: 2.93, step: 0.01, min: 0 },
    { k: "bank", label: "Share of the time saving you can bank", unit: "%", value: 70, step: 5, min: 0, max: 100,
      hint: "Use 100% only if the freed hours are genuinely sold or avoided." },
    { k: "oldTool", label: "Old tool cost per part", unit: "$", value: 0.480, step: 0.01, min: 0, group: "Tooling" },
    { k: "newTool", label: "New tool cost per part", unit: "$", value: 0.570, step: 0.01, min: 0 },
    { k: "oldScrap", label: "Old scrap rate", unit: "%", value: 1.00, step: 0.05, min: 0, max: 100, group: "Quality" },
    { k: "newScrap", label: "New scrap rate", unit: "%", value: 0.800, step: 0.05, min: 0, max: 100 },
    { k: "partCost", label: "Cost of one part lost to scrap", unit: "$", value: 45.00, step: 1, min: 0 },
    { k: "oneTime", label: "One-time cost of the change", unit: "$", value: 18000, step: 500, min: 0, group: "The investment" },
    { k: "years", label: "Years to evaluate", unit: "", value: 3, step: 1, min: 1, max: 15 },
    { k: "disc", label: "Discount rate", unit: "%", value: 10.00, step: 0.5, min: 0, max: 60 }
  ],
  compute: function (v) {
    var timeSave = (v.oldCycle - v.newCycle) / 60 * v.M * v.vol * (v.bank / 100);
    var toolSave = (v.oldTool - v.newTool) * v.vol;
    var scrapSave = (v.oldScrap - v.newScrap) / 100 * v.vol * v.partCost;
    var benefit = timeSave + toolSave + scrapSave;
    var payback = benefit > 0 ? v.oneTime / benefit * 12 : NaN;
    var r = v.disc / 100;
    var YRS_MAX = 50;
    var asked = Math.round(v.years);
    var yrs = TK.isNum(asked) ? TK.clamp(asked, 1, YRS_MAX) : 1;
    var capped = TK.isNum(asked) && asked > YRS_MAX;
    var npv = -v.oneTime;
    for (var t = 1; t <= yrs; t++) npv += benefit / Math.pow(1 + r, t);
    var roi = v.oneTime > 0 ? benefit / v.oneTime * 100 : NaN;
    var good = benefit > 0 && npv > 0;

    var cum = -v.oneTime, pts = [[0, cum]];
    for (var y = 1; y <= yrs; y++) { cum += benefit / Math.pow(1 + r, y); pts.push([y, cum]); }

    return {
      verdict: { state: good ? "good" : "bad", html: good
        ? "Yearly benefit <b>$" + TK.n(benefit, 0) + "</b>, payback in <b>" + TK.n(payback, 1) +
          " months</b>, net present value over " + yrs + " years <b>$" + TK.n(npv, 0) + "</b>."
        : "On these numbers the change does not pay: yearly benefit $" + TK.n(benefit, 0) +
          " and a net present value of $" + TK.n(npv, 0) + " over " + yrs + " years." },
      results: [
        { label: "Yearly benefit", value: TK.n(benefit, 0), unit: "$", big: true, state: benefit > 0 ? "good" : "bad" },
        { label: "Payback", value: TK.isNum(payback) && payback > 0 ? TK.n(payback, 1) : "—", unit: "months" },
        { label: "NPV over " + yrs + " years", value: TK.n(npv, 0), unit: "$", state: npv > 0 ? "good" : "bad",
          note: capped ? "Capped at " + YRS_MAX + " years." : "" },
        { label: "Return on one-time cost (year 1)", value: TK.n(roi, 0), unit: "%" },
        { label: "Benefit per part", value: TK.n(v.vol > 0 ? benefit / v.vol : NaN, 3), unit: "$" }
      ],
      tables: [{
        title: "Where the benefit comes from",
        head: ["Source", "Per year ($)", "Per part ($)"],
        rows: [
          { cells: ["Machine time banked", TK.n(timeSave, 0), TK.n(v.vol ? timeSave / v.vol : NaN, 3)] },
          { cells: ["Tooling", TK.n(toolSave, 0), TK.n(v.vol ? toolSave / v.vol : NaN, 3)] },
          { cells: ["Scrap avoided", TK.n(scrapSave, 0), TK.n(v.vol ? scrapSave / v.vol : NaN, 3)] },
          { cls: "hl", cells: ["<b>Total yearly benefit</b>", "<b>" + TK.n(benefit, 0) + "</b>",
            "<b>" + TK.n(v.vol ? benefit / v.vol : NaN, 3) + "</b>"] }
        ]
      }],
      charts: [TK.line({
        series: [{ pts: pts }],
        xLabel: "Years", yLabel: "Cumulative discounted cash flow ($)",
        title: "Cumulative discounted cash flow",
        caption: "Where the line crosses zero is the discounted payback point."
      })],
      notes: ["Do not use the full machine rate on hours that are not sold or avoided — that is what the banked share is for.",
              "Include the extra tool or holder cost. Leaving it out is the most common mistake in trial reports.",
              "The defaults are synthetic and only show how the tool works."]
    };
  },
  howRead: [
    "<b>Yearly benefit</b> is the headline, but the banked share is the assumption a customer will challenge first.",
    "<b>Payback under 12 months</b> clears most shop-floor approval thresholds without a capital request.",
    "<b>NPV</b> is the number a finance team will ask for. A positive NPV at their own discount rate is the test."
  ],
  formulas: ["Time saving = (old − new cycle)/60 × rate × volume × banked share",
             "Tool saving = (old − new tool cost per part) × volume",
             "Scrap saving = Δscrap rate × volume × part cost",
             "Payback = one-time cost ÷ yearly benefit × 12",
             "NPV = −one-time + Σ benefit/(1 + r)ᵗ"],
  watch: ["Do not use the full machine rate on hours that are not sold or avoided.",
          "Include the extra tool or holder cost; leaving it out is the most common mistake in trial reports.",
          "The defaults are synthetic and only show how the tool works."],
  source: ["Standard capital-budgeting method (NPV and payback) applied to a tooling trial.",
           "<i>In Cut Optimization – Establishing Operating Conditions</i> (cutting-tool training deck) for the cost structure. All default figures are synthetic."]
});
