TK.tool({
  slug: "pitch-builder", parent: "communication-tools.html", parentLabel: "Communication",
  label: "Communication tool", title: "Pitch builder (four phases, 20 minutes)",
  intro: "Plan a short pitch in four timed phases and build the “big idea” statement, following the structure in Pitch Anything.",
  useWhen: "You have one short slot to get a decision, and you need the time plan as much as the words.",
  fields: [
    { k: "mins", label: "Time you have", unit: "min", value: 20.00, step: 1, min: 1, group: "The slot" },
    { k: "record", label: "Phase 1 · Your track record (one or two wins, not a CV)", type: "textarea", wide: true, rows: 2,
      value: "Led a solutions engineering team for six years; built its first knowledge-management system.",
      group: "Phase 1 · Frame and track record" },
    { k: "econ", label: "Why now: economic force", type: "textarea", wide: true, rows: 2,
      value: "Customers expect quotations in days, and engineering hours are the main cost of each proposal." },
    { k: "social", label: "Why now: social force", type: "textarea", wide: true, rows: 2,
      value: "Experienced engineers are retiring or moving, and new engineers expect to search, not to ask." },
    { k: "tech", label: "Why now: technology force", type: "textarea", wide: true, rows: 2,
      value: "AI copilots can now search our own documents securely inside the tools we already use." },
    { k: "forWho", label: "Idea statement · For (target users)", type: "text", wide: true,
      value: "solutions engineers", group: "The big idea" },
    { k: "dissat", label: "…who are dissatisfied with", type: "text", wide: true,
      value: "searching old projects by memory and email" },
    { k: "category", label: "…my idea is a (category)", type: "text", wide: true,
      value: "AI knowledge copilot" },
    { k: "provides", label: "…that provides", type: "text", wide: true,
      value: "a proven starting solution for any new enquiry in minutes" },
    { k: "unlike", label: "…unlike", type: "text", wide: true,
      value: "shared folders and personal notes" },
    { k: "features", label: "…my idea (key features)", type: "textarea", wide: true, rows: 2,
      value: "answers in plain language, links to the source project and learns from every closed job" },
    { k: "budget", label: "Phase 2 · Budget and key advantage (“secret sauce”)", type: "textarea", wide: true, rows: 3,
      value: "Runs on licences we already own. Our advantage is 1,000+ structured past solutions that no outside tool has.",
      group: "Phase 2 and 3" },
    { k: "offer", label: "Phase 3 · The offer (what they get, when, and their part)", type: "textarea", wide: true, rows: 3,
      value: "A working pilot for one team in 12 weeks. We need one IT contact and four hours a week from two senior engineers." }
  ],
  compute: function (v) {
    var blocks = [
      { name: "Track record", ok: TK.filled(v.record) },
      { name: "Why now (three forces)", ok: TK.filled(v.econ, v.social, v.tech) },
      { name: "Idea statement", ok: TK.filled(v.forWho, v.dissat, v.category, v.provides, v.unlike, v.features) },
      { name: "Budget and secret sauce", ok: TK.filled(v.budget) },
      { name: "The offer", ok: TK.filled(v.offer) }
    ];
    var done = blocks.filter(function (b) { return b.ok; }).length;

    var art = /^[aeiou]/i.test(String(v.category).trim()) ? "an" : "a";
    var idea = "";
    if (blocks[2].ok) {
      idea = "For " + v.forWho.trim() + " who are dissatisfied with " + v.dissat.trim().replace(/\.$/, "") +
        ", my idea is " + art + " " + v.category.trim() + " that provides " + v.provides.trim().replace(/\.$/, "") +
        ". Unlike " + v.unlike.trim().replace(/\.$/, "") + ", it " + v.features.trim().replace(/\.$/, "") + ".";
    }
    var words = TK.words(idea);

    var split = [5, 10, 2, 3], names = [
      "Frame, track record and “why now”", "The big idea, budget and secret sauce",
      "Offer the deal", "Stack frames and close"];
    var phases = split.map(function (s, i) {
      return { name: names[i], min: v.mins * s / 20, share: s / 20 * 100 };
    });
    var st = done === 5 ? "good" : done >= 3 ? "warn" : "bad";

    return {
      verdict: { state: st, html: done === 5
        ? "All five building blocks are in place. Rehearse against the time plan."
        : "<b>" + done + " of 5</b> building blocks ready. Missing: " +
          blocks.filter(function (b) { return !b.ok; }).map(function (b) { return "<b>" + b.name + "</b>"; }).join(", ") + "." },
      results: [
        { label: "Pitch length", value: TK.n(v.mins, 0), unit: "min", big: true },
        { label: "Building blocks ready", value: done + " / 5", big: true, state: st },
        { label: "Idea statement", value: TK.n(words, 0), unit: "words", big: true,
          state: words > 0 && words <= 70 ? "good" : words === 0 ? "bad" : "warn",
          note: words ? "About " + (words / 130 >= 1 ? TK.n(words / 130, 1) + " minutes" : TK.n(words / 130 * 60, 0) + " seconds") + " to say" : "Fill the six idea fields." },
        { label: "Longest phase", value: TK.n(phases[1].min, 1), unit: "min",
          note: "Phase 2 carries half the pitch." }
      ],
      tables: [{
        title: "Time plan",
        head: ["Phase", "What happens", "Minutes", "Share"],
        rows: phases.map(function (p, i) {
          return { cls: i === 1 ? "hl" : "", cells: ["Phase " + (i + 1), p.name, TK.n(p.min, 1), TK.n(p.share, 0) + "%"] };
        })
      }, {
        title: "Building blocks",
        head: ["Block", "Status"],
        rows: blocks.map(function (b) {
          return { cls: b.ok ? "" : "crit", cells: [b.name, b.ok ? "ready" : "missing"] };
        })
      }],
      notes: idea ? ['<b>Your idea statement:</b><div class="draft">' + TK.esc(idea) + "</div>",
                     "Say the “why now” opening before the idea statement — it shows the idea is moving with the market, not just with you."]
                  : ["Fill the six idea fields to generate the statement."]
    };
  },
  howRead: [
    "The time plan scales the book's 5 / 10 / 2 / 3 minute split to the time you have.",
    "Say the “why now” opening before the idea statement. It shows the idea is moving with the market.",
    "Phase 4 is where the decision is made. Do not spend it repeating phase 2."
  ],
  formulas: ["Phase time = time available × (5, 10, 2, 3) ÷ 20",
             "Idea statement = For [users] who are dissatisfied with [current way], my idea is a [category] that provides [benefit]. Unlike [alternative], it [key features]."],
  watch: ["Explaining every detail in phase 2. The book's point is control of attention and time, not completeness.",
          "The book is written for deal-making with investors and its tone is combative. For internal or in-company pitches, keep the structure and soften the tone.",
          "Skipping the offer. People cannot say yes to something that was never stated."],
  source: ["Oren Klaff, <i>Pitch Anything</i> — the four-phase structure and the idea-statement template. Default content is an illustrative example."]
});
