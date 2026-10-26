// Phase 3 visuals: Embeddings and Vector Databases. Pure vanilla JS, no network.
(function () {
  'use strict';
  if (!window.QAW || !window.QAH) return;
  const { h, svg, css } = window.QAH;
  const PAL = ['#5856D6', '#ff9500', '#34c759', '#ff3b30', '#0a84ff', '#af52de'];
  const fix = (n, d) => (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);

  function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
  function head(title, note) { return [h('h4', {}, title), h('p', { class: 'wnote' }, note)]; }
  function btn(label, fn, primary) { return h('button', { type: 'button', class: 'btn' + (primary ? ' p' : ''), onclick: fn }, label); }
  // Labelled range slider. Returns {el, input, set}
  function slider(label, min, max, step, val, fmt, cb) {
    const out = h('span', { style: 'min-width:3.2em;font-variant-numeric:tabular-nums;font-weight:600' }, fmt(val));
    const input = h('input', { type: 'range', min, max, step, value: val, style: 'flex:1;min-width:120px' });
    input.addEventListener('input', () => { out.textContent = fmt(+input.value); cb(+input.value); });
    const el = h('label', { class: 'wrow', style: 'align-items:center;gap:8px;font-size:.85rem' }, h('span', { style: 'min-width:92px' }, label), input, out);
    return { el, input, set(v) { input.value = v; out.textContent = fmt(v); } };
  }
  // setInterval ticker that stops when detached and idles when off screen
  function ticker(root, fn, ms) {
    let id = 0, vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(root);
    return {
      start() { if (id) return; id = setInterval(() => { if (!root.isConnected) { clearInterval(id); id = 0; return; } if (vis) fn(); }, ms); },
      stop() { clearInterval(id); id = 0; },
      on() { return !!id; }
    };
  }
  const takeaway = () => h('div', { class: 'apanel', 'aria-live': 'polite', style: 'margin-top:8px;font-size:.9rem' });

  // ---------------------------------------------------------------- 1. 3D embedding space
  QAW.p3_space3d = function (root) {
    const groups = [
      { name: 'Billing', col: PAL[0], c: [-3, 1, 0.5], s: ['cancel my subscription', 'stop my monthly plan', 'what is the refund policy', 'update my payment card', 'my invoice looks wrong'] },
      { name: 'Device trouble', col: PAL[1], c: [3, 0.8, -1], s: ['laptop will not switch on', 'power failure in notebooks', 'screen stays black', 'battery drains fast', 'fan is very loud'] },
      { name: 'Food', col: PAL[2], c: [0, -2.2, 2.2], s: ['best biryani in Bengaluru', 'easy pasta recipe', 'vegan dinner ideas', 'street food near me', 'how to bake bread'] },
      { name: 'Coding', col: PAL[5], c: [0.5, 3, -2.2], s: ['python list index error', 'fix null pointer crash', 'reverse a string', 'git merge conflict', 'regex for emails'] }
    ];
    const queries = [
      { t: 'I want to end my plan', p: [-2.5, 0.7, 1.0], note: 'Shares no keywords with "cancel my subscription", yet sits beside it.' },
      { t: 'my notebook is dead', p: [2.4, 0.4, -0.4], note: 'Paraphrase of the device-trouble sentences.' },
      { t: 'cheap vegetarian meal', p: [0.4, -1.6, 1.6], note: 'Matches the food cluster by meaning.' },
      { t: 'app crashes with error 0x80070057', p: [1.9, 2.0, -1.7], note: 'Sits between two clusters: neighbours are mixed, a hint that exact-code queries need keyword or hybrid search.' }
    ];
    const r = rng(11), docs = [];
    groups.forEach((g, gi) => g.s.forEach(s => docs.push({ s, g: gi, p: [g.c[0] + (r() - .5) * 2, g.c[1] + (r() - .5) * 2, g.c[2] + (r() - .5) * 2] })));
    let qi = 0, k = 3;
    const items = [];
    const list = h('ol', { style: 'margin:6px 0 0 18px;padding:0;font-size:.85rem' });
    const out = takeaway();
    function rebuild() {
      const q = queries[qi], d = docs.map((o, i) => [Math.hypot(o.p[0] - q.p[0], o.p[1] - q.p[1], o.p[2] - q.p[2]), i]).sort((a, b) => a[0] - b[0]);
      const top = d.slice(0, k);
      items.length = 0;
      groups.forEach(g => items.push({ type: 'text', p: [g.c[0], g.c[1] + 1.6, g.c[2]], text: g.name.toUpperCase(), color: g.col, bold: true }));
      docs.forEach((o, i) => {
        const rank = top.findIndex(t => t[1] === i);
        items.push({ type: 'pt', p: o.p, r: rank >= 0 ? 6 : 4, color: groups[o.g].col, glow: rank >= 0, dim: rank < 0, label: rank >= 0 ? '#' + (rank + 1) : '' });
        if (rank >= 0) items.push({ type: 'line', a: q.p, b: o.p, color: PAL[3], alpha: .9, w: 2 });
      });
      items.push({ type: 'pt', p: q.p, r: 9, color: PAL[3], label: 'query', pulse: true, glow: true, bold: true });
      list.textContent = '';
      top.forEach(t => list.append(h('li', {}, docs[t[1]].s + '  [' + groups[docs[t[1]].g].name + ', distance ' + fix(t[0], 2) + ']')));
      const gs = new Set(top.map(t => docs[t[1]].g));
      out.textContent = 'What you just saw: the query "' + q.t + '" was placed in the space and its ' + k + ' nearest points were chosen purely by distance. ' +
        (gs.size === 1 ? 'All of them come from the "' + groups[[...gs][0]].name + '" cluster, so meaning (not shared words) drove the match. ' : 'They come from ' + gs.size + ' different clusters, so the result is ambiguous. ') + q.note;
    }
    const sel = h('select', { class: 'wi', 'aria-label': 'Choose a query sentence' }, queries.map((q, i) => h('option', { value: i }, q.t)));
    sel.addEventListener('change', () => { qi = +sel.value; rebuild(); });
    const ks = slider('Neighbours k', 1, 6, 1, k, v => String(v), v => { k = v; rebuild(); });
    const canvas = h('canvas', { role: 'img', 'aria-label': '3D scatter of sentence embeddings in four topic clusters with a query point and lines to its nearest neighbours. Drag to rotate; double click to resume auto-rotation.', style: 'width:100%;height:320px;display:block;background:var(--bg3);border-radius:8px;touch-action:none;cursor:grab' });
    root.append(...head('\u{1F9ED} Embedding space in 3D', 'Pick a query, change k, and drag the scene to rotate. Positions are hand-made and illustrative; real embeddings have hundreds of dimensions.'),
      h('div', { class: 'wrow', style: 'gap:10px;align-items:center;margin-bottom:6px' }, h('label', { style: 'font-size:.85rem' }, 'Query ', sel), ks.el),
      canvas, h('p', { class: 'wnote', style: 'margin:6px 0 0' }, 'Nearest neighbours (colour = topic, name shown in brackets):'), list, out);
    rebuild();
    if (window.VizScene) window.VizScene(canvas, () => items, { yaw: 0.6, pitch: 0.35 });
  };

  // ---------------------------------------------------------------- 2. cosine lab
  QAW.p3_cosine = function (root) {
    const st = { aD: 30, aL: 2, bD: 75, bL: 1.2, norm: false };
    const W = 300, C = 150, U = 40;
    const s = svg('svg', { viewBox: '0 0 300 300', role: 'img', 'aria-label': 'Two vectors A and B drawn from the origin with the angle between them', style: 'width:100%;max-width:340px;display:block;margin:auto;background:var(--bg3);border-radius:8px' });
    const read = h('table', { style: 'width:100%;font-size:.85rem' });
    const mCos = h('div', { style: 'width:50%' }), meter = h('div', { class: 'meter', role: 'img', 'aria-label': 'Cosine similarity meter from -1 to +1' }, mCos);
    const out = takeaway();
    const sl = {};
    function arrow(x, y, col, label, dash) {
      const ang = Math.atan2(150 - y, x - 150), hx = 8, g = [];
      g.push(svg('line', { x1: C, y1: C, x2: x, y2: y, stroke: col, 'stroke-width': 3, 'stroke-dasharray': dash || '' }));
      const p = (da, l) => (x - l * Math.cos(ang + da)) + ',' + (y + l * Math.sin(ang + da));
      g.push(svg('polygon', { points: x + ',' + y + ' ' + p(0.4, hx) + ' ' + p(-0.4, hx), fill: col }));
      g.push(svg('text', { x: x + (x > C ? 6 : -6), y: y + (y > C ? 14 : -6), fill: css('--tx'), 'font-size': 13, 'font-weight': 700, 'text-anchor': x > C ? 'start' : 'end' }, label));
      return g;
    }
    function draw() {
      const aL = st.norm ? 1 : st.aL, bL = st.norm ? 1 : st.bL, ra = st.aD * Math.PI / 180, rb = st.bD * Math.PI / 180;
      const A = [aL * Math.cos(ra), aL * Math.sin(ra)], B = [bL * Math.cos(rb), bL * Math.sin(rb)];
      const dot = A[0] * B[0] + A[1] * B[1], cos = dot / (aL * bL), dist = Math.hypot(A[0] - B[0], A[1] - B[1]);
      let diff = Math.abs(st.aD - st.bD) % 360; if (diff > 180) diff = 360 - diff;
      const px = v => [C + v[0] * U, C - v[1] * U];
      s.textContent = '';
      s.append(svg('line', { x1: 0, y1: C, x2: W, y2: C, stroke: css('--bd') }), svg('line', { x1: C, y1: 0, x2: C, y2: W, stroke: css('--bd') }),
        svg('circle', { cx: C, cy: C, r: U, fill: 'none', stroke: css('--bd'), 'stroke-dasharray': '3 3' }),
        svg('text', { x: C + U + 3, y: C - 4, fill: css('--tx2'), 'font-size': 9 }, 'length 1'));
      const pa = px(A), pb = px(B), a1 = Math.min(ra, rb), a2 = Math.max(ra, rb), R = 28;
      if (a2 - a1 < Math.PI * 1.999) {
        const big = (a2 - a1) > Math.PI ? 1 : 0;
        s.append(svg('path', { d: 'M ' + (C + R * Math.cos(a1)) + ' ' + (C - R * Math.sin(a1)) + ' A ' + R + ' ' + R + ' 0 ' + big + ' 0 ' + (C + R * Math.cos(a2)) + ' ' + (C - R * Math.sin(a2)), fill: 'none', stroke: css('--tx2'), 'stroke-width': 2 }));
      }
      s.append(svg('line', { x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1], stroke: PAL[3], 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }),
        svg('text', { x: (pa[0] + pb[0]) / 2 + 4, y: (pa[1] + pb[1]) / 2, fill: PAL[3], 'font-size': 10 }, 'distance ' + fix(dist, 2)));
      arrow(pa[0], pa[1], PAL[0], 'A').forEach(e => s.append(e));
      arrow(pb[0], pb[1], PAL[1], 'B', '').forEach(e => s.append(e));
      mCos.style.width = ((cos + 1) / 2 * 100) + '%';
      read.textContent = '';
      [['Angle between A and B', fix(diff, 0) + ' deg'], ['Cosine similarity', fix(cos, 3)], ['Dot product', fix(dot, 3)], ['Euclidean distance', fix(dist, 3)]].forEach(r => read.append(h('tr', {}, h('td', {}, r[0]), h('td', { style: 'font-weight:700;text-align:right' }, r[1]))));
      let msg;
      if (st.norm) msg = 'With both vectors scaled to length 1, the dot product (' + fix(dot, 3) + ') equals the cosine (' + fix(cos, 3) + '). That is why vector databases can use the cheaper dot product on normalized embeddings.';
      else if (cos > 0.99 && dist > 0.6) msg = 'A and B point the same way, so cosine says "identical meaning" (' + fix(cos, 2) + ') while Euclidean distance says "far apart" (' + fix(dist, 2) + '). Cosine ignores length, which is why it suits text.';
      else if (Math.abs(cos) < 0.05) msg = 'The vectors are orthogonal: cosine is about 0, meaning unrelated directions. The dot product is also 0 here regardless of length.';
      else if (cos < -0.5) msg = 'The vectors point in nearly opposite directions: cosine is negative (' + fix(cos, 2) + '). With real text embeddings this is rare.';
      else msg = 'Cosine depends only on the angle (' + fix(diff, 0) + ' deg). Change a length slider and watch the dot product and distance move while the cosine stays put.';
      out.textContent = 'What you just saw: ' + msg;
      s.setAttribute('aria-label', 'Vector A at ' + st.aD + ' degrees and vector B at ' + st.bD + ' degrees; cosine similarity ' + fix(cos, 2));
    }
    const mk = (label, key, min, max, step, fmt) => { sl[key] = slider(label, min, max, step, st[key], fmt, v => { st[key] = v; draw(); }); return sl[key].el; };
    function preset(a, b, norm) { Object.assign(st, a, b); st.norm = !!norm; cb.checked = st.norm; Object.keys(sl).forEach(k => sl[k].set(st[k])); draw(); }
    const cb = h('input', { type: 'checkbox', id: 'p3c' + Math.random().toString(36).slice(2, 7) });
    cb.addEventListener('change', () => { st.norm = cb.checked; draw(); });
    root.append(...head('\u{1F4D0} Cosine similarity lab', 'Drag the sliders to rotate and stretch A and B; compare cosine, dot product and distance.'),
      h('div', { class: 'wrow', style: 'gap:14px;align-items:flex-start' },
        h('div', { style: 'flex:1 1 280px' }, s),
        h('div', { style: 'flex:1 1 260px' },
          mk('Angle of A', 'aD', 0, 360, 1, v => v + ' deg'), mk('Length of A', 'aL', 0.5, 3.4, 0.1, v => fix(v, 1)),
          mk('Angle of B', 'bD', 0, 360, 1, v => v + ' deg'), mk('Length of B', 'bL', 0.5, 3.4, 0.1, v => fix(v, 1)),
          h('label', { class: 'cbx', style: 'display:block;margin:6px 0' }, cb, ' Normalize both to unit length'),
          h('div', { class: 'wrow', style: 'gap:6px;margin:6px 0' },
            btn('B = 2 x A', () => preset({ aD: 40, aL: 1.2 }, { bD: 40, bL: 2.4 })), btn('Orthogonal', () => preset({ aD: 20, aL: 2 }, { bD: 110, bL: 2 })),
            btn('Opposite', () => preset({ aD: 20, aL: 2 }, { bD: 200, bL: 2 })), btn('Close, different length', () => preset({ aD: 30, aL: 1 }, { bD: 45, bL: 3 }))),
          h('div', { style: 'font-size:.75rem;color:var(--tx2)' }, 'Cosine from -1 to +1 (centre = 0)'), meter, read)),
      out);
    draw();
  };

  // ---------------------------------------------------------------- 3. chunk size explorer
  QAW.p3_chunks = function (root) {
    const TOTAL = 1200, SEC = 150, REL = [300, 450], FACT = 40;
    const secName = ['Intro', 'Pricing', 'Refunds', 'Shipping', 'Warranty', 'Security', 'Support', 'Legal'];
    const st = { size: 300, ov: 0.15 };
    function chunks(size, ov) {
      const step = Math.max(1, Math.round(size * (1 - ov))), cs = [];
      for (let s0 = 0; ; s0 += step) { const e = Math.min(TOTAL, s0 + size); cs.push([s0, e]); if (e >= TOTAL) break; }
      return cs;
    }
    const olap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
    // Average over many positions of a 40-token answer inside the Refunds section.
    function evalCfg(size, ov) {
      const cs = chunks(size, ov); let pr = 0, co = 0, n = 0;
      for (let f = REL[0] + 5; f + FACT <= REL[1] - 5; f += 5) {
        const fa = [f, f + FACT]; let best = null, bo = -1;
        cs.forEach(c => { const o = olap(c, fa), sc = o + olap(c, REL) / 1e4; if (sc > bo) { bo = sc; best = c; } });
        pr += olap(best, REL) / (best[1] - best[0]); co += (best[0] <= f && best[1] >= f + FACT) ? 1 : 0; n++;
      }
      return { n: cs.length, prec: pr / n, comp: co / n, cs };
    }
    const strip = svg('svg', { viewBox: '0 0 340 120', role: 'img', style: 'width:100%;display:block;background:var(--bg3);border-radius:8px', 'aria-label': 'Document of 1200 tokens in 8 sections split into chunks' });
    const chart = svg('svg', { viewBox: '0 0 340 190', role: 'img', style: 'width:100%;display:block;background:var(--bg3);border-radius:8px', 'aria-label': 'Line chart of retrieval focus and answer completeness against chunk size' });
    const out = takeaway(), stats = h('p', { class: 'wnote', style: 'margin:6px 0' });
    function draw() {
      const x0 = 10, wd = 320, sx = t => x0 + t / TOTAL * wd, tx = css('--tx'), tx2 = css('--tx2');
      const res = evalCfg(st.size, st.ov), cs = res.cs;
      // strip
      strip.textContent = '';
      for (let i = 0; i < 8; i++) {
        strip.append(svg('rect', { x: sx(i * SEC), y: 18, width: wd * SEC / TOTAL, height: 22, fill: PAL[i % 6], opacity: i === 2 ? 0.95 : 0.4, stroke: i === 2 ? tx : 'none', 'stroke-width': 2 }),
          svg('text', { x: sx(i * SEC + SEC / 2), y: 33, 'text-anchor': 'middle', 'font-size': 9, fill: tx, 'font-weight': i === 2 ? 700 : 400 }, secName[i]));
      }
      strip.append(svg('text', { x: x0, y: 11, 'font-size': 9, fill: tx2 }, 'Document: 1,200 tokens, 8 sections. Answer lives in "Refunds" (bold outline).'));
      const fa = [360, 360 + FACT];
      strip.append(svg('rect', { x: sx(fa[0]), y: 14, width: wd * FACT / TOTAL, height: 30, fill: 'none', stroke: tx, 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }));
      let best = null, bo = -1;
      cs.forEach(c => { const sc = olap(c, fa) + olap(c, REL) / 1e4; if (sc > bo) { bo = sc; best = c; } });
      const rows = 3, rh = Math.min(14, 66 / rows);
      cs.forEach((c, i) => {
        const isB = c === best, y = 50 + (i % rows) * (rh + 2);
        strip.append(svg('rect', { x: sx(c[0]), y, width: Math.max(1, sx(c[1]) - sx(c[0]) - 1), height: rh, fill: isB ? PAL[3] : 'none', 'fill-opacity': .85, stroke: isB ? PAL[3] : tx2, 'stroke-width': isB ? 1.5 : 0.8, 'stroke-dasharray': isB ? '' : '' }));
      });
      strip.append(svg('text', { x: x0, y: 114, 'font-size': 9, fill: tx2 }, 'Red = best chunk for the answer (dashed box). Others alternate in 3 rows so overlaps show.'));
      // chart
      chart.textContent = '';
      const L = 34, T = 12, Wd = 296, Ht = 130, sx2 = v => L + (v - 50) / 1150 * Wd, sy = v => T + (1 - v) * Ht;
      for (let g = 0; g <= 4; g++) { const v = g / 4; chart.append(svg('line', { x1: L, y1: sy(v), x2: L + Wd, y2: sy(v), stroke: css('--bd'), 'stroke-width': .6 }), svg('text', { x: L - 4, y: sy(v) + 3, 'text-anchor': 'end', 'font-size': 8, fill: tx2 }, Math.round(v * 100) + '%')); }
      [50, 300, 600, 900, 1200].forEach(v => chart.append(svg('text', { x: sx2(v), y: T + Ht + 12, 'text-anchor': 'middle', 'font-size': 8, fill: tx2 }, v)));
      chart.append(svg('text', { x: L + Wd / 2, y: T + Ht + 26, 'text-anchor': 'middle', 'font-size': 9, fill: tx2 }, 'chunk size (tokens), overlap ' + Math.round(st.ov * 100) + '%'));
      const lp = [], lc = [];
      for (let sz = 50; sz <= 1200; sz += 25) { const e = evalCfg(sz, st.ov); lp.push(sx2(sz) + ',' + sy(e.prec)); lc.push(sx2(sz) + ',' + sy(e.comp)); }
      chart.append(svg('polyline', { points: lp.join(' '), fill: 'none', stroke: PAL[4], 'stroke-width': 2.5 }), svg('polyline', { points: lc.join(' '), fill: 'none', stroke: PAL[1], 'stroke-width': 2.5, 'stroke-dasharray': '6 3' }),
        svg('line', { x1: sx2(st.size), y1: T, x2: sx2(st.size), y2: T + Ht, stroke: tx, 'stroke-width': 1.5 }),
        svg('circle', { cx: sx2(st.size), cy: sy(res.prec), r: 4, fill: PAL[4] }), svg('circle', { cx: sx2(st.size), cy: sy(res.comp), r: 4, fill: PAL[1] }),
        svg('text', { x: L + 6, y: T + 10, 'font-size': 9, fill: PAL[4], 'font-weight': 700 }, 'solid: focus (share of chunk that is on-topic)'),
        svg('text', { x: L + 6, y: T + 22, 'font-size': 9, fill: PAL[1], 'font-weight': 700 }, 'dashed: answer fully inside the chunk'));
      stats.textContent = res.n + ' chunks | focus ' + Math.round(res.prec * 100) + '% | answer intact ' + Math.round(res.comp * 100) + '% | sending top-3 costs about ' + (3 * st.size) + ' tokens';
      let msg;
      if (st.size < 120) msg = 'at ' + st.size + ' tokens chunks are very focused but often cut the answer in half (' + Math.round(res.comp * 100) + '% intact) and the index has ' + res.n + ' entries. Fragmentation is the problem.';
      else if (st.size > 600) msg = 'at ' + st.size + ' tokens the answer is always inside, but only ' + Math.round(res.prec * 100) + '% of the chunk is on-topic, so the vector is diluted and every query pays ' + (3 * st.size) + ' tokens.';
      else msg = 'around ' + st.size + ' tokens balances focus (' + Math.round(res.prec * 100) + '%) and an intact answer (' + Math.round(res.comp * 100) + '%). Overlap raises "intact" at the cost of more chunks.';
      out.textContent = 'What you just saw: ' + msg + ' (Toy document, so exact numbers are illustrative; the shape of the trade-off is the point.)';
    }
    const s1 = slider('Chunk size', 50, 1200, 10, st.size, v => v + ' tok', v => { st.size = v; draw(); });
    const s2 = slider('Overlap', 0, 50, 5, st.ov * 100, v => v + '%', v => { st.ov = v / 100; draw(); });
    root.append(...head('✂️ Chunk size explorer', 'Slide chunk size and overlap: watch the strip re-cut the document and the trade-off curves move.'),
      s1.el, s2.el, strip, stats, chart, out);
    draw();
  };

  // ---------------------------------------------------------------- 4. exact vs graph (HNSW-style) search
  QAW.p3_ann = function (root) {
    const N = 60, r = rng(5), P = [];
    for (let i = 0; i < N; i++) P.push([0.05 + r() * 0.9, 0.05 + r() * 0.9]);
    const layerOf = i => (i % 12 === 0 ? 2 : i % 4 === 0 ? 1 : 0);
    const ids = [[], [], []]; for (let i = 0; i < N; i++) for (let l = 0; l <= layerOf(i); l++) ids[l].push(i);
    const dd = (i, q) => Math.hypot(P[i][0] - q[0], P[i][1] - q[1]);
    const adj = [0, 1, 2].map(l => {
      const m = {}; ids[l].forEach(i => { m[i] = new Set(); });
      ids[l].forEach(i => ids[l].filter(j => j !== i).sort((a, b) => Math.hypot(P[a][0] - P[i][0], P[a][1] - P[i][1]) - Math.hypot(P[b][0] - P[i][0], P[b][1] - P[i][1])).slice(0, l === 0 ? 4 : 3).forEach(j => { m[i].add(j); m[j].add(i); }));
      return m;
    });
    const queries = [[0.78, 0.22], [0.2, 0.75], [0.55, 0.55], [0.9, 0.85], [0.12, 0.2]];
    let qi = 0, ef = 3, steps = [], cur = -1, info = {};
    function plan() {
      const q = queries[qi], seen = new Set(), vis = {}; let cnt = 0, entry = 0; steps = [];
      const d = i => { if (!seen.has(i)) { seen.add(i); cnt++; } return dd(i, q); };
      for (let l = 2; l >= 0; l--) {
        const e = l === 0 ? ef : 1; let visited = new Set([entry]), cand = [entry], res = [entry]; d(entry);
        steps.push({ l, cur: entry, ev: [], cnt, note: 'Enter layer ' + l + ' at point ' + entry });
        while (cand.length) {
          cand.sort((a, b) => d(a) - d(b)); const c = cand.shift();
          res.sort((a, b) => d(a) - d(b));
          if (res.length >= e && d(c) > d(res[res.length - 1])) break;
          const ev = [];
          adj[l][c].forEach(nb => { if (visited.has(nb)) return; visited.add(nb); ev.push(nb); const dn = d(nb); res.sort((a, b) => d(a) - d(b)); if (res.length < e || dn < d(res[res.length - 1])) { cand.push(nb); res.push(nb); res.sort((a, b) => d(a) - d(b)); if (res.length > e) res.pop(); } });
          steps.push({ l, cur: c, ev, cnt, note: 'Layer ' + l + ': look at neighbours of ' + c + ' (' + ev.length + ' new distances)' });
        }
        res.sort((a, b) => d(a) - d(b)); entry = res[0]; steps[steps.length - 1].best = entry;
      }
      let tn = 0; for (let i = 1; i < N; i++) if (dd(i, q) < dd(tn, q)) tn = i;
      info = { found: entry, truth: tn, cnt, q };
      cur = -1;
    }
    const sv = svg('svg', { viewBox: '0 0 320 320', role: 'img', 'aria-label': 'Graph of 60 points with a query and a greedy layered search path', style: 'width:100%;max-width:380px;display:block;margin:auto;background:var(--bg3);border-radius:8px' });
    const log = h('p', { class: 'wnote', 'aria-live': 'polite', style: 'min-height:2.4em;margin:6px 0' });
    const mG = h('div', { style: 'width:0%' }), mB = h('div', { style: 'width:100%' });
    const out = takeaway();
    const S = 300, ox = 10, X = i => ox + P[i][0] * S, Y = i => ox + P[i][1] * S;
    function draw() {
      const tx = css('--tx'), tx2 = css('--tx2'), bd = css('--bd'), q = info.q;
      const upto = steps.slice(0, cur + 1), s = cur >= 0 ? steps[cur] : null, L = s ? s.l : 2;
      sv.textContent = '';
      for (const i in adj[L]) adj[L][i].forEach(j => { if (+i < j) sv.append(svg('line', { x1: X(+i), y1: Y(+i), x2: X(j), y2: Y(j), stroke: bd, 'stroke-width': L === 0 ? .6 : 1.2 })); });
      const seen = new Set(); upto.forEach(t => { seen.add(t.cur); t.ev.forEach(e => seen.add(e)); });
      const pathPts = upto.map(t => X(t.cur) + ',' + Y(t.cur));
      if (pathPts.length > 1) sv.append(svg('polyline', { points: pathPts.join(' '), fill: 'none', stroke: PAL[3], 'stroke-width': 2 }));
      for (let i = 0; i < N; i++) {
        const lv = layerOf(i), inL = lv >= L, rr = 2 + lv * 1.6;
        sv.append(svg('circle', { cx: X(i), cy: Y(i), r: seen.has(i) ? rr + 2 : rr, fill: seen.has(i) ? PAL[1] : (inL ? tx2 : bd), opacity: inL || seen.has(i) ? 1 : .6, stroke: lv === 2 ? tx : 'none', 'stroke-width': 1.5 }));
      }
      if (s) sv.append(svg('circle', { cx: X(s.cur), cy: Y(s.cur), r: 9, fill: 'none', stroke: PAL[3], 'stroke-width': 3 }));
      const qx = ox + q[0] * S, qy = ox + q[1] * S;
      sv.append(svg('polygon', { points: [qx + ',' + (qy - 8), (qx + 8) + ',' + qy, qx + ',' + (qy + 8), (qx - 8) + ',' + qy].join(' '), fill: tx }), svg('text', { x: qx + 10, y: qy - 8, 'font-size': 10, fill: tx, 'font-weight': 700 }, 'query'));
      const fin = cur === steps.length - 1;
      if (fin) {
        sv.append(svg('circle', { cx: X(info.truth), cy: Y(info.truth), r: 12, fill: 'none', stroke: PAL[2], 'stroke-width': 3, 'stroke-dasharray': '3 2' }), svg('text', { x: X(info.truth) + 13, y: Y(info.truth) + 12, 'font-size': 9, fill: PAL[2], 'font-weight': 700 }, 'true nearest'));
        if (info.found !== info.truth) sv.append(svg('text', { x: X(info.found) + 7, y: Y(info.found) - 7, 'font-size': 9, fill: PAL[3], 'font-weight': 700 }, 'returned'));
      }
      sv.append(svg('text', { x: 10, y: 14, 'font-size': 10, fill: tx, 'font-weight': 700 }, s ? 'Layer ' + L + (L === 2 ? ' (few hubs: long jumps)' : L === 1 ? ' (more points)' : ' (all points, fine search)') : 'Press Play or Step'));
      const c = s ? s.cnt : 0;
      mG.style.width = (c / N * 100) + '%';
      log.textContent = s ? s.note : 'Ready: ' + N + ' vectors, 3 layers. Brute force would compute ' + N + ' distances.';
      if (!fin) out.textContent = 'What you just saw (so far): the search has computed ' + c + ' distances out of ' + N + '. Big hops on the sparse top layer get close fast, then lower layers refine.';
      else out.textContent = 'What you just saw: the graph walk computed ' + info.cnt + ' distances instead of ' + N + ' (' + Math.round(info.cnt / N * 100) + '%) and ' + (info.found === info.truth ? 'found the true nearest neighbour.' : 'returned a near neighbour, not the exact one: that is the small recall loss ANN accepts. Raise ef and replay to improve it.') + ' At millions of vectors the saving is dramatic. (Toy graph; layers here are assigned deterministically.)';
    }
    const tk = ticker(root, () => { if (cur < steps.length - 1) { cur++; draw(); } else { tk.stop(); play.textContent = 'Play'; } }, 900);
    const play = btn('Play', () => { if (tk.on()) { tk.stop(); play.textContent = 'Play'; } else { if (cur >= steps.length - 1) cur = -1; tk.start(); play.textContent = 'Pause'; } }, true);
    const stepB = btn('Step', () => { tk.stop(); play.textContent = 'Play'; if (cur < steps.length - 1) cur++; draw(); });
    const reset = () => { tk.stop(); play.textContent = 'Play'; plan(); draw(); };
    const efs = slider('Search width ef', 1, 8, 1, ef, v => String(v), v => { ef = v; reset(); });
    root.append(...head('\u{1F578}️ Exact kNN vs graph (HNSW-style) search', 'Play or Step the walk from the top layer down; ef widens the search at the bottom layer.'),
      h('div', { class: 'wrow', style: 'gap:8px;align-items:center;margin-bottom:6px' }, play, stepB, btn('Reset', reset), btn('Next query', () => { qi = (qi + 1) % queries.length; reset(); }), efs.el),
      sv, log,
      h('div', { style: 'font-size:.8rem;color:var(--tx2)' }, 'Distances computed: graph search'), h('div', { class: 'meter', role: 'img', 'aria-label': 'Share of distances computed by graph search' }, mG),
      h('div', { style: 'font-size:.8rem;color:var(--tx2);margin-top:4px' }, 'Brute force (all ' + N + ')'), h('div', { class: 'meter', role: 'img', 'aria-label': 'Brute force computes all distances' }, mB), out);
    plan(); draw();
  };
})();
