TK.tool({
  slug: "cpm-pert", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "Project schedule: critical path (CPM and PERT)",
  intro: "Find the project duration, the critical path and the slack of each activity, with optional PERT three-point estimates.",
  useWhen: "You are planning a trial, an installation or a project and need to know which activities actually drive the end date.",
  fields: [
    { k: "acts", label: "Activities", type: "textarea", wide: true, rows: 9,
      value: "A, 2, 3, 4, \nB, 3, 4, 8, A\nC, 4, 6, 10, A\nD, 2, 3, 4, B\nE, 3, 5, 7, C\nF, 2, 4, 6, D,E\nG, 1, 2, 3, F",
      hint: "One activity per line: <b>name, optimistic, most likely, pessimistic, predecessors</b>. For a single estimate, repeat it three times." },
    { k: "deadline", label: "Target deadline", unit: "days", value: 24.00, step: 1, min: 0, group: "The question" }
  ],
  compute: function (v) {
    var rows = TK.rows(v.acts, 4);
    if (!rows.length) return { error: "Enter at least one activity as <b>name, optimistic, most likely, pessimistic, predecessors</b>." };
    var acts = [], by = {};
    for (var i = 0; i < rows.length; i++) {
      var o = TK.num(rows[i][1]), m = TK.num(rows[i][2]), p = TK.num(rows[i][3]);
      if (!TK.isNum(o) || !TK.isNum(m) || !TK.isNum(p)) return { error: 'Activity "' + TK.esc(rows[i][0]) +
        '" needs three numeric estimates.' };
      if (p < o) return { error: 'Activity "' + TK.esc(rows[i][0]) + '": the pessimistic estimate is below the optimistic one.' };
      var a = { name: String(rows[i][0]).trim(), o: o, m: m, p: p,
        te: (o + 4 * m + p) / 6, varr: Math.pow((p - o) / 6, 2),
        preds: rows[i].slice(4).map(function (x) { return String(x).trim(); }).filter(function (x) { return x; }) };
      acts.push(a); by[a.name] = a;
    }
    for (var j = 0; j < acts.length; j++) for (var k = 0; k < acts[j].preds.length; k++)
      if (!by[acts[j].preds[k]]) return { error: 'Activity "' + TK.esc(acts[j].name) + '" lists predecessor "' +
        TK.esc(acts[j].preds[k]) + '", which is not an activity.' };

    // topological order
    var order = [], seen = {}, temp = {}, cyclic = false;
    function visit(a) {
      if (seen[a.name]) return;
      if (temp[a.name]) { cyclic = true; return; }
      temp[a.name] = true;
      a.preds.forEach(function (p) { visit(by[p]); });
      temp[a.name] = false; seen[a.name] = true; order.push(a);
    }
    acts.forEach(visit);
    if (cyclic) return { error: "The predecessor list contains a loop, so no schedule exists. Check the activity list." };

    // forward pass
    order.forEach(function (a) {
      a.ES = 0;
      a.preds.forEach(function (p) { a.ES = Math.max(a.ES, by[p].EF); });
      a.EF = a.ES + a.te;
    });
    var T = order.reduce(function (acc, a) { return Math.max(acc, a.EF); }, 0);
    // backward pass
    var succ = {}; acts.forEach(function (a) { succ[a.name] = []; });
    acts.forEach(function (a) { a.preds.forEach(function (p) { succ[p].push(a.name); }); });
    order.slice().reverse().forEach(function (a) {
      if (!succ[a.name].length) a.LF = T;
      else { a.LF = Infinity; succ[a.name].forEach(function (s) { a.LF = Math.min(a.LF, by[s].LS); }); }
      a.LS = a.LF - a.te;
      a.slack = a.LS - a.ES;
      a.crit = Math.abs(a.slack) < 1e-9;
    });

    // longest critical chain, for display
    var crit = acts.filter(function (a) { return a.crit; });
    var chain = [], cur = crit.filter(function (a) { return Math.abs(a.ES) < 1e-9; })[0];
    var guard = 0;
    while (cur && guard++ < 500) {
      chain.push(cur.name);
      var nxt = succ[cur.name].map(function (s) { return by[s]; })
        .filter(function (s) { return s.crit && Math.abs(s.ES - cur.EF) < 1e-9; })
        .sort(function (a, b) { return b.te - a.te; })[0];
      cur = nxt;
    }
    var sigma = Math.sqrt(crit.reduce(function (a, b) { return a + b.varr; }, 0));
    var pOn = sigma > 0 ? TK.normCdf((v.deadline - T) / sigma) * 100 : (v.deadline >= T ? 100 : 0);
    var st = pOn >= 85 ? "good" : pOn >= 50 ? "warn" : "bad";

    acts.sort(function (a, b) { return a.ES - b.ES || a.name.localeCompare(b.name); });

    return {
      verdict: { state: st, html: "Expected duration <b>" + TK.n(T, 1) + " days</b>. Probability of finishing within " +
        TK.n(v.deadline, 0) + " days: <b>" + TK.n(pOn, 0) + "%</b>." },
      results: [
        { label: "Expected project duration", value: TK.n(T, 1), unit: "days", big: true },
        { label: "Critical path", value: chain.join(" → ") || "—", big: true },
        { label: "Std deviation of duration", value: TK.n(sigma, 2), unit: "days" },
        { label: "Chance of finishing by deadline", value: TK.n(pOn, 0), unit: "%", big: true, state: st },
        { label: "Activities on the critical path", value: String(crit.length) + " of " + acts.length },
        { label: "Duration for 90% confidence", value: TK.n(T + 1.2815516 * sigma, 1), unit: "days",
          note: "The date you should actually commit to." }
      ],
      tables: [{
        title: "Activity schedule",
        head: ["Activity", "te", "ES", "EF", "LS", "LF", "Slack", "Critical"],
        rows: acts.map(function (a) {
          return { cls: a.crit ? "crit" : "", cells: [TK.esc(a.name), TK.n(a.te, 2), TK.n(a.ES, 2), TK.n(a.EF, 2),
            TK.n(a.LS, 2), TK.n(a.LF, 2), TK.n(a.slack, 2), a.crit ? "yes" : ""] };
        })
      }],
      notes: ["Activities with slack can start late without delaying the project, up to their slack.",
              "The 90% date is usually the one to commit to: the expected duration has only about a 50% chance."]
    };
  },
  howRead: [
    "Put your best people and attention on the critical path.",
    "Activities with slack can start late without delaying the project, up to their slack.",
    "Quote the 90% duration, not the expected one — the expected duration is a coin flip."
  ],
  formulas: ["Expected time te = (o + 4m + p) / 6", "Variance = ((p − o) / 6)²",
             "ES = max EF of predecessors;  EF = ES + te", "LF = min LS of successors;  slack = LS − ES",
             "P(finish ≤ D) = Φ((D − T) / σ)"],
  watch: ["A second near-critical path can become critical when estimates move.",
          "Resource limits are not in CPM: check the people and machines too.",
          "PERT assumes the critical path's variances are independent, which understates risk when paths share resources."],
  source: ["Standard CPM and PERT method; IIM Sirmaur project-management coursework. Default activity list is illustrative."]
});
