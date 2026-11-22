# MBA Managers Toolkit

A working library of management frameworks and **33 interactive calculators** for leading
technical teams through change. Everything runs in the browser — no build step, no server,
no dependencies, and nothing you type is stored or sent anywhere.

It started as an IIM Sirmaur assignment (four core frameworks, graded) and grew into fourteen
more for business transformation, plus a calculator for every tool the guide pages describe.

## Live site

Enable GitHub Pages on `main` / root, and the site serves from `index.html`.
All links are relative, so it also works from a local folder or any subdirectory.

## What's inside

### Frameworks and guides

| Page | Contents |
| --- | --- |
| `index.html` | Hub: section cards and jump links to every framework and tool |
| `core-frameworks.html` | **4 core frameworks**, graded assignment — Six Sigma DMAIC, Kotter's 8 Steps, Situational Leadership, the Balanced Scorecard — plus how the four connect and a quick-reference card |
| `transformation-frameworks.html` | **14 frameworks** grouped by the question they answer: where to compete (Porter's Five Forces, Value Chain, BCG, Blue Ocean), how to create value (Business Model Canvas, Design Thinking, Three Horizons, Technology Adoption Lifecycle), how to build capability (Dynamic Capabilities, SECI, McKinsey 7S), how to bring people along (ADKAR, Stakeholder Mapping), how to govern (NIST AI RMF) |
| `templates-calculators.html` | A framework picker plus four self-contained calculators: decision matrix, RICE scoring, payback and NPV, Cp/Cpk |
| `machining-tools.html` · `engineering-tools.html` · `operations-tools.html` · `leadership-tools.html` · `communication-tools.html` | Guide pages: for each tool, how to use it, when to use it, a full worked example, how to read the result, the formulas, what to watch out for, and the source it rests on |

### The 33 calculators — `tools/`

`tools/index.html` lists them all. Each opens with the worked example from its guide page
already filled in, so you can check the method before trusting it with your own numbers.

| Area | Calculators |
| --- | --- |
| **Machining** (9) | Speeds, feeds and power · Tool life (Taylor) · Engineered Productivity · Cost per part A vs B · Cutting forces and shear angle · Surface finish · Sheet metal (punch, bend, springback) · CNC cycle time · Customer value case |
| **Engineering and quality** (6) | Tolerance stack-up (worst case and RSS) · Shaft and hole fit · Reliability, MTBF, MTTR, availability · Process capability (Cp, Cpk, ppm) · Sample size and confidence interval · Unit converter |
| **Operations and planning** (7) | EOQ, reorder point, safety stock · ABC (Pareto) classification · Demand forecasting (MA and exponential smoothing) · Assembly line balancing · Critical path (CPM and PERT) · Break-even and make-or-buy · Earned value |
| **Leadership and team** (5) | Situational leadership style · Team capacity and workload · Value of reusing knowledge · Change readiness (Kotter) · KPI scorecard with traffic lights |
| **Communication and influence** (6) | Story planner (StoryBrand) · Sticky idea checker (Made to Stick) · Pitch builder (Pitch Anything) · Presentation and data-story planner · Negotiation prep and offer ladder · Influence map |

## How it's built

Plain static HTML, CSS and vanilla JavaScript. No framework, no bundler, nothing to install.

```
index.html                 hub
*-tools.html               guide pages (method, worked examples, formulas)
core-frameworks.html       the graded assignment
transformation-frameworks.html
templates-calculators.html self-contained calculators
style.css                  shared styling for every page
tools/
  index.html               all 33 calculators
  <slug>.html              one thin page per calculator
  tk.js                    the calculator harness
  tk.css                   calculator form styling
  js/<slug>.js             one spec + compute function per calculator
test/
  verify.mjs               checks each calculator against its documented worked example
  render.mjs               loads each page in a DOM and checks it renders and survives bad input
```

Each calculator is a small declarative spec — fields, a `compute(v)` function, formulas and
notes. `tools/tk.js` renders the form, recomputes live as you type, and draws the result
cards, tables and SVG charts. Adding a calculator means adding one file in `tools/js/` and
one thin HTML page.

To work on it locally:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

## Tests

Two suites, both runnable with Node and no network access.

```bash
node test/verify.mjs             # all 33 against their documented worked examples
node test/verify.mjs machining   # one area
node test/render.mjs             # all 33 rendered in a DOM (needs: npm i jsdom)
```

`verify.mjs` is the important one. Every guide page carries a worked example with every input
and every result spelled out; the suite feeds each calculator its documented inputs and
compares every documented figure against what the code produces. All 33 reproduce their
examples. Values that match only within tolerance are reported separately, and the single
intentional deviation is registered in the file with the reason.

`render.mjs` loads each page in a real DOM and checks that the form renders with labels, that
results appear, that typing changes them, that charts contain no invalid geometry, and that
zero, negative, empty, huge and non-numeric inputs produce a readable message rather than
`NaN` or a hang.

## Sources

Frameworks are drawn from coursework at IIM Sirmaur (Executive MBA with AI) and from an
engineering career in cutting tools and machining. Each tool names the texts it rests on —
Trent's *Metal Cutting*, Kalpakjian and Schmid, Montgomery and Runger, Kotter, Kaplan and
Norton, and the published framework literature for the management sections.

**All default values are illustrative.** They demonstrate the method; they are not
benchmarks, and none of them come from any employer's data.

---

Part of a portfolio across three pillars: Engineering, Management and Technology.
