TK.tool({
  slug: "data-story-planner", parent: "communication-tools.html", parentLabel: "Communication",
  label: "Communication tool", title: "Presentation and data-story planner",
  intro: "Turn a before-and-after number into a headline people remember, then check the presentation against the course framework: hook, purpose, two to four points, summary and call to action.",
  useWhen: "You have a result worth presenting and want the number and the structure to land together.",
  fields: [
    { k: "title", label: "Presentation title", type: "text", wide: true,
      value: "Three minutes, not thirty: what the knowledge system changed", group: "The number" },
    { k: "measure", label: "The measure", type: "text", wide: true, value: "Time to find a proven past solution" },
    { k: "before", label: "Value before", unit: "", value: 30.00, step: 0.1 },
    { k: "after", label: "Value after", unit: "", value: 3.00, step: 0.1 },
    { k: "unit", label: "Unit", type: "text", value: "minutes" },
    { k: "dir", label: "Which direction is better?", type: "sel", value: "lower",
      options: [{ v: "lower", t: "Lower is better" }, { v: "higher", t: "Higher is better" }] },
    { k: "freq", label: "Times it happens per person per week", unit: "", value: 8.00, step: 1, min: 0, group: "Scale it up" },
    { k: "people", label: "People affected", unit: "", value: 5.00, step: 1, min: 0 },
    { k: "weeks", label: "Working weeks per year", unit: "", value: 48.00, step: 1, min: 0 },
    { k: "audience", label: "Audience and what they already know", type: "textarea", wide: true, rows: 2,
      value: "Engineering leadership; they know the project, not the results", group: "The presentation" },
    { k: "purpose", label: "Purpose", type: "sel", value: "Persuade",
      options: ["Inform", "Persuade", "Decide", "Teach"] },
    { k: "points", label: "Main points (two to four), each with its evidence", type: "textarea", wide: true, rows: 5,
      value: "Engineers now start from a proven solution / Search time 30 → 3 minutes\n" +
             "Fewer revisions reach the customer / Revision hours down about 60%\n" +
             "The knowledge stays when people move / 1,000+ solutions captured and reused",
      hint: "One per line: <b>point / evidence</b>." },
    { k: "cta", label: "Call to action", type: "text", wide: true,
      value: "Approve the rollout to the Europe and US teams this quarter" },
    { k: "speak", label: "Speaking time", unit: "min", value: 10.00, step: 1, min: 1 }
  ],
  compute: function (v) {
    if (!(v.before !== 0)) return { error: "The “before” value cannot be zero — there would be nothing to compare against." };
    var change = (v.after - v.before) / Math.abs(v.before) * 100;
    var better = v.dir === "lower" ? v.after < v.before : v.after > v.before;
    var times = v.dir === "lower" ? (v.after !== 0 ? v.before / v.after : NaN)
                                  : (v.before !== 0 ? v.after / v.before : NaN);
    var diff = Math.abs(v.after - v.before);
    var perWeek = diff * v.freq * v.people;
    var perYear = perWeek * v.weeks;
    var isTime = /min|hour|hr|sec|day/i.test(String(v.unit));
    var yearHours = /min/i.test(String(v.unit)) ? perYear / 60 : /sec/i.test(String(v.unit)) ? perYear / 3600 : perYear;
    var days = yearHours / 8;

    var pts = TK.rowsBy(v.points, "/", 1);
    var withEvidence = pts.filter(function (p) { return p[1] && p[1].trim(); });
    var checks = [
      { name: "Hook (title carries the number)", ok: TK.filled(v.title) },
      { name: "The measure and both values", ok: TK.filled(v.measure) && TK.isNum(v.before) && TK.isNum(v.after) },
      { name: "Audience named", ok: TK.filled(v.audience) },
      { name: "Purpose chosen", ok: TK.filled(v.purpose) },
      { name: "Two to four main points", ok: pts.length >= 2 && pts.length <= 4 },
      { name: "Every point has evidence", ok: pts.length > 0 && withEvidence.length === pts.length },
      { name: "Call to action", ok: TK.filled(v.cta) }
    ];
    var done = checks.filter(function (c) { return c.ok; }).length;
    var st = done === 7 ? "good" : done >= 5 ? "warn" : "bad";
    var perPoint = pts.length ? v.speak * 0.6 / pts.length : 0;

    return {
      verdict: { state: done === 7 ? (better ? "good" : "warn") : st, html: done === 7
        ? "Framework complete: <b>7 of 7</b>."
        : "<b>" + done + " of 7</b> framework elements in place. Missing: " +
          checks.filter(function (c) { return !c.ok; }).map(function (c) { return "<b>" + c.name + "</b>"; }).join(", ") + "." },
      results: [
        { label: "Change", value: TK.n(change, 0), unit: "%", big: true, state: better ? "good" : "bad" },
        { label: "Before → after", value: TK.n(v.before, 0) + " → " + TK.n(v.after, 0), unit: String(v.unit), big: true },
        { label: v.dir === "lower" ? "Times lower" : "Times higher", value: TK.n(times, 0), unit: "×", big: true },
        { label: "Difference per week, whole group", value: TK.n(perWeek, 0), unit: String(v.unit) },
        { label: "Per year", value: TK.n(isTime ? yearHours : perYear, 0), unit: isTime ? "hours" : String(v.unit) },
        { label: "Per year in working days", value: TK.n(days, 0), unit: "days (8 h)",
          state: "good", note: isTime ? "The form that usually lands with managers." : "Only meaningful for time units." },
        { label: "Minutes per main point", value: TK.n(perPoint, 1), unit: "min",
          note: "Assuming 60% of your " + TK.n(v.speak, 0) + " minutes on the points." }
      ],
      tables: [{
        title: "Framework check",
        head: ["Element", "Status"],
        rows: checks.map(function (c) {
          return { cls: c.ok ? "" : "crit", cells: [c.name, c.ok ? "in place" : "missing"] };
        })
      }, {
        title: "Your points and evidence",
        head: ["#", "Point", "Evidence", "Minutes"],
        rows: pts.length ? pts.map(function (p, i) {
          return { cls: p[1] && p[1].trim() ? "" : "crit",
            cells: [String(i + 1), TK.esc(p[0]), p[1] && p[1].trim() ? TK.esc(p[1]) : "no evidence yet", TK.n(perPoint, 1)] };
        }) : [{ cls: "crit", cells: ["—", "No points entered yet.", "", ""] }]
      }],
      charts: [TK.bar({
        groups: [{ label: "Before", values: [v.before] }, { label: "After", values: [v.after] }],
        yLabel: String(v.unit), title: "Before and after",
        caption: "The simplest chart is usually the one people remember."
      })],
      notes: ["Pick <b>one</b> form of the number. A percentage suits a technical audience; working days a year suits a manager.",
              "Put the headline number in the hook and repeat it in the summary. Everything between should explain it.",
              "Time “saved” is not money saved unless the time is used for something else. Say what it is used for."]
    };
  },
  howRead: [
    "Pick one form of the number. A percentage suits a technical audience; “working days a year” suits a manager.",
    "Put the headline number in the hook and repeat it in the summary. Everything between should explain it.",
    "If a point has no evidence, either find some or cut the point."
  ],
  formulas: ["Change % = (after − before) ÷ before × 100",
             "Times lower = before ÷ after;  times higher = after ÷ before",
             "Per week = |after − before| × times per person per week × people",
             "Per year = per week × working weeks;  working days = hours ÷ 8"],
  watch: ["Multiplying a small saving by a large frequency you have not measured. Measure or sample the frequency.",
          "Time “saved” is not money saved unless the time is used for something else. Say what the time is used for.",
          "More than four main points. The course framework asks for two to four."],
  source: ["IIM Sirmaur business-communication coursework (hook, purpose, points, summary, call to action), with standard data-storytelling practice. Default figures are illustrative."]
});
