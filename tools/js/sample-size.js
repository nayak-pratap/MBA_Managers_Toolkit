TK.tool({
  slug: "sample-size", parent: "engineering-tools.html", parentLabel: "Engineering",
  label: "Engineering calculator", title: "Sample size and confidence interval",
  intro: "How many parts must you measure to estimate a mean or a defect rate within a chosen margin, and what range does your sample support?",
  useWhen: "You are planning a capability study, a first-article inspection, or an audit and need to defend the sample size.",
  fields: [
    { k: "kind", label: "Estimate a", type: "sel", value: "mean", wide: true,
      options: [{ v: "mean", t: "Mean (measured values)" }, { v: "prop", t: "Proportion (pass / fail)" }] },
    { k: "sd", label: "Standard deviation σ", unit: "", value: 0.012, step: 0.0001, min: 1e-9,
      group: "What you expect", show: function (v) { return v.kind === "mean"; } },
    { k: "p", label: "Expected proportion p", unit: "0–1", value: 0.05, step: 0.01, min: 0, max: 1,
      hint: "Use 0.5 if you have no idea — it gives the largest, safest sample.",
      show: function (v) { return v.kind === "prop"; } },
    { k: "E", label: "Margin of error (±)", unit: "", value: 0.005, step: 0.001, min: 1e-9 },
    { k: "conf", label: "Confidence level", type: "sel", value: "95",
      options: [{ v: "80", t: "80%" }, { v: "90", t: "90%" }, { v: "95", t: "95%" },
                { v: "98", t: "98%" }, { v: "99", t: "99%" }, { v: "99.9", t: "99.9%" }] },
    { k: "have", label: "Sample size you actually have", unit: "", value: 30, step: 1, min: 1,
      group: "Check a sample you already took" }
  ],
  compute: function (v) {
    var z = TK.z(parseFloat(v.conf));
    if (!(v.E > 0)) return { error: "The margin of error must be above zero." };
    var n, marginAt;
    if (v.kind === "mean") {
      if (!(v.sd > 0)) return { error: "The standard deviation must be above zero." };
      n = Math.pow(z * v.sd / v.E, 2);
      marginAt = v.have > 0 ? z * v.sd / Math.sqrt(v.have) : NaN;
    } else {
      var p = TK.clamp(v.p, 0, 1);
      n = z * z * p * (1 - p) / (v.E * v.E);
      marginAt = v.have > 0 ? z * Math.sqrt(p * (1 - p) / v.have) : NaN;
    }
    var need = Math.ceil(n);
    var enough = v.have >= need;

    var pts = [];
    for (var i = 1; i <= 40; i++) {
      var nn = Math.max(2, Math.round(need * 2 * i / 40));
      var m = v.kind === "mean" ? z * v.sd / Math.sqrt(nn)
                                : z * Math.sqrt(TK.clamp(v.p, 0, 1) * (1 - TK.clamp(v.p, 0, 1)) / nn);
      pts.push([nn, m]);
    }

    return {
      verdict: { state: enough ? "good" : "warn", html: "You need <b>" + TK.n(need, 0) +
        "</b> measurements for a margin of ±" + TK.sig(v.E, 3) + " at " + v.conf + "% confidence. " +
        (enough ? "Your sample of " + TK.n(v.have, 0) + " is enough."
                : "Your sample of " + TK.n(v.have, 0) + " gives ±" + TK.sig(marginAt, 3) + " instead.") },
      results: [
        { label: "Sample size needed", value: TK.n(need, 0), big: true, state: enough ? "good" : "warn" },
        { label: "z for " + v.conf + "% confidence", value: TK.n(z, 3) },
        { label: "Margin from your sample of " + TK.n(v.have, 0), value: "±" + TK.sig(marginAt, 3),
          state: enough ? "good" : "warn" },
        { label: "Extra measurements needed", value: TK.n(Math.max(0, need - v.have), 0),
          note: enough ? "Your sample already covers it." : "To reach the margin you asked for." }
      ],
      tables: [{
        title: "What each confidence level costs",
        head: ["Confidence", "z", "Sample size needed"],
        rows: [80, 90, 95, 98, 99, 99.9].map(function (c) {
          var zz = TK.z(c);
          var nn = v.kind === "mean" ? Math.pow(zz * v.sd / v.E, 2)
                                     : zz * zz * TK.clamp(v.p, 0, 1) * (1 - TK.clamp(v.p, 0, 1)) / (v.E * v.E);
          return { cls: String(c) === String(v.conf) ? "hl" : "", cells: [c + "%", TK.n(zz, 3), TK.n(Math.ceil(nn), 0)] };
        })
      }],
      charts: [TK.line({
        series: [{ pts: pts }], markers: [{ x: need, label: "needed" }],
        xLabel: "Sample size", yLabel: "Margin of error (±)", yZero: true,
        title: "Margin of error against sample size",
        caption: "Margin falls with the square root of n, so halving it costs four times the samples."
      })],
      notes: ["Margin shrinks with √n: to halve the margin you need four times as many measurements.",
              "Round up. If measuring is costly, accept a wider margin before cutting confidence."]
    };
  },
  howRead: [
    "<b>Round up.</b> If measuring is costly, accept a wider margin first.",
    "Margin of error falls with the <b>square root</b> of sample size, so precision gets expensive quickly.",
    "For a proportion, p = 0.5 gives the largest sample. Use it when you have no prior estimate."
  ],
  formulas: ["Mean: n = (z·σ / E)²", "Proportion: n = z²·p(1−p) / E²"],
  watch: ["A sample is only valid if it is random and representative.",
          "Small expected defect rates need large samples to see anything.",
          "These formulas assume a large population; for a small lot, apply a finite-population correction."],
  source: ["<i>Montgomery and Runger</i>, <i>Applied Statistics and Probability for Engineers</i>, interval-estimation chapters. Default values are illustrative."]
});
