TK.tool({
  slug: "team-capacity", parent: "leadership-tools.html", parentLabel: "Leadership",
  label: "Leadership tool", title: "Team capacity and workload",
  intro: "Compare the hours your team has with the hours your work requires, per person and overall.",
  useWhen: "You are planning a period, deciding whether to take on more work, or explaining why a date cannot move.",
  fields: [
    { k: "weeks", label: "Weeks in period", unit: "", value: 4.00, step: 1, min: 0.1, group: "The period" },
    { k: "hrs", label: "Contract hours per week", unit: "h", value: 40.00, step: 1, min: 0.1 },
    { k: "oh", label: "Meetings, admin and breaks", unit: "%", value: 25.00, step: 5, min: 0, max: 90,
      hint: "Time that exists but cannot be assigned to project work." },
    { k: "people", label: "People", type: "textarea", wide: true, rows: 6,
      value: "Asha, 0, 112\nBen, 8, 120\nChen, 0, 90\nDev, 40, 70\nEli, 0, 128",
      hint: "One person per line: <b>name, leave hours, assigned hours</b>." }
  ],
  compute: function (v) {
    var rows = TK.rows(v.people, 3);
    if (!rows.length) return { error: "Enter at least one person as <b>name, leave hours, assigned hours</b>." };
    var gross = v.weeks * v.hrs, factor = 1 - v.oh / 100;
    var list = [];
    for (var i = 0; i < rows.length; i++) {
      var leave = TK.num(rows[i][1]), asg = TK.num(rows[i][2]);
      if (!TK.isNum(leave) || !TK.isNum(asg)) return { error: 'Line ' + (i + 1) + ' needs numeric leave and assigned hours.' };
      var cap = Math.max(0, gross - leave) * factor;
      list.push({ name: rows[i][0], leave: leave, asg: asg, cap: cap, util: cap > 0 ? asg / cap * 100 : Infinity });
    }
    var cap = list.reduce(function (a, b) { return a + b.cap; }, 0);
    var asg = list.reduce(function (a, b) { return a + b.asg; }, 0);
    var util = cap > 0 ? asg / cap * 100 : NaN;
    var spare = cap - asg;
    var over = list.filter(function (p) { return p.util > 100; });
    var st = util > 100 ? "bad" : util > 90 ? "bad" : util >= 75 ? "good" : "warn";
    var verdict = util > 100
      ? "Team is overcommitted: <b>" + TK.n(util, 0) + "%</b> of capacity. You are " + TK.n(-spare, 0) +
        " hours short — cut scope, move a date, or add people."
      : util > 90
        ? "Team utilisation <b>" + TK.n(util, 0) + "%</b>: no room for surprises. Cut scope or add capacity."
        : util >= 75
          ? "Team utilisation <b>" + TK.n(util, 0) + "%</b>, with " + TK.n(spare, 0) +
            " hours of buffer. That is a healthy plan."
          : "Team utilisation <b>" + TK.n(util, 0) + "%</b>: there is " + TK.n(spare, 0) +
            " hours of slack. You can take more work, or invest the time.";

    list.sort(function (a, b) { return b.util - a.util; });

    return {
      verdict: { state: st, html: verdict +
        (over.length ? " <b>" + over.length + "</b> " + (over.length === 1 ? "person is" : "people are") +
          " over 100% individually: " + over.map(function (p) { return TK.esc(p.name); }).join(", ") + "." : "") },
      results: [
        { label: "Team capacity", value: TK.n(cap, 0), unit: "h", big: true },
        { label: "Assigned", value: TK.n(asg, 0), unit: "h", big: true },
        { label: "Utilisation", value: TK.n(util, 0), unit: "%", big: true, state: st },
        { label: "Spare / (shortfall)", value: TK.n(spare, 0), unit: "h", state: spare >= 0 ? "good" : "bad" },
        { label: "People over 100%", value: String(over.length), state: over.length ? "bad" : "good" },
        { label: "Capacity per person (no leave)", value: TK.n(gross * factor, 0), unit: "h",
          note: TK.n(gross, 0) + " gross hours less " + TK.n(v.oh, 0) + "% overhead." }
      ],
      tables: [{
        title: "Person by person",
        head: ["Person", "Leave (h)", "Capacity (h)", "Assigned (h)", "Spare (h)", "Utilisation"],
        rows: list.map(function (p) {
          return { cls: p.util > 100 ? "crit" : p.util > 90 ? "hl" : "",
            cells: [TK.esc(p.name), TK.n(p.leave, 0), TK.n(p.cap, 0), TK.n(p.asg, 0),
              TK.n(p.cap - p.asg, 0), TK.n(p.util, 0) + "%"] };
        })
      }],
      charts: [TK.bar({
        groups: list.map(function (p) { return { label: String(p.name).slice(0, 8), values: [p.cap, p.asg] }; }),
        seriesLabels: ["Capacity", "Assigned"], yLabel: "Hours",
        title: "Capacity against assigned work, per person",
        caption: "Where the brown bar passes the blue one, that person is overcommitted."
      })],
      notes: ["Do not plan at 100%: queues grow very quickly as utilisation approaches full load.",
              "Spare hours of the wrong skill are not spare. Check the skill mix, not just the total."]
    };
  },
  howRead: [
    "Above 100% means someone is overcommitted on paper. Above 90% leaves no buffer.",
    "Check the team total, but also each person: an average hides overload.",
    "Buffer is not waste. It is what absorbs the urgent customer problem that arrives on Thursday."
  ],
  formulas: ["Capacity = (weeks × hours/week − leave) × (1 − overhead%)", "Utilisation = assigned / capacity"],
  watch: ["Do not plan at 100%: queues grow quickly as utilisation approaches 100%.",
          "Skills matter. Spare hours of the wrong skill are not spare.",
          "Overhead of 25% is typical for an engineering team; measure your own before trusting it."],
  source: ["Standard capacity-planning practice; queueing behaviour at high utilisation (Little's law and Kingman's formula). Default values are illustrative."]
});
