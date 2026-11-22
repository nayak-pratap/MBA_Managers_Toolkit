TK.tool({
  slug: "line-balancing", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "Assembly line balancing",
  intro: "Group tasks into workstations to meet a target output, using the largest-candidate rule, and see efficiency and idle time.",
  useWhen: "You are setting up or rebalancing a line or cell and need to know how many stations the target output demands.",
  fields: [
    { k: "time", label: "Productive time per day", unit: "min", value: 480.0, step: 10, min: 0.01, group: "Target" },
    { k: "out", label: "Required output per day", unit: "units", value: 110.0, step: 5, min: 0.01 },
    { k: "tasks", label: "Tasks (predecessor = task name that must precede, or blank)", type: "textarea", wide: true, rows: 10,
      value: "A, 2, \nB, 1.5, A\nC, 3, A\nD, 2.5, B\nE, 1, C\nF, 3.5, D,E\nG, 1.5, F\nH, 2, F\nI, 1, G,H",
      hint: "One task per line: <b>name, time, predecessors</b>. Separate several predecessors with commas." }
  ],
  compute: function (v) {
    var rows = TK.rows(v.tasks, 2);
    if (!rows.length) return { error: "Enter at least one task as <b>name, time, predecessors</b>." };
    var tasks = [], byName = {};
    for (var i = 0; i < rows.length; i++) {
      var t = TK.num(rows[i][1]);
      if (!TK.isNum(t) || t <= 0) return { error: 'Task "' + TK.esc(rows[i][0]) + '" needs a time above zero.' };
      var o = { name: String(rows[i][0]).trim(), t: t,
        preds: rows[i].slice(2).map(function (x) { return String(x).trim(); }).filter(function (x) { return x; }) };
      tasks.push(o); byName[o.name] = o;
    }
    for (var j = 0; j < tasks.length; j++) {
      for (var k = 0; k < tasks[j].preds.length; k++) {
        if (!byName[tasks[j].preds[k]]) return { error: 'Task "' + TK.esc(tasks[j].name) +
          '" lists predecessor "' + TK.esc(tasks[j].preds[k]) + '", which is not a task.' };
      }
    }
    if (!(v.time > 0)) return { error: "Enter the productive time per day as a number above zero." };
    if (!(v.out > 0)) return { error: "Enter the required output per day as a number above zero." };
    var takt = v.time / v.out;
    var total = tasks.reduce(function (a, b) { return a + b.t; }, 0);
    var tooLong = tasks.filter(function (t) { return t.t > takt + 1e-9; });
    if (tooLong.length) return { error: "Task " + tooLong.map(function (t) { return "<b>" + TK.esc(t.name) + "</b> (" +
      TK.n(t.t, 2) + " min)"; }).join(", ") + " is longer than the takt time of " + TK.n(takt, 2) +
      " min, so it cannot fit in one station. Split it, or lower the required output." };

    var minSt = Math.ceil(total / takt - 1e-9);
    // largest-candidate rule, honouring precedence
    var assigned = {}, stations = [], guard = 0;
    while (Object.keys(assigned).length < tasks.length && guard++ < 1000) {
      var st = { tasks: [], time: 0 };
      var placed = true, inner = 0;
      while (placed && inner++ <= tasks.length) {
        placed = false;
        var cands = tasks.filter(function (t) {
          if (assigned[t.name]) return false;
          if (t.t > takt - st.time + 1e-9) return false;
          return t.preds.every(function (p) { return assigned[p]; });
        }).sort(function (a, b) { return b.t - a.t; });
        if (cands.length) { var c = cands[0]; assigned[c.name] = true; st.tasks.push(c); st.time += c.t; placed = true; }
      }
      if (!st.tasks.length) return { error: "The precedence list has a loop, or a task's predecessors can never all be met. Check the task list." };
      stations.push(st);
    }
    var nSt = stations.length;
    var eff = total / (nSt * takt) * 100;
    var delay = 100 - eff;
    var bottleneck = stations.reduce(function (a, b) { return b.time > a.time ? b : a; }, stations[0]);
    var st2 = nSt === minSt ? "good" : "warn";

    return {
      verdict: { state: st2, html: nSt === minSt
        ? "Balanced at the theoretical minimum of <b>" + nSt + " stations</b> with <b>" + TK.n(eff, 1) + "%</b> efficiency."
        : "Needs <b>" + nSt + " stations</b> against a theoretical minimum of " + minSt + ". Efficiency " +
          TK.n(eff, 1) + "%. Try splitting a task or reordering." },
      results: [
        { label: "Takt / cycle time", value: TK.n(takt, 2), unit: "min", big: true },
        { label: "Total task time", value: TK.n(total, 1), unit: "min", big: true },
        { label: "Theoretical minimum stations", value: String(minSt) },
        { label: "Stations used", value: String(nSt), big: true, state: st2 },
        { label: "Line efficiency", value: TK.n(eff, 1), unit: "%", state: eff >= 85 ? "good" : eff >= 70 ? "warn" : "bad" },
        { label: "Balance delay (idle)", value: TK.n(delay, 1), unit: "%" },
        { label: "Bottleneck station", value: "Station " + (stations.indexOf(bottleneck) + 1),
          note: TK.n(bottleneck.time, 2) + " min of " + TK.n(takt, 2) + " min available." },
        { label: "Maximum output with these stations", value: TK.n(v.time / bottleneck.time, 0), unit: "units/day",
          note: "Set by the bottleneck, not the takt." }
      ],
      tables: [{
        title: "Station assignment",
        head: ["Station", "Tasks", "Work content (min)", "Idle (min)", "Utilisation"],
        rows: stations.map(function (s, i) {
          return { cls: s === bottleneck ? "hl" : "", cells: ["Station " + (i + 1),
            s.tasks.map(function (t) { return TK.esc(t.name); }).join(", "),
            TK.n(s.time, 2), TK.n(takt - s.time, 2), TK.n(s.time / takt * 100, 1) + "%"] };
        })
      }],
      charts: [TK.bar({
        groups: stations.map(function (s, i) { return { label: "S" + (i + 1), values: [s.time] }; }),
        yMax: takt, yLabel: "Work content (min)",
        title: "Work content by station",
        caption: "Bars reaching the top of the scale are at the takt time — those stations set the pace."
      })],
      notes: ["The largest-candidate rule is a heuristic, not an optimum. A different order can sometimes save a station.",
              "Maximum output is set by the <b>bottleneck station</b>, not by the takt you asked for."]
    };
  },
  howRead: [
    "Any station near the takt line is the bottleneck. Stations far below it have slack you can use.",
    "Efficiency = total work ÷ (stations × takt).",
    "If stations used exceeds the theoretical minimum, look for a task to split or move."
  ],
  formulas: ["Takt = available time / required output", "Min stations = ⌈ Σ times / takt ⌉",
             "Efficiency = Σ times / (n·takt)"],
  watch: ["A task longer than the takt cannot fit. Split it or duplicate stations.",
          "Use realistic productive minutes after breaks and changeovers.",
          "Precedence must be a directed acyclic graph — a loop makes balancing impossible."],
  source: ["Standard assembly-line balancing (largest-candidate rule); IIM Sirmaur operations coursework. Default task list is illustrative."]
});
