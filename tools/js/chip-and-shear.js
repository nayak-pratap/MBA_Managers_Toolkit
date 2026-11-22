TK.tool({
  slug: "chip-and-shear", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Cutting forces and shear angle (orthogonal cutting)",
  intro: "From a measured chip thickness and the two cutting force components, get the shear angle, friction, shear stress and specific cutting energy.",
  useWhen: "You are investigating a chip-control or edge-failure problem, or teaching why rake angle and friction matter.",
  fields: [
    { k: "t0", label: "Uncut chip thickness t₀ (feed)", unit: "mm", value: 0.25, step: 0.01, min: 0.001, group: "Geometry" },
    { k: "tc", label: "Chip thickness after cutting tc", unit: "mm", value: 0.45, step: 0.01, min: 0.001 },
    { k: "w", label: "Width of cut", unit: "mm", value: 3.0, step: 0.1, min: 0.001 },
    { k: "alpha", label: "Rake angle α", unit: "°", value: 10, step: 1, min: -30, max: 45 },
    { k: "Fc", label: "Cutting force Fc", unit: "N", value: 1200, step: 10, min: 0.001, group: "Measured forces" },
    { k: "Ft", label: "Thrust force Ft", unit: "N", value: 500, step: 10, min: 0 },
    { k: "vc", label: "Cutting speed", unit: "m/min", value: 150, step: 5, min: 0 }
  ],
  compute: function (v) {
    if (!(v.tc > 0) || !(v.t0 > 0)) return { error: "Both chip thicknesses must be above zero." };
    var r = v.t0 / v.tc;
    if (r > 1) return { error: "The chip is thinner than the feed, which cannot happen in orthogonal cutting. Check tc." };
    var a = v.alpha * Math.PI / 180;
    var phi = Math.atan2(r * Math.cos(a), 1 - r * Math.sin(a));       // shear angle, rad
    var beta = a + Math.atan2(v.Ft, v.Fc);                            // friction angle, rad
    var mu = Math.tan(beta);
    var gamma = 1 / Math.tan(phi) + Math.tan(phi - a);                // shear strain
    var Fs = v.Fc * Math.cos(phi) - v.Ft * Math.sin(phi);             // force on shear plane
    var As = v.t0 * v.w / Math.sin(phi);                              // shear plane area
    var tau = As > 0 ? Fs / As : NaN;                                 // MPa
    var u = v.Fc / (v.w * v.t0);                                      // J/mm³
    var pw = v.Fc * v.vc / 60 / 1000;                                 // kW
    var vs = v.vc * Math.cos(a) / Math.cos(phi - a);                  // shear velocity
    var phiM = 45 + v.alpha / 2 - beta * 90 / Math.PI;                // Merchant prediction, °
    var phiDeg = phi * 180 / Math.PI;

    return {
      verdict: { state: "", html: "Shear angle <b>" + TK.n(phiDeg, 1) + "°</b> with a friction coefficient of <b>" +
        TK.n(mu, 2) + "</b>. Merchant's minimum-energy model would predict " + TK.n(phiM, 1) +
        "°; a measured angle well below that is the usual case and points to friction on the rake face." },
      results: [
        { label: "Chip thickness ratio r", value: TK.n(r, 3), big: true },
        { label: "Shear angle φ", value: TK.n(phiDeg, 1), unit: "°", big: true },
        { label: "Friction angle β", value: TK.n(beta * 180 / Math.PI, 1), unit: "°" },
        { label: "Friction coefficient μ", value: TK.n(mu, 2) },
        { label: "Shear strain γ", value: TK.n(gamma, 2) },
        { label: "Shear stress on the plane", value: TK.n(tau, 0), unit: "MPa" },
        { label: "Specific cutting energy", value: TK.n(u, 2), unit: "J/mm³", note: "Same number as kc in N/mm²." },
        { label: "Cutting power", value: TK.n(pw, 2), unit: "kW" },
        { label: "Shear velocity", value: TK.n(vs, 0), unit: "m/min" },
        { label: "Merchant shear angle", value: TK.n(phiM, 1), unit: "°", note: "45° + α/2 − β/2." }
      ],
      notes: ["A thicker chip means a lower shear angle, more strain and more energy per mm³ removed.",
              "Specific cutting energy is the most useful single number here: it is the kc you would feed into a power calculation."]
    };
  },
  howRead: [
    "A <b>low shear angle</b> means a thick chip, high strain and high energy per unit volume removed.",
    "<b>μ above about 0.6</b> points to poor lubrication, built-up edge, or a coating that is not working.",
    "<b>Specific cutting energy</b> is directly comparable with the catalogue kc for the work material."
  ],
  formulas: ["r = t₀ / tc;  tan φ = r·cos α / (1 − r·sin α)", "β = α + arctan(Ft / Fc);  μ = tan β",
             "Fs = Fc·cos φ − Ft·sin φ;  As = t₀·w / sin φ;  τ = Fs / As", "γ = cot φ + tan(φ − α)",
             "Merchant: φ = 45° + α/2 − β/2;  u = Fc / (w·t₀)"],
  watch: ["The model assumes orthogonal (two-dimensional) cutting. A real turning insert with a nose radius is only an approximation.",
          "Chip thickness must be measured on a steady chip, not on a transient or segmented one.",
          "Force measurements need a calibrated dynamometer; small Ft errors move β and μ noticeably."],
  source: ["<i>Metal Cutting</i> (Trent), chapters on terminology and forces in metal cutting.",
           "<i>Manufacturing Processes for Engineering Materials</i> (Kalpakjian and Schmid), orthogonal cutting and the Merchant model."]
});
