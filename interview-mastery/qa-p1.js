// Phase 1 widgets: Foundations of Generative AI. Registers QAW.p1_* (needs qa-core.js first). Offline, no libraries.
(function () {
  const { h, svg } = window.QAH;
  const PAL = ['#5856D6', '#ff9500', '#34c759', '#ff3b30', '#0a84ff', '#af52de'];
  const reducedMotion = () => window.QAH.reduced();

  function title(t, note) { return [h('h4', null, t), h('p', { class: 'wnote' }, note)]; }
  function btn(label, fn, cls, aria) {
    return h('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), onclick: fn, 'aria-label': aria || null }, label);
  }
  // Interval-based player that stops when the widget is removed and idles while off screen.
  function player(root, tick, ms) {
    let id = 0, vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(root);
    const api = {
      on: false, onchange: null,
      play() { if (api.on) return; api.on = true; id = setInterval(() => { if (!root.isConnected) { api.pause(); return; } if (vis) tick(); }, ms); api.onchange && api.onchange(); },
      pause() { api.on = false; clearInterval(id); api.onchange && api.onchange(); },
    };
    return api;
  }
  function labeled(text, input) { return h('label', { style: 'display:flex;flex-direction:column;gap:2px;font-size:.8rem;color:var(--tx2);min-width:120px;flex:1' }, text, input); }
  function slider(min, max, step, val, label, fn) {
    const s = h('input', { type: 'range', min, max, step, 'aria-label': label, style: 'width:100%' });
    s.value = val; s.addEventListener('input', () => fn(+s.value)); return s;
  }

  /* ---------- 1. LLM lifecycle ---------- */
  const STAGES = [
    { n: 'Data', full: 'Data collection and preparation', v: 1, txt: 'Crawl the web, books, code and licensed data; deduplicate, filter for quality and toxicity, then tokenize into trillions of tokens.', out: 'Clean token corpus' },
    { n: 'Pretrain', full: 'Pre-training', v: 1000, txt: 'Self-supervised next-token prediction on huge GPU/TPU clusters. The model learns language, facts and reasoning patterns.', out: 'Base model (continues text, ignores instructions)' },
    { n: 'SFT', full: 'Supervised fine-tuning', v: 5, txt: 'Train on curated (instruction, response) pairs so the model follows instructions like an assistant.', out: 'Instruction-following model' },
    { n: 'Align', full: 'Alignment (RLHF / RLAIF / DPO)', v: 20, txt: 'Use human or AI preference data to make answers more helpful, harmless and honest.', out: 'Aligned assistant' },
    { n: 'Eval', full: 'Evaluation and red-teaming', v: 3, txt: 'Benchmarks (MMLU, HumanEval, GSM8K), domain evals, safety tests and adversarial probing before release.', out: 'Go / no-go decision' },
    { n: 'Deploy', full: 'Deployment and inference', v: 300, txt: 'Serve behind an API with quantization, KV caching, batching and speculative decoding. Most application teams join here by consuming a hosted model.', out: 'Live API' },
    { n: 'Monitor', full: 'Monitoring and improvement', v: 10, txt: 'Track quality, drift, cost and misuse; feed findings into the next training cycle or a fine-tune.', out: 'Feedback for the next cycle' },
  ];
  window.QAW.p1_lifecycle = function (root) {
    let cur = 0;
    const W = 700, X = i => 50 + i * 100;
    const packet = svg('g', { style: 'transition:transform .7s ease' }, svg('circle', { r: 11, cy: 40, fill: '#ff9500', stroke: 'var(--tx)', 'stroke-width': 1.5 }), svg('text', { y: 44, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, style: 'fill:#000' }, '●'));
    const nodes = STAGES.map((s, i) => svg('g', null,
      svg('circle', { cx: X(i), cy: 40, r: 20, style: 'fill:var(--bg3);stroke:var(--bd);stroke-width:2' }),
      svg('text', { x: X(i), y: 45, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, style: 'fill:var(--tx)' }, String(i + 1))));
    const track = svg('line', { x1: X(0), y1: 40, x2: X(6), y2: 40, style: 'stroke:var(--bd);stroke-width:3', 'stroke-dasharray': '6 5' });
    const bar = svg('svg', { viewBox: `0 0 ${W} 80`, style: 'width:100%;height:auto;display:block', role: 'img', 'aria-label': 'Seven stage LLM lifecycle with a packet moving between stages' }, track, nodes, packet);
    const chips = STAGES.map((s, i) => h('button', { type: 'button', class: 'btn', style: 'flex:1;min-width:70px;padding:4px 6px;font-size:.8rem', onclick: () => { pl.pause(); go(i); } }, (i + 1) + '. ' + s.n));
    const detail = h('div', { class: 'apanel', 'aria-live': 'polite' });
    const bars = STAGES.map((s, i) => {
      const f = h('div', { style: 'height:100%;border-radius:4px;transition:width .4s' });
      const val = h('span', { style: 'font-size:.75rem;color:var(--tx2);min-width:62px;text-align:right' }, '~' + s.v + ' u');
      const row = h('div', { style: 'display:flex;align-items:center;gap:6px;margin:3px 0' },
        h('span', { style: 'font-size:.78rem;min-width:62px;color:var(--tx)' }, s.n),
        h('div', { style: 'flex:1;height:14px;background:var(--bg3);border-radius:4px;overflow:hidden' }, f), val);
      f.style.width = (Math.log10(s.v * 2) / Math.log10(2000) * 100) + '%';
      return { row, f };
    });
    const take = h('p', { style: 'font-weight:600;margin:8px 0 0' });
    function go(i) {
      cur = (i + STAGES.length) % STAGES.length;
      packet.style.transform = `translate(${X(cur)}px,0)`;
      if (reducedMotion()) packet.style.transition = 'none';
      packet.setAttribute('transform', `translate(${X(cur)},0)`);
      nodes.forEach((g, k) => { const c = g.firstChild; c.style.fill = k === cur ? PAL[0] : 'var(--bg3)'; c.style.stroke = k <= cur ? PAL[0] : 'var(--bd)'; g.lastChild.style.fill = k === cur ? '#fff' : 'var(--tx)'; });
      chips.forEach((c, k) => { c.classList.toggle('p', k === cur); c.setAttribute('aria-pressed', k === cur); });
      const s = STAGES[cur];
      detail.replaceChildren(h('b', null, `Stage ${cur + 1}: ${s.full}`), h('br'), s.txt, h('br'), h('i', null, 'Output: ' + s.out));
      bars.forEach((b, k) => { b.f.style.background = k === cur ? PAL[1] : PAL[0]; b.row.style.outline = k === cur ? '1px solid var(--tx2)' : 'none'; });
      take.textContent = cur === 1 ? 'What you just saw: pretraining dwarfs every other training stage in compute, and it only produces a base model.'
        : cur === 5 ? 'What you just saw: application teams usually start at stage 6, consuming a hosted model, and can loop back to stages 3-4 with fine-tuning.'
        : `What you just saw: stage ${cur + 1} (${s.n}) turns the previous output into "${s.out.toLowerCase()}".`;
    }
    const pl = player(root, () => go(cur + 1), 1600);
    const playBtn = btn('Play', () => (pl.on ? pl.pause() : pl.play()), 'p');
    pl.onchange = () => { playBtn.textContent = pl.on ? 'Pause' : 'Play'; };
    root.append(...title('\u{1F501} The LLM lifecycle', 'Press Play (or click a stage) to follow a model from raw data to production. Bars are illustrative relative compute on a log scale, not measurements.'),
      bar, h('div', { class: 'wrow', style: 'gap:4px;flex-wrap:wrap' }, chips),
      h('div', { class: 'wrow', style: 'margin:8px 0' }, playBtn, btn('Step', () => { pl.pause(); go(cur + 1); }), btn('Reset', () => { pl.pause(); go(0); })),
      detail, h('div', { style: 'margin-top:8px' }, h('div', { style: 'font-size:.8rem;color:var(--tx2)' }, 'Relative compute per stage (log scale, illustrative units "u")'), bars.map(b => b.row)), take);
    go(0);
  };

  /* ---------- 2. Token explorer ---------- */
  const COMMON = new Set('the a an and or of to in on at is are was were be it this that for with as by from not but we you i he she they my your our can will do does how what why when where who which if then so than too very just about into out up down over after before'.split(' '));
  const PIECES = ['ization', 'ation', 'ment', 'ness', 'ing', 'tion', 'ical', 'able', 'ed', 'ly', 'er', 'es', 's', 'un', 're', 'pre', 'token', 'embed', 'model', 'trans', 'form', 'gen', 'erat', 'ive', 'ai', 'lang', 'uage', 'learn', 'data', 'http', 'www', 'com', 'def', 'return', 'print', 'import'];
  function pieceSplit(w) {
    const out = []; let s = w, guard = 0;
    while (s && guard++ < 40) {
      const low = s.toLowerCase(); let hit = '';
      for (const p of PIECES) if (low.startsWith(p) && p.length > hit.length) hit = p;
      if (!hit) { for (const p of PIECES) if (low.endsWith(p) && p.length > 2 && s.length > p.length + 1) { out.push(...pieceSplit(s.slice(0, -p.length))); out.push(s.slice(-p.length)); return out; } }
      const n = hit ? hit.length : Math.min(3, s.length);
      out.push(s.slice(0, n)); s = s.slice(n);
    }
    return out;
  }
  function tokenize(text) {
    const toks = []; const re = /(\s*)([A-Za-z]+|\d+|[^\sA-Za-z\d])/g; let m;
    while ((m = re.exec(text))) {
      const sp = m[1] ? ' ' : '', w = m[2];
      if (/^[A-Za-z]+$/.test(w)) {
        if (COMMON.has(w.toLowerCase()) || (w.length <= 4)) toks.push(sp + w);
        else { const ps = pieceSplit(w); ps.forEach((p, i) => toks.push((i ? '' : sp) + p)); }
      } else if (/^\d+$/.test(w)) { for (let i = 0; i < w.length; i += 3) toks.push((i ? '' : sp) + w.slice(i, i + 3)); }
      else if (/[^\x00-\x7f]/.test(w)) { const n = Math.max(1, Math.min(3, new TextEncoder().encode(w).length - 1)); for (let k = 0; k < n; k++) toks.push(k ? '…' : sp + w); }
      else toks.push(sp + w);
    }
    return toks;
  }
  window.QAW.p1_tokens = function (root) {
    const SAMPLES = {
      'English sentence': 'Tokenization turns unbelievable text into subword pieces for the model.',
      'Python code': 'def add(a, b):\n    return a + b\nprint(add(1234, 5678))',
      'URL': 'https://www.example.com/products/2024/summary?id=9876543',
      'Hindi (non-Latin script)': 'नमस्ते, आप कैसे हैं?',
    };
    const ta = h('textarea', { class: 'wi', rows: 3, 'aria-label': 'Text to tokenize', style: 'width:100%;font-family:inherit' });
    ta.value = SAMPLES['English sentence'];
    const sel = h('select', { class: 'wi', 'aria-label': 'Sample text' }, Object.keys(SAMPLES).map(k => h('option', { value: k }, k)));
    sel.addEventListener('change', () => { ta.value = SAMPLES[sel.value]; draw(); });
    const price = h('input', { type: 'number', class: 'wi', min: 0, step: 0.1, 'aria-label': 'Price in dollars per million input tokens' }); price.value = 3;
    const win = h('select', { class: 'wi', 'aria-label': 'Context window size' }, [[8000, '8K'], [32000, '32K'], [128000, '128K'], [200000, '200K'], [1000000, '1M']].map(([v, l]) => h('option', { value: v }, l + ' tokens')));
    win.value = 128000;
    const rep = slider(1, 2000, 1, 1, 'Number of copies of this text in the prompt', v => { repOut.textContent = v; draw(); });
    const repOut = h('b', null, '1');
    const chipBox = h('div', { style: 'display:flex;flex-wrap:wrap;gap:3px;padding:8px;background:var(--bg3);border-radius:8px;min-height:40px;line-height:1.6', 'aria-live': 'polite' });
    const stats = h('div', { class: 'apanel' });
    const fill = h('div', { style: 'height:100%;background:#5856D6;transition:width .3s' });
    const meter = h('div', { style: 'height:16px;background:var(--bg3);border:1px solid var(--bd);border-radius:8px;overflow:hidden', role: 'img', 'aria-label': 'Context window fill' }, fill);
    const take = h('p', { style: 'font-weight:600;margin:8px 0 0' });
    function draw() {
      const text = ta.value, toks = tokenize(text);
      chipBox.replaceChildren(...toks.map((t, i) => h('span', { title: 'token ' + (i + 1), style: `padding:1px 5px;border-radius:4px;border:1px solid ${PAL[i % 6]};background:${PAL[i % 6]}26;font-family:monospace;font-size:.85rem;white-space:pre-wrap;color:var(--tx)` }, t.replace(/\n/g, '↵\n'))));
      const n = toks.length, ch = text.length, wd = (text.trim().match(/\S+/g) || []).length, r = +rep.value;
      const total = n * r, pw = +win.value, pct = Math.min(100, total / pw * 100), cost = total * (+price.value || 0) / 1e6;
      const est = Math.round(ch / 4);
      stats.replaceChildren(h('table', null, h('tbody', null,
        h('tr', null, h('td', null, 'Tokens / characters / words'), h('td', null, `${n} / ${ch} / ${wd}`)),
        h('tr', null, h('td', null, 'Characters per token'), h('td', null, n ? (ch / n).toFixed(2) : '-')),
        h('tr', null, h('td', null, 'Rule-of-thumb estimate (chars / 4)'), h('td', null, '~' + est + ' tokens')),
        h('tr', null, h('td', null, 'Prompt size with copies'), h('td', null, total.toLocaleString() + ' tokens')),
        h('tr', null, h('td', null, 'Input cost per call'), h('td', null, '$' + (cost < 0.01 ? cost.toFixed(5) : cost.toFixed(3)))),
        h('tr', null, h('td', null, 'Cost for 10,000 calls'), h('td', null, '$' + (cost * 1e4).toFixed(2))))));
      fill.style.width = pct + '%'; fill.style.background = pct > 100 ? PAL[3] : total > pw ? PAL[3] : PAL[0];
      meter.setAttribute('aria-label', `Context window ${pct.toFixed(1)} percent full`);
      const over = total > pw;
      take.textContent = over ? 'What you just saw: the prompt no longer fits the context window, so something must be truncated or summarized.'
        : (ch / Math.max(n, 1) < 3 ? 'What you just saw: this text costs more tokens per character than plain English, so the same content is pricier and uses more context.'
          : `What you just saw: the text became ${n} tokens, and context, cost and speed are all counted in tokens, not words.`);
      meter.nextSibling && (meter.nextSibling.textContent = `Context used: ${pct.toFixed(1)}% (${total.toLocaleString()} of ${pw.toLocaleString()})`);
    }
    ta.addEventListener('input', draw); price.addEventListener('input', draw); win.addEventListener('change', draw);
    root.append(...title('\u{1F9E9} Token explorer', 'Edit the text or pick a sample; chips show a toy subword split (real BPE vocabularies differ). Raise copies to mimic stuffing many RAG chunks into a prompt.'),
      h('div', { class: 'wrow', style: 'gap:8px;flex-wrap:wrap' }, labeled('Sample', sel), labeled('Price $ per 1M input tokens', price), labeled('Context window', win)),
      ta, h('div', { style: 'margin:6px 0 2px;font-size:.8rem;color:var(--tx2)' }, 'Tokens (each outlined chip is one token; a leading space belongs to the token):'), chipBox,
      h('div', { style: 'margin:8px 0 2px;font-size:.85rem' }, 'Copies of this text in the prompt: ', repOut), rep,
      h('div', { style: 'margin-top:8px' }, meter, h('div', { style: 'font-size:.78rem;color:var(--tx2);margin-top:2px' })), stats, take);
    draw();
  };

  /* ---------- 3. Attention heatmap ---------- */
  const SENT = ['The', 'trophy', "didn't", 'fit', 'in', 'the', 'suitcase', 'because', 'it', 'was', 'too', 'big'];
  function attnRows(big, causal) {
    const spec = [
      { 0: 3, 1: 2 }, { 0: 2, 1: 3, 2: 1 }, { 1: 3, 2: 2, 3: 2 }, { 1: 2, 2: 3, 3: 2, 6: 1 },
      { 3: 2, 4: 2, 5: 1, 6: 1 }, { 4: 1, 5: 2, 6: 3 }, { 3: 1.5, 4: 1, 5: 2, 6: 3 }, { 3: 2, 6: 1, 7: 3, 8: 1 },
      { 1: big ? 4 : 1.5, 6: big ? 1.5 : 4, 7: 1, 8: 1 }, { 8: 3, 9: 2, 7: 1 }, { 8: 1, 9: 2, 10: 2, 11: 2 },
      { 1: big ? 2 : 0.5, 6: big ? 0.5 : 2, 8: 2.5, 10: 2, 11: 1 }];
    return spec.map((sp, i) => {
      const r = SENT.map((_, j) => (causal && j > i ? 0 : (sp[j] || 0) + 0.1));
      const s = r.reduce((a, b) => a + b, 0); return r.map(v => v / s);
    });
  }
  window.QAW.p1_attention = function (root) {
    let q = 8, big = true, causal = false;
    const N = SENT.length, C = 30, L = 70;
    const wordBtns = SENT.map((w, i) => h('button', { type: 'button', class: 'btn', style: 'padding:3px 8px', onclick: () => { q = i; draw(); } }, w));
    const sizeSel = h('select', { class: 'wi', 'aria-label': 'Final word of the sentence' }, h('option', { value: 'big' }, '... too big'), h('option', { value: 'small' }, '... too small'));
    sizeSel.addEventListener('change', () => { big = sizeSel.value === 'big'; SENT[11] = big ? 'big' : 'small'; wordBtns[11].textContent = SENT[11]; draw(); });
    const cbx = h('input', { type: 'checkbox', id: 'p1c' + Math.random().toString(36).slice(2, 6) });
    cbx.addEventListener('change', () => { causal = cbx.checked; draw(); });
    const grid = svg('svg', { viewBox: `0 0 ${L + N * C + 4} ${L + N * C + 4}`, style: 'width:100%;max-width:440px;height:auto;display:block', role: 'img', 'aria-label': 'Attention heatmap, rows are the attending word, columns are the attended word' });
    const bars = h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:8px 0' }, []);
    const take = h('p', { style: 'font-weight:600;margin:8px 0 0' });
    function draw() {
      const M = attnRows(big, causal);
      wordBtns.forEach((b, i) => { b.classList.toggle('p', i === q); b.setAttribute('aria-pressed', i === q); });
      grid.replaceChildren();
      SENT.forEach((w, i) => {
        grid.append(svg('text', { x: L - 4, y: L + i * C + C / 2 + 4, 'text-anchor': 'end', 'font-size': 11, style: `fill:var(--tx);font-weight:${i === q ? 700 : 400}` }, w));
        grid.append(svg('text', { x: L + i * C + C / 2, y: L - 6, 'text-anchor': 'start', 'font-size': 11, transform: `rotate(-50 ${L + i * C + C / 2} ${L - 6})`, style: 'fill:var(--tx2)' }, w));
        SENT.forEach((_, j) => {
          const v = M[i][j], sel = i === q;
          grid.append(svg('rect', { x: L + j * C, y: L + i * C, width: C - 1, height: C - 1, rx: 3, style: `fill:#5856D6;fill-opacity:${(v * 1.6).toFixed(3)};stroke:${sel ? 'var(--tx)' : 'var(--bd)'};stroke-width:${sel ? 1.5 : 0.5}`, 'data-v': v.toFixed(2) }));
          if (v >= 0.2) grid.append(svg('text', { x: L + j * C + C / 2 - 0.5, y: L + i * C + C / 2 + 4, 'text-anchor': 'middle', 'font-size': 9.5, style: 'fill:var(--tx)' }, Math.round(v * 100)));
        });
      });
      const row = M[q];
      bars.replaceChildren(...SENT.map((w, j) => h('span', { style: `padding:2px 8px;border-radius:6px;border:1px solid var(--bd);font-size:.85rem;background:rgba(88,86,214,${Math.min(0.85, row[j] * 1.6).toFixed(2)});color:var(--tx)` }, `${w} ${Math.round(row[j] * 100)}%`)));
      const top = row.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]).filter(x => x[1] !== q)[0];
      take.textContent = q === 8 || q === 11 ? `What you just saw: "${SENT[q]}" puts most of its non-self weight on "${SENT[top[1]]}", so changing the last word to "${SENT[11]}" shifts what "it" refers to (illustrative weights).`
        : `What you just saw: while processing "${SENT[q]}", the model mixes information from every allowed word, most strongly "${SENT[top[1]]}" (${Math.round(top[0] * 100)}%).`;
    }
    root.append(...title('\u{1F50D} Attention heatmap', 'Click a word to see where it looks (each row sums to 100%). Weights are hand-authored to be plausible, not taken from a real model. Try swapping big/small, then the causal mask.'),
      h('div', { class: 'wrow', style: 'gap:10px;flex-wrap:wrap;align-items:flex-end' }, labeled('Sentence ending', sizeSel), h('label', { style: 'display:flex;gap:6px;align-items:center;font-size:.85rem' }, cbx, 'Causal mask (decoder-only: no peeking right)')),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin:8px 0', role: 'group', 'aria-label': 'Choose the word that attends' }, wordBtns), grid,
      h('div', { style: 'font-size:.8rem;color:var(--tx2)' }, 'Selected word attends to (percent of attention):'), bars, take);
    draw();
  };

  /* ---------- 4. Sampling ---------- */
  const PROMPTS = {
    'The capital of France is': [[' Paris', 6.0], [' known', 2.0], [' a', 3.2], [' the', 3.0], [' located', 2.6], [' Lyon', 1.8], [' France', 1.5], [' beautiful', 1.4], [' not', 1.2], [' Marseille', 0.9]],
    'Once upon a time, there was a': [[' little', 3.6], [' young', 3.3], [' king', 3.0], [' princess', 2.8], [' brave', 2.5], [' dragon', 2.1], [' poor', 1.9], [' wizard', 1.6], [' very', 1.0], [' robot', 0.4]],
  };
  window.QAW.p1_sampling = function (root) {
    let T = 1, K = 10, P = 1, tally = {}, last = '';
    const pSel = h('select', { class: 'wi', 'aria-label': 'Prompt' }, Object.keys(PROMPTS).map(k => h('option', { value: k }, k)));
    const lT = h('b', null, '1.0'), lK = h('b', null, '10 (off)'), lP = h('b', null, '1.00 (off)');
    const sT = slider(0, 2, 0.05, 1, 'Temperature', v => { T = v; lT.textContent = v === 0 ? '0 (greedy)' : v.toFixed(2); draw(); });
    const sK = slider(1, 10, 1, 10, 'Top-k', v => { K = v; lK.textContent = v === 10 ? '10 (off)' : v; draw(); });
    const sP = slider(0.1, 1, 0.05, 1, 'Top-p', v => { P = v; lP.textContent = v === 1 ? '1.00 (off)' : v.toFixed(2); draw(); });
    pSel.addEventListener('change', () => { tally = {}; last = ''; draw(); });
    const chart = h('div', { role: 'img', 'aria-label': 'Bar chart of next-token probabilities' });
    const out = h('div', { class: 'apanel', 'aria-live': 'polite' });
    const take = h('p', { style: 'font-weight:600;margin:8px 0 0' });
    let state = null;
    function compute() {
      const toks = PROMPTS[pSel.value].slice().sort((a, b) => b[1] - a[1]);
      let pr;
      if (T === 0) pr = toks.map((_, i) => (i === 0 ? 1 : 0));
      else { const mx = toks[0][1], e = toks.map(t => Math.exp((t[1] - mx) / T)), s = e.reduce((a, b) => a + b, 0); pr = e.map(v => v / s); }
      const raw = pr.slice(), keep = toks.map((_, i) => i < K);
      let cum = 0;
      toks.forEach((_, i) => { if (!keep[i]) return; if (cum >= P && i > 0) keep[i] = false; cum += pr[i]; });
      const ks = pr.reduce((a, v, i) => a + (keep[i] ? v : 0), 0);
      const fin = pr.map((v, i) => (keep[i] ? v / ks : 0));
      return { toks, raw, keep, fin };
    }
    function pick() { const r = Math.random(); let c = 0; for (let i = 0; i < state.fin.length; i++) { c += state.fin[i]; if (r <= c && state.fin[i] > 0) return i; } return state.fin.findIndex(v => v > 0); }
    function sample(n) {
      for (let k = 0; k < n; k++) { const i = pick(), t = state.toks[i][0]; tally[t] = (tally[t] || 0) + 1; last = t; }
      draw();
    }
    function draw() {
      state = compute();
      const total = Object.values(tally).reduce((a, b) => a + b, 0);
      chart.replaceChildren(...state.toks.map(([t], i) => {
        const kept = state.keep[i];
        const w1 = state.raw[i] * 100, w2 = state.fin[i] * 100, emp = total ? (tally[t] || 0) / total * 100 : 0;
        return h('div', { style: 'display:flex;align-items:center;gap:6px;margin:3px 0;font-size:.82rem' },
          h('span', { style: `min-width:84px;font-family:monospace;color:var(--tx);${kept ? '' : 'text-decoration:line-through;opacity:.6'}` }, t.trim() || t),
          h('div', { style: 'position:relative;flex:1;height:16px;background:var(--bg3);border-radius:4px;overflow:hidden' },
            h('div', { style: `position:absolute;left:0;top:0;height:100%;width:${w1}%;background:repeating-linear-gradient(45deg,var(--bd),var(--bd) 3px,transparent 3px,transparent 6px);transition:width .25s` }),
            h('div', { style: `position:absolute;left:0;top:0;height:100%;width:${w2}%;background:${PAL[0]};opacity:.9;transition:width .25s` }),
            total ? h('div', { style: `position:absolute;left:0;bottom:0;height:4px;width:${emp}%;background:${PAL[1]}` }) : null),
          h('span', { style: 'min-width:92px;color:var(--tx2);font-size:.75rem;text-align:right' }, kept ? (state.fin[i] * 100).toFixed(1) + '%' : 'cut'));
      }));
      const nk = state.keep.filter(Boolean).length;
      out.replaceChildren(h('div', null, 'Prompt: ', h('b', null, pSel.value + (last || ' ...'))), h('div', { style: 'font-size:.8rem;color:var(--tx2)' }, `Candidates kept: ${nk} of ${state.toks.length}. Samples drawn: ${total}.`));
      take.textContent = T === 0 ? 'What you just saw: temperature 0 is greedy decoding, so the top token wins every time.'
        : nk === 1 ? 'What you just saw: top-k / top-p left a single candidate, which behaves like greedy decoding.'
        : T < 0.5 ? 'What you just saw: low temperature sharpens the distribution, so output is focused and repeatable.'
        : T > 1.2 ? 'What you just saw: high temperature flattens the distribution, so unlikely tokens are sampled more often (creative but riskier).'
        : 'What you just saw: sampling picks randomly from the kept tokens, weighted by probability, so the same prompt can give different answers.';
    }
    root.append(...title('\u{1F3B2} Next-token sampling', 'Hatched bar = raw probability; solid purple = probability after top-k / top-p (renormalised); orange underline = your sample history. Logits are made up for illustration.'),
      h('div', { class: 'wrow', style: 'gap:8px;flex-wrap:wrap' }, labeled('Prompt', pSel),
        labeled(h('span', null, 'Temperature: ', lT), sT), labeled(h('span', null, 'Top-k: ', lK), sK), labeled(h('span', null, 'Top-p: ', lP), sP)),
      chart, h('div', { class: 'wrow', style: 'margin:8px 0' }, btn('Sample 1 token', () => sample(1), 'p'), btn('Sample 100', () => sample(100)), btn('Clear history', () => { tally = {}; last = ''; draw(); })), out, take);
    draw();
  };
})();
