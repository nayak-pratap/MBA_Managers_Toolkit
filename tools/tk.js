/* Manager's Toolkit — calculator harness. Vanilla JS, no dependencies.
   A tool page supplies a spec via TK.tool({...}); everything renders from it.
   Nothing is stored and nothing leaves the browser. */
(function (root) {
  "use strict";

  var TK = {};
  root.TK = TK;

  /* ---------- number helpers ---------- */
  function isNum(x) { return typeof x === "number" && isFinite(x); }
  TK.isNum = isNum;

  TK.n = function (x, dp) {                 // fixed decimals + thousands separators
    if (!isNum(x)) return "—";
    if (dp === undefined) dp = 2;
    var s = Math.abs(x).toFixed(dp), p = s.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (x < 0 ? "-" : "") + p.join(".");
  };
  TK.sig = function (x, n) {                // n significant figures, then grouped
    if (!isNum(x)) return "—";
    if (x === 0) return "0";
    n = n || 3;
    var mag = Math.floor(Math.log(Math.abs(x)) / Math.LN10);
    var dp = Math.max(0, n - 1 - mag);
    return TK.n(x, Math.min(dp, 6));
  };
  TK.pct = function (x, dp) { return TK.n(x, dp === undefined ? 1 : dp); };
  TK.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };

  /* parse a textarea into rows: one record per line, fields split on comma or tab */
  TK.rows = function (text, min) {
    var out = [];
    String(text || "").split(/\n+/).forEach(function (ln) {
      if (!ln.trim()) return;
      var parts = ln.split(/\t|,/).map(function (x) { return x.trim(); });
      if (min && parts.length < min) return;
      out.push(parts);
    });
    return out;
  };
  /* like TK.rows but splits on a given separator, so fields may contain commas */
  TK.rowsBy = function (text, sep, min) {
    var out = [];
    String(text || "").split(/\n+/).forEach(function (ln) {
      if (!ln.trim()) return;
      var parts = ln.split(sep).map(function (x) { return x.trim(); });
      if (min && parts.filter(function (x) { return x; }).length < min) return;
      out.push(parts);
    });
    return out;
  };
  /* one non-empty item per line */
  TK.lines = function (text) {
    return String(text || "").split(/\n+/).map(function (x) { return x.trim(); })
      .filter(function (x) { return x; });
  };
  TK.words = function (text) {
    var t = String(text || "").trim();
    return t ? t.split(/\s+/).length : 0;
  };
  TK.filled = function () {
    for (var i = 0; i < arguments.length; i++) {
      if (!String(arguments[i] === undefined || arguments[i] === null ? "" : arguments[i]).trim()) return false;
    }
    return true;
  };

  TK.num = function (x) { var n = parseFloat(String(x).replace(/[^0-9eE+\-.]/g, "")); return isFinite(n) ? n : NaN; };

  /* standard normal CDF via erfc (Numerical Recipes erfcc, rel. error ~1.2e-7) */
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
      t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
      t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  TK.normCdf = function (z) { return 0.5 * erfc(-z / Math.SQRT2); };
  TK.normSf = function (z) { return 0.5 * erfc(z / Math.SQRT2); };   // upper tail, accurate far out
  /* inverse standard normal (Acklam), |rel err| < 1.15e-9 — one-sided z for service levels */
  TK.probit = function (p) {
    if (!(p > 0 && p < 1)) return NaN;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00],
        b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01],
        c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00],
        d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var pl = 0.02425, q, r, x;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
          ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= 1 - pl) {
      q = p - 0.5; r = q * q;
      x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
          (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    // one Halley refinement
    var e = TK.normCdf(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  };
  TK.z = function (conf) {                                           // two-sided z for a confidence level
    var map = { 80: 1.281552, 90: 1.644854, 95: 1.959964, 98: 2.326348, 99: 2.575829, 99.9: 3.290527 };
    return map[conf] !== undefined ? map[conf] : 1.959964;
  };

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  TK.esc = esc;

  /* ---------- charts (viewBox 640x300, classes from style.css) ---------- */
  var CW = 640, CH = 300, M = { l: 58, r: 16, t: 16, b: 46 };

  function niceTicks(lo, hi, want) {
    if (!(hi > lo)) { hi = lo + 1; }
    var raw = (hi - lo) / (want || 5);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag, step;
    step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    step *= mag;
    var start = Math.ceil(lo / step) * step, out = [];
    for (var v = start; v <= hi + step * 0.001; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }
  function tickLabel(v) {
    var a = Math.abs(v);
    if (a === 0) return "0";
    if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(1);
    if (a >= 100) return TK.n(v, 0);
    if (a >= 10) return TK.n(v, a % 1 === 0 ? 0 : 1);
    if (a >= 1) return TK.n(v, a % 1 === 0 ? 0 : 2);
    return TK.n(v, 2);
  }

  /* line / curve chart. series:[{pts:[[x,y],…], color, dash}] */
  TK.line = function (o) {
    var series = (o.series || []).filter(function (s) { return s.pts && s.pts.length; });
    if (!series.length) return "";
    var xs = [], ys = [];
    series.forEach(function (s) { s.pts.forEach(function (p) { if (isNum(p[0]) && isNum(p[1])) { xs.push(p[0]); ys.push(p[1]); } }); });
    (o.points || []).forEach(function (p) { if (isNum(p.x) && isNum(p.y)) { xs.push(p.x); ys.push(p.y); } });
    (o.markers || []).forEach(function (m) { if (isNum(m.x)) xs.push(m.x); });
    if (!xs.length) return "";
    var x0 = o.xMin !== undefined ? o.xMin : Math.min.apply(null, xs);
    var x1 = o.xMax !== undefined ? o.xMax : Math.max.apply(null, xs);
    var y0 = o.yMin !== undefined ? o.yMin : Math.min.apply(null, ys);
    var y1 = o.yMax !== undefined ? o.yMax : Math.max.apply(null, ys);
    if (o.yZero && y0 > 0) y0 = 0;
    if (y1 === y0) { y1 = y0 + 1; }
    if (x1 === x0) { x1 = x0 + 1; }
    var yt = niceTicks(y0, y1, 5);
    if (yt.length) { y0 = Math.min(y0, yt[0]); y1 = Math.max(y1, yt[yt.length - 1]); }
    var px = function (v) { return M.l + (v - x0) / (x1 - x0) * (CW - M.l - M.r); };
    var py = function (v) { return CH - M.b - (v - y0) / (y1 - y0) * (CH - M.b - M.t); };
    var s = "";
    yt.forEach(function (v) {
      s += '<line x1="' + M.l + '" x2="' + (CW - M.r) + '" y1="' + py(v).toFixed(1) + '" y2="' + py(v).toFixed(1) + '" class="gr"/>';
      s += '<text x="' + (M.l - 6) + '" y="' + (py(v) + 4).toFixed(1) + '" text-anchor="end" class="tk">' + tickLabel(v) + '</text>';
    });
    niceTicks(x0, x1, 6).forEach(function (v) {
      s += '<text x="' + px(v).toFixed(1) + '" y="' + (CH - M.b + 16) + '" text-anchor="middle" class="tk">' + tickLabel(v) + '</text>';
    });
    s += '<line x1="' + M.l + '" x2="' + (CW - M.r) + '" y1="' + py(Math.max(y0, Math.min(0, y1))) .toFixed(1) + '" y2="' + py(Math.max(y0, Math.min(0, y1))).toFixed(1) + '" class="ax"/>';
    s += '<line x1="' + M.l + '" x2="' + M.l + '" y1="' + M.t + '" y2="' + (CH - M.b) + '" class="ax"/>';
    (o.markers || []).forEach(function (m) {
      s += '<line x1="' + px(m.x).toFixed(1) + '" x2="' + px(m.x).toFixed(1) + '" y1="' + M.t + '" y2="' + (CH - M.b) + '" class="vl"/>';
      if (m.label) s += '<text x="' + (px(m.x) + 4).toFixed(1) + '" y="' + (M.t + 12) + '" class="tl">' + esc(m.label) + '</text>';
    });
    series.forEach(function (sr) {
      var d = sr.pts.filter(function (p) { return isNum(p[0]) && isNum(p[1]); })
        .map(function (p, i) { return (i ? "L" : "M") + px(p[0]).toFixed(1) + " " + py(p[1]).toFixed(1); }).join(" ");
      s += '<path d="' + d + '" fill="none" style="stroke:' + (sr.color || "var(--blue)") + '" stroke-width="2.2"' +
        (sr.dash ? ' stroke-dasharray="6 4"' : "") + "/>";
    });
    (o.points || []).forEach(function (p) {
      if (!isNum(p.x) || !isNum(p.y)) return;
      s += '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="5" class="pt"/>';
      if (p.label) s += '<text x="' + (px(p.x) + 8).toFixed(1) + '" y="' + (py(p.y) - 8).toFixed(1) + '" class="tl">' + esc(p.label) + '</text>';
    });
    if (o.xLabel) s += '<text x="' + ((M.l + CW - M.r) / 2) + '" y="' + (CH - 6) + '" text-anchor="middle" class="tt">' + esc(o.xLabel) + '</text>';
    if (o.yLabel) s += '<text transform="rotate(-90)" x="' + (-(M.t + CH - M.b) / 2) + '" y="14" text-anchor="middle" class="tt">' + esc(o.yLabel) + '</text>';
    return fig(s, o);
  };

  /* grouped bar chart. groups:[{label, values:[…]}] */
  TK.bar = function (o) {
    var groups = o.groups || []; if (!groups.length) return "";
    var ns = groups[0].values.length, all = [];
    groups.forEach(function (g) { g.values.forEach(function (v) { if (isNum(v)) all.push(v); }); });
    if (!all.length) return "";
    var y1 = o.yMax !== undefined ? o.yMax : Math.max.apply(null, all);
    var y0 = Math.min(0, Math.min.apply(null, all));
    var yt = niceTicks(y0, y1, 4);
    if (yt.length) { y1 = Math.max(y1, yt[yt.length - 1]); y0 = Math.min(y0, yt[0]); }
    if (y1 === y0) y1 = y0 + 1;
    var bb = CH - 58;
    var py = function (v) { return bb - (v - y0) / (y1 - y0) * (bb - M.t); };
    var colors = o.colors || ["var(--blue2)", "var(--copper)", "var(--blue-dim)"];
    var s = "";
    yt.forEach(function (v) {
      s += '<line x1="' + M.l + '" x2="' + (CW - M.r) + '" y1="' + py(v).toFixed(1) + '" y2="' + py(v).toFixed(1) + '" class="gr"/>';
      s += '<text x="' + (M.l - 6) + '" y="' + (py(v) + 4).toFixed(1) + '" text-anchor="end" class="tk">' + tickLabel(v) + '</text>';
    });
    var span = (CW - M.l - M.r) / groups.length, bw = Math.min(46, span / (ns + 0.6));
    groups.forEach(function (g, gi) {
      var cx = M.l + span * (gi + 0.5);
      g.values.forEach(function (v, si) {
        if (!isNum(v)) return;
        var x = cx - (ns * bw) / 2 + si * bw;
        var top = Math.min(py(v), py(0)), h = Math.abs(py(v) - py(0));
        s += '<rect x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + (bw - 2).toFixed(1) +
          '" height="' + Math.max(h, 0.6).toFixed(1) + '" style="fill:' + colors[si % colors.length] + '"/>';
      });
      s += '<text x="' + cx.toFixed(1) + '" y="' + (bb + 16) + '" text-anchor="middle" class="tk">' + esc(g.label) + "</text>";
    });
    s += '<line x1="' + M.l + '" x2="' + (CW - M.r) + '" y1="' + py(0).toFixed(1) + '" y2="' + py(0).toFixed(1) + '" class="ax"/>';
    if (o.seriesLabels) o.seriesLabels.forEach(function (l, i) {
      var lx = M.l + 4 + i * 128;
      s += '<rect x="' + lx + '" y="' + (CH - 22) + '" width="10" height="10" style="fill:' + colors[i % colors.length] + '"/>';
      s += '<text x="' + (lx + 15) + '" y="' + (CH - 13) + '" class="tl">' + esc(l) + "</text>";
    });
    if (o.yLabel) s += '<text transform="rotate(-90)" x="' + (-(M.t + bb) / 2) + '" y="14" text-anchor="middle" class="tt">' + esc(o.yLabel) + "</text>";
    return fig(s, o);
  };

  function fig(inner, o) {
    return '<figure class="fig"><svg viewBox="0 0 ' + CW + " " + CH + '" role="img" aria-label="' +
      esc(o.title || o.caption || "Chart") + '" class="chart">' + inner + "</svg>" +
      (o.caption ? "<figcaption>" + o.caption + "</figcaption>" : "") + "</figure>";
  }

  /* ---------- rendering ---------- */
  function fieldHTML(f) {
    var id = "f_" + f.k, v = f.value;
    var unit = f.unit ? ' <span class="u">' + esc(f.unit) + "</span>" : "";
    var h = '<div class="tk-f' + (f.wide ? " wide" : "") + '" data-for="' + esc(f.k) + '">' +
      '<label for="' + id + '">' + esc(f.label) + unit + "</label>";
    if (f.type === "sel") {
      h += '<select id="' + id + '" data-k="' + esc(f.k) + '">' +
        (f.options || []).map(function (o) {
          var val = o.v !== undefined ? o.v : o, lab = o.t !== undefined ? o.t : o;
          return '<option value="' + esc(val) + '"' + (String(val) === String(v) ? " selected" : "") + ">" + esc(lab) + "</option>";
        }).join("") + "</select>";
    } else if (f.type === "textarea") {
      h += '<textarea id="' + id + '" data-k="' + esc(f.k) + '" rows="' + (f.rows || 3) + '" placeholder="' +
        esc(f.placeholder || "") + '">' + esc(v || "") + "</textarea>";
    } else if (f.type === "text") {
      h += '<input id="' + id + '" data-k="' + esc(f.k) + '" type="text" value="' + esc(v || "") +
        '" placeholder="' + esc(f.placeholder || "") + '">';
    } else {
      h += '<input id="' + id + '" data-k="' + esc(f.k) + '" type="number" inputmode="decimal" value="' +
        esc(v) + '" step="' + esc(f.step || "any") + '"' +
        (f.min !== undefined ? ' min="' + f.min + '"' : "") +
        (f.max !== undefined ? ' max="' + f.max + '"' : "") + ">";
    }
    if (f.hint) h += '<span class="hint">' + f.hint + "</span>";
    return h + "</div>";
  }

  function resultsHTML(r) {
    if (!r.length) return "";
    return '<div class="results">' + r.map(function (x) {
      return '<div class="res ' + (x.state || "") + (x.big ? " big" : "") + '">' +
        '<div class="rl">' + esc(x.label) + "</div>" +
        '<div class="rv">' + x.value + (x.unit ? ' <span class="unit">' + esc(x.unit) + "</span>" : "") + "</div>" +
        (x.note ? '<div class="rn">' + x.note + "</div>" : "") + "</div>";
    }).join("") + "</div>";
  }

  function tableHTML(t) {
    if (!t || !t.rows || !t.rows.length) return "";
    return '<div class="tblwrap">' + (t.title ? "<h3>" + esc(t.title) + "</h3>" : "") +
      '<table class="tbl out"><thead><tr>' +
      (t.head || []).map(function (h) { return "<th>" + h + "</th>"; }).join("") +
      "</tr></thead><tbody>" + t.rows.map(function (row) {
        var cls = row.cls ? ' class="' + row.cls + '"' : "";
        var cells = row.cells || row;
        return "<tr" + cls + ">" + cells.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }

  function listSec(title, items) {
    if (!items || !items.length) return "";
    return '<h3 class="mini-h">' + title + '</h3><ul class="plain' + (title === "Formulas" ? " mono" : "") + '">' +
      items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>";
  }

  /* ---------- main ---------- */
  TK.tool = function (spec) {
    if (TK.capture) { TK.captured = spec; return; }   // Node test harness path
    var mount = document.getElementById("tk-root");
    if (!mount) return;
    var fields = spec.fields || [];

    var shell =
      '<header class="top"><div class="in">' +
        '<a class="back" href="index.html">← All calculators</a>' +
        '<span class="brand">Tools · The Manager\'s Toolkit</span>' +
      "</div></header>" +
      '<div class="wrap">' +
        '<p class="tk-crumb"><a href="../index.html">Toolkit</a> › <a href="../' +
          esc(spec.parent || "index.html") + '">' + esc(spec.parentLabel || "Calculators") + "</a> › " + esc(spec.title) + "</p>" +
        '<p class="session-label">' + esc(spec.label || "Calculator") + "</p>" +
        '<h1 class="sub-title">' + esc(spec.title) + "</h1>" +
        (spec.intro ? '<p class="fw-meta" style="font-size:1.05rem">' + spec.intro + "</p>" : "") +
        '<p class="session-meta"><span>Runs in your browser</span><span>Nothing stored or sent</span>' +
          '<span>Example values loaded</span></p>' +
        '<form class="tk-form" id="tk-f" autocomplete="off">' +
          "<h2>Your numbers</h2>" +
          '<p class="tk-formnote">Change any value and the results update as you type. ' +
            'The example from the guide is loaded to start with.</p>' +
          '<div class="tk-grid">' + fields.map(function (f) {
            return (f.group ? '<p class="tk-gh">' + esc(f.group) + "</p>" : "") + fieldHTML(f);
          }).join("") + "</div>" +
          '<div class="tk-bar">' +
            '<button type="button" class="tk-btn" id="tk-reset">Reload the example</button>' +
            '<button type="button" class="tk-btn" id="tk-copy">Copy the results</button>' +
            '<span class="tk-live" id="tk-live">updates live</span>' +
          "</div>" +
        "</form>" +
        '<p class="tk-out-h">Results</p><div class="wx" id="tk-out"></div>' +
        '<section class="tk-ref">' +
          (spec.useWhen ? "<h3 class=\"mini-h\">Use it when</h3><p>" + spec.useWhen + "</p>" : "") +
          listSec("How to read the result", spec.howRead) +
          listSec("Formulas", spec.formulas) +
          listSec("Watch out for", spec.watch) +
          listSec("Source and basis", spec.source) +
        "</section>" +
        '<p class="growing">Part of <a href="../index.html">The Manager\'s Toolkit</a>. ' +
          'Calculations run entirely in your browser — nothing you type is stored or sent anywhere.</p>' +
      "</div>" +
      "<footer>Pratap Nayak · The Manager's Toolkit · " +
        '<a href="../index.html">Toolkit home</a></footer>';
    mount.outerHTML = shell;

    var form = document.getElementById("tk-f");
    var out = document.getElementById("tk-out");

    function read() {
      var v = {};
      fields.forEach(function (f) {
        var el = document.getElementById("f_" + f.k);
        if (!el) { v[f.k] = f.value; return; }
        if (f.type === "sel" || f.type === "text" || f.type === "textarea") v[f.k] = el.value;
        else { var x = parseFloat(el.value); v[f.k] = isFinite(x) ? x : NaN; }
      });
      return v;
    }

    /* selects whose option list depends on another field */
    function applyOptions(v) {
      fields.forEach(function (f) {
        if (typeof f.optionsFor !== "function") return;
        var el = document.getElementById("f_" + f.k);
        if (!el) return;
        var opts = f.optionsFor(v) || [];
        var sig = opts.map(function (o) { return (o.v !== undefined ? o.v : o) + "\u0001" + (o.t !== undefined ? o.t : o); }).join("\u0002");
        if (el.getAttribute("data-sig") === sig) return;
        var keep = el.value;
        el.innerHTML = opts.map(function (o) {
          var val = o.v !== undefined ? o.v : o, lab = o.t !== undefined ? o.t : o;
          return '<option value="' + esc(val) + '">' + esc(lab) + "</option>";
        }).join("");
        el.setAttribute("data-sig", sig);
        var match = opts.some(function (o) { return String(o.v !== undefined ? o.v : o) === String(keep); });
        el.value = match ? keep : (opts.length ? (opts[0].v !== undefined ? opts[0].v : opts[0]) : "");
        v[f.k] = el.value;
      });
    }

    function applyVisibility(v) {
      fields.forEach(function (f) {
        if (typeof f.show !== "function") return;
        var wrap = form.querySelector('[data-for="' + f.k + '"]');
        if (wrap) wrap.style.display = f.show(v) ? "" : "none";
      });
    }

    function run() {
      var v = read();
      applyOptions(v);
      applyVisibility(v);
      var r;
      try { r = spec.compute(v) || {}; }
      catch (e) { out.innerHTML = '<div class="tk-err">That combination of inputs can\'t be calculated. ' +
        "Check for zeros or negative values where they don't make sense.</div>"; return; }
      if (r.error) { out.innerHTML = '<div class="tk-err">' + r.error + "</div>"; return; }
      var h = "";
      if (r.verdict) h += '<div class="verdict ' + (r.verdict.state || "") + '">' + r.verdict.html + "</div>";
      h += resultsHTML(r.results || []);
      (r.tables || []).forEach(function (t) { h += tableHTML(t); });
      (r.charts || []).forEach(function (c) { h += c; });
      if (r.notes && r.notes.length) h += '<ul class="plain notes">' +
        r.notes.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul>";
      out.innerHTML = h;
    }

    form.addEventListener("input", run);
    form.addEventListener("change", run);
    document.getElementById("tk-reset").addEventListener("click", function () {
      fields.forEach(function (f) {
        var el = document.getElementById("f_" + f.k);
        if (el) el.value = f.value;
      });
      run();
    });
    document.getElementById("tk-copy").addEventListener("click", function () {
      var lines = [spec.title, ""];
      fields.forEach(function (f) {
        var el = document.getElementById("f_" + f.k);
        if (el && (!f.show || f.show(read()))) lines.push("  " + f.label + (f.unit ? " (" + f.unit + ")" : "") + ": " + el.value);
      });
      lines.push("");
      out.querySelectorAll(".res").forEach(function (r) {
        var l = r.querySelector(".rl"), val = r.querySelector(".rv");
        if (l && val) lines.push("  " + l.textContent.trim() + ": " + val.textContent.trim());
      });
      var txt = lines.join("\n"), live = document.getElementById("tk-live");
      function done() { live.textContent = "copied"; live.className = "tk-live tk-copied";
        setTimeout(function () { live.textContent = "updates live"; live.className = "tk-live"; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
      else {
        var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta); done();
      }
    });
    run();
  };
})(typeof window !== "undefined" ? window : globalThis);
