TK.tool({
  slug: "sticky-idea-checker", parent: "communication-tools.html", parentLabel: "Communication",
  label: "Communication tool", title: "Sticky idea checker (six principles)",
  intro: "Score a message against the six principles from Made to Stick and see which one to fix first.",
  useWhen: "You have a message that is technically correct but nobody repeats it.",
  fields: [
    { k: "msg", label: "Your message", type: "textarea", wide: true, rows: 3,
      value: "Find any proven tooling solution in three minutes, not thirty.",
      hint: "One or two sentences — the version you would actually say." },
    { k: "simple", label: "Simple", type: "sel", value: "2", group: "Score each principle",
      options: [{ v: "0", t: "0 · Missing" }, { v: "1", t: "1 · Partly" }, { v: "2", t: "2 · Strong" }],
      hint: "Is there one core idea, stripped to its essence?" },
    { k: "unexpected", label: "Unexpected", type: "sel", value: "1",
      options: [{ v: "0", t: "0 · Missing" }, { v: "1", t: "1 · Partly" }, { v: "2", t: "2 · Strong" }],
      hint: "Does it break a pattern or open a gap the listener wants closed?" },
    { k: "concrete", label: "Concrete", type: "sel", value: "2",
      options: [{ v: "0", t: "0 · Missing" }, { v: "1", t: "1 · Partly" }, { v: "2", t: "2 · Strong" }],
      hint: "Can you picture it? Sensory, specific, not abstract." },
    { k: "credible", label: "Credible", type: "sel", value: "1",
      options: [{ v: "0", t: "0 · Missing" }, { v: "1", t: "1 · Partly" }, { v: "2", t: "2 · Strong" }],
      hint: "Why should they believe it — a detail, a source, a test they can run?" },
    { k: "emotional", label: "Emotional", type: "sel", value: "1",
      options: [{ v: "0", t: "0 · Missing" }, { v: "1", t: "1 · Partly" }, { v: "2", t: "2 · Strong" }],
      hint: "Does it make them care, about a person rather than a number?" },
    { k: "story", label: "Story", type: "sel", value: "0",
      options: [{ v: "0", t: "0 · Missing" }, { v: "1", t: "1 · Partly" }, { v: "2", t: "2 · Strong" }],
      hint: "Is there a story that makes people act, not just understand?" }
  ],
  compute: function (v) {
    var keys = [
      { k: "simple", name: "Simple", fix: "Cut until one idea is left. Lead with the core, not the context." },
      { k: "unexpected", name: "Unexpected", fix: "Open a gap: state the surprising consequence before the explanation." },
      { k: "concrete", name: "Concrete", fix: "Replace an abstraction with something you can picture or count." },
      { k: "credible", name: "Credible", fix: "Add one verifiable detail, or an invitation to test it themselves." },
      { k: "emotional", name: "Emotional", fix: "Make it about one person affected, not the aggregate." },
      { k: "story", name: "Story", fix: "Tell a 30-second story of one case, with a before and an after." }
    ];
    var scored = keys.map(function (x, i) { return { name: x.name, fix: x.fix, idx: i, s: TK.clamp(TK.num(v[x.k]) || 0, 0, 2) }; });
    var total = scored.reduce(function (a, b) { return a + b.s; }, 0);
    var words = TK.words(v.msg);
    var weakest = scored.slice().sort(function (a, b) { return a.s - b.s || a.idx - b.idx; })[0];
    var st = total >= 10 ? "good" : total >= 7 ? "warn" : "bad";
    var verdict = total >= 10 ? "Sticky: <b>" + total + " of 12</b>. This should travel."
      : total >= 7 ? "Partly sticky: <b>" + total + " of 12</b>. Fix the weakest principles."
      : "Unlikely to stick: <b>" + total + " of 12</b>. Start with Simple and Concrete.";

    return {
      verdict: { state: st, html: verdict },
      results: [
        { label: "Stickiness score", value: total + " / 12", big: true, state: st },
        { label: "Message length", value: TK.n(words, 0), unit: "words", big: true,
          state: words > 0 && words <= 25 ? "good" : words === 0 ? "bad" : "warn",
          note: words > 25 ? "Long for a line people repeat." : words ? "Short enough to repeat." : "Write the message first." },
        { label: "Fix first", value: weakest.name, big: true, state: weakest.s <= 1 ? "warn" : "good" },
        { label: "Principles scoring 2", value: String(scored.filter(function (s) { return s.s === 2; }).length) + " of 6" }
      ],
      tables: [{
        title: "Principle by principle",
        head: ["Principle", "Score", "If it is low"],
        rows: scored.map(function (s) {
          return { cls: s.s === 0 ? "crit" : s.s === 1 ? "hl" : "",
            cells: [s.name, s.s + " / 2", s.s === 2 ? "—" : s.fix] };
        })
      }],
      charts: [TK.bar({
        groups: scored.map(function (s) { return { label: s.name.slice(0, 9), values: [s.s] }; }),
        yMax: 2, yLabel: "Score (0–2)",
        title: "Score by principle",
        caption: "The shortest bar is the cheapest improvement."
      })],
      notes: ["A message does not need all six to work, and the book says so. It does need <b>Simple</b>.",
              "The bands here (10+ sticky, 7–9 partly, below 7 unlikely) are a working rule for this tool, not from the book."]
    };
  },
  howRead: [
    "A message does not need all six to work, and the book says so. It does need “Simple”.",
    "A low “Emotional” or “Story” score is normal for technical messages and is usually the cheapest thing to add.",
    "Ask a colleague to score the same message without seeing your scores. The difference shows what you are assuming."
  ],
  formulas: ["Stickiness = sum of the six scores (each 0 to 2), maximum 12",
             "Verdict: 10 or more is sticky, 7 to 9 partly, below 7 unlikely (these bands are a working rule for this tool, not from the book)"],
  watch: ["Scoring your own message generously. You already know what you mean; the listener does not.",
          "Treating “Simple” as “short”. A short slogan that is not the core idea scores 0.",
          "Adding statistics to raise “Credible”. One concrete detail usually does more."],
  source: ["Chip Heath and Dan Heath, <i>Made to Stick</i> — the six principles (SUCCESs). Default content is an illustrative example."]
});
