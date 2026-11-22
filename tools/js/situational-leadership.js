TK.tool({
  slug: "situational-leadership", parent: "leadership-tools.html", parentLabel: "Leadership",
  label: "Leadership tool", title: "Situational leadership: choose your style",
  intro: "Match your leadership style to a team member's competence and commitment on a specific task.",
  useWhen: "You are delegating a task, a capable person seems demotivated, or a new starter is struggling.",
  fields: [
    { k: "skill", label: "Skill on this task", type: "sel", value: "low", wide: true,
      options: [{ v: "low", t: "Low: new to this task" }, { v: "some", t: "Some: has tried it once or twice" },
                { v: "mod", t: "Moderate: can do it with help" }, { v: "high", t: "High: fully capable" }] },
    { k: "commit", label: "Commitment (confidence and motivation)", type: "sel", value: "high", wide: true,
      options: [{ v: "high", t: "High: keen and confident" }, { v: "var", t: "Variable: up and down" },
                { v: "low", t: "Low: reluctant or discouraged" }] }
  ],
  compute: function (v) {
    var grid = {
      "low:high": "S1", "low:var": "S1", "low:low": "S2",
      "some:high": "S2", "some:var": "S2", "some:low": "S2",
      "mod:high": "S3", "mod:var": "S3", "mod:low": "S2",
      "high:high": "S4", "high:var": "S3", "high:low": "S3"
    };
    var styles = {
      S1: { name: "Directing", dir: "High", sup: "Low",
        how: "Tell, show, set clear steps and check often.",
        do1: ["Break the task into visible steps with a deadline for each.",
              "Demonstrate once, then watch them do it.",
              "Check in daily at first, and say explicitly that this is normal for a new task."],
        avoid: "Do not mistake their enthusiasm for capability and leave them alone." },
      S2: { name: "Coaching", dir: "High", sup: "High",
        how: "Direct the work and explain the why, while rebuilding confidence.",
        do1: ["Keep giving clear direction, but ask for their view before you decide.",
              "Explain the reasoning so they can make the next call themselves.",
              "Name what they are already doing well — this is the style where motivation is the constraint."],
        avoid: "Do not drop into pure instruction; the confidence gap is the real problem." },
      S3: { name: "Supporting", dir: "Low", sup: "High",
        how: "Let them lead the task and back their judgement.",
        do1: ["Ask what they want to do, then agree it rather than instruct.",
              "Be available but do not inspect the work.",
              "Help remove obstacles they cannot clear themselves."],
        avoid: "Do not step back in with instructions at the first wobble." },
      S4: { name: "Delegating", dir: "Low", sup: "Low",
        how: "Hand over the task, the decision and the credit.",
        do1: ["Agree the outcome and the reporting point, then leave it alone.",
              "Give them the authority, not just the work.",
              "Let them choose the method, even if it is not yours."],
        avoid: "Do not keep asking for updates you do not need — it reads as distrust." }
    };
    var key = v.skill + ":" + v.commit;
    var code = grid[key] || "S2", s = styles[code];
    var n = { S1: "1", S2: "2", S3: "3", S4: "4" }[code];

    return {
      verdict: { state: "good", html: "Use a <b>" + s.name + "</b> style (" + code + "). " +
        s.dir + " direction, " + s.sup.toLowerCase() + " support. " + s.how },
      results: [
        { label: "Recommended style", value: s.name, big: true, state: "good", note: "Style " + code },
        { label: "Direction", value: s.dir, big: true },
        { label: "Support", value: s.sup, big: true },
        { label: "Development level", value: "D" + n, note: "The matching readiness level for this task." }
      ],
      tables: [{
        title: "What to do this week",
        head: ["Do this"],
        rows: s.do1.map(function (d) { return { cells: [d] }; })
          .concat([{ cls: "crit", cells: ["<b>Avoid:</b> " + s.avoid] }])
      }, {
        title: "All four styles, for comparison",
        head: ["Style", "Direction", "Support", "Use when"],
        rows: [
          { cls: code === "S1" ? "hl" : "", cells: ["S1 Directing", "High", "Low", "New to the task, keen"] },
          { cls: code === "S2" ? "hl" : "", cells: ["S2 Coaching", "High", "High", "Some skill, confidence dipping"] },
          { cls: code === "S3" ? "hl" : "", cells: ["S3 Supporting", "Low", "High", "Capable, but hesitant or variable"] },
          { cls: code === "S4" ? "hl" : "", cells: ["S4 Delegating", "Low", "Low", "Fully capable and committed"] }
        ]
      }],
      notes: ["The style belongs to the <b>task</b>, not the person. The same person may need Directing on one task and Delegating on another.",
              "Moving to a lighter style too early is the most common mistake; moving too late is the most demotivating."]
    };
  },
  howRead: [
    "The style belongs to the task, not the person: the same person may need Directing on one task and Delegating on another.",
    "If you are unsure between two styles, pick the more supportive one and move on quickly.",
    "Re-run this as the person develops; the right style changes within weeks on a new task."
  ],
  formulas: ["Skill low + commitment high → Directing", "Skill low/some → Coaching",
             "Skill moderate/high + variable commitment → Supporting", "Skill high → Delegating"],
  watch: ["Over-directing capable people lowers motivation.",
          "Delegating to someone who is not ready sets them up to fail.",
          "Judge skill on this task, not on seniority or years of service."],
  source: ["Hersey and Blanchard, Situational Leadership; Blanchard's SLII model. Part of the graded IIM Sirmaur core-frameworks assignment."]
});
