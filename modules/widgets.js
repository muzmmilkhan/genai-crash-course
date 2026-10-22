// Interactive widgets for the module pages. Everything runs locally in the browser.
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => { if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v); });
    kids.flat().forEach(k => { if (k != null) el.append(k.nodeType ? k : document.createTextNode(k)); });
    return el;
  }
  const PAL = ['#007aff', '#ff9500', '#34c759', '#af52de', '#ff3b30', '#30b0c7', '#ff2d92'];
  const note = t => h('p', { class: 'wnote' }, t);

  // ---------- pure helpers (also unit-tested in node) ----------
  const PRE = ['un', 'pre', 'dis', 'mis', 'over', 're'], SUF = ['ing', 'tion', 'able', 'ness', 'ment', 'ly', 'ed', 'er', 'es', 's'];
  function splitWord(w) {
    const parts = [], low = w.toLowerCase(); let start = 0, end = w.length;
    for (const p of PRE) if (low.startsWith(p) && w.length - p.length >= 4) { parts.push(w.slice(0, p.length)); start = p.length; break; }
    let tail = '';
    for (const s of SUF) if (low.endsWith(s) && end - start - s.length >= 3) { tail = w.slice(end - s.length); end -= s.length; break; }
    let mid = w.slice(start, end);
    while (mid.length > 6) { parts.push(mid.slice(0, 5)); mid = mid.slice(5); }
    if (mid) parts.push(mid);
    if (tail) parts.push(tail);
    return parts;
  }
  function tokenize(text) {
    const out = [], re = /(\s?)([A-Za-z]+)|\s?\d{1,3}|\s?[^\sA-Za-z\d]|\s+/g; let m;
    while ((m = re.exec(text))) {
      if (m[2]) { const parts = splitWord(m[2]); parts.forEach((p, i) => out.push((i === 0 ? m[1] : '') + p)); }
      else out.push(m[0]);
    }
    return out;
  }
  function fakeId(t) { let x = 7; for (const c of t) x = (x * 131 + c.charCodeAt(0)) % 50257; return x; }
  function softmaxT(probs, T) {
    const l = probs.map(p => Math.log(p) / T), mx = Math.max(...l), e = l.map(v => Math.exp(v - mx)), s = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / s);
  }
  function sampleIdx(p, r) { let c = 0; for (let i = 0; i < p.length; i++) { c += p[i]; if (r < c) return i; } return p.length - 1; }
  const words = s => (s.toLowerCase().match(/[a-z0-9]+/g) || []);
  function tfidfScores(query, docs, syn) {
    const N = docs.length, toks = docs.map(d => words(d)), df = {};
    toks.forEach(t => new Set(t).forEach(w => df[w] = (df[w] || 0) + 1));
    let q = words(query); if (syn) q = q.concat(q.flatMap(w => syn[w] || []));
    return toks.map(t => { const tf = {}; t.forEach(w => tf[w] = (tf[w] || 0) + 1); return q.reduce((s, w) => s + (tf[w] || 0) * Math.log((N + 1) / ((df[w] || 0) + 1) + 1), 0); });
  }
  function chunkText(text, size, overlap) {
    const out = [], step = Math.max(1, size - overlap);
    for (let i = 0; i < text.length; i += step) { out.push([i, Math.min(text.length, i + size)]); if (i + size >= text.length) break; }
    return out;
  }
  function simulateCost(o) {
    let ctx = o.base, inTok = 0, cached = 0, outTok = 0; const series = [];
    for (let t = 1; t <= o.turns; t++) {
      if (o.compact && ctx > o.compactAt) ctx = Math.round(ctx * 0.2) + o.base * 0.5;
      const prefix = ctx; ctx += o.perTurn / 2;
      inTok += ctx; cached += o.cache ? prefix : 0; outTok += o.perTurn / 2;
      const cost = ((inTok - cached) + cached * 0.1) * o.pin / 1e6 + outTok * o.pout / 1e6;
      series.push({ t, ctx, inTok, cost });
      ctx += o.perTurn / 2;
    }
    return series;
  }
  if (typeof module !== 'undefined') { module.exports = { tokenize, softmaxT, sampleIdx, tfidfScores, chunkText, simulateCost }; return; }

  // ---------- widgets ----------
  const W = {};

  W.tokenizer = root => {
    const ta = h('textarea', { rows: 3, class: 'wi' }); ta.value = 'Tokenization splits unbelievable sentences into pieces, e.g. 2024 numbers!';
    const chips = h('div', { class: 'chips' }), stats = h('div', { class: 'stats' });
    function draw() {
      const toks = tokenize(ta.value); chips.replaceChildren();
      toks.forEach((t, i) => chips.append(h('span', { class: 'chip', style: `background:${PAL[i % PAL.length]}33;border-color:${PAL[i % PAL.length]}`, title: 'illustrative id ' + fakeId(t) }, t.replace(/ /g, '·').replace(/\n/g, '↵'))));
      const w = words(ta.value).length;
      stats.textContent = `${ta.value.length} characters · ${w} words · ${toks.length} tokens · ${(ta.value.length / Math.max(1, toks.length)).toFixed(1)} chars/token`;
    }
    ta.addEventListener('input', draw);
    root.append(h('h4', {}, '🔤 Try it: see how text becomes tokens'), ta, chips, stats, note('Approximation for learning. Real tokenizers (BPE variants) split text differently. Dots show leading spaces; hover a chip for an illustrative ID. Try code, emoji, or another language and watch the count change.'));
    draw();
  };

  W.sampler = root => {
    const SETS = {
      'The capital of France is': [[' Paris', .82], [' a', .06], [' the', .04], [' located', .03], [' Lyon', .02], [' known', .02], [' …', .01]],
      'Once upon a': [[' time', .45], [' midnight', .1], [' hill', .08], [' dream', .08], [' king', .08], [' star', .07], [' …', .14]],
      'My favourite programming language is': [[' Python', .3], [' JavaScript', .2], [' Rust', .15], [' Go', .12], [' TypeScript', .1], [' Swift', .08], [' …', .05]]
    };
    const sel = h('select', { class: 'wi' }, Object.keys(SETS).map(k => h('option', {}, k)));
    const slider = h('input', { type: 'range', min: 0.1, max: 2, step: 0.05, value: 1 }), tl = h('b', {}, '1.0');
    const bars = h('div', { class: 'bars' }), out = h('div', { class: 'sampout' }), hist = h('div', { class: 'stats' });
    const counts = {};
    let p;
    function draw() {
      const set = SETS[sel.value]; p = softmaxT(set.map(x => x[1]), +slider.value); tl.textContent = (+slider.value).toFixed(2);
      bars.replaceChildren(...set.map((x, i) => h('div', { class: 'brow' }, h('span', { class: 'bl' }, x[0].trim() || '…'), h('div', { class: 'bt' }, h('div', { class: 'bf', style: `width:${p[i] * 100}%;background:${PAL[i % 7]}` })), h('span', { class: 'bp' }, (p[i] * 100).toFixed(1) + '%'))));
    }
    function sample(n) {
      const set = SETS[sel.value];
      for (let k = 0; k < n; k++) { const i = sampleIdx(p, Math.random()); counts[sel.value + i] = (counts[sel.value + i] || 0) + 1; if (n === 1) out.textContent = sel.value + set[i][0]; }
      if (n > 1) out.textContent = '20 samples drawn'; 
      hist.textContent = 'Samples so far: ' + set.map((x, i) => `${x[0].trim() || '…'} ×${counts[sel.value + i] || 0}`).join(' · ');
    }
    sel.addEventListener('change', () => { out.textContent = ''; draw(); }); slider.addEventListener('input', draw);
    root.append(h('h4', {}, '🌡️ Try it: temperature and next-token probabilities'), h('div', { class: 'wrow' }, sel), h('div', { class: 'wrow' }, h('label', {}, 'Temperature ', tl), slider),
      bars, h('div', { class: 'wrow' }, h('button', { class: 'btn p', onclick: () => sample(1) }, 'Sample 1 token'), h('button', { class: 'btn', onclick: () => sample(20) }, 'Sample 20'), h('button', { class: 'btn', onclick: () => { Object.keys(counts).forEach(k => delete counts[k]); out.textContent = ''; hist.textContent = ''; } }, 'Reset')), out, hist,
      note('Low temperature sharpens the distribution (almost always the top token). High temperature flattens it, so unlikely tokens appear more often. Probabilities here are illustrative.'));
    draw();
  };

  W.promptbuilder = root => {
    const task = h('input', { class: 'wi', value: 'Summarize the incident report below' });
    const parts = [
      ['Role', 'You are a senior site reliability engineer.'],
      ['Audience', 'The summary is for non-technical executives.'],
      ['Context', 'The outage lasted 42 minutes and affected the checkout service in the EU region.'],
      ['Examples', 'Example style: "Checkout was unavailable for 42 minutes; fixed by rolling back release 1.8. No data lost."'],
      ['Constraints', 'Maximum 80 words. No jargon. Do not speculate about causes.'],
      ['Output format', 'Return 3 bullets: Impact, Cause, Next steps.']
    ];
    const boxes = parts.map(([n]) => h('label', { class: 'cbx' }, h('input', { type: 'checkbox' }), ' ' + n));
    const prompt = h('pre', { class: 'plain' }), meter = h('div', { class: 'meter' }, h('div', {})), resp = h('div', { class: 'resp' });
    const R = [
      'The incident report describes a service issue. Several systems were affected for some time and the team worked on it. Further investigation is recommended.',
      'Checkout was down for about 42 minutes in the EU. The team fixed the problem. Follow-up work is planned to prevent it from happening again.',
      '• Impact: Checkout unavailable in the EU for 42 minutes; no data lost.\n• Cause: Release 1.8 introduced the fault (confirmed by rollback).\n• Next steps: Add pre-release checks and review rollout process.'
    ];
    function draw() {
      const on = parts.filter((_, i) => boxes[i].firstChild.checked);
      prompt.textContent = [...on.slice(0, 1).map(p => p[1]), task.value + '.', ...on.slice(1).map(p => p[1])].join('\n\n');
      const n = on.length; meter.firstChild.style.width = (n / parts.length * 100) + '%';
      meter.firstChild.style.background = n < 2 ? '#ff3b30' : n < 5 ? '#ff9500' : '#34c759';
      resp.textContent = R[n < 2 ? 0 : n < 5 ? 1 : 2];
      resp.dataset.label = `Simulated response · prompt completeness ${n}/${parts.length}`;
    }
    boxes.forEach(b => b.firstChild.addEventListener('change', draw)); task.addEventListener('input', draw);
    root.append(h('h4', {}, '🧱 Try it: build a prompt layer by layer'), h('label', {}, 'Core task'), task, h('div', { class: 'cbxs' }, boxes), h('b', {}, 'Assembled prompt'), prompt, meter, resp,
      note('The response is a canned simulation to show the pattern: richer prompts remove ambiguity. Real models vary, so always test with your own inputs.'));
    draw();
  };

  W.promptfix = root => {
    const ta = h('textarea', { rows: 4, class: 'wi', placeholder: 'Rewrite the prompt here...' });
    const list = h('ul', { class: 'checks' });
    const CH = [
      ['States who it is for (audience)', /\b(for|audience|reader|manager|customer|beginner|team|executive|student)s?\b/i],
      ['Gives context or specifics (numbers, system, situation)', /\d|\b(because|context|about|our|this|the (app|api|service|report|code))\b/i],
      ['States the goal / purpose', /\b(so that|in order to|goal|to (help|decide|understand|fix|explain|reduce)|purpose)\b/i],
      ['Sets a format or length', /\b(bullets?|words?|sentences?|paragraphs?|table|json|steps?|list|under \d+|max(imum)?)\b/i],
      ['Is detailed enough (20+ words)', null]
    ];
    function draw() {
      const v = ta.value; let n = 0; list.replaceChildren();
      CH.forEach(([label, re]) => { const ok = re ? re.test(v) : words(v).length >= 20; if (ok) n++; list.append(h('li', { class: ok ? 'ok' : '' }, (ok ? '✅ ' : '⬜ ') + label)); });
      score.textContent = v.trim() ? `Prompt strength: ${n} / ${CH.length}` + (n === CH.length ? ' 🎉 Strong prompt!' : '') : '';
    }
    const score = h('div', { class: 'score' });
    ta.addEventListener('input', draw);
    root.append(h('h4', {}, '🛠️ Try it: fix this prompt'), h('div', { class: 'box warn' }, h('b', {}, 'Weak prompt: '), '"Explain our API errors."'),
      ta, list, score, note('Goal: write a version that scores 5/5. Example idea: "Explain our REST API error codes (400, 401, 429, 500) to junior developers so they can debug quickly. Use a table with code, meaning and first thing to check, under 150 words." The checker is a simple heuristic, not a real model.'));
    draw();
  };

  W.agentstep = root => {
    const STEPS = [
      ['Think', 'The user wants failing tests fixed. I should first see which tests fail.', null],
      ['Act', 'Run the test suite.', 'Bash: pytest -q'],
      ['Observe', '1 failed: test_count_words_empty — expected 0, got 1.', null],
      ['Think', 'The bug is probably in count_words. Let me read the file.', null],
      ['Act', 'Read wordcount.py.', 'Read: wordcount.py'],
      ['Observe', 'Found: len(text.split(" ")). Splitting on a single space miscounts an empty string.', null],
      ['Think', 'Use text.split() which handles empty strings and repeated whitespace.', null],
      ['Act', 'Edit wordcount.py to use text.split().', 'Edit: wordcount.py', true],
      ['Observe', 'File updated.', null],
      ['Act', 'Re-run tests.', 'Bash: pytest -q'],
      ['Observe', '4 passed.', null],
      ['Done', 'Fixed count_words and confirmed all tests pass. Please review the change.', null]
    ];
    let i = 0, timer = null, waiting = false;
    const log = h('div', { class: 'alog' }), ask = h('div', { class: 'ask' });
    const approve = h('input', { type: 'checkbox', checked: true });
    const COL = { Think: '#af52de', Act: '#ff9500', Observe: '#34c759', Done: '#ff3b30' };
    function add(kind, text, tool) {
      log.append(h('div', { class: 'astep' }, h('span', { class: 'tag', style: `background:${COL[kind]}` }, kind), h('span', {}, text, tool ? h('code', {}, tool) : null)));
      log.scrollTop = log.scrollHeight;
    }
    function next() {
      if (waiting || i >= STEPS.length) { stop(); return; }
      const [k, t, tool, risky] = STEPS[i];
      if (risky && approve.checked) {
        waiting = true; stop();
        add('Act', t, tool);
        ask.replaceChildren(h('b', {}, '🔐 Permission requested: ' + tool + '  '), h('button', { class: 'btn p', onclick: () => { ask.replaceChildren(); waiting = false; i++; next(); } }, 'Approve'),
          h('button', { class: 'btn', onclick: () => { ask.replaceChildren(); waiting = false; add('Observe', 'The user denied the edit.', null); add('Think', 'I will explain the proposed change instead of applying it.', null); add('Done', 'Proposed: replace split(" ") with split() in wordcount.py. Awaiting your go-ahead.', null); i = STEPS.length; } }, 'Deny'));
        return;
      }
      add(k, t, tool); i++;
    }
    function stop() { clearInterval(timer); timer = null; play.textContent = '▶ Auto-play'; }
    const play = h('button', { class: 'btn', onclick: () => { if (timer) stop(); else { play.textContent = '⏸ Pause'; timer = setInterval(next, 900); } } }, '▶ Auto-play');
    root.append(h('h4', {}, '🤖 Try it: step through an agent loop'), h('div', { class: 'box tip' }, h('b', {}, 'Task: '), '"The tests are failing. Fix it."'),
      h('div', { class: 'wrow' }, h('button', { class: 'btn p', onclick: next }, 'Next step →'), play, h('button', { class: 'btn', onclick: () => { stop(); i = 0; waiting = false; log.replaceChildren(); ask.replaceChildren(); } }, 'Reset'),
        h('label', { class: 'cbx' }, approve, ' Ask permission before edits')), ask, log,
      note('A scripted simulation of the think → act → observe loop. Turn the permission switch off to let edits through automatically, or deny an edit to see how the agent adapts.'));
  };

  W.retrieval = root => {
    const DOCS = [
      ['refunds.md', 'Customers can request a refund within 30 days of purchase. Refunds are issued to the original payment method within 5 business days.'],
      ['shipping.md', 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days and costs extra.'],
      ['privacy.md', 'We store account data encrypted at rest. You may request deletion of your data at any time.'],
      ['support.md', 'Support is available Monday to Friday, 9am to 5pm. Email support@example.com for help.'],
      ['warranty.md', 'Hardware products include a one year limited warranty covering manufacturing defects.'],
      ['security.md', 'Enable two-factor authentication in account settings. Passwords must be at least 12 characters.'],
      ['billing.md', 'Invoices are sent monthly. You can update your payment method from the billing page.'],
      ['returns.md', 'Unopened items can be returned for store credit. Return labels are provided by email.']
    ];
    const SYN = { money: ['refund', 'payment'], back: ['refund', 'return'], delivery: ['shipping'], arrive: ['shipping'], cost: ['billing', 'extra'], hack: ['security'], safe: ['security', 'encrypted'], broken: ['warranty', 'defects'] };
    const q = h('input', { class: 'wi', value: 'How long do I have to ask for a refund?' }), k = h('input', { type: 'range', min: 1, max: 4, value: 2 }), kl = h('b', {}, '2');
    const sem = h('input', { type: 'checkbox' }), list = h('div', { class: 'bars' }), promptBox = h('pre', { class: 'plain' });
    function draw() {
      const sc = tfidfScores(q.value, DOCS.map(d => d[1]), sem.checked ? SYN : null), mx = Math.max(...sc, 0.0001);
      const order = sc.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]); kl.textContent = k.value;
      const top = order.slice(0, +k.value).filter(x => x[0] > 0).map(x => x[1]);
      list.replaceChildren(...order.map(([s, i]) => h('div', { class: 'brow' + (top.includes(i) ? ' top' : '') }, h('span', { class: 'bl wide' }, DOCS[i][0]), h('div', { class: 'bt' }, h('div', { class: 'bf', style: `width:${s / mx * 100}%;background:${top.includes(i) ? '#34c759' : '#8e8e93'}` })), h('span', { class: 'bp' }, s.toFixed(2)))));
      const ctx = top.map(i => `[${DOCS[i][0]}]\n${DOCS[i][1]}`).join('\n\n') || '(nothing relevant found)';
      promptBox.textContent = `Answer using only the context. Cite the file name. If the answer is not there, say you don't know.\n\n<context>\n${ctx}\n</context>\n\nQuestion: ${q.value}`;
    }
    [q, k, sem].forEach(x => x.addEventListener('input', draw));
    root.append(h('h4', {}, '🔎 Try it: retrieval playground'), h('label', {}, 'Question'), q,
      h('div', { class: 'wrow' }, h('label', {}, 'Chunks to retrieve (k) ', kl), k, h('label', { class: 'cbx' }, sem, ' Semantic mode (understands synonyms)')),
      list, h('b', {}, 'Prompt sent to the model'), promptBox,
      note('Try "money back" or "delivery time" with semantic mode off, then on. Keyword scoring misses synonyms; embeddings catch them (here simulated with a small synonym map). Try a question that is not covered, such as "Do you sell gift cards?".'));
    draw();
  };

  W.chunker = root => {
    const TEXT = 'Retrieval-augmented generation splits documents into chunks before indexing them. If a chunk is too small, it loses the surrounding context and the model sees fragments. If a chunk is too large, the important sentence is diluted among unrelated text and retrieval gets less precise. Overlap between neighbouring chunks helps when an idea straddles a boundary. Natural boundaries such as headings and paragraphs usually work better than fixed character counts.';
    const ta = h('textarea', { rows: 4, class: 'wi' }); ta.value = TEXT;
    const size = h('input', { type: 'range', min: 40, max: 400, step: 10, value: 160 }), ov = h('input', { type: 'range', min: 0, max: 100, step: 5, value: 30 });
    const sl = h('b', {}), ol = h('b', {}), strip = h('div', { class: 'strip' }), cards = h('div', { class: 'chunks' }), info = h('div', { class: 'stats' });
    function draw() {
      const t = ta.value, s = +size.value, o = Math.min(+ov.value, s - 10); sl.textContent = s; ol.textContent = o;
      const ch = chunkText(t, s, o); strip.replaceChildren(); cards.replaceChildren();
      ch.forEach(([a, b], i) => {
        strip.append(h('div', { class: 'seg', style: `left:${a / Math.max(1, t.length) * 100}%;width:${(b - a) / Math.max(1, t.length) * 100}%;background:${PAL[i % 7]}99;top:${(i % 3) * 14}px`, title: `chunk ${i + 1}` }));
        cards.append(h('div', { class: 'chunk', style: `border-left:4px solid ${PAL[i % 7]}` }, h('b', {}, `#${i + 1} `), h('small', {}, `[${a}–${b}] `), t.slice(a, b)));
      });
      info.textContent = `${ch.length} chunks · ${t.length} characters · ~${Math.round(t.length / 4)} tokens total`;
    }
    [ta, size, ov].forEach(x => x.addEventListener('input', draw));
    root.append(h('h4', {}, '✂️ Try it: chunk size and overlap'), ta, h('div', { class: 'wrow' }, h('label', {}, 'Chunk size ', sl, ' chars'), size, h('label', {}, 'Overlap ', ol, ' chars'), ov), strip, info, cards,
      note('Colored bars show where each chunk sits in the text. Notice how overlap duplicates text at boundaries and how tiny chunks cut sentences in half.'));
    draw();
  };

  W.costsim = root => {
    const mk = (label, min, max, step, val) => { const i = h('input', { type: 'range', min, max, step, value: val }), o = h('b', {}, val); i.addEventListener('input', () => { o.textContent = i.value; draw(); }); return { i, row: h('div', { class: 'wrow' }, h('label', {}, label + ' ', o), i) }; };
    const turns = mk('Turns in the session', 1, 80, 1, 30), per = mk('Tokens added per turn', 200, 4000, 100, 1500), base = mk('Starting context (instructions + documents)', 1000, 40000, 1000, 10000);
    const pin = mk('Price per 1M input tokens ($, example)', 0.25, 20, 0.25, 3), pout = mk('Price per 1M output tokens ($, example)', 1, 100, 1, 15);
    const cache = h('input', { type: 'checkbox' }), compact = h('input', { type: 'checkbox' });
    const chart = h('div', { class: 'chart' }), res = h('div', { class: 'stats big' });
    function draw() {
      const o = { turns: +turns.i.value, perTurn: +per.i.value, base: +base.i.value, pin: +pin.i.value, pout: +pout.i.value, compactAt: 60000 };
      const A = simulateCost({ ...o, cache: false, compact: false }), B = simulateCost({ ...o, cache: cache.checked, compact: compact.checked });
      const mx = Math.max(A[A.length - 1].cost, 1e-9), W_ = 560, H_ = 190, px = i => 40 + i / Math.max(1, A.length - 1) * (W_ - 50), py = c => H_ - 20 - c / mx * (H_ - 40);
      const line = (S, col) => `<polyline fill="none" stroke="${col}" stroke-width="2.5" points="${S.map((d, i) => px(i) + ',' + py(d.cost)).join(' ')}"/>`;
      chart.innerHTML = `<svg viewBox="0 0 ${W_} ${H_}"><line x1="40" y1="${H_ - 20}" x2="${W_ - 10}" y2="${H_ - 20}" stroke="var(--bd)"/><line x1="40" y1="10" x2="40" y2="${H_ - 20}" stroke="var(--bd)"/>
        ${line(A, '#ff3b30')}${line(B, '#34c759')}<text x="${W_ - 10}" y="${H_ - 5}" text-anchor="end" class="t2">turns →</text><text x="44" y="22" class="t2" style="text-anchor:start">cumulative cost ($)</text>
        <text x="${W_ - 14}" y="${py(A[A.length - 1].cost) - 6}" text-anchor="end" fill="#ff3b30" font-size="12">baseline</text><text x="${W_ - 14}" y="${py(B[B.length - 1].cost) + 14}" text-anchor="end" fill="#34c759" font-size="12">your settings</text></svg>`;
      const a = A[A.length - 1], b = B[B.length - 1];
      res.innerHTML = `Baseline: <b>${(a.inTok / 1e6).toFixed(2)}M</b> input tokens re-read → <b>$${a.cost.toFixed(2)}</b><br>Your settings: <b>$${b.cost.toFixed(2)}</b> (${a.cost ? Math.round((1 - b.cost / a.cost) * 100) : 0}% saved) · final context ≈ <b>${Math.round(b.ctx / 1000)}k</b> tokens`;
    }
    [cache, compact].forEach(x => x.addEventListener('change', draw));
    root.append(h('h4', {}, '💰 Try it: why long sessions get expensive'), turns.row, per.row, base.row, pin.row, pout.row,
      h('div', { class: 'wrow' }, h('label', { class: 'cbx' }, cache, ' Prompt caching (cached reads ≈ 10% price)'), h('label', { class: 'cbx' }, compact, ' Summarize history when context > 60k')), chart, res,
      note('Each turn re-sends the whole history, so cost grows faster than linearly. Prices are placeholders: enter your provider’s real rates. This is a simplified model for intuition, not a bill estimator.'));
    draw();
  };

  W.modelpick = root => {
    const sel = (opts) => h('select', { class: 'wi' }, opts.map(o => h('option', {}, o)));
    const diff = sel(['Simple (rename, format, lookup)', 'Moderate (feature, small refactor)', 'Hard (multi-file bug, architecture)']), vol = sel(['A few requests', 'Hundreds per day', 'Millions per day']), lat = sel(['Quality matters most', 'Balanced', 'Needs to feel instant']);
    const out = h('div', { class: 'box tip' });
    function draw() {
      const d = diff.selectedIndex, v = vol.selectedIndex, l = lat.selectedIndex;
      const tier = (d === 2 && l < 2 && v < 2) ? 'most capable' : (d === 0 || v === 2 || l === 2) && d < 2 ? 'small, fast' : 'balanced mid-tier';
      const eff = d === 2 ? 'high' : d === 1 ? 'medium' : 'low';
      out.innerHTML = `<b>Suggested starting point:</b> a <b>${tier}</b> model with <b>${eff}</b> effort.<br><small>${v === 2 ? 'At this volume, consider batch processing and prompt caching. ' : ''}${d === 2 ? 'Give it tools to verify its work (tests, linters). ' : ''}Always test on your own examples and move down a tier if quality holds.</small>`;
    }
    [diff, vol, lat].forEach(x => x.addEventListener('change', draw));
    root.append(h('h4', {}, '🎯 Try it: pick a starting model'), h('label', {}, 'Task difficulty'), diff, h('label', {}, 'Volume'), vol, h('label', {}, 'Speed need'), lat, out,
      note('A rule of thumb for where to begin, not a benchmark. Model lineups change, so check current docs.'));
    draw();
  };

  // ---------- interactive architecture diagrams ----------
  const ARCH = {
    llmarch: {
      w: 820, h: 330, hint: 'A simplified Transformer language model.',
      group: { x: 440, y: 28, w: 190, h: 268, label: 'repeated N times (layers)' },
      nodes: [
        { id: 'in', x: 10, y: 130, w: 110, h: 60, t: 'Your text', c: '#007aff', d: 'The text you type, called the prompt. Example: "The cat sat on the".' },
        { id: 'tok', x: 145, y: 130, w: 110, h: 60, t: 'Tokenizer', c: '#ff9500', d: 'Splits the text into tokens (small pieces) and turns each into an ID number: "The | cat | sat | on | the".' },
        { id: 'emb', x: 280, y: 130, w: 130, h: 60, t: 'Embeddings\n+ position', c: '#34c759', d: 'Each token ID becomes a list of numbers that captures its meaning. Position information is added so the model knows word order.' },
        { id: 'att', x: 470, y: 48, w: 130, h: 70, t: 'Self-attention', c: '#af52de', d: 'Every token looks at the other tokens and decides which ones matter. This is how "it" can be linked to "the animal".' },
        { id: 'ffn', x: 470, y: 205, w: 130, h: 70, t: 'Feed-forward\nnetwork', c: '#5856D6', d: 'A small neural network that processes each token after attention, refining its meaning. Stacked many times, layers build deeper understanding.' },
        { id: 'head', x: 665, y: 100, w: 140, h: 60, t: 'Output layer\n(probabilities)', c: '#ff2d92', d: 'Produces a probability for every possible next token, for example "mat" 41%, "floor" 12%, "sofa" 8%.' },
        { id: 'next', x: 665, y: 215, w: 140, h: 60, t: 'Pick next token', c: '#ff3b30', d: 'One token is chosen (temperature controls how adventurous). It is added to the text and the whole process repeats until the answer is complete.' }
      ],
      edges: [['in', 'tok'], ['tok', 'emb'], ['emb', 'att'], ['att', 'ffn'], ['ffn', 'head'], ['head', 'next']],
      flow: [['in', 'You send a prompt.'], ['tok', 'Text becomes tokens.'], ['emb', 'Tokens become meaningful vectors.'], ['att', 'Tokens look at each other for context.'], ['ffn', 'Each token is refined. Layers repeat.'], ['head', 'Probabilities are computed for the next token.'], ['next', 'A token is chosen and appended. Repeat!']]
    },
    ragarch: {
      w: 790, h: 340, hint: 'Retrieval-augmented generation.',
      lanes: [{ y: 14, h: 108, label: 'OFFLINE: prepare your knowledge' }, { y: 160, h: 168, label: 'ONLINE: answer a question' }],
      nodes: [
        { id: 'docs', x: 10, y: 45, w: 115, h: 60, t: 'Your\ndocuments', c: '#007aff', d: 'PDFs, web pages, wikis, support articles: the knowledge you want the AI to use.' },
        { id: 'chunk', x: 140, y: 45, w: 115, h: 60, t: 'Split into\nchunks', c: '#ff9500', d: 'Long documents are cut into small passages so the right piece can be found.' },
        { id: 'emb1', x: 270, y: 45, w: 115, h: 60, t: 'Embedding\nmodel', c: '#34c759', d: 'Turns each chunk into a vector (list of numbers) that represents its meaning.' },
        { id: 'vdb', x: 400, y: 45, w: 115, h: 60, t: 'Vector\ndatabase', c: '#af52de', d: 'Stores all chunk vectors and can quickly find the ones nearest to a query.' },
        { id: 'q', x: 10, y: 195, w: 115, h: 60, t: 'User\nquestion', c: '#007aff', d: 'Example: "How long do I have to ask for a refund?"' },
        { id: 'emb2', x: 140, y: 195, w: 115, h: 60, t: 'Embedding\nmodel', c: '#34c759', d: 'The question is embedded with the same model, so it lands in the same meaning space as the chunks.' },
        { id: 'search', x: 400, y: 195, w: 115, h: 60, t: 'Similarity\nsearch', c: '#30b0c7', d: 'Finds the chunks whose vectors are closest to the question. Optionally reranks them.' },
        { id: 'prompt', x: 530, y: 195, w: 115, h: 60, t: 'Build\nprompt', c: '#ff2d92', d: 'Combines the question with the retrieved chunks: "Answer using only this context."' },
        { id: 'llm', x: 660, y: 195, w: 115, h: 60, t: 'LLM', c: '#5856D6', d: 'Reads the question and the context, then writes an answer grounded in your documents.' },
        { id: 'ans', x: 660, y: 270, w: 115, h: 50, t: 'Answer +\nsources', c: '#ff3b30', d: 'A response that cites where the information came from, or says it does not know.' }
      ],
      edges: [['docs', 'chunk'], ['chunk', 'emb1'], ['emb1', 'vdb'], ['q', 'emb2'], ['emb2', 'search'], ['vdb', 'search'], ['search', 'prompt'], ['prompt', 'llm'], ['llm', 'ans']],
      flow: [['q', 'A user asks a question.'], ['emb2', 'The question becomes a vector.'], ['vdb', 'The database holds pre-computed chunk vectors.'], ['search', 'The closest chunks are retrieved.'], ['prompt', 'Question + chunks are combined into one prompt.'], ['llm', 'The LLM writes a grounded answer.'], ['ans', 'The user gets an answer with sources.']]
    },
    agentarch: {
      w: 790, h: 340, hint: 'A typical AI agent.',
      nodes: [
        { id: 'user', x: 10, y: 130, w: 115, h: 60, t: 'You\n(goal)', c: '#007aff', d: 'You describe a goal, such as "Find three flights under $400 and email me the options".' },
        { id: 'brain', x: 190, y: 120, w: 170, h: 80, t: 'LLM brain', c: '#5856D6', d: 'Plans the next step, decides which tool to use, reads the result, and decides whether it is done.' },
        { id: 'guard', x: 190, y: 14, w: 170, h: 56, t: 'Guardrails &\napprovals', c: '#ff3b30', d: 'Rules and human approval for risky actions such as spending money or deleting data.' },
        { id: 'mem', x: 190, y: 250, w: 170, h: 56, t: 'Memory &\ncontext', c: '#34c759', d: 'What the agent remembers: the conversation, notes and earlier results.' },
        { id: 't1', x: 440, y: 14, w: 150, h: 54, t: 'Web search', c: '#ff9500', d: 'A tool that searches the internet and returns snippets.' },
        { id: 't2', x: 440, y: 88, w: 150, h: 54, t: 'Run code /\ncalculator', c: '#ff9500', d: 'A tool that runs code or math exactly, since LLMs are not reliable calculators.' },
        { id: 't3', x: 440, y: 162, w: 150, h: 54, t: 'Database / APIs', c: '#ff9500', d: 'Tools that read business data or call other services.' },
        { id: 't4', x: 440, y: 236, w: 150, h: 54, t: 'Email / files', c: '#ff9500', d: 'Tools that take real-world actions. These deserve extra caution and approval.' },
        { id: 'out', x: 650, y: 130, w: 130, h: 60, t: 'Final answer', c: '#ff2d92', d: 'When the goal is met, the agent reports back with results.' }
      ],
      edges: [['user', 'brain'], ['guard', 'brain'], ['mem', 'brain'], ['brain', 't1'], ['brain', 't2'], ['brain', 't3'], ['brain', 't4'], ['brain', 'out']],
      flow: [['user', 'You give the agent a goal.'], ['brain', 'The LLM plans the first step.'], ['t1', 'It calls a tool (search) and reads the result.'], ['brain', 'It thinks again with the new information.'], ['t2', 'It calls another tool (calculator).'], ['brain', 'Checks whether the goal is met.'], ['guard', 'Risky actions pause for approval.'], ['out', 'It reports the final answer.']]
    },
    apparch: {
      w: 790, h: 420, hint: 'Reference architecture for a GenAI app.',
      nodes: [
        { id: 'client', x: 10, y: 10, w: 770, h: 50, t: 'Client: web app, mobile app, chat widget', c: '#007aff', d: 'What users see and touch. Collects the question and streams the answer back.' },
        { id: 'gate', x: 10, y: 90, w: 240, h: 54, t: 'API gateway & auth', c: '#5856D6', d: 'Checks who the user is, rate limits traffic and protects your backend.' },
        { id: 'gin', x: 275, y: 90, w: 240, h: 54, t: 'Input guardrails', c: '#ff3b30', d: 'Blocks unsafe or off-topic requests and removes sensitive data before it reaches the model.' },
        { id: 'cache', x: 540, y: 90, w: 240, h: 54, t: 'Cache', c: '#ff9500', d: 'Reuses answers or repeated prompt parts to save money and time.' },
        { id: 'orch', x: 10, y: 175, w: 770, h: 58, t: 'Orchestrator: prompt templates, routing, memory', c: '#af52de', d: 'The brain of the app. Builds the prompt, decides whether to retrieve documents or call tools, and manages conversation memory.' },
        { id: 'llm', x: 10, y: 265, w: 240, h: 56, t: 'LLM provider(s)', c: '#34c759', d: 'The model that writes the response. Apps often use several: a big one for hard tasks, a small one for easy ones.' },
        { id: 'vdb', x: 275, y: 265, w: 240, h: 56, t: 'Retrieval / vector DB', c: '#30b0c7', d: 'Your private knowledge, searched by meaning (RAG).' },
        { id: 'tools', x: 540, y: 265, w: 240, h: 56, t: 'Tools & APIs', c: '#ff9500', d: 'Calculators, search, databases, and other services the model can request.' },
        { id: 'gout', x: 10, y: 350, w: 370, h: 54, t: 'Output guardrails', c: '#ff3b30', d: 'Checks the answer for safety, privacy leaks and format before showing it to the user.' },
        { id: 'obs', x: 410, y: 350, w: 370, h: 54, t: 'Logging, monitoring & evaluation', c: '#8e8e93', d: 'Tracks quality, cost, latency and errors so you can improve the app over time.' }
      ],
      edges: [['client', 'gate'], ['gate', 'gin'], ['gin', 'orch'], ['cache', 'orch'], ['orch', 'llm'], ['orch', 'vdb'], ['orch', 'tools'], ['llm', 'gout'], ['gout', 'obs']],
      flow: [['client', 'A user sends a question.'], ['gate', 'They are authenticated and rate-limited.'], ['gin', 'The input is checked for safety.'], ['cache', 'Maybe we already have this answer.'], ['orch', 'The orchestrator builds the prompt.'], ['vdb', 'Relevant documents are retrieved.'], ['tools', 'Tools are called if needed.'], ['llm', 'The model writes the response.'], ['gout', 'The output is checked.'], ['obs', 'Everything is logged and measured. The answer returns to the user.']]
    }
  };

  function anchor(a, b) {
    const ox1 = Math.max(a.x, b.x), ox2 = Math.min(a.x + a.w, b.x + b.w);
    if (ox1 < ox2) { const x = (ox1 + ox2) / 2; return b.y > a.y ? [x, a.y + a.h, x, b.y] : [x, a.y, x, b.y + b.h]; }
    const oy1 = Math.max(a.y, b.y), oy2 = Math.min(a.y + a.h, b.y + b.h);
    if (oy1 < oy2) { const y = (oy1 + oy2) / 2; return b.x > a.x ? [a.x + a.w, y, b.x, y] : [a.x, y, b.x + b.w, y]; }
    return [a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2];
  }

  W.archdiag = root => {
    const A = ARCH[root.dataset.arch], by = {}; A.nodes.forEach(n => by[n.id] = n);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${A.w} ${A.h}`); svg.setAttribute('class', 'archsvg');
    let s = `<defs><marker id="am${root.dataset.arch}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--tx2)"/></marker></defs>`;
    (A.lanes || []).forEach(l => s += `<rect x="2" y="${l.y}" width="${A.w - 4}" height="${l.h}" rx="14" fill="none" stroke="var(--bd)" stroke-dasharray="6 5"/><text x="14" y="${l.y + 14}" class="lane">${l.label}</text>`);
    if (A.group) s += `<rect x="${A.group.x}" y="${A.group.y}" width="${A.group.w}" height="${A.group.h}" rx="14" fill="none" stroke="var(--tx2)" stroke-dasharray="6 5"/><text x="${A.group.x + A.group.w / 2}" y="${A.group.y + A.group.h + 14}" class="lane" text-anchor="middle">${A.group.label}</text>`;
    A.edges.forEach(([f, t], i) => { const [x1, y1, x2, y2] = anchor(by[f], by[t]); s += `<line data-e="${f}-${t}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge" marker-end="url(#am${root.dataset.arch})"/>`; });
    A.nodes.forEach(n => {
      const lines = n.t.split('\n'), cy = n.y + n.h / 2 - (lines.length - 1) * 8;
      s += `<g class="anode" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.t.replace(/\n/g, ' ')}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" style="stroke:${n.c};fill:color-mix(in srgb,${n.c} 13%,var(--bg))"/>` +
        lines.map((l, i) => `<text x="${n.x + n.w / 2}" y="${cy + i * 16 + 5}" class="t1">${l.replace(/&/g, '&amp;')}</text>`).join('') + '</g>';
    });
    svg.innerHTML = s;
    const panel = h('div', { class: 'apanel' }), step = h('div', { class: 'astepnote' });
    let timer = null, sel = null;
    function select(id, caption) {
      sel = id; svg.querySelectorAll('.anode').forEach(g => g.classList.toggle('sel', g.dataset.id === id));
      const n = by[id]; panel.replaceChildren(h('b', { style: `color:${n.c}` }, n.t.replace(/\n/g, ' ')), h('p', {}, n.d));
      step.textContent = caption || '';
      svg.querySelectorAll('.edge').forEach(e => e.classList.toggle('on', e.dataset.e.endsWith('-' + id) || e.dataset.e.startsWith(id + '-')));
    }
    svg.querySelectorAll('.anode').forEach(g => { g.addEventListener('click', () => { stop(); select(g.dataset.id); }); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop(); select(g.dataset.id); } }); });
    let i = 0;
    function stop() { clearInterval(timer); timer = null; play.textContent = '▶ Follow a request'; }
    function tick() { const [id, cap] = A.flow[i % A.flow.length]; select(id, `Step ${i % A.flow.length + 1}/${A.flow.length}: ${cap}`); i++; if (i >= A.flow.length) { stop(); i = 0; } }
    const play = h('button', { class: 'btn p', onclick: () => { if (timer) { stop(); return; } i = 0; play.textContent = '⏸ Pause'; tick(); timer = setInterval(tick, 1600); } }, '▶ Follow a request');
    root.append(h('div', { class: 'wrow' }, play, h('span', { class: 'wnote', style: 'margin:0' }, A.hint + ' Click any box.')), svg, step, panel);
    select(A.flow[0][0]); step.textContent = '';
    panel.firstChild && 0;
  };

  // ---------- AI / ML / DL / GenAI rings ----------
  W.venn = root => {
    const L = [
      { n: 'Artificial Intelligence', r: 190, c: '#007aff', d: 'The broad goal: machines doing tasks that normally need human intelligence. Includes rule-based systems, game players, planners and more.' },
      { n: 'Machine Learning', r: 145, c: '#34c759', d: 'AI that learns patterns from data instead of following hand-written rules. Example: spam filters, recommendations.' },
      { n: 'Deep Learning', r: 100, c: '#ff9500', d: 'Machine learning using large neural networks with many layers. Powers modern image recognition, speech and language models.' },
      { n: 'Generative AI', r: 56, c: '#af52de', d: 'Deep learning models that create new content: text, images, audio, code. Large language models (LLMs) live here.' }
    ];
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 420 400'); svg.setAttribute('class', 'archsvg'); svg.style.maxWidth = '420px'; svg.style.margin = '0 auto'; svg.style.display = 'block';
    svg.innerHTML = L.map((l, i) => `<g class="ring" data-i="${i}" tabindex="0" role="button" aria-label="${l.n}"><circle cx="210" cy="${390 - l.r}" r="${l.r}" style="fill:color-mix(in srgb,${l.c} 14%,var(--bg));stroke:${l.c}" stroke-width="2.5"/><text x="210" y="${390 - l.r * 2 + 24}" class="t1" style="fill:${l.c}">${l.n}</text></g>`).join('');
    const panel = h('div', { class: 'apanel' });
    function pick(i) { svg.querySelectorAll('.ring').forEach((g, j) => g.classList.toggle('sel', i === j)); panel.replaceChildren(h('b', { style: `color:${L[i].c}` }, L[i].n), h('p', {}, L[i].d)); }
    svg.querySelectorAll('.ring').forEach(g => { g.addEventListener('click', e => { e.stopPropagation(); pick(+g.dataset.i); }); g.addEventListener('keydown', e => { if (e.key === 'Enter') pick(+g.dataset.i); }); });
    root.append(h('h4', {}, '🎯 Explore: how AI, ML, deep learning and GenAI fit together'), svg, panel); pick(3);
  };

  W.modalities = root => {
    const M = [
      ['📝 Text', 'Write an email asking for a deadline extension, polite but firm.', 'A draft email in seconds.', 'Language models predict the next word, again and again.', 'May state wrong facts confidently.'],
      ['💻 Code', 'Write a Python function that removes duplicates from a list.', 'Working code plus an explanation.', 'Trained on lots of public code and documentation.', 'Can contain bugs or insecure patterns. Always test.'],
      ['🖼️ Images', 'A watercolor painting of a lighthouse at sunrise.', 'A brand new picture matching your description.', 'Diffusion models start with noise and gradually shape it into an image.', 'Can misrepresent real people or copy styles; check licensing.'],
      ['🎵 Audio', 'Read this paragraph in a calm voice.', 'Speech, music or sound effects.', 'Models learn the patterns of sound waves and speech.', 'Voice cloning raises consent and fraud concerns.'],
      ['🎬 Video', 'A paper boat sailing down a rainy street.', 'A short generated clip.', 'Extends image generation across time, keeping frames consistent.', 'Expensive to run; can be used to make misleading content.']
    ];
    const tabs = h('div', { class: 'tabs' }), body = h('div', { class: 'apanel' });
    function pick(i) { [...tabs.children].forEach((t, j) => t.classList.toggle('on', i === j)); const m = M[i]; body.replaceChildren(h('p', {}, h('b', {}, 'Example prompt: '), h('em', {}, '"' + m[1] + '"')), h('p', {}, h('b', {}, 'You get: '), m[2]), h('p', {}, h('b', {}, 'How it works: '), m[3]), h('p', {}, h('b', {}, '⚠️ Watch out: '), m[4])); }
    M.forEach((m, i) => tabs.append(h('button', { class: 'tab', onclick: () => pick(i) }, m[0])));
    root.append(h('h4', {}, '🎨 Explore: what GenAI can create'), tabs, body); pick(0);
  };

  W.attention = root => {
    const T = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];
    const W_ = { 7: { 1: .5, 5: .1, 10: .12, 3: .05, 6: .05, 8: .05 }, 10: { 1: .3, 7: .25, 9: .15, 8: .1 }, 3: { 1: .3, 5: .3, 2: .15, 4: .05 }, 1: { 0: .3, 2: .1, 3: .1 }, 5: { 4: .35, 3: .25, 1: .1 } };
    const sent = h('div', { class: 'sent' }), bars = h('div', { class: 'bars' });
    function pick(i) {
      const raw = T.map((_, j) => (W_[i] && W_[i][j]) || (j === i ? .2 : .02)), tot = raw.reduce((a, b) => a + b, 0), w = raw.map(v => v / tot);
      [...sent.children].forEach((el, j) => { el.classList.toggle('me', j === i); el.style.background = j === i ? '' : `rgba(88,86,214,${Math.min(.85, w[j] * 1.6)})`; el.style.color = w[j] > .25 && j !== i ? '#fff' : ''; });
      bars.replaceChildren(...T.map((t, j) => h('div', { class: 'brow' }, h('span', { class: 'bl' }, t), h('div', { class: 'bt' }, h('div', { class: 'bf', style: `width:${w[j] * 100 / Math.max(...w) }%;background:#5856D6` })), h('span', { class: 'bp' }, (w[j] * 100).toFixed(0) + '%'))));
    }
    T.forEach((t, i) => sent.append(h('span', { class: 'word', tabindex: 0, onclick: () => pick(i), onkeydown: e => { if (e.key === 'Enter') pick(i); } }, t)));
    root.append(h('h4', {}, '👀 Try it: click a word to see what it pays attention to'), sent, bars, note('Illustrative weights for teaching. Real models have many attention "heads" with learned weights. Click "it", then "tired", then "cross".'));
    pick(7);
  };

  W.halluc = root => {
    const S = [
      ['The Eiffel Tower is located in Paris, France.', false, 'True.'],
      ['It was completed in 1889 for the World\'s Fair.', false, 'True.'],
      ['It was designed by the artist Leonardo da Vinci.', true, 'False. It is named after the engineering firm of Gustave Eiffel; Leonardo died in 1519.'],
      ['The structure is made mostly of wrought iron.', false, 'True.'],
      ['In 1925 the French Senate officially renamed it "The Iron Lady of Paris" by law.', true, 'Invented. It has nicknames, but no such law exists. Specific-sounding details like dates and institutions are a classic hallucination sign.']
    ];
    const marked = new Set(), box = h('div', { class: 'hsents' }), res = h('div', { class: 'apanel', style: 'display:none' });
    S.forEach((s, i) => box.append(h('span', { class: 'hs', tabindex: 0, onclick: e => { if (res.dataset.done) return; marked.has(i) ? marked.delete(i) : marked.add(i); e.target.classList.toggle('flag'); } }, s[0] + ' ')));
    const btn = h('button', { class: 'btn p', onclick: () => {
      res.dataset.done = 1; let ok = 0;
      res.replaceChildren(...S.map((s, i) => { const good = marked.has(i) === s[1]; if (good) ok++; return h('p', {}, good ? '✅ ' : '❌ ', h('b', {}, s[0] + ' '), s[2]); }), h('b', {}, `You got ${ok} / ${S.length}.`), h('p', {}, 'Lesson: fluent text is not proof. Verify claims that matter, especially names, dates, quotes and numbers.'));
      res.style.display = 'block'; btn.disabled = true;
    } }, 'Check my answers');
    root.append(h('h4', {}, '🕵️ Try it: find the invented facts'), h('p', { class: 'wnote', style: 'margin:0 0 8px' }, 'An AI wrote this paragraph. Click the sentences you think are false, then check.'), h('div', { class: 'box' }, box), btn, res);
  };

  W.riskspot = root => {
    const C = [
      ['Paste your company\'s unreleased source code into a public chatbot to debug it.', true, 'Risky. Confidential code can leave your control. Use only approved tools.'],
      ['Ask a chatbot to explain how the TCP protocol works.', false, 'Safe. Public, general knowledge.'],
      ['Include AI-generated legal citations in a court filing without checking them.', true, 'Risky. Models can invent citations. Always verify.'],
      ['Ask AI to draft an email, then read and edit it before sending.', false, 'Safe. A human reviews the result.'],
      ['Upload a spreadsheet of customers\' personal data to an unapproved AI tool.', true, 'Risky. Personal data needs approved handling.'],
      ['Let an AI agent delete files on your main drive with no confirmation.', true, 'Risky. Destructive actions need approval and limits.'],
      ['Use made-up sample data to practise writing prompts.', false, 'Safe. No real data involved.']
    ];
    let i = 0, score = 0;
    const card = h('div', { class: 'apanel' }), fb = h('div', { class: 'apanel', style: 'display:none' });
    function show() {
      fb.style.display = 'none';
      if (i >= C.length) { card.replaceChildren(h('b', {}, `Finished! Score: ${score} / ${C.length}`), h('p', {}, 'Rule of thumb: if it is sensitive, unchecked or irreversible, slow down.'), h('button', { class: 'btn p', onclick: () => { i = 0; score = 0; show(); } }, 'Play again')); return; }
      card.replaceChildren(h('small', {}, `Scenario ${i + 1} of ${C.length}`), h('p', { style: 'font-size:16px;margin:8px 0 12px' }, C[i][0]),
        h('div', { class: 'wrow' }, h('button', { class: 'btn', onclick: () => ans(false) }, '✅ Safe'), h('button', { class: 'btn', onclick: () => ans(true) }, '⚠️ Risky')));
    }
    function ans(r) { const ok = r === C[i][1]; if (ok) score++; fb.style.display = 'block'; fb.replaceChildren(h('b', {}, ok ? '✅ Correct. ' : '❌ Not quite. '), C[i][2], h('div', { class: 'wrow' }, h('button', { class: 'btn p', onclick: () => { i++; show(); } }, 'Next →'))); card.querySelectorAll('button').forEach(b => b.disabled = true); }
    root.append(h('h4', {}, '🚦 Try it: safe or risky?'), card, fb); show();
  };

  const GLOSS_CACHE = () => (window.GLOSSARY || []);
  W.flashcards = root => {
    const G = GLOSS_CACHE().slice(); let i = 0, flipped = false, known = new Set();
    const card = h('div', { class: 'fcard', tabindex: 0, role: 'button' }), info = h('div', { class: 'stats' });
    function draw() { const g = G[i]; card.classList.toggle('flip', flipped); card.replaceChildren(flipped ? h('span', {}, g[1]) : h('b', {}, g[0])); info.textContent = `Card ${i + 1} of ${G.length} · I know ${known.size}`; }
    const flip = () => { flipped = !flipped; draw(); };
    card.addEventListener('click', flip); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    const go = d => { i = (i + d + G.length) % G.length; flipped = false; draw(); };
    root.append(h('h4', {}, '🃏 Flashcards'), card, h('div', { class: 'wrow' }, h('button', { class: 'btn', onclick: () => go(-1) }, '← Prev'), h('button', { class: 'btn', onclick: () => { known.add(i); go(1); } }, '✓ I know it'), h('button', { class: 'btn p', onclick: () => go(1) }, 'Next →'),
      h('button', { class: 'btn', onclick: () => { G.sort(() => Math.random() - .5); i = 0; flipped = false; draw(); } }, '🔀 Shuffle')), info);
    draw();
  };

  W.glossary = root => {
    const G = GLOSS_CACHE(), q = h('input', { class: 'wi', placeholder: 'Search terms...' }), list = h('div', { class: 'gl' });
    function draw() { const v = q.value.toLowerCase(); list.replaceChildren(...G.filter(g => (g[0] + g[1]).toLowerCase().includes(v)).map(g => h('div', { class: 'gi' }, h('b', {}, g[0]), h('span', {}, g[1])))); }
    q.addEventListener('input', draw); root.append(q, list); draw();
  };

  W.archbuilder = root => {
    const COMP = { llm: 'LLM', prompt: 'Prompt template', rag: 'Retrieval / vector DB', tools: 'Tools & APIs', memory: 'Conversation memory', guard: 'Guardrails', cache: 'Cache', obs: 'Monitoring & evaluation', human: 'Human review' };
    const CASES = {
      'Customer-support bot answering from our help articles': { req: { llm: 'The model writes the replies.', prompt: 'A template keeps tone and rules consistent.', rag: 'Answers must come from your help articles, not guesses.', guard: 'Prevents wrong promises or leaked data.', obs: 'Track bad answers to improve.' }, ok: { memory: 'Useful for multi-turn chats.', cache: 'Saves money on repeat questions.', human: 'Good for escalations.' }, no: { tools: 'Not needed unless it must act (for example issue refunds).' } },
      'Math tutor for students': { req: { llm: 'Explains steps in plain language.', prompt: 'Sets a friendly tutor persona and teaching style.', tools: 'A calculator/code tool avoids arithmetic mistakes.', guard: 'Keeps the tutor age-appropriate and on topic.', memory: 'Remembers what the student already learned.' }, ok: { obs: 'Helps improve explanations.', human: 'Teachers could review flagged chats.' }, no: { rag: 'Not needed for general math knowledge.', cache: 'Every student question differs.' } },
      'Daily news summarizer': { req: { llm: 'Writes the summary.', prompt: 'Controls length and style.', tools: 'A web/news fetch tool provides fresh articles.', cache: 'Summaries are reused by many readers.', obs: 'Check quality and source accuracy.' }, ok: { guard: 'Helps avoid unsafe or misleading content.', human: 'An editor could approve before publishing.' }, no: { memory: 'Each digest is independent.', rag: 'Fresh content is fetched, not searched in a private archive.' } }
    };
    const sel = h('select', { class: 'wi' }, Object.keys(CASES).map(k => h('option', {}, k)));
    const boxes = Object.entries(COMP).map(([id, label]) => h('label', { class: 'cbx' }, h('input', { type: 'checkbox', 'data-id': id }), ' ' + label));
    const strip = h('div', { class: 'chips' }), fb = h('div', { class: 'apanel', style: 'display:none' });
    const chosen = () => boxes.filter(b => b.firstChild.checked).map(b => b.firstChild.dataset.id);
    function live() { strip.replaceChildren(h('span', { class: 'chip', style: 'background:#007aff33;border-color:#007aff' }, 'User'), ...chosen().map(id => h('span', { class: 'chip', style: 'background:#34c75933;border-color:#34c759' }, '→ ' + COMP[id]))); fb.style.display = 'none'; }
    function check() {
      const c = CASES[sel.value], ch = chosen(), items = [];
      Object.entries(c.req).forEach(([id, why]) => items.push(ch.includes(id) ? ['✅', COMP[id], why] : ['❌ Missing', COMP[id], why]));
      ch.filter(id => c.no[id]).forEach(id => items.push(['⚠️ Probably unnecessary', COMP[id], c.no[id]]));
      ch.filter(id => c.ok[id]).forEach(id => items.push(['👍 Nice extra', COMP[id], c.ok[id]]));
      const miss = Object.keys(c.req).filter(id => !ch.includes(id)).length;
      fb.replaceChildren(h('b', {}, miss ? `${miss} required block(s) missing` : '🎉 Solid design: all required blocks are included'), ...items.map(([t, n, w]) => h('p', {}, h('b', {}, t + ' · ' + n + ': '), w)));
      fb.style.display = 'block';
    }
    boxes.forEach(b => b.firstChild.addEventListener('change', live)); sel.addEventListener('change', live);
    root.append(h('h4', {}, '🏗️ Try it: design a GenAI app'), h('label', {}, 'Product idea'), sel, h('div', { class: 'cbxs' }, boxes), strip, h('button', { class: 'btn p', onclick: check }, 'Check my design'), fb,
      note('There is no single right answer in real life; this checker teaches common reasoning.')); live();
  };

  // ---------- Embeddings: 3D word space ----------
  W.wordspace = root => {
    const CAT = { Animals: '#ff9500', Food: '#34c759', Tech: '#007aff', Feelings: '#ff2d92', People: '#af52de', Places: '#30b0c7' };
    const r = (() => { let s = 11; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
    const jit = a => a.map(v => v + (r() - .5) * 0.25);
    const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k), sub = (a, b) => a.map((v, i) => v - b[i]);
    const man = [-3.4, -0.6, -3], woman = [-2.4, -1.2, -3.4], royal = [0.3, 1.4, 0.4];
    const country = { France: [2.4, 2.6, -1.2], Japan: [3.9, 2.2, -2.4], Italy: [2.8, 3.3, -2.7] }, cap = [-0.2, -1.0, 0.9];
    const W3 = {
      cat: ['Animals', jit([-3.9, 1.2, 1.4])], dog: ['Animals', jit([-3.4, 0.8, 1.9])], lion: ['Animals', jit([-3.0, 1.6, 0.6])], horse: ['Animals', jit([-4.0, 0.3, 0.7])], fish: ['Animals', jit([-3.3, 0.1, 1.6])],
      pizza: ['Food', jit([-1.1, -2.9, -0.7])], bread: ['Food', jit([-1.8, -3.1, -1.2])], rice: ['Food', jit([-1.4, -2.4, -1.6])], cheese: ['Food', jit([-0.7, -2.5, -1.2])], apple: ['Food', jit([-2.0, -2.6, -0.5])],
      computer: ['Tech', jit([3.0, -1.6, 1.8])], laptop: ['Tech', jit([3.5, -1.2, 1.4])], phone: ['Tech', jit([2.8, -1.1, 2.3])], software: ['Tech', jit([3.6, -2.0, 1.0])], internet: ['Tech', jit([2.4, -1.9, 1.2])],
      happy: ['Feelings', jit([0.2, 3.1, -2.3])], joyful: ['Feelings', jit([0.7, 3.4, -2.6])], sad: ['Feelings', jit([0.0, 2.2, -2.9])], angry: ['Feelings', jit([0.9, 2.6, -2.0])],
      man: ['People', man], woman: ['People', woman], king: ['People', add(man, royal)], queen: ['People', add(woman, royal)], prince: ['People', add(man, royal, 0.55)], princess: ['People', add(woman, royal, 0.55)],
      France: ['Places', country.France], Japan: ['Places', country.Japan], Italy: ['Places', country.Italy], Paris: ['Places', add(country.France, cap)], Tokyo: ['Places', add(country.Japan, cap)], Rome: ['Places', add(country.Italy, cap)]
    };
    const names = Object.keys(W3), dist = (a, b) => Math.hypot(...W3[a][1].map((v, i) => v - W3[b][1][i]));
    const nearest = (p, excl, k) => names.filter(n => !excl.includes(n)).map(n => [n, Math.hypot(...W3[n][1].map((v, i) => v - p[i]))]).sort((a, b) => a[1] - b[1]).slice(0, k);
    const items = []; let scene;
    const base = () => { items.length = 0; names.forEach(n => items.push({ type: 'pt', id: n, p: W3[n][1], r: 5, color: CAT[W3[n][0]], label: n })); };
    base();
    const canvas = h('canvas', { style: 'height:420px;width:100%;display:block;cursor:pointer;touch-action:none' });
    const panel = h('div', { class: 'apanel' }, 'Click any word in the 3D space.');
    const legend = h('div', { class: 'chips' }, Object.entries(CAT).map(([k, c]) => h('span', { class: 'chip', style: `background:${c}33;border-color:${c}` }, k)));

    function reset() { base(); panel.replaceChildren('Click any word in the 3D space.'); }
    function selectWord(n) {
      base(); const near = nearest(W3[n][1], [n], 3), keep = new Set([n, ...near.map(x => x[0])]);
      items.forEach(it => { if (it.type === 'pt') { it.dim = !keep.has(it.id); if (it.id === n) { it.r = 9; it.glow = true; it.bold = true; } } });
      near.forEach(([m]) => items.unshift({ type: 'line', a: W3[n][1], b: W3[m][1], color: '#ff3b30', alpha: .95, w: 2.5 }));
      panel.replaceChildren(h('b', {}, `Nearest to “${n}”: `), ...near.map(([m, d], i) => h('span', {}, (i ? ' · ' : '') + `${m} (distance ${d.toFixed(1)})`)), h('p', { class: 'wnote' }, 'Words with similar meaning sit close together. That is how a model knows “cat” and “dog” are related.'));
    }
    scene = window.VizScene(canvas, () => items, { yaw: .6, pitch: .3, onPick: it => it ? selectWord(it.id) : reset() });

    // distance between two words
    const opts = () => names.map(n => h('option', {}, n));
    const a = h('select', { class: 'wi' }, opts()), b = h('select', { class: 'wi' }, opts()); a.value = 'cat'; b.value = 'dog';
    const dRes = h('div', { class: 'stats big' });
    function showDist() { const d = dist(a.value, b.value), close = Math.round(100 / (1 + d)); dRes.innerHTML = `Distance <b>${d.toFixed(1)}</b> → closeness <b>${close}%</b> ${d < 1.5 ? '(very related)' : d < 4 ? '(somewhat related)' : '(unrelated)'}`; selectPair(); }
    function selectPair() { base(); items.forEach(it => { if (it.type === 'pt') { const on = it.id === a.value || it.id === b.value; it.dim = !on; if (on) { it.r = 8; it.glow = true; } } }); items.unshift({ type: 'line', a: W3[a.value][1], b: W3[b.value][1], color: '#007aff', alpha: 1, w: 3 }); }
    [a, b].forEach(x => x.addEventListener('change', showDist));

    // word arithmetic
    const x1 = h('select', { class: 'wi' }, opts()), x2 = h('select', { class: 'wi' }, opts()), x3 = h('select', { class: 'wi' }, opts());
    const aRes = h('div', { class: 'apanel' });
    function analogy() {
      const A = W3[x1.value][1], B = W3[x2.value][1], C = W3[x3.value][1], target = add(sub(A, B), C), best = nearest(target, [x1.value, x2.value, x3.value], 1)[0];
      base(); items.forEach(it => { if (it.type === 'pt') it.dim = ![x1.value, x2.value, x3.value, best[0]].includes(it.id); });
      items.unshift({ type: 'line', a: W3[x2.value][1], b: A, color: '#ff9500', alpha: 1, w: 2.5 }, { type: 'line', a: C, b: W3[best[0]][1], color: '#ff9500', alpha: 1, w: 2.5 });
      items.push({ type: 'pt', p: target, r: 7, color: '#ff3b30', label: '? (computed)', glow: true, pulse: true, bold: true });
      items.forEach(it => { if (it.id === best[0]) { it.r = 9; it.glow = true; it.bold = true; } });
      aRes.replaceChildren(h('b', {}, `${x1.value} − ${x2.value} + ${x3.value} ≈ `), h('b', { style: 'color:#ff3b30;font-size:18px' }, best[0]), h('span', { class: 'wnote' }, `  (landed ${best[1].toFixed(2)} away from a real word)`),
        h('p', { class: 'wnote' }, 'The difference between two words is a direction (for example “royal” or “female”). Adding it to another word moves you to a related word.'));
    }
    [x1, x2, x3].forEach(x => x.addEventListener('change', analogy));
    const preset = (p, q, t) => h('button', { class: 'btn', onclick: () => { x1.value = p; x2.value = q; x3.value = t; analogy(); } }, `${p} − ${q} + ${t}`);
    x1.value = 'king'; x2.value = 'man'; x3.value = 'woman';

    root.append(h('h4', {}, '🌌 Explore: a 3D map of word meanings'),
      h('p', { class: 'wnote', style: 'margin:0 0 6px' }, 'Drag to rotate · click a word to see its nearest neighbours · click empty space to reset'),
      h('figure', { class: 'viz3d' }, canvas), legend, panel,
      h('h4', { style: 'margin-top:18px' }, '📏 How close are two words?'), h('div', { class: 'wrow' }, a, h('span', {}, 'and'), b), dRes,
      h('h4', { style: 'margin-top:18px' }, '➕ Word arithmetic'), h('div', { class: 'wrow' }, x1, h('span', {}, '−'), x2, h('span', {}, '+'), x3), h('div', { class: 'wrow' }, preset('king', 'man', 'woman'), preset('Paris', 'France', 'Japan'), preset('Rome', 'Italy', 'France')), aRes,
      note('A teaching model: the layout is hand-built in 3 dimensions. Real embeddings have hundreds or thousands of dimensions and are learned from data, but the ideas (closeness = similar meaning, directions = relationships) are the same.'));
    showDist(); reset(); analogy(); reset();
  };

  // ---------- Careers & interview prep ----------
  ARCH.careerarch = {
    w: 790, h: 330, hint: 'How the market has shifted.',
    nodes: [
      { id: 'n1', x: 10, y: 250, w: 170, h: 62, t: 'LLM user\n(prompts & chat)', c: '#8e8e93', d: 'Uses chatbots and writes prompts. A useful starting point, but no longer enough on its own to stand out for GenAI roles.' },
      { id: 'n2', x: 205, y: 172, w: 170, h: 62, t: 'AI product\nengineer', c: '#007aff', d: 'Builds real features with LLMs: RAG, tool calling, good UX, handling latency, reliability and failures.' },
      { id: 'n3', x: 400, y: 94, w: 170, h: 62, t: 'AI system\narchitect', c: '#af52de', d: 'Designs whole systems: data flow, scaling, cost, security, evaluation and monitoring, and how agents and models fit together.' },
      { id: 'n4', x: 595, y: 14, w: 185, h: 62, t: 'AI generalist', c: '#34c759', d: 'Understands LLMs, product engineering, agentic systems and cloud infrastructure well enough to take an idea from prototype to production.' }
    ],
    edges: [['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4']],
    flow: [['n1', 'Most people start here.'], ['n2', 'Add product engineering: ship features that work reliably.'], ['n3', 'Add system design: scale, cost, security, monitoring.'], ['n4', 'Combine it all, including cloud and agentic systems.']]
  };
  ARCH.skillarch = {
    w: 790, h: 330, hint: 'Ten areas to prepare.',
    lanes: [{ y: 78, h: 242, label: 'ESSENTIAL PREPARATION TOPICS' }],
    nodes: [
      { id: 'gen', x: 10, y: 8, w: 770, h: 52, t: 'AI generalist: LLMs + product engineering + agentic systems + cloud', c: '#34c759', d: 'The goal: broad, practical skill across the full stack of a GenAI product, with depth in a few areas.' },
      { id: 'prod', x: 10, y: 108, w: 140, h: 62, t: 'Productionizing\nAI systems', c: '#007aff', d: 'The whole "Ops" side: cloud infrastructure, cost, scalability and security. A demo is not a product.' },
      { id: 'rag', x: 168, y: 108, w: 140, h: 62, t: 'Modern RAG\npipelines', c: '#30b0c7', d: 'Optimized retrieval for large knowledge bases and unstructured data: chunking, hybrid search, reranking, access control.' },
      { id: 'agent', x: 326, y: 108, w: 140, h: 62, t: 'Agentic\nworkflows', c: '#ff9500', d: 'Different kinds of agents, with focus on access control, security and how decisions are made and approved.' },
      { id: 'llmops', x: 484, y: 108, w: 140, h: 62, t: 'LLMOps', c: '#af52de', d: 'Hosting, inference costs, token consumption, prompt versions, tracing and guardrails.' },
      { id: 'multi', x: 642, y: 108, w: 138, h: 62, t: 'Multimodal\norchestration', c: '#ff2d92', d: 'Coordinating different models (text, vision, speech) so each handles the task it is best at.' },
      { id: 'cloud', x: 10, y: 222, w: 140, h: 62, t: 'Cloud\ndeployment', c: '#5856D6', d: 'AWS, Azure or GCP services plus infrastructure-as-code such as Terraform for repeatable deployments.' },
      { id: 'infra', x: 168, y: 222, w: 140, h: 62, t: 'AI\ninfrastructure', c: '#8e8e93', d: 'GPU and TPU basics, model inference and training costs, and when to use managed versus self-hosted models.' },
      { id: 'eval', x: 326, y: 222, w: 140, h: 62, t: 'Evaluation &\nmonitoring', c: '#34c759', d: 'Test sets, quality metrics and production monitoring so you notice when answers get worse.' },
      { id: 'sec', x: 484, y: 222, w: 140, h: 62, t: 'AI security\n& privacy', c: '#ff3b30', d: 'Prompt injection, data leakage, access control and protecting personal and confidential data.' },
      { id: 'cost', x: 642, y: 222, w: 138, h: 62, t: 'Cost\noptimization', c: '#ff9f0a', d: 'Model routing, caching, shorter prompts and right-sizing infrastructure to cut spend without hurting quality.' }
    ],
    edges: [['gen', 'prod'], ['gen', 'rag'], ['gen', 'agent'], ['gen', 'llmops'], ['gen', 'multi']],
    flow: [['gen', 'A generalist covers the full picture.'], ['prod', '1. Productionizing'], ['rag', '2. Modern RAG'], ['agent', '3. Agentic workflows'], ['llmops', '4. LLMOps'], ['multi', '5. Multimodal orchestration'], ['cloud', '6. Cloud deployment'], ['infra', '7. AI infrastructure'], ['eval', '8. Evaluation & monitoring'], ['sec', '9. AI security'], ['cost', '10. Cost optimization']]
  };
  ARCH.interviewarch = {
    w: 790, h: 330, hint: 'The modern GenAI interview.',
    nodes: [
      { id: 'old', x: 10, y: 8, w: 770, h: 46, t: 'Old style: DSA · SQL · ML theory (becoming less relevant for GenAI roles)', c: '#8e8e93', d: 'Classic algorithm puzzles, SQL drills and pure ML theory still appear sometimes, but GenAI hiring is shifting toward practical building skills.' },
      { id: 'r1', x: 10, y: 100, w: 230, h: 76, t: 'Round 1\nAI fundamentals', c: '#007aff', d: 'Can you explain how modern AI works? Expect transformer architecture, tokens, embeddings and RAG.' },
      { id: 'r2', x: 280, y: 100, w: 230, h: 76, t: 'Round 2\nBuild discussion', c: '#af52de', d: 'Walk through something you built: architecture, data flow, scaling, cost, security, optimization and monitoring.' },
      { id: 'r3', x: 550, y: 100, w: 230, h: 76, t: 'Round 3\nSystem design & build', c: '#34c759', d: 'Real-time problem solving: design (and sometimes build) an AI system live while explaining your trade-offs.' },
      { id: 's1', x: 10, y: 226, w: 230, h: 66, t: 'Transformers · tokens ·\nembeddings · RAG', c: '#007aff', d: 'Study the How LLMs Work and RAG modules, then practise explaining each concept out loud in plain language.' },
      { id: 's2', x: 280, y: 226, w: 230, h: 66, t: 'Architecture · data flow ·\nscaling · cost · security', c: '#af52de', d: 'Prepare a 5-minute walkthrough of a real project: why you chose each component, what it costs and how you monitor it.' },
      { id: 's3', x: 550, y: 226, w: 230, h: 66, t: 'Clarify · design ·\ntrade-offs · iterate', c: '#34c759', d: 'Practise with a timer. Start by asking requirement questions, sketch the architecture, then discuss failure modes, cost and evaluation.' }
    ],
    edges: [['old', 'r1'], ['r1', 'r2'], ['r2', 'r3'], ['r1', 's1'], ['r2', 's2'], ['r3', 's3']],
    flow: [['old', 'The old interview mix is fading.'], ['r1', 'Round 1 tests fundamentals.'], ['s1', 'Prepare: fundamentals you can explain simply.'], ['r2', 'Round 2 explores what you have built.'], ['s2', 'Prepare: a clear project walkthrough.'], ['r3', 'Round 3 is live design and building.'], ['s3', 'Prepare: timed practice with trade-offs.']]
  };

  W.roles = root => {
    const R = [
      ['🧠 AI Engineer', 'LLM applications, RAG, multi-agent systems and fine-tuning.', ['Prompting & evaluation', 'RAG', 'Agents', 'Fine-tuning basics'], 'How would you build a RAG assistant over our internal documents?'],
      ['🔧 Backend Engineer', 'API security, scaling, asynchronous programming and authentication.', ['REST/gRPC APIs', 'Async I/O', 'Auth & rate limiting', 'Queues & caching'], 'How would you serve a slow LLM endpoint to thousands of users without timeouts?'],
      ['🗄️ Data Engineer', 'Embedding pipelines, vector databases, ETL and data warehousing.', ['ETL / ELT', 'Vector databases', 'Embedding pipelines', 'Warehouses'], 'How do you keep a vector index fresh when source documents change daily?'],
      ['☁️ Cloud & Ops Engineer', 'Cloud platforms, Kubernetes, Docker and CI/CD.', ['AWS / Azure / GCP', 'Docker & Kubernetes', 'CI/CD', 'Infrastructure as code'], 'Walk me through deploying a containerized AI service with zero-downtime updates.'],
      ['📊 LLMOps Engineer', 'Prompt engineering, evaluation, tracing, guardrails and cost tracking.', ['Evals & test sets', 'Tracing', 'Guardrails', 'Cost dashboards'], 'How do you detect that a prompt change made answers worse?'],
      ['🎯 AI Product Lead / Engineer', 'User experience, latency, reliability and failure handling.', ['UX for AI', 'Latency budgets', 'Reliability', 'Failure handling'], 'What should the app do when the model is slow, wrong, or unavailable?']
    ];
    const tabs = h('div', { class: 'tabs' }), body = h('div', { class: 'apanel' });
    function pick(i) {
      [...tabs.children].forEach((t, j) => t.classList.toggle('on', i === j)); const r = R[i];
      body.replaceChildren(h('p', {}, h('b', {}, 'Focus: '), r[1]), h('div', { class: 'chips' }, r[2].map(t => h('span', { class: 'chip', style: 'background:#5856D633;border-color:#5856D6' }, t))), h('p', {}, h('b', {}, 'Sample interview question: '), h('em', {}, '"' + r[3] + '"')));
    }
    R.forEach((r, i) => tabs.append(h('button', { class: 'tab', onclick: () => pick(i) }, r[0])));
    root.append(h('h4', {}, '👥 Explore: roles that hire for GenAI'), tabs, body); pick(0);
  };

  W.projectspot = root => {
    const C = [
      ['A chatbot built by following a tutorial step by step, with nothing changed.', true, 'Red flag. Hiring teams see this constantly. Change the problem, data and design so the work is clearly yours.'],
      ['A RAG app over thousands of PDFs with hybrid search, reranking and a quality evaluation report.', false, 'Strong. It shows retrieval depth and measurement.'],
      ['"I know LangChain and AutoGen" with no project that uses them.', true, 'Red flag. Knowing a framework name is not the same as building with it. Show something working.'],
      ['An agent with role-based access, approval steps and audit logs, with a short write-up of the risks.', false, 'Strong. It covers access control, security and decision-making.'],
      ['A clever prompt library presented as the whole project.', true, 'Weak. GenAI is more than prompt engineering. Pair prompts with system design.'],
      ['A deployed service on a cloud provider defined with Terraform, with CI/CD, monitoring and a cost dashboard.', false, 'Strong. It proves you can productionize, not just prototype.'],
      ['A copy-pasted open-source AI app with a new logo.', true, 'Red flag. Interviewers will ask how it works, and copied work falls apart under questions.']
    ];
    let i = 0, score = 0;
    const card = h('div', { class: 'apanel' }), fb = h('div', { class: 'apanel', style: 'display:none' });
    function show() {
      fb.style.display = 'none';
      if (i >= C.length) { card.replaceChildren(h('b', {}, `Finished! Score: ${score} / ${C.length}`), h('p', {}, 'Strong portfolios show depth, measurement and production thinking.'), h('button', { class: 'btn p', onclick: () => { i = 0; score = 0; show(); } }, 'Play again')); return; }
      card.replaceChildren(h('small', {}, `Project ${i + 1} of ${C.length}`), h('p', { style: 'font-size:16px;margin:8px 0 12px' }, C[i][0]), h('div', { class: 'wrow' }, h('button', { class: 'btn', onclick: () => ans(false) }, '💪 Strong project'), h('button', { class: 'btn', onclick: () => ans(true) }, '🚩 Red flag')));
    }
    function ans(flag) { const ok = flag === C[i][1]; if (ok) score++; fb.style.display = 'block'; fb.replaceChildren(h('b', {}, ok ? '✅ Correct. ' : '❌ Not quite. '), C[i][2], h('div', { class: 'wrow' }, h('button', { class: 'btn p', onclick: () => { i++; show(); } }, 'Next →'))); card.querySelectorAll('button').forEach(b => b.disabled = true); }
    root.append(h('h4', {}, '🚩 Try it: strong project or red flag?'), card, fb); show();
  };

  W.qa = root => {
    const R = {
      'Round 1: Fundamentals': [
        ['Explain tokens and why they matter.', ['Text is split into pieces (words or sub-words) that map to IDs.', 'Limits, latency and price are measured in tokens.', 'Different languages and code use different numbers of tokens.']],
        ['What is an embedding, and how is it used in RAG?', ['A vector that represents meaning; similar meanings are close together.', 'Chunks and questions are embedded with the same model.', 'The nearest chunks to the question are retrieved by similarity search.']],
        ['What does self-attention do?', ['Lets each token weigh which other tokens matter.', 'Resolves references such as "it" and captures long-range context.', 'Several attention heads capture different relationships in parallel.']],
        ['RAG or fine-tuning: how do you choose?', ['RAG for fresh, private or citable knowledge that changes.', 'Fine-tuning for style, format or behavior, or to specialize a smaller model.', 'They can be combined; start with prompting and RAG because they are cheaper to iterate.']],
        ['How do you reduce hallucinations?', ['Ground answers in retrieved sources and require citations.', 'Allow "I don\'t know" and constrain the prompt to the context.', 'Use evaluation sets, validators and human review for high-stakes output.']]
      ],
      'Round 2: Build discussion': [
        ['Design a RAG system over 5 million documents. Walk me through the data flow.', ['Ingestion: parse, clean, chunk, embed, store with metadata.', 'Retrieval: approximate nearest neighbor index, hybrid search, reranking, metadata filters.', 'Access control per document, caching, incremental re-indexing.', 'Evaluation set, monitoring, cost and latency budgets.']],
        ['How would you cut LLM costs by 50%?', ['Route easy requests to smaller models.', 'Cache repeated requests and shared prompt prefixes.', 'Trim prompts and history, limit output length, batch offline work.', 'Measure quality before and after every change.']],
        ['How do you secure an agent that can use internal tools?', ['Least-privilege, scoped credentials per tool.', 'Human approval for risky actions; sandbox execution.', 'Input and output guardrails and prompt-injection defenses.', 'Audit logs and alerts on unusual behavior.']]
      ],
      'Round 3: System design': [
        ['Design a support copilot used by 10,000 agents.', ['Clarify: users, latency target, data sources, accuracy needs.', 'Architecture: gateway, orchestrator, retrieval, LLM, guardrails, feedback loop.', 'Scale and cost: caching, model routing, rate limits, autoscaling.', 'Quality: offline evals, online metrics, human-in-the-loop, rollout plan.']],
        ['Design an agent that processes invoices end to end.', ['Break the workflow into steps and decide which need a model.', 'Structured extraction with validation against business rules.', 'Approval thresholds, audit trail and exception handling.', 'Monitoring accuracy, throughput and cost per invoice.']]
      ]
    };
    const tabs = h('div', { class: 'tabs' }), body = h('div', {});
    function pick(k) {
      [...tabs.children].forEach(t => t.classList.toggle('on', t.textContent === k));
      body.replaceChildren(...R[k].map(([q, a]) => { const ans = h('ul', { style: 'display:none;margin:8px 0 0 20px' }, a.map(x => h('li', {}, x))); return h('div', { class: 'apanel' }, h('b', {}, q), h('div', { class: 'wrow' }, h('button', { class: 'btn', onclick: e => { const open = ans.style.display === 'none'; ans.style.display = open ? 'block' : 'none'; e.target.textContent = open ? 'Hide answer outline' : 'Show answer outline'; } }, 'Show answer outline')), ans); }));
    }
    Object.keys(R).forEach(k => tabs.append(h('button', { class: 'tab', onclick: () => pick(k) }, k)));
    root.append(h('h4', {}, '🎤 Practise: answer out loud first, then reveal'), tabs, body, note('These outlines are what a strong answer typically covers, not scripts. Use your own words and your own project examples.')); pick(Object.keys(R)[0]);
  };

  W.cloudmap = root => {
    const T = [
      ['Run a containerized API', 'AWS ECS / Fargate', 'Azure Container Apps', 'Google Cloud Run'],
      ['Kubernetes', 'Amazon EKS', 'Azure AKS', 'Google GKE'],
      ['Managed foundation models', 'Amazon Bedrock', 'Azure OpenAI / AI Foundry', 'Vertex AI'],
      ['Object storage for documents', 'Amazon S3', 'Azure Blob Storage', 'Cloud Storage'],
      ['Vector / semantic search', 'OpenSearch or Aurora with pgvector', 'Azure AI Search', 'Vertex AI Vector Search or AlloyDB'],
      ['Secrets', 'AWS Secrets Manager', 'Azure Key Vault', 'Secret Manager'],
      ['Monitoring & logs', 'CloudWatch', 'Azure Monitor', 'Cloud Monitoring & Logging'],
      ['Infrastructure as code', 'Terraform (or CloudFormation)', 'Terraform (or Bicep)', 'Terraform (or Deployment Manager)']
    ];
    const sel = h('select', { class: 'wi' }, T.map(t => h('option', {}, t[0]))), out = h('div', { class: 'bars' });
    const colors = ['#ff9900', '#0078d4', '#34a853'];
    function draw() { const t = T[sel.selectedIndex]; out.replaceChildren(...['AWS', 'Azure', 'Google Cloud'].map((n, i) => h('div', { class: 'apanel', style: `border-left:5px solid ${colors[i]}` }, h('small', {}, n), h('div', {}, h('b', {}, t[i + 1]))))); }
    sel.addEventListener('change', draw);
    root.append(h('h4', {}, '☁️ Explore: the same need on three clouds'), h('label', {}, 'What do you need?'), sel, out, note('Service names change over time, so confirm in each provider\'s docs. The point: concepts transfer between clouds.')); draw();
  };

  W.readiness = root => {
    const TOP = [
      ['Productionizing AI', 'Deploy a small LLM service end to end with logging and error handling.'],
      ['Modern RAG', 'Build RAG with hybrid search, reranking and an evaluation set (see Lab 2).'],
      ['Agentic workflows', 'Build an agent with two tools, an approval step and audit logs.'],
      ['LLMOps', 'Add tracing and prompt versioning to one of your projects.'],
      ['Cloud deployment', 'Deploy a container to a cloud service and describe it with Terraform.'],
      ['AI infrastructure', 'Learn GPU vs TPU basics and compare managed vs self-hosted inference costs.'],
      ['Evaluation & monitoring', 'Write a 20-question test set and track scores across prompt changes.'],
      ['AI security', 'Test your app against prompt injection and document the defenses.'],
      ['Cost optimization', 'Measure cost per request and try routing and caching to reduce it.'],
      ['Multimodal orchestration', 'Chain a speech or vision model with an LLM in one workflow.']
    ];
    const LEVELS = ['Never heard of it', 'I know the idea', 'I have built something', 'Production-ready'];
    const vals = TOP.map(() => 0), NS = 'http://www.w3.org/2000/svg';
    const radar = document.createElementNS(NS, 'svg'); radar.setAttribute('viewBox', '0 0 360 320'); radar.setAttribute('class', 'archsvg'); radar.style.maxWidth = '420px';
    const out = h('div', { class: 'apanel' }), score = h('div', { class: 'stats big' });
    const rows = TOP.map(([n], i) => h('div', { class: 'wrow', style: 'justify-content:space-between' }, h('label', { style: 'min-width:170px;color:var(--tx)' }, n), (() => { const s = h('select', { class: 'wi', style: 'max-width:210px;margin:0' }, LEVELS.map(l => h('option', {}, l))); s.addEventListener('change', () => { vals[i] = s.selectedIndex; draw(); }); return s; })()));
    function draw() {
      const cx = 180, cy = 160, R = 110, n = TOP.length; let s = '';
      [1, 2, 3].forEach(l => s += `<polygon points="${TOP.map((_, i) => { const a = i / n * 2 * Math.PI - Math.PI / 2; return (cx + Math.cos(a) * R * l / 3) + ',' + (cy + Math.sin(a) * R * l / 3); }).join(' ')}" fill="none" stroke="var(--bd)"/>`);
      TOP.forEach((t, i) => { const a = i / n * 2 * Math.PI - Math.PI / 2; s += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * R}" y2="${cy + Math.sin(a) * R}" stroke="var(--bd)"/><text x="${cx + Math.cos(a) * (R + 22)}" y="${cy + Math.sin(a) * (R + 18) + 4}" class="t2" style="font-size:10px">${t[0].split(' ')[0]}</text>`; });
      s += `<polygon points="${TOP.map((_, i) => { const a = i / n * 2 * Math.PI - Math.PI / 2, r = R * vals[i] / 3; return (cx + Math.cos(a) * r) + ',' + (cy + Math.sin(a) * r); }).join(' ')}" fill="rgba(88,86,214,.3)" stroke="#5856D6" stroke-width="2.5"/>`;
      radar.innerHTML = s;
      const total = vals.reduce((a, b) => a + b, 0), pct = Math.round(total / (TOP.length * 3) * 100);
      score.innerHTML = `Readiness: <b>${pct}%</b> · ${pct < 25 ? 'Just starting. Pick one topic and build something small.' : pct < 60 ? 'Good foundation. Turn knowledge into projects.' : 'Strong. Polish your portfolio and practise explaining trade-offs.'}`;
      const weak = TOP.map((t, i) => [vals[i], t]).sort((a, b) => a[0] - b[0]).slice(0, 3);
      out.replaceChildren(h('b', {}, 'Focus next on:'), ...weak.map(([, t]) => h('p', {}, h('b', {}, t[0] + ': '), t[1])));
    }
    root.append(h('h4', {}, '📡 Self-assessment: how ready are you?'), ...rows, radar, score, out, note('Be honest: the chart is for you. Revisit it every few weeks.')); draw();
  };

  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-widget]').forEach(r => { const f = W[r.dataset.widget]; if (f) f(r); }));
})();
