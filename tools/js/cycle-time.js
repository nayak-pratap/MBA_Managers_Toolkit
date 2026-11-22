TK.tool({
  slug: "cycle-time", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "CNC cycle time and parts per shift",
  intro: "Break a part cycle into cutting and non-cutting time, see how many parts a shift gives, and test how much a faster cut really helps.",
  useWhen: "You are quoting a job, chasing a capacity gap, or checking whether a tooling change will really raise output.",
  fields: [
    { k: "cut", label: "Cutting time", unit: "min", value: 2.40, step: 0.05, min: 0, group: "Per part" },
    { k: "rapid", label: "Rapid and positioning time", unit: "min", value: 0.350, step: 0.05, min: 0 },
    { k: "ntc", label: "Tool changes per part (turret / ATC)", unit: "", value: 4, step: 1, min: 0 },
    { k: "ttc", label: "Time per tool change", unit: "s", value: 6.0, step: 0.5, min: 0 },
    { k: "load", label: "Load and unload", unit: "min", value: 0.500, step: 0.05, min: 0 },
    { k: "insp", label: "Inspection per part (averaged)", unit: "min", value: 0.100, step: 0.05, min: 0 },
    { k: "life", label: "Tool life per edge", unit: "min", value: 15.0, step: 0.5, min: 0.01, group: "Edge changes" },
    { k: "edge", label: "Time to change an edge", unit: "min", value: 2.00, step: 0.1, min: 0 },
    { k: "shift", label: "Shift length", unit: "min", value: 480, step: 10, min: 1, group: "The shift" },
    { k: "avail", label: "Machine availability", unit: "%", value: 85, step: 1, min: 1, max: 100 },
    { k: "redu", label: "Test a cutting-time reduction of", unit: "%", value: 15, step: 1, min: 0, max: 90,
      group: "What if", hint: "The improvement a faster tool or higher feed would give." }
  ],
  compute: function (v) {
    if (!(v.life > 0)) return { error: "Tool life per edge must be above zero." };
    function cycleFor(cut) {
      return cut + v.rapid + v.ntc * v.ttc / 60 + v.load + v.insp + (cut / v.life) * v.edge;
    }
    var cycle = cycleFor(v.cut);
    if (!(cycle > 0)) return { error: "The cycle adds up to zero. Enter at least one time above zero." };
    var availMin = v.shift * v.avail / 100;
    var pph = 60 / cycle, pps = availMin / cycle;
    var share = v.cut / cycle * 100;
    var cut2 = v.cut * (1 - v.redu / 100), cycle2 = cycleFor(cut2);
    var pps2 = availMin / cycle2, gain = (pps2 / pps - 1) * 100;

    var breakdown = [
      ["Cutting", v.cut], ["Rapids and positioning", v.rapid],
      ["Tool changes in cycle", v.ntc * v.ttc / 60], ["Load and unload", v.load],
      ["Inspection", v.insp], ["Edge changes (amortised)", (v.cut / v.life) * v.edge]
    ];

    return {
      verdict: { state: share >= 60 ? "good" : share >= 40 ? "warn" : "bad", html:
        "Cycle time <b>" + TK.n(cycle, 2) + " min</b> gives <b>" + TK.n(pps, 0) +
        " parts a shift</b>. The spindle is actually cutting <b>" + TK.n(share, 0) + "%</b> of the cycle" +
        (share < 50 ? ", so most of your gain is in the non-cutting time, not the cut." :
                      ", so a faster cut is worth chasing.") },
      results: [
        { label: "Cycle time per part", value: TK.n(cycle, 2), unit: "min", big: true },
        { label: "Parts per hour", value: TK.n(pph, 1), big: true },
        { label: "Parts per shift", value: TK.n(pps, 0), big: true, note: "Available time " + TK.n(availMin, 0) + " min." },
        { label: "Share of cycle spent cutting", value: TK.n(share, 0), unit: "%",
          state: share >= 60 ? "good" : share >= 40 ? "warn" : "bad" },
        { label: "With " + TK.n(v.redu, 0) + "% shorter cutting time", value: TK.n(pps2, 0), unit: "parts/shift",
          state: "good", note: "+" + TK.n(gain, 1) + "% output" },
        { label: "Non-cutting time per part", value: TK.n(cycle - v.cut, 2), unit: "min" }
      ],
      tables: [{
        title: "Where the cycle goes",
        head: ["Element", "Minutes", "Share of cycle"],
        rows: breakdown.map(function (b) {
          return { cls: b[0] === "Cutting" ? "hl" : "", cells: [b[0], TK.n(b[1], 3), TK.n(b[1] / cycle * 100, 1) + "%"] };
        }).concat([{ cls: "hl", cells: ["<b>Total cycle</b>", "<b>" + TK.n(cycle, 3) + "</b>", "<b>100%</b>"] }])
      }],
      charts: [TK.bar({
        groups: breakdown.map(function (b) { return { label: b[0].split(" ")[0], values: [b[1]] }; }),
        yLabel: "Minutes per part", title: "Cycle time by element",
        caption: "The tallest bar is where a change pays off most."
      })],
      notes: ["A " + TK.n(v.redu, 0) + "% cut in cutting time gives only +" + TK.n(gain, 1) +
              "% output here, because cutting is " + TK.n(share, 0) + "% of the cycle. That gap is Amdahl's law on the shop floor.",
              "Chip-to-chip time and tool-change count come from the program, not the catalogue."]
    };
  },
  howRead: [
    "<b>Share of cycle spent cutting</b> tells you where to work. Below 50%, tooling changes move the needle less than handling and setup.",
    "<b>Parts per shift</b> already includes availability, so compare it with what the shop actually ships.",
    "The <b>what-if</b> row converts a cutting-time improvement into the output gain you can actually promise."
  ],
  formulas: ["Cycle = cut + rapids + tool changes + load + inspection + (cut / life)·edge-change time",
             "Parts per shift = shift × availability ÷ cycle"],
  watch: ["Chip-to-chip time of the machine and tool-change count come from the program, not the catalogue.",
          "Availability below 70% is usually a planning problem, not a machining problem.",
          "Averaged inspection time hides a bottleneck if every part is gauged on a busy CMM."],
  source: ["<i>Machining and CNC Technology</i> and <i>Fundamentals of Metal Machining and Machine Tools</i>.",
           "<i>In Cut Optimization – Establishing Operating Conditions</i> (cutting-tool training deck). Default values are illustrative."]
});
