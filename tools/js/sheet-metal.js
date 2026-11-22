TK.tool({
  slug: "sheet-metal", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Sheet metal: punching force, bending and springback",
  intro: "Estimate the press force to punch or blank a part, the flat length of a bend, the smallest safe bend radius and the springback.",
  useWhen: "You are sizing a press, laying out a flat blank, or explaining why a bend opens up after forming.",
  fields: [
    { k: "mode", label: "What do you want to calculate?", type: "sel", value: "punch", wide: true,
      options: [{ v: "punch", t: "Punching / blanking force and clearance" },
                { v: "bend", t: "Bend allowance, flat length and minimum radius" },
                { v: "spring", t: "Springback of a bend" }] },
    { k: "uts", label: "Ultimate tensile strength", unit: "MPa", value: 1000, step: 25, min: 1,
      group: "Material", show: function (v) { return v.mode === "punch"; } },
    { k: "t", label: "Sheet thickness", unit: "mm", value: 3.20, step: 0.1, min: 0.01, group: "Material" },
    { k: "shape", label: "Cut shape", type: "sel", value: "round", group: "The cut",
      options: [{ v: "round", t: "Round hole" }, { v: "rect", t: "Rectangular slot" }, { v: "custom", t: "Known cut length" }],
      show: function (v) { return v.mode === "punch"; } },
    { k: "dia", label: "Hole diameter", unit: "mm", value: 25, step: 1, min: 0.01,
      show: function (v) { return v.mode === "punch" && v.shape === "round"; } },
    { k: "rw", label: "Slot width", unit: "mm", value: 20, step: 1, min: 0.01,
      show: function (v) { return v.mode === "punch" && v.shape === "rect"; } },
    { k: "rl", label: "Slot length", unit: "mm", value: 60, step: 1, min: 0.01,
      show: function (v) { return v.mode === "punch" && v.shape === "rect"; } },
    { k: "Lc", label: "Cut length", unit: "mm", value: 120, step: 1, min: 0.01,
      show: function (v) { return v.mode === "punch" && v.shape === "custom"; } },
    { k: "a", label: "Clearance allowance a", unit: "", value: 0.060, step: 0.005, min: 0,
      hint: "About 0.06 for soft steel and aluminium, up to 0.10 for hard or thick stock.",
      show: function (v) { return v.mode === "punch"; } },
    { k: "ang", label: "Bend angle", unit: "°", value: 90, step: 5, min: 0.1, max: 180,
      group: "The bend", show: function (v) { return v.mode === "bend"; } },
    { k: "Ri", label: "Inside bend radius", unit: "mm", value: 3.0, step: 0.5, min: 0.01,
      show: function (v) { return v.mode === "bend"; } },
    { k: "kf", label: "k factor (neutral axis)", unit: "", value: 0.44, step: 0.01, min: 0.1, max: 0.5,
      hint: "0.33 for a tight radius, 0.44 for a generous one, 0.5 in theory.",
      show: function (v) { return v.mode === "bend"; } },
    { k: "leg1", label: "Flange 1 length (to the bend)", unit: "mm", value: 40, step: 1, min: 0,
      show: function (v) { return v.mode === "bend"; } },
    { k: "leg2", label: "Flange 2 length (to the bend)", unit: "mm", value: 30, step: 1, min: 0,
      show: function (v) { return v.mode === "bend"; } },
    { k: "roa", label: "Reduction of area of the material", unit: "0–1", value: 0.50, step: 0.01, min: 0.01, max: 0.95,
      hint: "From a tensile test. Ductile steels about 0.5; hard tempers much lower.",
      show: function (v) { return v.mode === "bend"; } },
    { k: "RiS", label: "Inside bend radius before release", unit: "mm", value: 10, step: 0.5, min: 0.01,
      group: "Springback", show: function (v) { return v.mode === "spring"; } },
    { k: "Y", label: "Yield strength", unit: "MPa", value: 350, step: 10, min: 1,
      show: function (v) { return v.mode === "spring"; } },
    { k: "E", label: "Young's modulus", unit: "MPa", value: 207000, step: 1000, min: 1,
      hint: "About 207,000 for steel, 70,000 for aluminium.",
      show: function (v) { return v.mode === "spring"; } },
    { k: "angS", label: "Bend angle before release", unit: "°", value: 90, step: 5, min: 0.1, max: 180,
      show: function (v) { return v.mode === "spring"; } }
  ],
  compute: function (v) {
    if (!(v.t > 0)) return { error: "Enter a sheet thickness above zero." };

    if (v.mode === "punch") {
      var L = v.shape === "round" ? Math.PI * v.dia
        : v.shape === "rect" ? 2 * (v.rw + v.rl) : v.Lc;
      if (!(L > 0)) return { error: "Enter a cut length above zero." };
      var F = 0.7 * v.uts * v.t * L;                 // N
      var tonnes = F / 9806.65;
      var c = v.a * v.t;
      var press = F * 1.3;
      return {
        verdict: { state: "", html: "Maximum punch force about <b>" + TK.n(F / 1000, 1) + " kN</b> (" +
          TK.n(tonnes, 1) + " tonne-force). Size the press at <b>" + TK.n(press / 1000, 0) +
          " kN</b> or more to leave margin for a dull punch." },
        results: [
          { label: "Cut length L", value: TK.n(L, 1), unit: "mm", big: true },
          { label: "Maximum punch force", value: TK.n(F / 1000, 1), unit: "kN", big: true },
          { label: "Force as tonnes", value: TK.n(tonnes, 1), unit: "tonne-force" },
          { label: "Clearance per side", value: TK.n(c, 3), unit: "mm" },
          { label: "Suggested press capacity (+30%)", value: TK.n(press / 1000, 0), unit: "kN" },
          { label: "Die opening", value: TK.n((v.shape === "round" ? v.dia : 0) + 2 * c, 3), unit: "mm",
            note: v.shape === "round" ? "Punch diameter plus clearance both sides." : "Add 2× clearance to the punch size." }
        ],
        notes: ["A shear or bevel ground on the punch face can cut the peak force by 30–50% without changing the work done.",
                "Too little clearance gives a secondary shear burr; too much gives a large rollover and burr."]
      };
    }

    if (v.mode === "bend") {
      var rad = v.ang * Math.PI / 180;
      var BA = rad * (v.Ri + v.kf * v.t);
      var flat = v.leg1 + v.leg2 + BA;
      var Rmin = v.t * (1 / (2 * v.roa) - 1);
      var okR = v.Ri >= Rmin;
      return {
        verdict: { state: okR ? "good" : "bad", html: "Bend allowance <b>" + TK.n(BA, 2) +
          " mm</b>, so the flat blank is <b>" + TK.n(flat, 2) + " mm</b> long. " +
          (okR ? "The inside radius of " + TK.n(v.Ri, 2) + " mm clears the minimum of " + TK.n(Rmin, 2) + " mm."
               : "The inside radius of " + TK.n(v.Ri, 2) + " mm is tighter than the minimum of " +
                 TK.n(Rmin, 2) + " mm, so the outside may crack.") },
        results: [
          { label: "Bend allowance", value: TK.n(BA, 2), unit: "mm", big: true },
          { label: "Flat blank length", value: TK.n(flat, 2), unit: "mm", big: true },
          { label: "Minimum inside radius", value: TK.n(Rmin, 2), unit: "mm", state: okR ? "good" : "bad" },
          { label: "Inside radius ÷ thickness", value: TK.n(v.Ri / v.t, 2),
            note: "Below about 1 the bend gets difficult." },
          { label: "Bend deduction", value: TK.n(2 * (v.Ri + v.t) * Math.tan(Math.min(rad, Math.PI * 0.98) / 2) - BA, 2), unit: "mm",
            note: "Subtract from the sum of the outside flange dimensions." }
        ],
        notes: ["k depends on material and tooling. Use a measured value for production work.",
                "Bend across the rolling direction where you can: minimum radius is larger along the grain."]
      };
    }

    var ratio = v.RiS * v.Y / (v.E * v.t);
    var factor = 4 * Math.pow(ratio, 3) - 3 * ratio + 1;            // Ri/Rf
    if (!(factor > 0)) return { error: "Those values fall outside the range the springback formula covers." };
    var Rf = v.RiS / factor;
    var angF = v.angS * factor;                                      // retained angle
    var lost = v.angS - angF;
    return {
      verdict: { state: lost > 10 ? "warn" : "good", html: "The radius opens from <b>" + TK.n(v.RiS, 1) +
        " mm</b> to <b>" + TK.n(Rf, 1) + " mm</b> and the bend loses about <b>" + TK.n(lost, 1) +
        "°</b>. Overbend by that much, or set the tooling to " + TK.n(v.angS + lost, 1) + "°." },
      results: [
        { label: "Radius after release", value: TK.n(Rf, 2), unit: "mm", big: true },
        { label: "Angle after release", value: TK.n(angF, 1), unit: "°", big: true },
        { label: "Springback", value: TK.n(lost, 1), unit: "°", state: lost > 10 ? "warn" : "good" },
        { label: "Ri / Rf", value: TK.n(factor, 3) },
        { label: "Overbend target", value: TK.n(v.angS + lost, 1), unit: "°",
          note: "Form to this to land on " + TK.n(v.angS, 0) + "°." }
      ],
      notes: ["Springback rises with yield strength and with the radius-to-thickness ratio, and falls with a stiffer material.",
              "Bottoming or coining the bend reduces springback at the cost of much higher press force."]
    };
  },
  howRead: [
    "<b>Punch force</b> is a peak. The press also needs the energy (force × stroke), which matters on thick stock.",
    "<b>Clearance</b> is per side, so the die opening is the punch size plus twice the clearance.",
    "<b>Minimum radius</b> comes from ductility: a low reduction of area means a large minimum radius."
  ],
  formulas: ["F = 0.7·UTS·t·L   (maximum punch force)", "c = a·t   (clearance per side)",
             "BA = α·(R + k·T),  α in radians", "R_min = T·(1/(2r) − 1),  r = reduction of area",
             "Ri/Rf = 4(Ri·Y/(E·T))³ − 3(Ri·Y/(E·T)) + 1"],
  watch: ["The 0.7·UTS·t·L rule is for estimates. Check the work done on thick sheet and high-speed punching separately.",
          "k depends on material and tooling. Use measured values for production.",
          "Springback formulas assume pure bending; real tooling with pressure pads behaves differently."],
  source: ["<i>Manufacturing Processes for Engineering Materials</i> (Kalpakjian and Schmid), sheet-metal forming chapters.",
           "<i>ET ZC235 Manufacturing Processes</i> course material. Default values are illustrative."]
});
