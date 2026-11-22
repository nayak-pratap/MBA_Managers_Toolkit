TK.tool({
  slug: "forecasting", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "Demand forecasting (moving average and exponential smoothing)",
  intro: "Forecast next period demand from history, compare methods and see which one has the lowest error.",
  useWhen: "You need a defensible number for next month's demand, or must show which forecasting method fits your data.",
  fields: [
    { k: "hist", label: "Demand history (oldest first)", type: "textarea", wide: true, rows: 7,
      value: "M1, 120\nM2, 132\nM3, 128\nM4, 140\nM5, 150\nM6, 147\nM7, 160\nM8, 158\nM9, 171\nM10, 175\nM11, 169\nM12, 182",
      hint: "One period per line: <b>label, demand</b>. Oldest first." },
    { k: "w", label: "Moving average window", unit: "periods", value: 3, step: 1, min: 1, group: "Method settings" },
    { k: "alpha", label: "Smoothing constant α", unit: "0–1", value: 0.300, step: 0.05, min: 0.01, max: 1 }
  ],
  compute: function (v) {
    var HIST_MAX = 240;
    var rows = TK.rows(v.hist, 2), D = [], labels = [];
    if (rows.length > HIST_MAX) return { error: "That is " + rows.length +
      " periods of history. This tool handles up to " + HIST_MAX + " — trim the list." };
    for (var i = 0; i < rows.length; i++) {
      var x = TK.num(rows[i][1]);
      if (!TK.isNum(x)) return { error: 'Line ' + (i + 1) + ' needs a numeric demand.' };
      D.push(x); labels.push(rows[i][0]);
    }
    var n = D.length, w = Math.max(1, Math.round(v.w));
    if (n < w + 1) return { error: "Enter at least " + (w + 1) + " periods for a window of " + w + "." };

    // moving average forecast for each period t (0-based), defined for t >= w
    var fMA = [];
    for (var t = 0; t < n + 1; t++) {
      if (t < w) { fMA[t] = NaN; continue; }
      var s = 0; for (var j = t - w; j < t; j++) s += D[j];
      fMA[t] = s / w;
    }
    // exponential smoothing, F[0] undefined, F[1] = D[0]
    var fES = [NaN, D[0]];
    for (var t2 = 2; t2 <= n; t2++) fES[t2] = v.alpha * D[t2 - 1] + (1 - v.alpha) * fES[t2 - 1];

    // errors over the window where both methods have a forecast: periods w .. n-1
    var eMA = 0, eES = 0, pMA = 0, pES = 0, cnt = 0;
    for (var t3 = w; t3 < n; t3++) {
      var a = D[t3];
      eMA += Math.abs(a - fMA[t3]); eES += Math.abs(a - fES[t3]);
      if (a !== 0) { pMA += Math.abs(a - fMA[t3]) / Math.abs(a); pES += Math.abs(a - fES[t3]) / Math.abs(a); }
      cnt++;
    }
    var madMA = eMA / cnt, madES = eES / cnt, mapeMA = pMA / cnt * 100, mapeES = pES / cnt * 100;
    var nextMA = fMA[n], nextES = fES[n];
    var better = madMA <= madES ? "moving average" : "exponential smoothing";
    var best = madMA <= madES ? nextMA : nextES;

    var histPts = D.map(function (d, i) { return [i + 1, d]; });
    var maPts = [], esPts = [];
    for (var t4 = w; t4 <= n; t4++) maPts.push([t4 + 1, fMA[t4]]);
    for (var t5 = 1; t5 <= n; t5++) esPts.push([t5 + 1, fES[t5]]);

    return {
      verdict: { state: "good", html: "Lower error: <b>" + better + "</b>. Next-period forecast about <b>" +
        TK.n(best, 0) + "</b>." },
      results: [
        { label: "Moving average forecast", value: TK.n(nextMA, 1), big: true,
          state: madMA <= madES ? "good" : "" },
        { label: "Exponential smoothing forecast", value: TK.n(nextES, 1), big: true,
          state: madES < madMA ? "good" : "" },
        { label: "MAD (MA / ES)", value: TK.n(madMA, 1) + " / " + TK.n(madES, 1),
          note: "Average miss in units, over " + cnt + " periods." },
        { label: "MAPE (MA / ES)", value: TK.n(mapeMA, 1) + "% / " + TK.n(mapeES, 1) + "%",
          note: "Average miss in percent." },
        { label: "Periods of history", value: String(n) },
        { label: "Average demand", value: TK.n(D.reduce(function (a, b) { return a + b; }, 0) / n, 1) }
      ],
      tables: [{
        title: "History against both forecasts",
        head: ["Period", "Actual", "Moving average", "Error", "Exp. smoothing", "Error"],
        rows: D.map(function (d, i) {
          var inWin = i >= w;
          return { cls: inWin ? "" : "", cells: [TK.esc(labels[i]), TK.n(d, 0),
            TK.isNum(fMA[i]) ? TK.n(fMA[i], 1) : "—", inWin ? TK.n(d - fMA[i], 1) : "—",
            TK.isNum(fES[i]) ? TK.n(fES[i], 1) : "—", inWin ? TK.n(d - fES[i], 1) : "—"] };
        }).concat([{ cls: "hl", cells: ["<b>Next period</b>", "—", "<b>" + TK.n(nextMA, 1) + "</b>", "—",
          "<b>" + TK.n(nextES, 1) + "</b>", "—"] }])
      }],
      charts: [TK.line({
        series: [{ pts: histPts, color: "var(--blue)" },
                 { pts: maPts, color: "var(--copper)", dash: true },
                 { pts: esPts, color: "var(--blue-dim)", dash: true }],
        xLabel: "Period", yLabel: "Demand", yZero: true,
        title: "Demand history and forecasts",
        caption: "Solid blue = actual demand. Dashed brown = moving average, dashed light blue = exponential smoothing."
      })],
      notes: ["Errors are measured over the same " + cnt + " periods for both methods, so the comparison is fair.",
              "A high α behaves like “last period”; a low α smooths noise but lags a trend."]
    };
  },
  howRead: [
    "MAD is the average miss in units; MAPE is the average miss in percent.",
    "A very high α behaves like “last period”; a low α smooths noise but lags.",
    "If both methods miss badly in the same direction, you have a trend and need a trend method."
  ],
  formulas: ["MA: Fₜ = (Dₜ₋₁ + … + Dₜ₋ₖ) / k", "ES: Fₜ = α·Dₜ₋₁ + (1 − α)·Fₜ₋₁",
             "MAD = mean |D − F|;  MAPE = mean(|D − F| / D)"],
  watch: ["Do not compare forecasts over different time spans.",
          "Seasonality needs a seasonal method, not these.",
          "Neither method projects a trend, so both lag steadily growing demand."],
  source: ["Standard time-series forecasting as taught in operations management; IIM Sirmaur operations coursework. Default history is illustrative."]
});
