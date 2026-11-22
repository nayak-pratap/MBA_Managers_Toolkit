TK.tool({
  slug: "knowledge-reuse", parent: "leadership-tools.html", parentLabel: "Leadership",
  label: "Leadership tool", title: "Value of reusing knowledge (templates, playbooks, lessons)",
  intro: "Estimate the hours and money saved when a team reuses a proven template or playbook instead of starting from scratch.",
  useWhen: "You want to justify the time to build a template, a playbook or a knowledge base, in hours someone recognises.",
  fields: [
    { k: "n", label: "Times the task happens per year", unit: "", value: 40.00, step: 1, min: 0, group: "The task" },
    { k: "scratch", label: "Hours from scratch", unit: "h", value: 12.00, step: 0.5, min: 0 },
    { k: "tpl", label: "Hours with the template", unit: "h", value: 5.00, step: 0.5, min: 0 },
    { k: "adopt", label: "Share of cases that really use it", unit: "%", value: 70.00, step: 5, min: 0, max: 100,
      hint: "Be pessimistic. This is the number that decides the case." },
    { k: "rate", label: "Cost per hour", unit: "$", value: 35.00, step: 1, min: 0, group: "Value" },
    { k: "build", label: "One-time build effort", unit: "h", value: 30.00, step: 1, min: 0, group: "The investment" },
    { k: "maint", label: "Yearly maintenance", unit: "h", value: 8.00, step: 1, min: 0 },
    { k: "quality", label: "Quality benefit: fewer reworks", unit: "h/yr", value: 20.00, step: 1, min: 0 }
  ],
  compute: function (v) {
    var perCase = v.scratch - v.tpl;
    var raw = v.n * (v.adopt / 100) * perCase + v.quality;
    var net = raw - v.maint;
    var value = net * v.rate;
    var payback = net > 0 ? v.build / net * 12 : NaN;
    var firstYear = net - v.build;
    var days = net / 8;
    var st = net > 0 && TK.isNum(payback) && payback <= 12 ? "good" : net > 0 ? "warn" : "bad";

    var pts = [];
    for (var i = 0; i <= 20; i++) {
      var ad = i / 20;
      var nn = v.n * ad * perCase + v.quality - v.maint;
      pts.push([ad * 100, nn]);
    }
    var breakAdopt = perCase > 0 && v.n > 0 ? (v.maint - v.quality) / (v.n * perCase) * 100 : NaN;

    return {
      verdict: { state: st, html: net > 0
        ? "Saves about <b>" + TK.n(net, 0) + " hours a year</b> (≈ $" + TK.n(value, 0) + "). " +
          (TK.isNum(payback) ? "Payback in <b>" + TK.n(payback, 1) + " months</b>." : "")
        : "On these numbers it does not pay: maintenance of " + TK.n(v.maint, 0) +
          " h/yr costs more than the " + TK.n(raw, 0) + " h saved." },
      results: [
        { label: "Hours saved per year", value: TK.n(net, 0), unit: "h", big: true, state: st,
          note: "After " + TK.n(v.maint, 0) + " h of maintenance." },
        { label: "Value per year", value: TK.n(value, 0), unit: "$", big: true },
        { label: "Payback", value: TK.isNum(payback) && payback > 0 ? TK.n(payback, 1) : "—", unit: "months" },
        { label: "First-year net", value: TK.n(firstYear, 0), unit: "h",
          state: firstYear > 0 ? "good" : "warn", note: "After the build effort." },
        { label: "Working days freed per year", value: TK.n(days, 1), unit: "days" },
        { label: "Break-even adoption", value: TK.isNum(breakAdopt) ? TK.n(Math.max(0, breakAdopt), 0) : "—", unit: "%",
          note: "Below this share of cases, it stops paying." }
      ],
      tables: [{
        title: "How sensitive is this to adoption?",
        head: ["Adoption", "Hours saved per year", "Value ($/yr)", "Payback (months)"],
        rows: [25, 50, 70, 85, 100].map(function (a) {
          var nn = v.n * (a / 100) * perCase + v.quality - v.maint;
          return { cls: Math.abs(a - v.adopt) < 3 ? "hl" : "", cells: [a + "%", TK.n(nn, 0), TK.n(nn * v.rate, 0),
            nn > 0 ? TK.n(v.build / nn * 12, 1) : "never"] };
        })
      }],
      charts: [TK.line({
        series: [{ pts: pts }], markers: [{ x: v.adopt, label: "your estimate" }],
        xLabel: "Adoption (% of cases)", yLabel: "Hours saved per year",
        title: "Hours saved against adoption",
        caption: "Adoption is the lever that decides the case. Everything else is secondary."
      })],
      notes: ["Change the adoption share first. If the case only works at 100%, make adoption part of the plan, not an assumption.",
              "Templates need an owner, or they go stale and adoption quietly falls to zero."]
    };
  },
  howRead: [
    "Sensitivity: change the adoption share first. If the case only works at 100%, make adoption part of the plan.",
    "Compare the first-year net with the build effort: a template that pays back inside a year is an easy yes.",
    "Working days freed is usually the number that persuades a manager, more than the dollar value."
  ],
  formulas: ["Saving = n × adoption × (hours scratch − hours template) + quality hours",
             "Net = saving − maintenance", "Payback = build / net × 12"],
  watch: ["Be honest about the time saved: measure it on two real cases.",
          "Templates need an owner or they go stale.",
          "A template that constrains a genuinely varied task will be quietly abandoned."],
  source: ["Nonaka and Takeuchi's SECI model of knowledge creation (combination and internalisation), applied as a simple cost case. Default values are illustrative."]
});
