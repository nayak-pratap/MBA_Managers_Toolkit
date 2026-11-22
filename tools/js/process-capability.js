TK.tool({
  slug: "process-capability", parent: "engineering-tools.html", parentLabel: "Engineering",
  label: "Engineering calculator", title: "Process capability (Cp, Cpk, ppm)",
  intro: "Turn your measured mean, spread and specification limits into Cp, Cpk, expected defect rate and sigma level.",
  useWhen: "A customer asks for capability evidence, a process is drifting, or you must decide between re-centring and reducing variation.",
  fields: [
    { k: "lsl", label: "Lower spec limit", unit: "", value: 24.95, step: 0.001, group: "Specification" },
    { k: "usl", label: "Upper spec limit", unit: "", value: 25.05, step: 0.001 },
    { k: "mu", label: "Process mean", unit: "", value: 25.01, step: 0.001, group: "Measured process" },
    { k: "sd", label: "Process standard deviation", unit: "", value: 0.012, step: 0.0001, min: 1e-9 }
  ],
  compute: function (v) {
    if (!(v.sd > 0)) return { error: "The standard deviation must be above zero." };
    if (!(v.usl > v.lsl)) return { error: "The upper spec limit must be above the lower spec limit." };
    var width = v.usl - v.lsl;
    var cp = width / (6 * v.sd);
    var cpu = (v.usl - v.mu) / (3 * v.sd), cpl = (v.mu - v.lsl) / (3 * v.sd);
    var cpk = Math.min(cpu, cpl);
    var pLow = TK.normCdf((v.lsl - v.mu) / v.sd), pHigh = TK.normSf((v.usl - v.mu) / v.sd);
    var ppm = (pLow + pHigh) * 1e6;
    var sigma = 3 * cpk;
    var mid = (v.usl + v.lsl) / 2, off = v.mu - mid;
    var ppmC = 2 * TK.normSf(3 * cp) * 1e6;
    var k = width / 2 > 0 ? Math.abs(off) / (width / 2) * 100 : 0;

    var st = cpk >= 1.33 ? "good" : cpk >= 1.0 ? "warn" : "bad";
    var verdict = cpk >= 1.67 ? "Excellent: Cpk <b>" + TK.n(cpk, 2) + "</b>. Comfortably capable."
      : cpk >= 1.33 ? "Capable: Cpk <b>" + TK.n(cpk, 2) + "</b>, which meets the usual 1.33 requirement."
      : cpk >= 1.0 ? "Marginal: Cpk <b>" + TK.n(cpk, 2) + "</b>. Defects will occur; improve centring or spread."
      : "Not capable: Cpk <b>" + TK.n(cpk, 2) + "</b>. Expect about " + TK.n(ppm, 0) + " ppm out of tolerance.";

    var pts = [], lo = Math.min(v.lsl, v.mu - 4 * v.sd), hi = Math.max(v.usl, v.mu + 4 * v.sd);
    for (var i = 0; i <= 60; i++) {
      var x = lo + (hi - lo) * i / 60;
      pts.push([x, Math.exp(-0.5 * Math.pow((x - v.mu) / v.sd, 2))]);
    }

    return {
      verdict: { state: st, html: verdict },
      results: [
        { label: "Cp (potential)", value: TK.n(cp, 2), big: true,
          note: "What the spread alone allows, ignoring centring." },
        { label: "Cpk (actual)", value: TK.n(cpk, 2), big: true, state: st },
        { label: "Expected out of tolerance", value: TK.n(ppm, 0), unit: "ppm", big: true,
          state: ppm <= 63 ? "good" : ppm <= 2700 ? "warn" : "bad" },
        { label: "Sigma level (short term)", value: TK.n(sigma, 2) },
        { label: "Offset from mid-spec", value: TK.n(off, 4),
          note: TK.n(k, 1) + "% of the half-tolerance." },
        { label: "If perfectly centred", value: "Cpk " + TK.n(cp, 2) + ", " + TK.n(ppmC, 0), unit: "ppm",
          state: "good", note: "What re-centring alone would buy you." },
        { label: "Below LSL / above USL", value: TK.n(pLow * 1e6, 0) + " / " + TK.n(pHigh * 1e6, 0), unit: "ppm",
          note: "Which end is losing parts." }
      ],
      tables: [{
        title: "Where the gain is",
        head: ["Action", "Resulting Cpk", "Resulting ppm"],
        rows: [
          { cells: ["Today", TK.n(cpk, 2), TK.n(ppm, 0)] },
          { cells: ["Re-centre the mean only", TK.n(cp, 2), TK.n(ppmC, 0)] },
          { cells: ["Cut the spread by 20% only", TK.n(Math.min((v.usl - v.mu), (v.mu - v.lsl)) / (3 * v.sd * 0.8), 2),
            TK.n((TK.normCdf((v.lsl - v.mu) / (v.sd * 0.8)) + TK.normSf((v.usl - v.mu) / (v.sd * 0.8))) * 1e6, 0)] },
          { cls: "hl", cells: ["<b>Both</b>", "<b>" + TK.n(cp / 0.8, 2) + "</b>",
            "<b>" + TK.n(2 * TK.normSf(3 * cp / 0.8) * 1e6, 0) + "</b>"] }
        ]
      }],
      charts: [TK.line({
        series: [{ pts: pts }],
        markers: [{ x: v.lsl, label: "LSL" }, { x: v.usl, label: "USL" }],
        points: [{ x: v.mu, y: 1, label: "mean" }],
        xLabel: "Measured value", yLabel: "Relative frequency", yZero: true,
        title: "Process distribution against the specification limits",
        caption: "The spec limits are the dashed lines. Anything outside them is a defect."
      })],
      notes: ["A large gap between Cp and Cpk means the process is off centre. Re-centring is almost always cheaper than reducing variation.",
              "Cpk 1.33 is the usual customer requirement; 1.67 is common in automotive and aerospace."]
    };
  },
  howRead: [
    "A large gap between Cp and Cpk means the process is off centre: re-centre before investing in variation reduction.",
    "If <b>Cp itself</b> is low, you need to reduce variation, not just shift the mean.",
    "<b>Sigma level</b> here is the short-term figure (3 × Cpk). A “six sigma” process has Cpk 2.0."
  ],
  formulas: ["Cp = (USL − LSL) / 6σ", "Cpk = min[(USL − μ)/3σ, (μ − LSL)/3σ]",
             "ppm = [Φ((LSL−μ)/σ) + 1 − Φ((USL−μ)/σ)]·10⁶"],
  watch: ["Cpk is meaningless if the process is not in control. Check the control chart first.",
          "Use short-term (within) sigma for Cpk and overall sigma for Ppk.",
          "Needs at least 30 well-spaced measurements for a reliable estimate."],
  source: ["<i>Montgomery</i>, <i>Introduction to Statistical Quality Control</i>, process-capability chapters.",
           "IASSC Lean Six Sigma body of knowledge. Default values are illustrative."]
});
