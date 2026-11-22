TK.tool({
  slug: "abc-analysis", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "ABC (Pareto) inventory classification",
  intro: "Rank items by annual usage value and split them into A, B and C classes so effort and control go where the money is.",
  useWhen: "You are setting stock policies, cycle-count frequencies, or deciding which items deserve a negotiated contract.",
  fields: [
    { k: "items", label: "Items", type: "textarea", wide: true, rows: 9,
      value: "Carbide insert CNMG, 40000, 4.2\nDrill 12 mm, 1800, 38\nEnd mill 16 mm, 2200, 55\nBoring bar, 150, 320\nTap M10, 900, 12\nCoolant (20 L), 600, 65\nCollet, 80, 45\nShim set, 300, 3",
      hint: "One item per line: <b>name, annual demand, unit cost</b>." },
    { k: "cutA", label: "A class cut-off", unit: "%", value: 80.00, step: 1, min: 1, max: 99, group: "Class boundaries" },
    { k: "cutB", label: "B class cut-off", unit: "%", value: 95.00, step: 1, min: 2, max: 99.9 }
  ],
  compute: function (v) {
    var rows = TK.rows(v.items, 3);
    if (!rows.length) return { error: "Enter at least one item as <b>name, annual demand, unit cost</b>." };
    var list = [];
    for (var i = 0; i < rows.length; i++) {
      var dem = TK.num(rows[i][1]), cost = TK.num(rows[i][2]);
      if (!TK.isNum(dem) || !TK.isNum(cost)) return { error: 'Line ' + (i + 1) + ' ("' + TK.esc(rows[i][0]) + '") needs a numeric demand and unit cost.' };
      list.push({ name: rows[i][0], dem: dem, cost: cost, val: dem * cost });
    }
    var total = list.reduce(function (a, b) { return a + b.val; }, 0);
    if (!(total > 0)) return { error: "The total annual value is zero. Check the demand and cost figures." };
    list.sort(function (a, b) { return b.val - a.val; });

    var cum = 0, cls = { A: [], B: [], C: [] };
    list.forEach(function (it) {
      var before = cum / total * 100;
      it.cls = before < v.cutA ? "A" : before < v.cutB ? "B" : "C";
      cum += it.val;
      it.cum = cum / total * 100;
      it.share = it.val / total * 100;
      cls[it.cls].push(it);
    });

    function sum(arr) { return arr.reduce(function (a, b) { return a + b.val; }, 0); }
    var n = list.length;
    var pareto = [];
    list.forEach(function (it, i) { pareto.push([i + 1, it.cum]); });

    return {
      verdict: { state: "good", html: "<b>" + cls.A.length + " of " + n + " items</b> carry <b>" +
        TK.n(sum(cls.A) / total * 100, 0) + "%</b> of the annual value. Put your contracts, cycle counts and " +
        "attention there, and run class C on simple rules." },
      results: ["A", "B", "C"].map(function (k) {
        return { label: "Class " + k, value: String(cls[k].length), unit: "items", big: k === "A",
          state: k === "A" ? "good" : "",
          note: TK.n(sum(cls[k]) / total * 100, 0) + "% of value (" + TK.n(cls[k].length / n * 100, 0) + "% of items)" };
      }).concat([
        { label: "Total annual value", value: TK.n(total, 0), unit: "$", big: true },
        { label: "Top item's share", value: TK.n(list[0].share, 1), unit: "%", note: TK.esc(list[0].name) }
      ]),
      tables: [{
        title: "Items ranked by annual value",
        head: ["Rank", "Item", "Demand", "Unit cost", "Annual value", "% of total", "Cumulative %", "Class"],
        rows: list.map(function (it, i) {
          return { cls: it.cls === "A" ? "hl" : "", cells: [String(i + 1), TK.esc(it.name), TK.n(it.dem, 0),
            TK.n(it.cost, 2), TK.n(it.val, 0), TK.n(it.share, 1) + "%", TK.n(it.cum, 1) + "%", it.cls] };
        })
      }],
      charts: [TK.line({
        series: [{ pts: pareto }],
        markers: [{ x: cls.A.length + 0.5, label: "A | B" }, { x: cls.A.length + cls.B.length + 0.5, label: "B | C" }],
        xLabel: "Items ranked by value", yLabel: "Cumulative % of value", yZero: true, yMax: 100,
        title: "Pareto curve of annual value",
        caption: "The steeper the start, the more concentrated your spend is."
      })],
      notes: ["An item is class A if the value accumulated before it is still under the A cut-off, so the item that crosses the line is included.",
              "High-value is not the same as critical. Add a criticality flag for items where a stock-out stops the line."]
    };
  },
  howRead: [
    "A short A class (often 10–20% of items) holding most of the value is normal.",
    "High-value but critical C items still need a safety stock policy; value is not criticality.",
    "Use the class to set cycle-count frequency: A monthly, B quarterly, C yearly is a common pattern."
  ],
  formulas: ["Annual value = demand × unit cost", "Class by cumulative % of total value"],
  watch: ["Classify using at least 12 months of data.",
          "Add a criticality flag (VED analysis) for items where a stock-out stops the line.",
          "Re-run it yearly: items move between classes as volumes change."],
  source: ["Standard ABC / Pareto inventory practice; IIM Sirmaur operations coursework. Default values are illustrative."]
});
