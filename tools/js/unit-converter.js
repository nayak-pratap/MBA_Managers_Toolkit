/* Unit tables: f = how many base units in one of this unit; dp = decimals shown. */
var TKU = {
  len:  { label: "Length", base: "mm", units: [
    { k: "mm", t: "mm", f: 1, dp: 3 }, { k: "m", t: "m", f: 1000, dp: 4 },
    { k: "in", t: "inch", f: 25.4, dp: 4 }, { k: "ft", t: "ft", f: 304.8, dp: 4 },
    { k: "thou", t: "thou (0.001 in)", f: 0.0254, dp: 1 }, { k: "um", t: "µm", f: 0.001, dp: 1 } ] },
  spd:  { label: "Surface speed", base: "m/min", units: [
    { k: "mmin", t: "m/min", f: 1, dp: 1 }, { k: "ms", t: "m/s", f: 60, dp: 3 },
    { k: "sfm", t: "surface ft/min (SFM)", f: 0.3048, dp: 1 },
    { k: "fts", t: "ft/s", f: 18.288, dp: 3 }, { k: "kmh", t: "km/h", f: 1000 / 60, dp: 3 } ] },
  frc:  { label: "Force", base: "N", units: [
    { k: "N", t: "N", f: 1, dp: 1 }, { k: "kN", t: "kN", f: 1000, dp: 3 },
    { k: "kgf", t: "kgf", f: 9.80665, dp: 2 }, { k: "lbf", t: "lbf", f: 4.4482216, dp: 2 },
    { k: "tonf", t: "tonne-force", f: 9806.65, dp: 4 } ] },
  prs:  { label: "Pressure and stress", base: "MPa", units: [
    { k: "MPa", t: "MPa (= N/mm²)", f: 1, dp: 3 }, { k: "kPa", t: "kPa", f: 0.001, dp: 1 },
    { k: "bar", t: "bar", f: 0.1, dp: 3 }, { k: "psi", t: "psi", f: 0.00689476, dp: 1 },
    { k: "ksi", t: "ksi", f: 6.89476, dp: 3 }, { k: "GPa", t: "GPa", f: 1000, dp: 4 } ] },
  pwr:  { label: "Power", base: "kW", units: [
    { k: "kW", t: "kW", f: 1, dp: 3 }, { k: "W", t: "W", f: 0.001, dp: 1 },
    { k: "hp", t: "hp (mechanical)", f: 0.7456999, dp: 3 }, { k: "ps", t: "PS (metric hp)", f: 0.7354988, dp: 3 } ] },
  trq:  { label: "Torque", base: "N·m", units: [
    { k: "Nm", t: "N·m", f: 1, dp: 2 }, { k: "kgfm", t: "kgf·m", f: 9.80665, dp: 3 },
    { k: "lbft", t: "lbf·ft", f: 1.3558180, dp: 2 }, { k: "lbin", t: "lbf·in", f: 0.1129848, dp: 1 } ] },
  eng:  { label: "Energy", base: "J", units: [
    { k: "J", t: "J", f: 1, dp: 1 }, { k: "kJ", t: "kJ", f: 1000, dp: 4 },
    { k: "cal", t: "calorie", f: 4.184, dp: 2 }, { k: "kWh", t: "kWh", f: 3.6e6, dp: 6 },
    { k: "btu", t: "BTU", f: 1055.056, dp: 4 } ] },
  tmp:  { label: "Temperature", base: "°C", units: [
    { k: "C", t: "°C", dp: 2 }, { k: "F", t: "°F", dp: 2 }, { k: "K", t: "K", dp: 2 } ] }
};
var TKQ = Object.keys(TKU);

TK.tool({
  slug: "unit-converter", parent: "engineering-tools.html", parentLabel: "Engineering",
  label: "Engineering calculator", title: "Engineering unit converter",
  intro: "Convert length, surface speed, force, pressure, power, torque, energy and temperature, including the metric and imperial pairs used in machining.",
  useWhen: "A catalogue is in one system and your machine or drawing is in the other.",
  fields: [
    { k: "q", label: "Quantity", type: "sel", value: "spd", wide: true,
      options: TKQ.map(function (k) { return { v: k, t: TKU[k].label }; }) },
    { k: "val", label: "Value", unit: "", value: 250, step: "any" },
    { k: "u", label: "Unit you entered", type: "sel", value: "mmin",
      optionsFor: function (v) {
        var q = TKU[v.q] ? v.q : "spd";
        return TKU[q].units.map(function (u) { return { v: u.k, t: u.t }; });
      },
      options: TKU.spd.units.map(function (u) { return { v: u.k, t: u.t }; }) }
  ],
  compute: function (v) {
    var q = TKU[v.q] ? v.q : "spd";
    var set = TKU[q].units;
    var from = set.filter(function (u) { return u.k === v.u; })[0] || set[0];
    if (!TK.isNum(v.val)) return { error: "Enter a numeric value to convert." };

    var out;
    if (q === "tmp") {
      var c = from.k === "C" ? v.val : from.k === "F" ? (v.val - 32) * 5 / 9 : v.val - 273.15;
      out = set.map(function (u) {
        var x = u.k === "C" ? c : u.k === "F" ? c * 9 / 5 + 32 : c + 273.15;
        return { u: u, x: x };
      });
    } else {
      var base = v.val * from.f;
      out = set.map(function (u) { return { u: u, x: base / u.f }; });
    }

    return {
      verdict: { state: "", html: TK.sig(v.val, 6) + " " + from.t + " = <b>" +
        TK.n(out.filter(function (o) { return o.u.k !== from.k; })[0].x,
             out.filter(function (o) { return o.u.k !== from.k; })[0].u.dp) + " " +
        out.filter(function (o) { return o.u.k !== from.k; })[0].u.t + "</b>, and the other equivalents below." },
      results: out.map(function (o) {
        return { label: o.u.t, value: TK.n(o.x, o.u.dp), big: o.u.k === from.k,
          state: o.u.k === from.k ? "good" : "",
          note: o.u.k === from.k ? "What you entered." : "" };
      }),
      notes: [
        "MPa and N/mm² are the same number, which makes stress and kc conversion easy.",
        "If your unit is missing from the list, change the <b>Quantity</b> first — the unit list is filtered by quantity."
      ]
    };
  },
  howRead: ["Use the first card as your answer, the rest as cross-checks.",
            "The card marked as what you entered confirms the converter read your input correctly."],
  formulas: ["Each unit is stored as a factor to a base unit. Result = value × factor(in) ÷ factor(out).",
             "°F = °C × 9/5 + 32;  K = °C + 273.15"],
  watch: ["MPa and N/mm² are the same number, which makes stress and kc conversion easy.",
          "hp is not one unit. This tool uses mechanical hp (745.7 W) and metric PS (735.5 W).",
          "Pick the quantity before the unit, or the unit list will not contain what you want."],
  source: ["SI definitions and standard conversion factors (NIST SP 811)."]
});
