TK.tool({
  slug: "negotiation-prep", parent: "communication-tools.html", parentLabel: "Communication",
  label: "Communication tool", title: "Negotiation prep sheet (one sheet and offer ladder)",
  intro: "Prepare a negotiation on one sheet and calculate a four-step offer ladder, following Never Split the Difference.",
  useWhen: "You have a price conversation coming and want a plan rather than a reaction.",
  fields: [
    { k: "role", label: "Your role", type: "sel", value: "buy", wide: true,
      options: [{ v: "buy", t: "I am buying (I want a lower price)" }, { v: "sell", t: "I am selling (I want a higher price)" }] },
    { k: "target", label: "Your target price (your goal)", unit: "", value: 1200000, step: 1000, min: 0,
      group: "The numbers", hint: "The best realistic outcome, not your walk-away point." },
    { k: "theirs", label: "Their opening price (0 if unknown)", unit: "", value: 1650000, step: 1000, min: 0 },
    { k: "facts", label: "Summary of the known facts (a couple of sentences)", type: "textarea", wide: true, rows: 3,
      value: "We have used their software for three years and renewal is due in six weeks. Their quote is up 22% and adds modules we did not ask for.",
      group: "The one sheet" },
    { k: "labels", label: "Labels: name what they may feel or accuse you of (three to five)", type: "textarea", wide: true, rows: 4,
      value: "It seems like you feel we only care about price and not about your support.\n" +
             "It sounds like the new modules matter a lot to your targets this year.\n" +
             "It looks like you think we will renew whatever the price is.",
      hint: "One per line. Start with “It seems like…”, “It sounds like…”, “It looks like…”." },
    { k: "questions", label: "Calibrated questions (three to five)", type: "textarea", wide: true, rows: 4,
      value: "What matters most to you in this renewal?\n" +
             "How would I justify this increase to our finance team?\n" +
             "What would need to be true for a three-year price to work for you?",
      hint: "One per line. Start with <b>How</b> or <b>What</b>, never <b>Why</b>." },
    { k: "noncash", label: "Non-cash items they could give", type: "textarea", wide: true, rows: 4,
      value: "Two extra training days a year\nA named support engineer\nPrice fixed for the full three years",
      hint: "One per line. These often close the gap more cheaply than price." }
  ],
  compute: function (v) {
    if (!(v.target > 0)) return { error: "Enter a target price above zero." };
    var buy = v.role === "buy";
    var labels = TK.lines(v.labels), qs = TK.lines(v.questions), nc = TK.lines(v.noncash);
    var sections = [
      { name: "Target price", ok: v.target > 0 },
      { name: "Known facts", ok: TK.filled(v.facts) },
      { name: "Labels (3–5)", ok: labels.length >= 3 && labels.length <= 5 },
      { name: "Calibrated questions (3–5)", ok: qs.length >= 3 && qs.length <= 5 },
      { name: "Non-cash items", ok: nc.length >= 1 }
    ];
    var done = sections.filter(function (s) { return s.ok; }).length;

    var mult = buy ? [0.65, 0.85, 0.95, 1.00] : [1.35, 1.15, 1.05, 1.00];
    var ladder = mult.map(function (m, i) {
      return { step: i + 1, pct: m * 100, amount: v.target * m };
    });
    // final figure nudged about 0.2% toward a non-round number, deterministically
    var dir = buy ? -1 : 1;
    var base = Math.round(v.target * (1 + dir * 0.002));
    var span = Math.max(11, Math.round(Math.abs(v.target) * 0.0005));
    var seed = 0, ds = String(Math.round(Math.abs(v.target)));
    for (var si = 0; si < ds.length; si++) seed = (seed * 31 + ds.charCodeAt(si) + si * 7) % 100003;
    var jitter = 1 + (seed % span);
    var precise = base + dir * jitter;
    ladder[3].amount = precise;

    var gap = v.theirs > 0 ? Math.abs(v.theirs - v.target) : NaN;
    var gapPct = v.theirs > 0 ? gap / v.theirs * 100 : NaN;
    var st = done === 5 ? "good" : done >= 3 ? "warn" : "bad";

    var qWhy = qs.filter(function (q) { return /^\s*why\b/i.test(q); });

    return {
      verdict: { state: st, html: done === 5
        ? "One sheet complete: <b>5 of 5</b> sections."
        : "<b>" + done + " of 5</b> sections ready. Missing: " +
          sections.filter(function (s) { return !s.ok; }).map(function (s) { return "<b>" + s.name + "</b>"; }).join(", ") + "." },
      results: [
        { label: "Sheet sections ready", value: done + " / 5", big: true, state: st },
        { label: "Your first offer", value: TK.n(ladder[0].amount, 0), big: true,
          note: TK.n(ladder[0].pct, 0) + "% of target" },
        { label: "Precise final figure", value: TK.n(precise, 0), big: true,
          note: "Non-round, close to target" },
        { label: "Gap: their opening vs your target", value: TK.isNum(gap) ? TK.n(gap, 0) : "—",
          note: TK.isNum(gapPct) ? TK.n(gapPct, 0) + "% of their opening" : "Their opening not entered." },
        { label: "Labels / questions / non-cash", value: labels.length + " / " + qs.length + " / " + nc.length,
          state: qWhy.length ? "warn" : "good",
          note: qWhy.length ? qWhy.length + ' question(s) start with "Why" — reword them.' : "Counts look right." }
      ],
      tables: [{
        title: "Offer ladder",
        head: ["Step", "% of target", "Amount", "Use it when"],
        rows: ladder.map(function (l, i) {
          return { cls: i === 3 ? "hl" : "", cells: ["Step " + l.step, TK.n(l.pct, 0) + "%", TK.n(l.amount, 0),
            ["Your anchor — deliver it calmly and then stop talking",
             "After a label and a question, not as a reflex",
             "Signal you are near your limit",
             "The precise, final figure — pair it with a non-cash ask"][i]] };
        })
      }, {
        title: "Your one sheet",
        head: ["Section", "Content"],
        rows: [
          { cls: TK.filled(v.facts) ? "" : "crit", cells: ["Known facts", TK.filled(v.facts) ? TK.esc(v.facts) : "not written yet"] }
        ].concat(labels.map(function (l, i) { return { cells: [i === 0 ? "Labels" : "", TK.esc(l)] }; }))
         .concat(qs.map(function (q, i) { return { cls: /^\s*why\b/i.test(q) ? "crit" : "",
            cells: [i === 0 ? "Questions" : "", TK.esc(q)] }; }))
         .concat(nc.map(function (n, i) { return { cells: [i === 0 ? "Non-cash asks" : "", TK.esc(n)] }; }))
      }],
      notes: ["The ladder is a plan for your offers, not a script. Between each step use labels and questions, and let silence do some work.",
              "A precise final figure reads as calculated. A round one reads as a guess that can be pushed.",
              "This is a preparation aid. Follow your company's purchasing rules and approval limits."]
    };
  },
  howRead: [
    "The ladder is a plan for your offers, not a script. Between each step use labels and questions.",
    "The first offer will feel extreme. That is its purpose: it anchors the range. Deliver it calmly.",
    "A precise final figure reads as calculated. A round one reads as a guess that can be pushed.",
    "Non-cash items often close the gap more cheaply than price."
  ],
  formulas: ["Buyer offers = target × 65%, 85%, 95%, 100%",
             "Seller offers (adaptation) = target × 135%, 115%, 105%, 100%",
             "Precise final figure = target adjusted by about 0.2% to a non-round number",
             "Gap = |their opening − your target|"],
  watch: ["Using an extreme anchor in a long-term relationship without empathy. The book pairs the ladder with labels and questions for a reason.",
          "Setting the target at your bottom line. The book asks you to write down the best case.",
          "Questions that start with “Why” tend to sound like accusations.",
          "This is a preparation aid. Follow your company's purchasing rules and approval limits."],
  source: ["Chris Voss, <i>Never Split the Difference</i> — labels, calibrated questions and the Ackerman offer ladder. The seller ladder is an adaptation. Default figures are illustrative."]
});
