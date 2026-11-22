TK.tool({
  slug: "kpi-scorecard", parent: "leadership-tools.html", parentLabel: "Leadership",
  label: "Leadership tool", title: "KPI scorecard with traffic lights",
  intro: "Turn a list of KPIs with targets and actuals into a one-page scorecard with weighted overall performance.",
  useWhen: "You run a weekly or monthly review and want one page that shows where to spend the meeting.",
  fields: [
    { k: "kpis", label: "KPIs", type: "textarea", wide: true, rows: 7,
      value: "OEE %, Higher, 80, 74, 30\nFirst-pass yield %, Higher, 98, 97.4, 25\n" +
             "On-time delivery %, Higher, 95, 96, 20\nScrap %, Lower, 1, 1.3, 15\n" +
             "Tool cost per part $, Lower, 0.5, 0.46, 10",
      hint: "One KPI per line: <b>name, Higher or Lower is better, target, actual, weight</b>." },
    { k: "green", label: "Green threshold", unit: "% of target", value: 100.0, step: 1, min: 1, group: "Traffic lights" },
    { k: "amber", label: "Amber threshold", unit: "% of target", value: 90.00, step: 1, min: 1 }
  ],
  compute: function (v) {
    var rows = TK.rows(v.kpis, 5);
    if (!rows.length) return { error: "Enter at least one KPI as <b>name, Higher or Lower, target, actual, weight</b>." };
    var list = [], wsum = 0;
    for (var i = 0; i < rows.length; i++) {
      var dir = /^l/i.test(String(rows[i][1]).trim()) ? "lower" : "higher";
      var tgt = TK.num(rows[i][2]), act = TK.num(rows[i][3]), w = TK.num(rows[i][4]);
      if (!TK.isNum(tgt) || !TK.isNum(act) || !TK.isNum(w))
        return { error: 'KPI "' + TK.esc(rows[i][0]) + '" needs a numeric target, actual and weight.' };
      var perf;
      if (dir === "higher") { if (tgt === 0) return { error: 'KPI "' + TK.esc(rows[i][0]) + '" has a target of zero.' }; perf = act / tgt; }
      else { if (act === 0) return { error: 'KPI "' + TK.esc(rows[i][0]) + '" has an actual of zero, so "lower is better" cannot be scored.' }; perf = tgt / act; }
      var light = perf * 100 >= v.green ? "green" : perf * 100 >= v.amber ? "amber" : "red";
      list.push({ name: rows[i][0], dir: dir, tgt: tgt, act: act, w: w, perf: perf, light: light });
      wsum += w;
    }
    if (!(wsum > 0)) return { error: "The weights add up to zero." };
    var score = list.reduce(function (a, k) { return a + Math.min(k.perf, 1.2) * k.w; }, 0) / wsum * 100;
    var counts = { red: 0, amber: 0, green: 0 };
    list.forEach(function (k) { counts[k.light]++; });
    var st = counts.red ? "bad" : counts.amber ? "warn" : "good";
    var worstW = list.filter(function (k) { return k.light === "red"; })
      .sort(function (a, b) { return b.w - a.w; })[0];

    list.sort(function (a, b) { return a.perf - b.perf; });

    return {
      verdict: { state: st, html: "Weighted score <b>" + TK.n(score, 0) + "%</b>." +
        (counts.red ? " <b>" + counts.red + " red</b>" + (worstW ? ", the heaviest being <b>" + TK.esc(worstW.name) +
          "</b> at " + TK.n(worstW.w, 0) + "% weight — start the meeting there." : ".")
                    : counts.amber ? " Some KPIs are missing target." : " Everything is on or above target.") },
      results: [
        { label: "Weighted score", value: TK.n(score, 0), unit: "% of target", big: true, state: st },
        { label: "Red KPIs", value: String(counts.red), big: true, state: counts.red ? "bad" : "good" },
        { label: "Amber KPIs", value: String(counts.amber), big: true, state: counts.amber ? "warn" : "good" },
        { label: "Green KPIs", value: String(counts.green), big: true, state: "good" },
        { label: "Weakest KPI", value: TK.esc(list[0].name), state: "bad",
          note: TK.n(list[0].perf * 100, 1) + "% of target." },
        { label: "Total weight", value: TK.n(wsum, 0),
          note: wsum === 100 ? "Weights add to 100." : "Weights are normalised to 100 for the score." }
      ],
      tables: [{
        title: "Scorecard",
        head: ["KPI", "Direction", "Target", "Actual", "Performance", "Weight", "Light"],
        rows: list.map(function (k) {
          return { cls: k.light === "red" ? "crit" : k.light === "amber" ? "hl" : "",
            cells: [TK.esc(k.name), k.dir === "higher" ? "Higher better" : "Lower better",
              TK.n(k.tgt, 2), TK.n(k.act, 2), TK.n(k.perf * 100, 1) + "%", TK.n(k.w, 0),
              k.light === "green" ? "green" : k.light === "amber" ? "amber" : "red"] };
        })
      }],
      charts: [TK.bar({
        groups: list.map(function (k) { return { label: String(k.name).split(" ")[0].slice(0, 9), values: [k.perf * 100] }; }),
        yLabel: "% of target",
        title: "Performance against target by KPI",
        caption: "Bars below 100% are missing target. Read them together with the weight column."
      })],
      notes: ["Performance is capped at 120% in the weighted score, so one runaway KPI cannot hide a red one.",
              "Too many KPIs hide the important ones. Five to eight is usually enough."]
    };
  },
  howRead: [
    "Look at the reds first, then the weights: a red KPI with a high weight deserves the next meeting.",
    "A weighted score near 100% with a red KPI inside it means the weights are doing the hiding, not the data.",
    "Performance is capped at 120% so that over-achievement on one measure cannot mask a failure on another."
  ],
  formulas: ["Higher is better: performance = actual / target", "Lower is better: performance = target / actual",
             "Weighted score = Σ min(performance, 120%) × weight"],
  watch: ["Too many KPIs hide the important ones. Aim for five to eight.",
          "Agree definitions before the first review, or you will debate data instead of actions.",
          "Weights are a statement of priority. If everything is weighted equally, nothing is prioritised."],
  source: ["Kaplan and Norton's Balanced Scorecard, simplified to a single weighted operational scorecard. Part of the graded IIM Sirmaur core-frameworks assignment."]
});
