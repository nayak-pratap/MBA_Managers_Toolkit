TK.tool({
  slug: "cutting-parameters", parent: "machining-tools.html", parentLabel: "Machining",
  label: "Machining calculator", title: "Speeds, feeds and power",
  intro: "Turn a cutting speed into spindle rpm, feed rate, metal removal rate, power, torque and cycle time for turning, milling or drilling.",
  useWhen: "You are setting up a job, checking a recommendation, or testing whether a machine has enough power for a heavier cut.",
  fields: [
    { k: "op", label: "Operation", type: "sel", value: "turn", group: "The cut",
      options: [{ v: "turn", t: "Turning" }, { v: "mill", t: "Milling" }, { v: "drill", t: "Drilling" }] },
    { k: "vc", label: "Cutting speed", unit: "m/min", value: 250, step: 5, min: 0 },
    { k: "d", label: "Workpiece / tool diameter", unit: "mm", value: 60, step: 1, min: 0 },
    { k: "f", label: "Feed per revolution", unit: "mm/rev", value: 0.4, step: 0.01, min: 0,
      show: function (v) { return v.op !== "mill"; } },
    { k: "fz", label: "Feed per tooth", unit: "mm/tooth", value: 0.15, step: 0.01, min: 0,
      show: function (v) { return v.op === "mill"; } },
    { k: "z", label: "Number of teeth", unit: "", value: 4, step: 1, min: 1,
      show: function (v) { return v.op === "mill"; } },
    { k: "ap", label: "Depth of cut", unit: "mm", value: 2.5, step: 0.1, min: 0,
      show: function (v) { return v.op !== "drill"; } },
    { k: "ae", label: "Radial width of cut", unit: "mm", value: 30, step: 1, min: 0,
      show: function (v) { return v.op === "mill"; } },
    { k: "L", label: "Length of cut", unit: "mm", value: 150, step: 5, min: 0 },
    { k: "kc", label: "Specific cutting force kc", unit: "N/mm²", value: 2100, step: 50, min: 0,
      group: "Material and machine",
      hint: "Catalogue value for the work material. Roughly 1,500–2,500 for steels." },
    { k: "eta", label: "Machine efficiency", unit: "0–1", value: 0.85, step: 0.01, min: 0.1, max: 1 },
    { k: "pav", label: "Machine spindle power available", unit: "kW", value: 15, step: 0.5, min: 0 }
  ],
  compute: function (v) {
    if (!(v.d > 0) || !(v.vc > 0)) return { error: "Enter a cutting speed and a diameter above zero." };
    var n = 1000 * v.vc / (Math.PI * v.d);           // rpm
    var vf, mrr;                                      // feed rate mm/min, MRR cm³/min
    if (v.op === "mill") {
      if (!(v.z >= 1)) return { error: "Milling needs at least one tooth." };
      vf = v.fz * v.z * n;
      mrr = v.ap * v.ae * vf / 1000;
    } else if (v.op === "drill") {
      vf = v.f * n;
      mrr = (Math.PI * v.d * v.d / 4) * vf / 1000;
    } else {
      vf = v.f * n;
      mrr = v.vc * v.f * v.ap;
    }
    var pc = v.kc * (mrr * 1000) / 6e7;               // kW at the edge
    var pm = v.eta > 0 ? pc / v.eta : NaN;            // kW at the motor
    var tq = n > 0 ? 9549 * pc / n : NaN;             // N·m
    var tmin = vf > 0 ? v.L / vf : NaN;               // min
    var use = v.pav > 0 ? pm / v.pav * 100 : NaN;

    var state = use <= 80 ? "good" : use <= 100 ? "warn" : "bad";
    var verdict = use <= 80
      ? "Power is fine: the cut uses about <b>" + TK.n(use, 0) + "%</b> of the machine."
      : use <= 100
        ? "Tight: the cut uses about <b>" + TK.n(use, 0) + "%</b> of the machine. Leave margin for a worn edge."
        : "Too heavy: the cut needs about <b>" + TK.n(use, 0) + "%</b> of the machine. It will stall or slow down.";

    var mrrLabel = v.op === "turn" ? "Cutting speed × feed × depth for turning."
      : v.op === "mill" ? "Depth × width × feed rate for milling." : "Hole area × feed rate for drilling.";

    // power against depth of cut, to show the headroom
    var pts = [], base = v.op === "drill" ? null : v.ap;
    if (base) {
      for (var i = 1; i <= 40; i++) {
        var ap = base * 2 * i / 40;
        var m2 = v.op === "mill" ? ap * v.ae * vf / 1000 : v.vc * v.f * ap;
        pts.push([ap, v.kc * (m2 * 1000) / 6e7 / (v.eta || 1)]);
      }
    }

    return {
      verdict: { state: state, html: verdict },
      results: [
        { label: "Spindle speed", value: TK.n(n, 0), unit: "rpm", big: true },
        { label: v.op === "turn" ? "Carriage feed rate" : "Table / axis feed rate", value: TK.n(vf, 0), unit: "mm/min", big: true },
        { label: "Metal removal rate", value: TK.n(mrr, 1), unit: "cm³/min", big: true, note: mrrLabel },
        { label: "Cutting power at the edge", value: TK.n(pc, 2), unit: "kW" },
        { label: "Motor power needed", value: TK.n(pm, 2), unit: "kW", state: state, note: "After machine efficiency." },
        { label: "Spindle torque", value: TK.n(tq, 0), unit: "N·m" },
        { label: "Cutting time for this pass", value: TK.n(tmin * 60, 0), unit: "s", note: TK.n(tmin, 2) + " min" },
        { label: "Share of machine power used", value: TK.n(use, 0), unit: "%", state: state }
      ],
      charts: pts.length ? [TK.line({
        series: [{ pts: pts }],
        points: [{ x: v.ap, y: pm, label: "your cut" }],
        markers: v.pav > 0 ? [] : [],
        xLabel: "Depth of cut (mm)", yLabel: "Motor power needed (kW)", yZero: true,
        title: "Motor power against depth of cut",
        caption: "Power rises in a straight line with depth. Your cut is marked."
      })] : [],
      notes: [
        "Rule of thumb from the cutting-tool training deck: <b>take the heaviest depth of cut, then the highest feed, then optimise the speed</b>. Speed has the strongest effect on tool life.",
        "kc changes with chip thickness and tool geometry, so treat power as an estimate of about ±20%."
      ]
    };
  },
  howRead: [
    "<b>Spindle speed</b> is what you program, or the rpm limit you must stay under.",
    "<b>Metal removal rate</b> is the productivity number. Doubling feed or depth doubles it; speed also scales it directly.",
    "<b>Power check</b> under 80% is comfortable. Over 100% means the machine will stall or slow down."
  ],
  formulas: [
    "n = 1000·Vc / (π·D)   [rpm]",
    "Turning: Vf = f·n;  MRR = Vc·f·ap  [cm³/min]",
    "Milling: Vf = fz·z·n;  MRR = ap·ae·Vf / 1000",
    "Drilling: MRR = (π·D²/4)·Vf / 1000",
    "Pc = kc·MRR(mm³/min) / 6×10⁷  [kW];  P_motor = Pc / η",
    "Torque = 9549·Pc / n  [N·m]"
  ],
  watch: [
    "kc changes with chip thickness and tool geometry. The catalogue value is for a stated chip thickness.",
    "Turning at the end of a bar: rpm should follow the <i>current</i> diameter, or use constant surface speed.",
    "Milling with a narrow radial width needs a higher feed per tooth to keep the real chip thickness."
  ],
  source: [
    "<i>Metal Cutting</i> (Trent) and <i>Manufacturing Processes for Engineering Materials</i> (Kalpakjian and Schmid).",
    "<i>In Cut Optimization – Establishing Operating Conditions</i> (cutting-tool training deck). Default values are illustrative."
  ]
});
