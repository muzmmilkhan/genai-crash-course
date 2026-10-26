// Phase 6 visuals: Fine-Tuning and Customization. Registers p6_* widgets on window.QAW.
(function () {
  'use strict';
  var H = window.QAH, h = H.h, svg = H.svg;
  var PAL = ['#5856D6', '#ff9500', '#34c759', '#ff3b30', '#0a84ff', '#af52de'];

  function T(x, y, s, o) {
    o = o || {};
    return svg('text', { x: x, y: y, 'font-size': o.size || 11, 'text-anchor': o.anchor || 'start', 'font-weight': o.w || 400,
      style: 'fill:' + (o.fill || 'var(--tx)') }, s);
  }
  function R(x, y, w, hh, o) {
    o = o || {};
    return svg('rect', { x: x, y: y, width: w, height: hh, rx: o.rx == null ? 4 : o.rx,
      style: 'fill:' + (o.fill || 'var(--bg3)') + ';stroke:' + (o.stroke || 'var(--bd)') + ';stroke-width:' + (o.sw || 1) + (o.dash ? ';stroke-dasharray:' + o.dash : '') });
  }
  function L(x1, y1, x2, y2, o) {
    o = o || {};
    return svg('line', { x1: x1, y1: y1, x2: x2, y2: y2,
      style: 'stroke:' + (o.stroke || 'var(--bd)') + ';stroke-width:' + (o.sw || 1) + (o.dash ? ';stroke-dasharray:' + o.dash : '') });
  }
  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n));
  }
  function head(title, note) {
    return [h('h4', null, title), h('p', { class: 'wnote' }, note)];
  }
  function takeaway() {
    return h('div', { class: 'apanel', role: 'status', 'aria-live': 'polite', style: 'margin-top:10px' });
  }
  var uid = 0;
  function labeled(text, input) {
    var id = 'p6c' + (++uid);
    input.id = id;
    return h('label', { for: id, style: 'display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--tx2)' }, text, input);
  }

  // ---------- 1. LoRA matrix lab + forward flow ----------
  window.QAW.p6_lora = function (root) {
    var st = { d: 4096, r: 8, merged: false, stage: -1, timer: 0 };
    var dSel = h('select', { class: 'wi' }, [512, 1024, 4096, 8192].map(function (v) {
      return h('option', { value: v, selected: v === 4096 ? 'selected' : null }, v + ' x ' + v);
    }));
    var rIn = h('input', { type: 'range', min: 1, max: 64, value: 8, step: 1 });
    var rOut = h('output', { style: 'font-weight:600' }, '8');
    var mer = h('input', { type: 'checkbox', id: 'p6m' + (++uid) });
    var meter = h('div', { style: 'width:1%' });
    var stats = h('div', { style: 'font-size:13px;margin:6px 0' });
    var s1 = svg('svg', { viewBox: '0 0 400 190', role: 'img', 'aria-label': 'Frozen weight matrix W plus a low-rank update made of a tall thin matrix B and a wide flat matrix A', style: 'width:100%;max-width:560px;display:block' });
    var s2 = svg('svg', { viewBox: '0 0 420 170', role: 'img', 'aria-label': 'Forward pass: input x goes through the frozen W and through A then B, and the two results are added', style: 'width:100%;max-width:560px;display:block' });
    var out = takeaway();
    var stageLabel = h('div', { style: 'font-size:12px;color:var(--tx2);min-height:18px' });

    var STAGES = [
      { ids: ['x'], t: 'Input x enters the layer.' },
      { ids: ['W', 'A'], t: 'x is sent down two paths: the frozen W, and the small matrix A, which squeezes it from k dimensions down to r.' },
      { ids: ['B'], t: 'B expands the r-dimensional result back to d dimensions, scaled by alpha/r. Only A and B receive gradients.' },
      { ids: ['sum'], t: 'The two outputs are added: Wx + (alpha/r) B A x.' },
      { ids: ['y'], t: 'Layer output y. After training, B A can be merged into W so this layer costs the same as before.' }
    ];
    var STAGES_M = [
      { ids: ['x'], t: 'Input x enters the layer.' },
      { ids: ['Wm'], t: 'Merged: a single matrix W + BA does all the work. No extra latency.' },
      { ids: ['y'], t: 'Layer output y, identical to the two-path result.' }
    ];

    function drawMats() {
      var d = st.d, r = st.r, bw = 8 + r * 0.55, ah = 8 + r * 0.55;
      s1.replaceChildren(
        R(12, 30, 110, 110, { fill: 'var(--bg3)', dash: '4 3' }), T(67, 90, 'W', { anchor: 'middle', size: 20, w: 700 }),
        T(67, 152, 'frozen, d x k', { anchor: 'middle', size: 11, fill: 'var(--tx2)' }), T(67, 166, 'no gradients', { anchor: 'middle', size: 10, fill: 'var(--tx2)' }),
        T(140, 90, '+', { size: 22, anchor: 'middle' }),
        R(160, 30, bw, 110, { fill: PAL[0], stroke: PAL[0] }), T(160 + bw / 2, 22, 'B', { anchor: 'middle', size: 14, w: 700 }),
        T(160 + bw / 2, 152, 'd x r', { anchor: 'middle', size: 11, fill: 'var(--tx2)' }),
        T(160 + bw + 16, 90, '.', { size: 24, anchor: 'middle' }),
        R(160 + bw + 30, 30, 110, ah, { fill: PAL[1], stroke: PAL[1] }), T(160 + bw + 85, 22, 'A', { anchor: 'middle', size: 14, w: 700 }),
        T(160 + bw + 85, 30 + ah + 14, 'r x k', { anchor: 'middle', size: 11, fill: 'var(--tx2)' }),
        T(200, 184, 'r is exaggerated for visibility; real r is tiny next to d', { anchor: 'start', size: 9, fill: 'var(--tx2)' })
      );
      var full = d * d, lora = r * (d + d), pct = 100 * lora / full;
      stats.replaceChildren(
        h('div', null, 'Full update delta-W: ', h('b', null, fmt(full)), ' parameters'),
        h('div', null, 'LoRA r=' + r + ': r x (d + k) = ', h('b', null, fmt(lora)), ' parameters (', h('b', null, pct.toFixed(2) + '%'), ' of full)')
      );
      meter.style.width = Math.max(1, Math.min(100, pct)) + '%';
      var scale = (full / lora);
      out.textContent = 'What you just saw: for one ' + d + ' x ' + d + ' matrix, rank ' + r + ' trains about ' + scale.toFixed(0) + 'x fewer parameters than a full update, because two thin matrices replace one huge one.';
    }
    function node(id, x, y, w, hh, label, fill, on) {
      var g = svg('g', null, R(x, y, w, hh, { fill: fill, stroke: on ? 'var(--tx)' : 'var(--bd)', sw: on ? 3 : 1 }), T(x + w / 2, y + hh / 2 + 4, label, { anchor: 'middle', size: 12, w: on ? 700 : 500, fill: fill.indexOf('#') === 0 ? '#fff' : 'var(--tx)' }));
      return g;
    }
    function drawFlow() {
      var S = st.merged ? STAGES_M : STAGES, cur = S[st.stage], on = cur ? cur.ids : [];
      var is = function (i) { return on.indexOf(i) >= 0; };
      var kids = [];
      kids.push(L(40, 85, 100, 85), L(40, 85, 40, 85));
      if (st.merged) {
        kids.push(L(50, 85, 130, 85), L(250, 85, 300, 85));
        kids.push(node('Wm', 130, 65, 120, 40, "W' = W + BA", 'var(--bg3)', is('Wm')));
      } else {
        kids.push(L(50, 85, 90, 85), L(90, 85, 90, 45), L(90, 45, 130, 45), L(90, 85, 90, 125), L(90, 125, 110, 125));
        kids.push(L(190, 45, 300, 45), L(300, 45, 300, 70), L(255, 125, 300, 125), L(300, 125, 300, 100));
        kids.push(node('W', 130, 25, 120, 40, 'W (frozen)', 'var(--bg3)', is('W')));
        kids.push(node('A', 110, 105, 60, 40, 'A (r x k)', PAL[1], is('A')));
        kids.push(L(170, 125, 195, 125));
        kids.push(node('B', 195, 105, 60, 40, 'B (d x r)', PAL[0], is('B')));
        kids.push(T(262, 119, 'x alpha/r', { size: 10, fill: 'var(--tx2)' }));
        // dashed line from W to the sum node
        kids.push(L(250, 45, 300, 45));
      }
      kids.push(svg('circle', { cx: 300, cy: 85, r: 15, style: 'fill:var(--bg3);stroke:' + (is('sum') ? 'var(--tx)' : 'var(--bd)') + ';stroke-width:' + (is('sum') ? 3 : 1) }));
      kids.push(T(300, 91, '+', { anchor: 'middle', size: 18, w: 700 }));
      kids.push(L(315, 85, 355, 85));
      kids.push(svg('circle', { cx: 28, cy: 85, r: 16, style: 'fill:var(--bg3);stroke:' + (is('x') ? 'var(--tx)' : 'var(--bd)') + ';stroke-width:' + (is('x') ? 3 : 1) }));
      kids.push(T(28, 90, 'x', { anchor: 'middle', size: 14, w: 700 }));
      kids.push(svg('circle', { cx: 372, cy: 85, r: 16, style: 'fill:var(--bg3);stroke:' + (is('y') ? 'var(--tx)' : 'var(--bd)') + ';stroke-width:' + (is('y') ? 3 : 1) }));
      kids.push(T(372, 90, 'y', { anchor: 'middle', size: 14, w: 700 }));
      // ensure x -> branch lines exist in merged mode too (drawn above)
      s2.replaceChildren.apply(s2, kids);
      stageLabel.textContent = cur ? 'Step ' + (st.stage + 1) + '/' + S.length + ': ' + cur.t : 'Press Play or Step to follow one input through the layer.';
    }
    function stop() { if (st.timer) { clearInterval(st.timer); st.timer = 0; } playBtn.textContent = 'Play'; }
    function nextStage() {
      var S = st.merged ? STAGES_M : STAGES;
      if (st.stage >= S.length - 1) { stop(); return; }
      st.stage++; drawFlow();
      if (st.stage >= S.length - 1) stop();
    }
    var playBtn = h('button', { type: 'button', class: 'btn p', onclick: function () {
      if (st.timer) { stop(); return; }
      var S = st.merged ? STAGES_M : STAGES;
      if (st.stage >= S.length - 1) st.stage = -1;
      if (H.reduced()) { nextStage(); return; }
      playBtn.textContent = 'Pause'; nextStage();
      st.timer = setInterval(function () { if (!root.isConnected) { stop(); return; } nextStage(); }, 1500);
    } }, 'Play');
    var stepBtn = h('button', { type: 'button', class: 'btn', onclick: function () { stop(); if (st.stage >= (st.merged ? STAGES_M : STAGES).length - 1) st.stage = -1; nextStage(); } }, 'Step');
    var resetBtn = h('button', { type: 'button', class: 'btn', onclick: function () { stop(); st.stage = -1; drawFlow(); } }, 'Reset');

    dSel.setAttribute('aria-label', 'Matrix size d by k');
    rIn.setAttribute('aria-label', 'LoRA rank r');
    dSel.addEventListener('change', function () { st.d = +dSel.value; drawMats(); });
    rIn.addEventListener('input', function () { st.r = +rIn.value; rOut.textContent = rIn.value; drawMats(); });
    mer.addEventListener('change', function () { stop(); st.merged = mer.checked; st.stage = -1; drawFlow(); });

    root.append.apply(root, head('LoRA matrix lab', 'Change the matrix size and rank; then play the forward pass. Parameter counts are exact for one matrix; the picture is not to scale.').concat([
      h('div', { class: 'wrow', style: 'gap:14px;align-items:flex-end;flex-wrap:wrap' },
        labeled('Weight matrix W (d x k)', dSel),
        labeled('Rank r', h('span', { style: 'display:flex;gap:8px;align-items:center' }, rIn, rOut))),
      s1, stats, h('div', { class: 'meter', 'aria-hidden': 'true' }, meter),
      h('h5', { style: 'margin:14px 0 4px' }, 'Forward pass through an adapted layer'),
      h('div', { class: 'wrow', style: 'gap:8px;align-items:center;flex-wrap:wrap' }, playBtn, stepBtn, resetBtn,
        h('label', { class: 'cbx', for: mer.id }, mer, ' Merge adapter into W')),
      s2, stageLabel, out
    ]));
    drawMats(); drawFlow();
  };

  // ---------- 2. Memory chart ----------
  window.QAW.p6_memory = function (root) {
    var st = { n: 7, act: 2 };
    var sel = h('select', { class: 'wi' }, [7, 13, 70].map(function (v) { return h('option', { value: v }, v + 'B parameters'); }));
    var act = h('input', { type: 'range', min: 0, max: 40, step: 1, value: 2 });
    var actOut = h('output', { style: 'font-weight:600' }, '2 GB');
    var S = svg('svg', { viewBox: '0 0 480 250', role: 'img', 'aria-label': 'Horizontal log-scale bars of estimated training memory in gigabytes for full fine-tuning, LoRA and QLoRA, with vertical lines at 24, 48 and 80 gigabyte GPU sizes', style: 'width:100%;max-width:640px;display:block' });
    var tbl = h('div');
    var out = takeaway();
    var GPUS = [24, 48, 80];
    var METHODS = [
      { k: 'Full fine-tune', c: PAL[3], f: function (n, a) { return 16 * n + a; }, how: '16 bytes/param (weights 2 + grads 2 + Adam 8 + master copy 4)' },
      { k: 'LoRA (bf16 base)', c: PAL[0], f: function (n, a) { return 2 * n + 0.16 * n + a; }, how: '2 bytes/param frozen + ~1% adapters x 16 bytes' },
      { k: 'QLoRA (4-bit base)', c: PAL[2], f: function (n, a) { return 0.5 * n + 0.16 * n + a; }, how: '0.5 bytes/param frozen + ~1% adapters x 16 bytes' }
    ];
    function px(v) { return 110 + 350 * Math.log10(Math.max(v, 1)) / Math.log10(2000); }
    function draw() {
      var n = st.n, a = st.act, kids = [];
      [1, 10, 100, 1000].forEach(function (t) {
        kids.push(L(px(t), 36, px(t), 206, { dash: '2 4' }), T(px(t), 222, t + ' GB', { anchor: 'middle', size: 10, fill: 'var(--tx2)' }));
      });
      GPUS.forEach(function (g, i) {
        kids.push(L(px(g), 28, px(g), 206, { stroke: PAL[1], sw: 2, dash: '6 3' }));
        kids.push(T(px(g) + (i === 0 ? -3 : 3), 22 + (i % 2) * 0, g + 'GB GPU', { anchor: i === 0 ? 'end' : 'start', size: 10, fill: PAL[1], w: 700 }));
      });
      var rows = [];
      METHODS.forEach(function (m, i) {
        var v = m.f(n, a), y = 44 + i * 54, w = px(v) - 110;
        kids.push(T(106, y + 20, m.k, { anchor: 'end', size: 11 }));
        kids.push(R(110, y, Math.max(2, w), 32, { fill: m.c, stroke: m.c, rx: 3 }));
        kids.push(T(110 + Math.max(2, w) + 5, y + 20, Math.round(v) + ' GB', { size: 12, w: 700 }));
        var fit = GPUS.filter(function (g) { return v <= g; })[0];
        rows.push([m.k, Math.round(v) + ' GB', fit ? 'fits ' + fit + ' GB GPU' : 'needs multiple GPUs', m.how]);
        m.v = v; m.fit = fit;
      });
      S.replaceChildren.apply(S, kids);
      tbl.replaceChildren(h('table', null, h('thead', null, h('tr', null, ['Method', 'Estimate', 'Smallest single GPU', 'Rule of thumb'].map(function (x) { return h('th', null, x); }))),
        h('tbody', null, rows.map(function (r) { return h('tr', null, r.map(function (c) { return h('td', null, c); })); }))));
      var q = METHODS[2], lo = METHODS[1], fu = METHODS[0];
      out.textContent = 'What you just saw: on a ' + n + 'B model, full fine-tuning needs about ' + Math.round(fu.v) + ' GB while QLoRA needs about ' + Math.round(q.v) + ' GB' +
        (q.fit ? ', which fits a single ' + q.fit + ' GB GPU' : ', still more than one 80 GB GPU') + '; LoRA sits in between at ' + Math.round(lo.v) + ' GB.';
    }
    sel.setAttribute('aria-label', 'Model size');
    act.setAttribute('aria-label', 'Activation memory in gigabytes');
    sel.addEventListener('change', function () { st.n = +sel.value; draw(); });
    act.addEventListener('input', function () { st.act = +act.value; actOut.textContent = act.value + ' GB'; draw(); });
    root.append.apply(root, head('Memory: full fine-tune vs LoRA vs QLoRA', 'Pick a model size and activation budget. Estimates only (log scale): real usage varies with sequence length, batch size, and framework.').concat([
      h('div', { class: 'wrow', style: 'gap:14px;align-items:flex-end;flex-wrap:wrap' }, labeled('Model size', sel), labeled('Activations / overhead', h('span', { style: 'display:flex;gap:8px;align-items:center' }, act, actOut))),
      S, tbl, out
    ]));
    draw();
  };

  // ---------- 3. Escalation ladder ----------
  window.QAW.p6_ladder = function (root) {
    var Q = {
      eval: { t: 'Do you have an eval set, and have you iterated on prompts and few-shot examples seriously?', y: 'know', n: 'R_prompt' },
      know: { t: 'Is the failure about missing knowledge (fresh, private or citable facts) rather than behavior?', y: 'R_rag', n: 'chg' },
      chg: { t: 'Do requirements or desired behavior change every week or so?', y: 'R_fewshot', n: 'data' },
      data: { t: 'Do you have hundreds or more high-quality, representative examples (or can you build them)?', y: 'why', n: 'R_fewshot2' },
      why: { t: 'Is the need consistency of style/format, a smaller or cheaper model, or removing a long prompt at high volume?', y: 'R_ft', n: 'R_fewshot' }
    };
    var RES = {
      R_prompt: { rung: 0, t: 'Prompt engineering first', d: 'Build a small eval set and iterate on instructions and few-shot examples. Fine-tuning without measurement is gambling with GPU money.' },
      R_fewshot: { rung: 1, t: 'Stay with prompting and few-shot', d: 'Cheap to edit, instant to deploy. Revisit fine-tuning when the behavior stabilizes and a measured gap remains.' },
      R_fewshot2: { rung: 1, t: 'Few-shot now, collect data', d: 'A few hundred noisy examples often lose to good few-shot prompting. Log production cases and curate them for later.' },
      R_rag: { rung: 2, t: 'Use RAG', d: 'Knowledge belongs in a retrieval index: easy to update, citable. Fine-tune later only for behavior.' },
      R_ft: { rung: 3, t: 'Fine-tune (LoRA/QLoRA), keep RAG for facts', d: 'Cheaper rungs have plateaued and you have data. Hold out a test set, compare to the prompted baseline, check for regressions.' }
    };
    var RUNGS = ['1. Prompt engineering', '2. Few-shot examples', '3. RAG (knowledge gap)', '4. Fine-tuning (LoRA/QLoRA)'];
    var st = { cur: 'eval', trail: [], res: null };
    var qBox = h('div', { class: 'apanel', style: 'margin:8px 0' });
    var ladder = svg('svg', { viewBox: '0 0 300 190', role: 'img', 'aria-label': 'Four-rung escalation ladder: prompt engineering, few-shot, RAG, fine-tuning', style: 'width:100%;max-width:320px;display:block' });
    var trailBox = h('div', { style: 'font-size:12px;color:var(--tx2);margin-top:6px' });
    var out = takeaway();
    function draw() {
      var kids = [];
      RUNGS.forEach(function (name, i) {
        var y = 140 - i * 44, on = st.res && RES[st.res].rung === i;
        kids.push(R(10 + i * 14, y, 270 - i * 14, 34, { fill: on ? PAL[0] : 'var(--bg3)', stroke: on ? PAL[0] : 'var(--bd)', sw: on ? 2 : 1 }));
        kids.push(T(20 + i * 14, y + 21, (on ? '>> ' : '') + name, { size: 12, w: on ? 700 : 400, fill: on ? '#fff' : 'var(--tx)' }));
      });
      kids.push(T(150, 186, 'cost and effort rise as you climb', { anchor: 'middle', size: 10, fill: 'var(--tx2)' }));
      ladder.replaceChildren.apply(ladder, kids);
      qBox.replaceChildren();
      if (st.res) {
        var r = RES[st.res];
        qBox.append(h('b', null, 'Recommendation: ' + r.t), h('div', { style: 'margin-top:4px' }, r.d));
        out.textContent = 'What you just saw: the answers led to rung ' + (r.rung + 1) + ' of 4; you only escalate when a cheaper rung measurably fails.';
      } else {
        var q = Q[st.cur];
        qBox.append(h('div', { style: 'font-weight:600;margin-bottom:8px' }, 'Question ' + (st.trail.length + 1) + ': ' + q.t),
          h('div', { class: 'wrow', style: 'gap:8px' },
            h('button', { type: 'button', class: 'btn p', onclick: function () { go(true); } }, 'Yes'),
            h('button', { type: 'button', class: 'btn', onclick: function () { go(false); } }, 'No')));
        out.textContent = 'Answer honestly: the ladder always starts at the cheapest rung and climbs only when evidence says so.';
      }
      trailBox.textContent = st.trail.length ? 'Your answers: ' + st.trail.map(function (s) { return s.key + '=' + (s.a ? 'yes' : 'no'); }).join(', ') : '';
    }
    function go(a) {
      var q = Q[st.cur], nx = a ? q.y : q.n;
      st.trail.push({ key: st.cur, a: a });
      if (RES[nx]) st.res = nx; else st.cur = nx;
      draw();
    }
    function back() {
      if (!st.trail.length) return;
      var last = st.trail.pop(); st.cur = last.key; st.res = null; draw();
    }
    function reset() { st.cur = 'eval'; st.trail = []; st.res = null; draw(); }
    root.append.apply(root, head('Escalation ladder', 'Answer the questions about your scenario; the highlighted rung is the cheapest one that should work.').concat([
      h('div', { class: 'wrow', style: 'gap:16px;align-items:flex-start;flex-wrap:wrap' },
        h('div', { style: 'flex:1 1 240px' }, ladder),
        h('div', { style: 'flex:2 1 260px' }, qBox,
          h('div', { class: 'wrow', style: 'gap:8px' },
            h('button', { type: 'button', class: 'btn', onclick: back }, 'Back'),
            h('button', { type: 'button', class: 'btn', onclick: reset }, 'Reset')), trailBox)),
      out
    ]));
    draw();
  };

  // ---------- 4. Training curves + metrics picker ----------
  window.QAW.p6_curves = function (root) {
    var st = { ep: 6, data: 'small', task: 'cls' };
    var epIn = h('input', { type: 'range', min: 1, max: 12, step: 1, value: 6 });
    var epOut = h('output', { style: 'font-weight:600' }, '6');
    var dSel = h('select', { class: 'wi' }, h('option', { value: 'small' }, 'Small dataset (~500 examples)'), h('option', { value: 'large' }, 'Large dataset (~20,000 examples)'));
    var tSel = h('select', { class: 'wi' },
      h('option', { value: 'cls' }, 'Classification / extraction'), h('option', { value: 'gen' }, 'Free-text generation'),
      h('option', { value: 'code' }, 'Code / SQL'), h('option', { value: 'rag' }, 'RAG question answering'), h('option', { value: 'ops' }, 'Production viability'));
    var S = svg('svg', { viewBox: '0 0 460 240', role: 'img', 'aria-label': 'Training and validation loss versus epoch; validation loss falls then rises when the model overfits', style: 'width:100%;max-width:640px;display:block' });
    var out = takeaway();
    var mbox = h('div', { class: 'apanel', style: 'margin-top:10px' });
    var METRICS = {
      cls: ['Accuracy, and precision / recall / F1 (macro and per class) when classes are imbalanced', 'Confusion matrix to see which classes are mixed up', 'Schema-validity rate and field-level exact match for extraction'],
      gen: ['LLM-judge rubric scores and pairwise win rate vs the baseline (validate the judge on human ratings)', 'Human preference ratings: the gold standard', 'BERTScore / METEOR for semantics; BLEU and ROUGE only as weak supporting signals'],
      code: ['pass@k and unit-test pass rate (HumanEval style)', 'Execution accuracy for SQL', 'Task completion rate, tool-call correctness, steps to completion for agents'],
      rag: ['Faithfulness / groundedness: is the answer supported by retrieved context?', 'Answer relevance, context precision, context recall (Ragas)', 'Retrieval side: hit rate, recall@k, MRR, nDCG'],
      ops: ['Latency (time-to-first-token, total) and throughput (tokens/sec)', 'Cost per 1K requests, error and timeout rates', 'Online task success, deflection, CSAT / thumbs, escalation rate']
    };
    function train(e) { return 0.25 + 1.9 * Math.exp(-0.45 * e); }
    function val(e) {
      var k = st.data === 'small' ? 0.045 : 0.004;
      return 0.5 + 1.7 * Math.exp(-0.5 * e) + k * Math.pow(Math.max(0, e - 2), 2);
    }
    function X(e) { return 44 + e * 34; }
    function Y(v) { return 200 - v * 80; }
    function draw() {
      var kids = [], best = 1, i;
      for (i = 1; i <= 12; i++) if (val(i) < val(best)) best = i;
      [0, 0.5, 1, 1.5, 2].forEach(function (v) {
        kids.push(L(44, Y(v), 452, Y(v), { dash: '2 4' }), T(38, Y(v) + 4, v.toFixed(1), { anchor: 'end', size: 10, fill: 'var(--tx2)' }));
      });
      for (i = 0; i <= 12; i += 2) kids.push(T(X(i), 216, String(i), { anchor: 'middle', size: 10, fill: 'var(--tx2)' }));
      kids.push(T(248, 234, 'epoch', { anchor: 'middle', size: 11, fill: 'var(--tx2)' }), T(8, 14, 'loss', { size: 11, fill: 'var(--tx2)' }));
      // faint future part
      function path(fn, from, to) { var p = []; for (var e = from; e <= to; e += 0.25) p.push((p.length ? 'L' : 'M') + X(e).toFixed(1) + ' ' + Y(fn(e)).toFixed(1)); return p.join(' '); }
      kids.push(svg('path', { d: path(train, 1, 12), style: 'fill:none;stroke:' + PAL[0] + ';stroke-width:1.5;opacity:.25' }));
      kids.push(svg('path', { d: path(val, 1, 12), style: 'fill:none;stroke:' + PAL[1] + ';stroke-width:1.5;opacity:.25;stroke-dasharray:5 3' }));
      kids.push(svg('path', { d: path(train, 1, st.ep), style: 'fill:none;stroke:' + PAL[0] + ';stroke-width:2.5' }));
      kids.push(svg('path', { d: path(val, 1, st.ep), style: 'fill:none;stroke:' + PAL[1] + ';stroke-width:2.5;stroke-dasharray:6 3' }));
      kids.push(svg('circle', { cx: X(st.ep), cy: Y(train(st.ep)), r: 5, style: 'fill:' + PAL[0] }));
      kids.push(svg('rect', { x: X(st.ep) - 5, y: Y(val(st.ep)) - 5, width: 10, height: 10, style: 'fill:' + PAL[1] }));
      kids.push(L(X(best), 20, X(best), 200, { stroke: PAL[2], sw: 2, dash: '4 3' }));
      kids.push(T(X(best) + 4, 30, 'best val: epoch ' + best, { size: 10, fill: PAL[2], w: 700 }));
      kids.push(svg('circle', { cx: 300, cy: 14, r: 4, style: 'fill:' + PAL[0] }), T(308, 18, 'train (solid)', { size: 10 }));
      kids.push(svg('rect', { x: 376, y: 9, width: 8, height: 8, style: 'fill:' + PAL[1] }), T(388, 18, 'val (dashed)', { size: 10 }));
      S.replaceChildren.apply(S, kids);
      var over = st.ep > best, gap = val(st.ep) - train(st.ep);
      out.textContent = over
        ? 'What you just saw: past epoch ' + best + ' training loss keeps falling (' + train(st.ep).toFixed(2) + ') while validation loss rises (' + val(st.ep).toFixed(2) + '): that is overfitting, so stop at epoch ' + best + ' or use fewer epochs. Curves are illustrative.'
        : 'What you just saw: at epoch ' + st.ep + ' both losses are still improving or at their best (gap ' + gap.toFixed(2) + '); keep training until validation loss stops improving. Curves are illustrative.';
      mbox.replaceChildren(h('b', null, 'Recommended metrics'), h('ul', { style: 'margin:6px 0 0 18px' }, METRICS[st.task].map(function (m) { return h('li', null, m); })));
    }
    epIn.setAttribute('aria-label', 'Epochs trained');
    dSel.setAttribute('aria-label', 'Dataset size');
    tSel.setAttribute('aria-label', 'Task type');
    epIn.addEventListener('input', function () { st.ep = +epIn.value; epOut.textContent = epIn.value; draw(); });
    dSel.addEventListener('change', function () { st.data = dSel.value; draw(); });
    tSel.addEventListener('change', function () { st.task = tSel.value; draw(); });
    root.append.apply(root, head('Training curves and metrics picker', 'Illustrative curves: drag the epoch slider, switch dataset size, then choose a task for suitable metrics.').concat([
      h('div', { class: 'wrow', style: 'gap:14px;align-items:flex-end;flex-wrap:wrap' },
        labeled('Dataset', dSel), labeled('Epochs trained', h('span', { style: 'display:flex;gap:8px;align-items:center' }, epIn, epOut))),
      S, out,
      h('div', { style: 'margin-top:12px' }, labeled('Which task are you measuring?', tSel)), mbox
    ]));
    draw();
  };
})();
