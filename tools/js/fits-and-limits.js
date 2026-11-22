TK.tool({
  slug: "fits-and-limits", parent: "engineering-tools.html", parentLabel: "Engineering",
  label: "Engineering calculator", title: "Shaft and hole fit (clearance or interference)",
  intro: "Find the minimum and maximum clearance or interference between a shaft and hole and classify the fit.",
  useWhen: "You are selecting a fit from a drawing, checking a press or slide fit, or diagnosing an assembly that is too tight or too loose.",
  fields: [
    { k: "d", label: "Nominal diameter", unit: "mm", value: 25.00, step: 1, min: 0.01 },
    { k: "hu", label: "Hole upper deviation", unit: "mm", value: 0.021, step: 0.001, group: "Hole" },
    { k: "hl", label: "Hole lower deviation", unit: "mm", value: 0, step: 0.001 },
    { k: "su", label: "Shaft upper deviation", unit: "mm", value: -0.007, step: 0.001, group: "Shaft" },
    { k: "sl", label: "Shaft lower deviation", unit: "mm", value: -0.020, step: 0.001 }
  ],
  compute: function (v) {
    var hMax = v.d + Math.max(v.hu, v.hl), hMin = v.d + Math.min(v.hu, v.hl);
    var sMax = v.d + Math.max(v.su, v.sl), sMin = v.d + Math.min(v.su, v.sl);
    var cMax = hMax - sMin, cMin = hMin - sMax;
    var fitTol = cMax - cMin;
    var kind = cMin >= 0 ? "Clearance" : cMax <= 0 ? "Interference" : "Transition";
    var st = cMin >= 0 ? "good" : cMax <= 0 ? "warn" : "warn";

    return {
      verdict: { state: st, html: kind + " fit: from <b>" + TK.n(cMin, 3) +
        " mm</b> (negative = interference) to <b>" + TK.n(cMax, 3) + " mm</b>." +
        (kind === "Transition" ? " Some assemblies will be loose and some tight — that is usually not what a drawing intends." : "") },
      results: [
        { label: "Hole size", value: TK.n(hMin, 3) + " to " + TK.n(hMax, 3), unit: "mm", big: true },
        { label: "Shaft size", value: TK.n(sMin, 3) + " to " + TK.n(sMax, 3), unit: "mm", big: true },
        { label: "Maximum clearance", value: TK.n(cMax, 3), unit: "mm", big: true },
        { label: "Minimum clearance (− = interference)", value: TK.n(cMin, 3), unit: "mm", state: st },
        { label: "Fit tolerance", value: TK.n(fitTol, 3), unit: "mm",
          note: "Hole tolerance plus shaft tolerance." },
        { label: "Fit type", value: kind, state: st }
      ],
      tables: [{
        title: "The four limits",
        head: ["", "Minimum (mm)", "Maximum (mm)", "Tolerance (mm)"],
        rows: [
          { cells: ["Hole", TK.n(hMin, 3), TK.n(hMax, 3), TK.n(hMax - hMin, 3)] },
          { cells: ["Shaft", TK.n(sMin, 3), TK.n(sMax, 3), TK.n(sMax - sMin, 3)] },
          { cls: "hl", cells: ["<b>Clearance</b>", "<b>" + TK.n(cMin, 3) + "</b>", "<b>" + TK.n(cMax, 3) + "</b>",
            "<b>" + TK.n(fitTol, 3) + "</b>"] }
        ]
      }],
      notes: ["Deviations are measured from the nominal size and carry a sign. A hole below nominal has a negative deviation.",
              "For an interference fit, the assembly force and the hoop stress in the outer part matter as much as the amount of interference."]
    };
  },
  howRead: [
    "<b>Positive minimum clearance</b> means every assembly slides.",
    "<b>Negative maximum clearance</b> means every assembly needs force or heat.",
    "If the range straddles zero you have a transition fit, and assemblies will behave inconsistently."
  ],
  formulas: ["Max clearance = hole max − shaft min", "Min clearance = hole min − shaft max"],
  watch: ["Deviations are from nominal and carry a sign.",
          "Thermal growth and surface finish can change a fit in service.",
          "A fit specified at 20 °C may not hold at operating temperature."],
  source: ["ISO 286 limits-and-fits system; B.Tech engineering-metrology course material. Default values show a sliding fit."]
});
