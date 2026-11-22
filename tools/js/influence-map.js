TK.tool({
  slug: "influence-map", parent: "communication-tools.html", parentLabel: "Communication",
  label: "Communication tool", title: "Influence map (stakeholders without authority)",
  intro: "Map the people who can help or block a change, rank who to speak to first, and get an approach for each based on How to Win Friends and Influence People.",
  useWhen: "You need a change to happen across teams you do not manage.",
  fields: [
    { k: "people", label: "Stakeholders", type: "textarea", wide: true, rows: 8,
      value: "Head of engineering / 5 / 4 / Supporter / Faster quotations, no extra headcount\n" +
             "IT security lead / 4 / 2 / Sceptic / Data stays inside approved systems\n" +
             "Senior application engineer / 2 / 5 / Sceptic / Their expertise is still valued\n" +
             "Finance controller / 4 / 2 / Neutral / Payback within the year\n" +
             "Regional sales manager / 3 / 3 / Neutral / Shorter response time to customers\n" +
             "Early-adopter engineer / 2 / 5 / Champion / Less searching, more engineering",
      hint: "One per line: <b>name / power 1–5 / interest 1–5 / stance / what they need</b>. " +
            "Stance: Blocker, Sceptic, Neutral, Supporter or Champion." }
  ],
  compute: function (v) {
    var rows = TK.rowsBy(v.people, "/", 4);
    if (!rows.length) return { error: "Enter at least one stakeholder as <b>name / power / interest / stance / what they need</b>." };
    var STANCE = { blocker: -2, sceptic: -1, skeptic: -1, neutral: 0, supporter: 1, champion: 2 };
    var APPROACH = {
      "-2": "Become genuinely interested in what they stand to lose. Let them talk first, and admit the risk they see.",
      "-1": "Ask questions instead of arguing. Concede the valid part of their objection before adding anything.",
      "0": "Give them a reason that is theirs, not yours. Show the result in the terms they already measure.",
      "1": "Give honest appreciation and make the next step easy and specific.",
      "2": "Let them own a visible part of it, and give them the credit publicly."
    };
    var list = [];
    for (var i = 0; i < rows.length; i++) {
      var pw = TK.num(rows[i][1]), it = TK.num(rows[i][2]);
      var sName = String(rows[i][3] || "Neutral").trim();
      var sv = STANCE[sName.toLowerCase()];
      if (!TK.isNum(pw) || !TK.isNum(it)) return { error: 'Line ' + (i + 1) + ' ("' + TK.esc(rows[i][0]) +
        '") needs numeric power and interest from 1 to 5.' };
      if (sv === undefined) return { error: 'Line ' + (i + 1) + ': stance "' + TK.esc(sName) +
        '" is not recognised. Use Blocker, Sceptic, Neutral, Supporter or Champion.' };
      pw = TK.clamp(pw, 1, 5); it = TK.clamp(it, 1, 5);
      var grid = (pw >= 4 && it >= 4) ? "Manage closely" : pw >= 4 ? "Keep satisfied"
        : it >= 4 ? "Keep informed" : "Monitor";
      list.push({ name: rows[i][0], pw: pw, it: it, stance: sName, sv: sv, need: rows[i][4] || "",
        grid: grid, pri: pw * (3 - sv) + 0.5 * it, approach: APPROACH[String(sv)] });
    }
    var sup = 0, opp = 0, und = 0;
    list.forEach(function (p) { if (p.sv > 0) sup += p.pw; else if (p.sv < 0) opp += p.pw; else und += p.pw; });
    list.sort(function (a, b) { return b.pri - a.pri; });
    var first = list[0];
    var st = sup > opp + und ? "good" : sup > opp ? "warn" : "bad";

    return {
      verdict: { state: st, html: "Supporters hold <b>" + TK.n(sup, 0) + "</b> power points, opponents <b>" +
        TK.n(opp, 0) + "</b>, undecided <b>" + TK.n(und, 0) + "</b>. " +
        (und >= Math.abs(sup - opp) ? "The undecided will settle it." :
         sup > opp ? "You have the balance — protect it." : "You are behind; start with the heaviest sceptic.") },
      results: [
        { label: "Speak to first", value: TK.esc(first.name), big: true, state: "warn",
          note: first.stance + ", power " + TK.n(first.pw, 0) + ", interest " + TK.n(first.it, 0) },
        { label: "Power supporting", value: TK.n(sup, 0), big: true, state: "good" },
        { label: "Power opposing", value: TK.n(opp, 0), big: true, state: "bad" },
        { label: "Power undecided", value: TK.n(und, 0), big: true, state: "warn" },
        { label: "People to manage closely", value: String(list.filter(function (p) { return p.grid === "Manage closely"; }).length),
          note: "High power and high interest." },
        { label: "Stakeholders mapped", value: String(list.length) }
      ],
      tables: [{
        title: "Who to speak to, in order",
        head: ["Priority", "Person", "Power", "Interest", "Stance", "Grid", "What they need"],
        rows: list.map(function (p, i) {
          return { cls: i === 0 ? "hl" : p.sv < 0 && p.pw >= 4 ? "crit" : "",
            cells: [String(i + 1), TK.esc(p.name), TK.n(p.pw, 0), TK.n(p.it, 0), p.stance, p.grid,
              p.need ? TK.esc(p.need) : "—"] };
        })
      }, {
        title: "Approach for each",
        head: ["Person", "Principle to lean on"],
        rows: list.map(function (p) { return { cells: [TK.esc(p.name), p.approach] }; })
      }],
      charts: [TK.bar({
        groups: list.map(function (p) { return { label: String(p.name).split(" ")[0].slice(0, 9), values: [p.pw, p.it] }; }),
        seriesLabels: ["Power", "Interest"], yMax: 5, yLabel: "Score (1–5)",
        title: "Power and interest by stakeholder",
        caption: "High power with low interest is the quiet risk: they can stop it without caring much."
      })],
      notes: ["Start at the top of the list. One conversation with a powerful sceptic is worth more than five with a champion.",
              "The approach column gives the principle to lean on. The words must be yours and must be sincere.",
              "Treat a filled-in map as private — it holds names and your read of their stance."]
    };
  },
  howRead: [
    "Start at the top of the list. One conversation with a powerful sceptic is worth more than five with a champion.",
    "The approach column gives the principle to lean on. The words must be yours and must be sincere.",
    "Update the stance after each conversation and watch the power totals move."
  ],
  formulas: ["Priority = power × (3 − stance) + 0.5 × interest  (stance from −2 blocker to +2 champion)",
             "Grid: power 4–5 and interest 4–5 = manage closely; high power only = keep satisfied; high interest only = keep informed; otherwise monitor",
             "Power supporting / opposing / undecided = sum of power scores in each group"],
  watch: ["Scoring formal rank as power. Score power over this decision, which may sit with an expert or a gatekeeper.",
          "Treating the map as a way to work around people. It is a way to understand what they need.",
          "Keeping names and stances in a shared file. Treat a filled-in map as private."],
  source: ["Dale Carnegie, <i>How to Win Friends and Influence People</i>, for the approach principles, with standard power/interest stakeholder mapping. Default roles are generic."]
});
