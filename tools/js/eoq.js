TK.tool({
  slug: "eoq", parent: "operations-tools.html", parentLabel: "Operations",
  label: "Operations calculator", title: "Economic order quantity, reorder point and safety stock",
  intro: "Find how much to order and when, so that ordering and holding costs balance and you hold enough safety stock for your service level.",
  useWhen: "You are setting a reorder policy for tooling or consumables, or justifying why stock should go up or down.",
  fields: [
    { k: "D", label: "Annual demand", unit: "units/yr", value: 12000, step: 100, min: 0.01, group: "Demand and cost" },
    { k: "S", label: "Cost per order", unit: "$", value: 50.00, step: 1, min: 0 },
    { k: "H", label: "Holding cost per unit per year", unit: "$", value: 2.40, step: 0.1, min: 0.0001 },
    { k: "LT", label: "Lead time", unit: "weeks", value: 2.00, step: 0.5, min: 0, group: "Variability" },
    { k: "sd", label: "Std deviation of weekly demand", unit: "units", value: 60.00, step: 5, min: 0 },
    { k: "sl", label: "Service level", unit: "%", value: 95.00, step: 1, min: 50, max: 99.99 },
    { k: "price", label: "Unit price", unit: "$", value: 12.00, step: 0.5, min: 0 }
  ],
  compute: function (v) {
    if (!(v.H > 0) || !(v.D > 0)) return { error: "Annual demand and holding cost must both be above zero." };
    var Q = Math.sqrt(2 * v.D * v.S / v.H);
    if (!(Q > 0)) return { error: "With a zero ordering cost the EOQ is undefined. Enter a cost per order." };
    var orders = v.D / Q;
    var weeksBetween = 52 / orders;
    var z = TK.probit(TK.clamp(v.sl / 100, 0.5, 0.9999));
    var ss = z * v.sd * Math.sqrt(v.LT);
    var dlt = v.D / 52 * v.LT;
    var rop = dlt + ss;
    var cost = orders * v.S + (Q / 2) * v.H;
    var ssVal = ss * v.price;

    var pts = [];
    for (var i = 1; i <= 40; i++) {
      var q = Q * 2 * i / 40;
      pts.push([q, (v.D / q) * v.S + (q / 2) * v.H]);
    }

    return {
      verdict: { state: "good", html: "Order <b>" + TK.n(Q, 0) + " units</b> about <b>" + TK.n(orders, 1) +
        " times a year</b> (every " + TK.n(weeksBetween, 1) + " weeks), and reorder when stock falls to <b>" +
        TK.n(rop, 0) + " units</b>." },
      results: [
        { label: "Economic order quantity", value: TK.n(Q, 0), unit: "units", big: true },
        { label: "Orders per year", value: TK.n(orders, 1), big: true },
        { label: "Time between orders", value: TK.n(weeksBetween, 1), unit: "weeks" },
        { label: "Safety stock", value: TK.n(ss, 0), unit: "units", note: "z = " + TK.n(z, 3) + " for " + TK.n(v.sl, 2) + "% service." },
        { label: "Reorder point", value: TK.n(rop, 0), unit: "units", big: true,
          note: TK.n(dlt, 0) + " used during lead time + " + TK.n(ss, 0) + " safety." },
        { label: "Ordering + holding cost", value: TK.n(cost, 0), unit: "$/yr" },
        { label: "Safety stock value", value: TK.n(ssVal, 0), unit: "$" },
        { label: "Average inventory value", value: TK.n((Q / 2 + ss) * v.price, 0), unit: "$" }
      ],
      tables: [{
        title: "What a different order quantity would cost",
        head: ["Order quantity", "Orders per year", "Ordering cost ($)", "Holding cost ($)", "Total ($/yr)"],
        rows: [0.5, 0.75, 1, 1.5, 2].map(function (m) {
          var q = Q * m, oc = (v.D / q) * v.S, hc = (q / 2) * v.H;
          return { cls: m === 1 ? "hl" : "", cells: [TK.n(q, 0), TK.n(v.D / q, 1), TK.n(oc, 0), TK.n(hc, 0), TK.n(oc + hc, 0)] };
        })
      }],
      charts: [TK.line({
        series: [{ pts: pts }], markers: [{ x: Q, label: "EOQ" }],
        xLabel: "Order quantity (units)", yLabel: "Annual cost ($)", yZero: true,
        title: "Annual cost against order quantity",
        caption: "The total-cost curve is flat near the EOQ, so rounding to a pack size costs almost nothing."
      })],
      notes: ["At the EOQ, ordering cost and holding cost are equal — that is what the formula balances.",
              "Shortening the lead time is usually the cheapest way to cut safety stock: it scales with √LT."]
    };
  },
  howRead: [
    "Round the EOQ to a practical pack or pallet size; cost barely moves.",
    "Safety stock rises with lead time, demand variation and service level. Shortening lead time is the best lever because it enters as a square root.",
    "A service level above about 98% gets expensive quickly, because z climbs steeply."
  ],
  formulas: ["EOQ = √(2·D·S / H)", "Safety stock = z·σ·√LT",
             "Reorder point = demand during lead time + safety stock", "Cost = (D/Q)·S + (Q/2)·H"],
  watch: ["EOQ assumes constant demand and no quantity discounts.",
          "Use the same time unit for demand deviation and lead time.",
          "If the supplier has a minimum order quantity, that beats the EOQ."],
  source: ["Standard inventory theory (Wilson EOQ) as taught in operations management; IIM Sirmaur operations coursework. Default values are illustrative."]
});
