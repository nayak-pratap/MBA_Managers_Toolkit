TK.tool({
  slug: "tolerance-stack", parent: "engineering-tools.html", parentLabel: "Engineering",
  label: "Engineering calculator", title: "Tolerance stack-up (worst case and RSS)",
  intro: "Add up the tolerances of parts in a chain to find the gap or length variation, with worst-case and statistical (RSS) results.",
  useWhen: "A gap, clearance or fit is built from several parts and you need to know whether every assembly will work.",
  fields: [
    { k: "chain", label: "Parts in the chain", type: "textarea", wide: true, rows: 6,
      value: "Housing bore, +, 50, 0.10\nSpacer, -, 12, 0.05\nBearing, -, 20, 0.05\nShaft shoulder, -, 15, 0.08",
      hint: "One part per line: <b>name, + or −, nominal, ± tolerance</b>. Use + for dimensions that open the gap and − for those that close it." },
    { k: "lo", label: "Minimum gap needed", unit: "mm", value: 2.00, step: 0.05, group: "Requirement" },
    { k: "hi", label: "Maximum gap allowed", unit: "mm", value: 3.50, step: 0.05 }
  ],
  compute: function (v) {
    var rows = TK.rows(v.chain, 4);
    if (rows.length < 2) return { error: "Enter at least two parts, one per line, as <b>name, + or −, nominal, tolerance</b>." };
    var nominal = 0, sumTol = 0, sumSq = 0, items = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], sign = /-|−/.test(r[1]) ? -1 : 1;
      var nom = TK.num(r[2]), tol = Math.abs(TK.num(r[3]));
      if (!TK.isNum(nom) || !TK.isNum(tol)) return { error: 'Line ' + (i + 1) + ' ("' + TK.esc(r[0]) + '") needs a numeric nominal and tolerance.' };
      nominal += sign * nom; sumTol += tol; sumSq += tol * tol;
      items.push({ name: r[0], sign: sign, nom: nom, tol: tol });
    }
    var rss = Math.sqrt(sumSq);
    var wcLo = nominal - sumTol, wcHi = nominal + sumTol;
    var rsLo = nominal - rss, rsHi = nominal + rss;
    var wcOk = wcLo >= v.lo && wcHi <= v.hi;
    var rsOk = rsLo >= v.lo && rsHi <= v.hi;
    var st = wcOk ? "good" : rsOk ? "warn" : "bad";

    items.sort(function (a, b) { return b.tol - a.tol; });

    return {
      verdict: { state: st, html: wcOk
        ? "Every assembly fits, even at worst case: gap <b>" + TK.n(wcLo, 3) + " to " + TK.n(wcHi, 3) + " mm</b>."
        : rsOk
          ? "Worst case falls outside the limits (<b>" + TK.n(wcLo, 3) + " to " + TK.n(wcHi, 3) +
            " mm</b>) but the statistical range fits. You are accepting a small reject rate."
          : "The stack does not fit: even the statistical range (<b>" + TK.n(rsLo, 3) + " to " + TK.n(rsHi, 3) +
            " mm</b>) falls outside " + TK.n(v.lo, 2) + "–" + TK.n(v.hi, 2) + " mm. Tighten the largest contributor." },
      results: [
        { label: "Nominal gap", value: TK.n(nominal, 3), unit: "mm", big: true },
        { label: "Worst-case range", value: TK.n(wcLo, 3) + " to " + TK.n(wcHi, 3), unit: "mm", big: true,
          state: wcOk ? "good" : "bad" },
        { label: "RSS range", value: TK.n(rsLo, 3) + " to " + TK.n(rsHi, 3), unit: "mm", big: true,
          state: rsOk ? "good" : "bad" },
        { label: "Total tolerance: worst case / RSS", value: "±" + TK.n(sumTol, 3) + " / ±" + TK.n(rss, 3), unit: "mm" },
        { label: "RSS saving against worst case", value: TK.n((1 - rss / sumTol) * 100, 0), unit: "%",
          note: "How much tolerance the statistical method frees up." },
        { label: "Parts in the chain", value: String(rows.length),
          note: rows.length < 3 ? "RSS needs at least three parts to be meaningful." : "Enough for RSS to apply." }
      ],
      tables: [{
        title: "Who contributes the variation",
        head: ["Part", "Direction", "Nominal", "± Tolerance", "Share of RSS variation"],
        rows: items.map(function (it, i) {
          return { cls: i === 0 ? "hl" : "", cells: [TK.esc(it.name), it.sign > 0 ? "+ adds" : "− subtracts",
            TK.n(it.nom, 3), "±" + TK.n(it.tol, 3), TK.n(sumSq ? it.tol * it.tol / sumSq * 100 : 0, 1) + "%"] };
        })
      }],
      charts: [TK.bar({
        groups: items.map(function (it) { return { label: String(it.name).slice(0, 10), values: [it.tol] }; }),
        yLabel: "± Tolerance (mm)", title: "Tolerance by part",
        caption: "Tighten the tallest bar first — it is the cheapest improvement."
      })],
      notes: ["Worst case assumes every part sits at its limit in the unlucky direction at the same time.",
              "RSS assumes centred, independent, roughly normal processes. State that assumption when you use it."]
    };
  },
  howRead: [
    "<b>Worst case</b> = every part at its limit in the unlucky direction. It is safe but expensive.",
    "<b>RSS</b> accepts a small risk for looser tolerances. State the assumed capability when you use it.",
    "Tighten the top row of the contribution table first: it is the cheapest improvement."
  ],
  formulas: ["Nominal = Σ (sign · nominal)", "Worst case = nominal ± Σ tol", "RSS = nominal ± √(Σ tol²)",
             "Share of variation = tol² / Σ tol²"],
  watch: ["The direction (+ or −) is the most common error. Draw the loop first.",
          "Do not use RSS on a stack with fewer than 3 parts or with non-centred processes.",
          "This is a one-dimensional stack. Angles and geometric tolerances need more advanced methods."],
  source: ["<i>Montgomery and Runger</i>, statistical tolerancing, and standard GD&T stack-up practice.",
           "B.Tech engineering-metrology course material. Default values are illustrative."]
});
