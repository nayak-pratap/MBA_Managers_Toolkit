TK.tool({
  slug: "change-readiness", parent: "leadership-tools.html", parentLabel: "Leadership",
  label: "Leadership tool", title: "Change readiness (Kotter steps)",
  intro: "Score how ready your team is for a change across the eight Kotter steps and see which gaps to close first.",
  useWhen: "You are about to launch a change, or a change has stalled and you need to find out which step was skipped.",
  fields: [
    { k: "scores", label: "Score each step (1 to 5)", type: "textarea", wide: true, rows: 9,
      value: "1 Create urgency, 4\n2 Build a guiding coalition, 3\n3 Form a strategic vision, 3\n" +
             "4 Enlist a volunteer army, 2\n5 Remove barriers, 2\n6 Create short-term wins, 3\n" +
             "7 Sustain acceleration, 2\n8 Anchor in culture, 1",
      hint: "One step per line: <b>step name, score 1–5</b>. 1 = not started, 5 = fully in place." }
  ],
  compute: function (v) {
    var rows = TK.rows(v.scores, 2);
    if (!rows.length) return { error: "Enter at least one step as <b>step name, score</b>." };
    var steps = [];
    for (var i = 0; i < rows.length; i++) {
      var s = TK.num(rows[i][1]);
      if (!TK.isNum(s)) return { error: 'Line ' + (i + 1) + ' needs a numeric score from 1 to 5.' };
      steps.push({ name: String(rows[i][0]).trim(), score: TK.clamp(s, 1, 5), idx: i });
    }
    var avg = steps.reduce(function (a, b) { return a + b.score; }, 0) / steps.length;
    var readiness = avg * 20;
    var weakest = steps.slice().sort(function (a, b) { return a.score - b.score || a.idx - b.idx; }).slice(0, 3);
    var firstLow = steps.filter(function (s) { return s.score <= 2; })[0];
    var st = avg >= 4 ? "good" : avg >= 3 ? "warn" : "bad";
    var verdict = avg >= 4
      ? "Ready: average <b>" + TK.n(avg, 1) + "</b>. Keep the weakest step in view as you go."
      : avg >= 3
        ? "Partly ready: average <b>" + TK.n(avg, 1) + "</b>. Close the gaps below before you scale up."
        : "Not ready: average <b>" + TK.n(avg, 1) + "</b>. Starting now risks failure.";

    return {
      verdict: { state: st, html: verdict +
        (firstLow ? " The earliest weak step is <b>" + TK.esc(firstLow.name) + "</b> — fix that one first." : "") },
      results: [
        { label: "Readiness score", value: TK.n(readiness, 0) + " / 100", big: true, state: st },
        { label: "Weakest steps", value: weakest.map(function (s) { return TK.esc(s.name); }).join("; "), big: true },
        { label: "Average score", value: TK.n(avg, 1), unit: "of 5" },
        { label: "Earliest weak step", value: firstLow ? TK.esc(firstLow.name) : "none",
          state: firstLow ? "warn" : "good",
          note: "Kotter's steps build on each other, so fix the earliest gap first." },
        { label: "Steps scoring 4 or more", value: String(steps.filter(function (s) { return s.score >= 4; }).length) +
          " of " + steps.length }
      ],
      tables: [{
        title: "Step by step",
        head: ["Step", "Score", "Status"],
        rows: steps.map(function (s) {
          return { cls: s.score <= 2 ? "crit" : s.score === 3 ? "hl" : "",
            cells: [TK.esc(s.name), TK.n(s.score, 0) + " / 5",
              s.score >= 4 ? "in place" : s.score === 3 ? "partly there" : "gap"] };
        })
      }],
      charts: [TK.bar({
        groups: steps.map(function (s) { return { label: String(s.name).split(" ")[0], values: [s.score] }; }),
        yMax: 5, yLabel: "Score (1–5)",
        title: "Readiness by Kotter step",
        caption: "Short bars on the left are the most expensive gaps: the later steps depend on them."
      })],
      notes: ["Fix the <b>earliest</b> low score first, not simply the lowest. The steps build on each other.",
              "Scores are opinions. Ask two or three colleagues to score independently and compare before you act."]
    };
  },
  howRead: [
    "Fix the earliest low score first, not simply the lowest.",
    "A low score on steps 1 to 3 explains most stalled changes: people were never convinced it mattered.",
    "A low score on steps 7 and 8 explains changes that worked and then quietly reverted."
  ],
  formulas: ["Readiness = average score × 20"],
  watch: ["Scores are opinions. Ask two or three colleagues to score independently and compare.",
          "A high average can still hide one fatal gap, so read the table, not just the score.",
          "Re-score after each milestone; readiness moves as the change proceeds."],
  source: ["John Kotter, <i>Leading Change</i> — the eight steps. Part of the graded IIM Sirmaur core-frameworks assignment."]
});
