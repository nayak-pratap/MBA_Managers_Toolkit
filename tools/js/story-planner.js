TK.tool({
  slug: "story-planner", parent: "communication-tools.html", parentLabel: "Communication",
  label: "Communication tool", title: "Story planner (StoryBrand seven parts)",
  intro: "Build a clear message in seven parts, with your audience as the hero and you as the guide, and get a one-line statement you can say out loud.",
  useWhen: "You are writing a proposal, a profile, a landing page or an introduction and the message keeps coming out about you instead of them.",
  fields: [
    { k: "character", label: "1 · The character (who is the hero?)", type: "text", wide: true,
      value: "Manufacturing and engineering leaders", group: "1 · A character" },
    { k: "want", label: "…and what they want", type: "text", wide: true,
      value: "want proven machining solutions in front of customers faster",
      hint: "Start with a verb, so it reads on from the character." },
    { k: "external", label: "2 · Their external problem", type: "textarea", wide: true, rows: 2,
      value: "their engineering knowledge is scattered, so teams solve the same problem twice", group: "2 · Has a problem" },
    { k: "internal", label: "…the internal problem (how it makes them feel)", type: "textarea", wide: true, rows: 2,
      value: "Frustrated that hard-won experience keeps walking out of the door" },
    { k: "philos", label: "…the philosophical problem (why it is wrong)", type: "textarea", wide: true, rows: 2,
      value: "Knowledge a company has already paid for should not have to be paid for twice" },
    { k: "empathy", label: "3 · You as guide: empathy", type: "textarea", wide: true, rows: 2,
      value: "I have led a solutions engineering team through exactly this problem", group: "3 · And meets a guide" },
    { k: "authority", label: "…and authority", type: "textarea", wide: true, rows: 2,
      value: "Built an AI-assisted knowledge system that cut search time by about 90% and revision hours by about 60%" },
    { k: "plan", label: "4 · The plan (the steps to work with you)", type: "textarea", wide: true, rows: 4,
      value: "Map where knowledge lives and where time is lost\nBuild one searchable, structured home for it\nAdd an AI copilot and reuse measures so it keeps improving",
      hint: "One step per line. Three to six steps.", group: "4 · Who gives them a plan" },
    { k: "planOne", label: "…the plan in one sentence", type: "text", wide: true,
      value: "I help them put that knowledge in one searchable, AI-assisted system" },
    { k: "ctaDirect", label: "5 · Direct call to action", type: "text", wide: true,
      value: "Book a 30-minute conversation", group: "5 · And calls them to action" },
    { k: "ctaTrans", label: "…and a transitional call to action", type: "text", wide: true,
      value: "Read the case study on my portfolio" },
    { k: "failure", label: "6 · The failure they avoid", type: "textarea", wide: true, rows: 2,
      value: "Repeated rework, slow quotations and lost expertise when experienced engineers leave",
      group: "6 · That helps them avoid failure" },
    { k: "success", label: "7 · The success they reach", type: "text", wide: true,
      value: "engineers find proven answers in minutes", group: "7 · And ends in success" }
  ],
  compute: function (v) {
    var steps = TK.lines(v.plan);
    var parts = [
      { n: 1, name: "A character", ok: TK.filled(v.character, v.want) },
      { n: 2, name: "Has a problem", ok: TK.filled(v.external, v.internal) },
      { n: 3, name: "And meets a guide", ok: TK.filled(v.empathy, v.authority) },
      { n: 4, name: "Who gives them a plan", ok: steps.length >= 3 && steps.length <= 6 && TK.filled(v.planOne) },
      { n: 5, name: "And calls them to action", ok: TK.filled(v.ctaDirect) },
      { n: 6, name: "That helps them avoid failure", ok: TK.filled(v.failure) },
      { n: 7, name: "And ends in success", ok: TK.filled(v.success) }
    ];
    var done = parts.filter(function (p) { return p.ok; }).length;
    var missing = parts.filter(function (p) { return !p.ok; });

    var one = "";
    if (TK.filled(v.character, v.want, v.external)) {
      one = v.character.trim() + " " + v.want.trim() + ", but " + v.external.trim().replace(/\.$/, "") + ".";
      if (TK.filled(v.planOne)) one += " " + v.planOne.trim().replace(/\.$/, "");
      if (TK.filled(v.success)) one += ", so " + v.success.trim().replace(/\.$/, "");
      one += ".";
    }
    var words = TK.words(one);
    var st = done === 7 ? "good" : done >= 5 ? "warn" : "bad";

    return {
      verdict: { state: st, html: done === 7
        ? "Complete story: <b>7 of 7</b> parts in place."
        : "<b>" + done + " of 7</b> parts in place. Missing: " +
          missing.map(function (p) { return "<b>" + p.n + " " + p.name + "</b>"; }).join(", ") + "." },
      results: [
        { label: "Story completeness", value: done + " / 7", big: true, state: st },
        { label: "Plan steps", value: String(steps.length), big: true,
          state: steps.length >= 3 && steps.length <= 6 ? "good" : "warn", note: "Aim for 3 to 6" },
        { label: "One-line statement length", value: TK.n(words, 0), unit: "words", big: true,
          state: words > 0 && words <= 60 ? "good" : words === 0 ? "bad" : "warn",
          note: words > 60 ? "Long for saying out loud." : words ? "About " + TK.n(words / 130 * 60, 0) + " seconds to say." : "Fill parts 1 and 2." },
        { label: "Calls to action", value: (TK.filled(v.ctaDirect) ? 1 : 0) + (TK.filled(v.ctaTrans) ? 1 : 0) + " of 2",
          note: "One direct, one transitional." }
      ],
      tables: [{
        title: "The seven parts",
        head: ["Part", "Status"],
        rows: parts.map(function (p) {
          return { cls: p.ok ? "" : "crit", cells: [p.n + " · " + p.name, p.ok ? "in place" : "missing or incomplete"] };
        })
      }, {
        title: "Your plan, as steps",
        head: ["Step", "What you do"],
        rows: steps.length ? steps.map(function (s, i) { return { cells: [String(i + 1), TK.esc(s)] }; })
          : [{ cls: "crit", cells: ["—", "No steps entered yet."] }]
      }],
      charts: one ? [] : [],
      notes: one ? ['<b>Your one-line statement:</b><div class="draft">' + TK.esc(one) + "</div>",
                    "Say it out loud. If it does not survive being spoken, it will not survive a meeting."]
                 : ["Fill in the character, what they want and the external problem to generate the one-line statement."]
    };
  },
  howRead: [
    "The score counts parts, not quality. A part can be “in place” and still be vague, so read each one again.",
    "The one-line statement should make a stranger say “tell me more”. If they ask “what does that mean?”, simplify.",
    "Use the direct call to action as your main button or closing line, and the transitional one beside it."
  ],
  formulas: ["Completeness = number of the seven parts that are filled in",
             "Part 2 needs the external and the internal problem; part 3 needs empathy and authority; part 4 needs 3 to 6 steps",
             'One-line statement = character + want, "but" problem. Plan, "so" success.'],
  watch: ["Making yourself the hero. In this framework the customer or reader is the hero and you are the guide.",
          "Selling only the external problem. The book argues people act on the internal one.",
          "Several calls to action of equal weight. Choose one direct action."],
  source: ["Donald Miller, <i>Building a StoryBrand</i> — the seven-part framework. Default content is an illustrative example."]
});
