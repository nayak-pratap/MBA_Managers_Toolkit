TK.tool({
  slug: "reliability", parent: "engineering-tools.html", parentLabel: "Engineering",
  label: "Engineering calculator", title: "Reliability, MTBF, MTTR and availability",
  intro: "Compute failure rate, MTBF, availability and the probability a machine survives a mission time, for single items or series and parallel systems.",
  useWhen: "You are setting a maintenance interval, justifying a spare, or quoting uptime for a machine or line.",
  fields: [
    { k: "hours", label: "Operating hours", unit: "h", value: 4000, step: 100, min: 0.01, group: "History" },
    { k: "fails", label: "Number of failures", unit: "", value: 5, step: 1, min: 0.0001 },
    { k: "repair", label: "Total repair time", unit: "h", value: 30, step: 1, min: 0 },
    { k: "mission", label: "Mission time", unit: "h", value: 200, step: 10, min: 0, group: "The question" },
    { k: "layout", label: "System layout", type: "sel", value: "series",
      options: [{ v: "series", t: "Series (all must work)" }, { v: "parallel", t: "Parallel (any one works)" }] },
    { k: "comps", label: "Component reliabilities (0 to 1)", type: "textarea", wide: true, rows: 4,
      value: "Unit A, 0.95\nUnit B, 0.98\nUnit C, 0.99",
      hint: "One per line: <b>name, reliability</b>." }
  ],
  compute: function (v) {
    if (!(v.hours > 0) || !(v.fails > 0)) return { error: "Operating hours and the number of failures must both be above zero." };
    var mtbf = v.hours / v.fails;
    var mttr = v.repair / v.fails;
    var avail = mtbf / (mtbf + mttr) * 100;
    var lambda = v.fails / v.hours;
    var R = Math.exp(-v.mission / mtbf) * 100;

    var rows = TK.rows(v.comps, 2), comps = [], sysR = null;
    for (var i = 0; i < rows.length; i++) {
      var r = TK.num(rows[i][1]);
      if (!TK.isNum(r) || r < 0 || r > 1) return { error: 'Line ' + (i + 1) + ' needs a reliability between 0 and 1.' };
      comps.push({ name: rows[i][0], R: r });
    }
    if (comps.length) {
      if (v.layout === "series") { sysR = 1; comps.forEach(function (c) { sysR *= c.R; }); }
      else { var q = 1; comps.forEach(function (c) { q *= (1 - c.R); }); sysR = 1 - q; }
      sysR *= 100;
    }

    var pts = [];
    for (var t = 0; t <= 40; t++) { var tt = mtbf * 3 * t / 40; pts.push([tt, Math.exp(-tt / mtbf) * 100]); }

    var st = avail >= 99 ? "good" : avail >= 95 ? "warn" : "bad";
    var res = [
      { label: "MTBF", value: TK.n(mtbf, 0), unit: "h", big: true },
      { label: "MTTR", value: TK.n(mttr, 1), unit: "h", big: true },
      { label: "Availability", value: TK.n(avail, 2), unit: "%", big: true, state: st },
      { label: "Failure rate λ", value: TK.n(lambda * 1000, 2), unit: "per 1,000 h" },
      { label: "Reliability over " + TK.n(v.mission, 0) + " h", value: TK.n(R, 1), unit: "%",
        state: R >= 90 ? "good" : R >= 70 ? "warn" : "bad" }
    ];
    if (sysR !== null) res.push({ label: "System reliability (" + (v.layout === "series" ? "series" : "parallel") + ")",
      value: TK.n(sysR, 2), unit: "%", state: sysR >= 95 ? "good" : sysR >= 85 ? "warn" : "bad",
      note: comps.length + (v.layout === "series" ? " units, all must work." : " units, any one works.") });

    return {
      verdict: { state: st, html: "MTBF <b>" + TK.n(mtbf, 0) + " h</b> with repairs averaging <b>" +
        TK.n(mttr, 1) + " h</b> gives availability of <b>" + TK.n(avail, 2) + "%</b>. Over a " +
        TK.n(v.mission, 0) + " h mission about <b>" + TK.n(R, 1) + "%</b> survive without a failure." },
      results: res,
      tables: comps.length ? [{
        title: "Component contribution",
        head: ["Unit", "Reliability", "Unreliability", "Effect on the system"],
        rows: comps.map(function (c) {
          var without = 1;
          if (v.layout === "series") { comps.forEach(function (o) { if (o !== c) without *= o.R; }); }
          else { var q = 1; comps.forEach(function (o) { if (o !== c) q *= (1 - o.R); }); without = 1 - q; }
          return { cells: [TK.esc(c.name), TK.n(c.R * 100, 2) + "%", TK.n((1 - c.R) * 100, 2) + "%",
            "system would be " + TK.n(without * 100, 2) + "% without it"] };
        })
      }] : [],
      charts: [TK.line({
        series: [{ pts: pts }], points: [{ x: v.mission, y: R, label: "mission" }],
        markers: [{ x: mtbf, label: "MTBF" }],
        xLabel: "Time (h)", yLabel: "Reliability (%)", yZero: true, yMax: 100,
        title: "Reliability against time",
        caption: "At MTBF only about 37% survive — MTBF is an average, not a guaranteed life."
      })],
      notes: ["Availability improves by lengthening MTBF or shortening MTTR. Repair speed is often the cheaper lever.",
              "In series, the weakest unit dominates. In parallel, redundancy pays off fastest on the weakest unit."]
    };
  },
  howRead: [
    "MTBF is not a guaranteed life. At MTBF only about <b>37%</b> survive.",
    "Availability improves by lengthening MTBF or shortening MTTR; repair speed is often the cheaper lever.",
    "In series the weakest unit sets the system. Adding redundancy to the weakest unit buys the most."
  ],
  formulas: ["MTBF = operating hours / failures", "MTTR = repair hours / failures", "A = MTBF / (MTBF + MTTR)",
             "R(t) = e^(−t/MTBF)", "Series: R = Π Rᵢ;  Parallel: R = 1 − Π(1 − Rᵢ)"],
  watch: ["Count only failures in the same operating context and with a consistent definition of “failure”.",
          "Wear-out failures do not follow a constant rate, so the exponential model understates late-life risk.",
          "A handful of failures gives a very wide confidence interval on MTBF."],
  source: ["<i>Montgomery and Runger</i>, reliability and the exponential model; standard maintenance-engineering practice. Default values are illustrative."]
});
