TK.tool({
  slug: "surface-finish", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Surface finish: feed and nose radius",
  intro: "Estimate the theoretical Ra and Rmax in turning from feed and insert nose radius, and find the largest feed that still meets a target finish.",
  useWhen: "A drawing calls out a finish and you need to know the fastest feed that still meets it, or a part is failing a finish check.",
  fields: [
    { k: "f", label: "Feed per revolution", unit: "mm/rev", value: 0.20, step: 0.01, min: 0.001 },
    { k: "r", label: "Insert nose radius", unit: "mm", value: 0.80, step: 0.1, min: 0.001 },
    { k: "ra", label: "Required Ra", unit: "µm", value: 1.60, step: 0.1, min: 0.001 }
  ],
  compute: function (v) {
    if (!(v.r > 0)) return { error: "The nose radius must be above zero." };
    var raCalc = v.f * v.f / (32 * v.r) * 1000;          // µm
    var rmax = v.f * v.f / (8 * v.r) * 1000;             // µm
    var fmax = Math.sqrt(32 * v.r * v.ra / 1000);        // mm/rev
    var margin = (fmax / v.f - 1) * 100;
    var ok = raCalc <= v.ra;
    var st = ok ? (margin > 15 ? "good" : "good") : "bad";
    var ratio = v.f / v.r;

    var pts = [];
    for (var i = 1; i <= 40; i++) { var f = fmax * 1.6 * i / 40; pts.push([f, f * f / (32 * v.r) * 1000]); }

    return {
      verdict: { state: st, html: ok
        ? "Theoretical Ra <b>" + TK.n(raCalc, 2) + " µm</b> meets the target of " + TK.n(v.ra, 1) + " µm." +
          (margin > 0 ? " You could go up to <b>" + TK.n(fmax, 3) + " mm/rev</b>." : "")
        : "Theoretical Ra <b>" + TK.n(raCalc, 2) + " µm</b> misses the target of " + TK.n(v.ra, 1) +
          " µm. Drop the feed to <b>" + TK.n(fmax, 3) + " mm/rev</b> or fit a larger nose radius." },
      results: [
        { label: "Theoretical Ra", value: TK.n(raCalc, 2), unit: "µm", big: true, state: st },
        { label: "Theoretical peak-to-valley (Rmax)", value: TK.n(rmax, 2), unit: "µm", big: true },
        { label: "Maximum feed for the target", value: TK.n(fmax, 3), unit: "mm/rev" },
        { label: "Feed margin", value: TK.n(margin, 0), unit: "%", state: margin >= 0 ? "" : "bad" },
        { label: "Feed ÷ nose radius", value: TK.n(ratio, 2), state: ratio > 0.5 ? "warn" : "",
          note: ratio > 0.5 ? "Above about 0.5 the formula gets optimistic." : "Comfortably inside the valid range." }
      ],
      charts: [TK.line({
        series: [{ pts: pts }],
        points: [{ x: v.f, y: raCalc, label: "your feed" }],
        markers: [{ x: fmax, label: "target" }],
        xLabel: "Feed per revolution (mm/rev)", yLabel: "Theoretical Ra (µm)", yZero: true,
        title: "Theoretical Ra against feed",
        caption: "Ra grows with the square of feed, so halving feed quarters the roughness."
      })],
      notes: ["Real Ra is usually 1.5 to 3 times the theoretical value once vibration, built-up edge and tool wear are included.",
              "A larger nose radius is often cheaper than a slower feed: Ra falls in direct proportion to the radius."]
    };
  },
  howRead: [
    "Ra depends on <b>feed squared</b>: halving the feed quarters the theoretical roughness.",
    "Ra is inversely proportional to the <b>nose radius</b>, so a bigger radius buys finish without losing feed.",
    "Treat the number as a floor, not a promise. Measure the real part."
  ],
  formulas: ["Ra ≈ f² / (32·r)   (f and r in mm; ×1000 for µm)", "Rmax ≈ f² / (8·r)", "f_max = √(32·r·Ra)"],
  watch: ["Valid for feed smaller than the nose radius and for a stable cut.",
          "Ra of milled surfaces follows a different pattern (cutter marks and runout).",
          "A worn edge, chatter or built-up edge will all push the real value above the theoretical one."],
  source: ["<i>Manufacturing Processes for Engineering Materials</i> (Kalpakjian and Schmid), surface finish in turning.",
           "<i>Machining and CNC Technology</i>, finishing-parameter tables."]
});
