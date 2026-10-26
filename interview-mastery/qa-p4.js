// Phase 4 widgets: Retrieval-Augmented Generation. Toy but faithful logic; all numbers illustrative.
(function () {
  const { h, svg, css, reduced } = window.QAH;
  const PAL = ['#5856D6', '#ff9500', '#34c759', '#ff3b30', '#0a84ff', '#af52de'];
  const btn = (label, fn, cls, aria) => h('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), onclick: fn, 'aria-label': aria || null }, label);
  const head = (title, note) => [h('h4', {}, title), h('p', { class: 'wnote' }, note)];
  const mkTake = () => h('p', { class: 'apanel', 'aria-live': 'polite', style: 'margin-top:8px' });
  let uid = 0;
  const nid = p => 'p4-' + p + '-' + (++uid);

  // ---------------------------------------------------------------- 1. Pipeline
  window.QAW.p4_pipeline = function (root) {
    const nodes = [
      { lane: 0, col: 0, t: 'Load', d: 'Loaders and parsers pull text from PDFs, wikis, tickets. OCR for scans, keep headings and tables.', pk: 'refund-policy.pdf (12 pages)' },
      { lane: 0, col: 1, t: 'Chunk', d: 'Split into retrieval units (for example 500 tokens, 10-20% overlap) and attach metadata: source, section, tenant, permissions.', pk: '38 chunks + metadata' },
      { lane: 0, col: 2, t: 'Embed', d: 'An embedding model turns each chunk into a vector. The same model must be used for queries later.', pk: '38 vectors (e.g. 1024-d)' },
      { lane: 0, col: 3, t: 'Vector DB', d: 'Vectors and metadata are upserted into an ANN index (HNSW/IVF); a BM25 index is often kept alongside.', pk: 'index ready, searchable in ms' },
      { lane: 1, col: 0, t: 'Question', d: 'The user asks. Chat history may be used to rewrite the question into a standalone query.', pk: '"Refund window for annual plans?"' },
      { lane: 1, col: 1, t: 'Embed Q', d: 'The question is embedded with the SAME model used at indexing time.', pk: 'query vector' },
      { lane: 1, col: 2, t: 'Retrieve', d: 'ANN (and optionally BM25) search with metadata and permission filters returns the top-k candidates.', pk: 'top-50 candidate chunks' },
      { lane: 1, col: 3, t: 'Rerank', d: 'A cross-encoder rescores the candidates against the query and keeps the best few.', pk: 'top-5 chunks' },
      { lane: 1, col: 4, t: 'Prompt', d: 'Instructions + tagged chunks + question are assembled within a token budget, best chunks first.', pk: 'prompt, ~1,200 tokens' },
      { lane: 1, col: 5, t: 'LLM', d: 'The model answers only from the context and cites sources. Guardrails check groundedness.', pk: 'answer + citations [1][2]' }
    ];
    const X = c => 55 + c * 98, Y = l => (l ? 175 : 70), W = 84, H = 40;
    let i = 0, timer = null;
    const takeaway = mkTake(), detail = h('div', { class: 'apanel', 'aria-live': 'polite' });
    const packet = svg('g', { style: 'transition:transform ' + (reduced() ? '0s' : '.6s') + ' ease' },
      svg('circle', { r: 11, fill: PAL[1], stroke: css('--tx'), 'stroke-width': 1.5 }), svg('text', { y: 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#000' }, 'D'));
    const s = svg('svg', { viewBox: '0 0 610 240', style: 'width:100%;height:auto;max-width:640px', role: 'group', 'aria-label': 'RAG pipeline diagram. Offline indexing lane on top, online query lane below. Each box is a button.' });
    const gs = nodes.map((n, k) => {
      const g = svg('g', { tabindex: 0, role: 'button', 'aria-label': n.t + ': ' + n.d, style: 'cursor:pointer' },
        svg('rect', { x: X(n.col) - W / 2, y: Y(n.lane) - H / 2, width: W, height: H, rx: 8, 'stroke-width': 2 }),
        svg('text', { x: X(n.col), y: Y(n.lane) + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600 }, n.t));
      g.addEventListener('click', () => go(k));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(k); } });
      return g;
    });
    const lines = [];
    for (let k = 0; k < nodes.length - 1; k++) {
      if (k === 3) continue;
      const a = nodes[k], b = nodes[k + 1];
      lines.push(svg('line', { x1: X(a.col) + W / 2, y1: Y(a.lane), x2: X(b.col) - W / 2, y2: Y(b.lane), 'stroke-width': 2, 'data-l': 1 }));
    }
    const link = svg('line', { x1: X(3), y1: Y(0) + H / 2, x2: X(2), y2: Y(1) - H / 2, 'stroke-width': 2, 'stroke-dasharray': '5 4', 'data-l': 1 });
    const lab0 = svg('text', { x: 6, y: 22, 'font-size': 12, 'font-weight': 700 }, 'OFFLINE: indexing (before any question)');
    const lab1 = svg('text', { x: 6, y: 127, 'font-size': 12, 'font-weight': 700 }, 'ONLINE: query time (per question)');
    const lk = svg('text', { x: X(3) - 150, y: 128 + 25, 'font-size': 10 }, '');
    s.append(...lines, link, lab0, lab1, ...gs, packet);
    function paint() {
      const tx = css('--tx'), tx2 = css('--tx2'), bd = css('--bd'), bg = css('--bg2');
      [lab0, lab1].forEach(t => t.setAttribute('fill', tx));
      s.querySelectorAll('[data-l]').forEach(l => l.setAttribute('stroke', bd));
      gs.forEach((g, k) => {
        const r = g.firstChild, t = g.lastChild, on = k === i, done = k < i && nodes[k].lane === nodes[i].lane || (nodes[i].lane === 1 && nodes[k].lane === 0);
        r.setAttribute('fill', on ? PAL[nodes[k].lane ? 4 : 0] : bg);
        r.setAttribute('stroke', on ? tx : (done ? PAL[2] : bd));
        r.setAttribute('stroke-dasharray', done && !on ? '' : '');
        t.setAttribute('fill', on ? '#fff' : tx);
      });
      packet.firstChild.setAttribute('stroke', tx);
      packet.style.transform = 'translate(' + X(nodes[i].col) + 'px,' + (Y(nodes[i].lane) - H / 2 - 16) + 'px)';
      const n = nodes[i];
      detail.textContent = '';
      detail.append(h('b', {}, (n.lane ? 'Online' : 'Offline') + ' step ' + (i + 1) + '/10 - ' + n.t + ': '), n.d, h('br'), h('span', { style: 'color:var(--tx2)' }, 'Data leaving this stage (illustrative): ' + n.pk));
      takeaway.textContent = i < 4 ? 'What you saw: indexing happens once, ahead of time, and turns documents into searchable vectors.' : i < 9 ? 'What you saw: at question time we embed the query, fetch candidates, narrow them, and only then build the prompt.' : 'What you saw: the LLM only writes the answer; the quality was largely decided by the retrieval steps before it.';
    }
    function go(k) { i = (k + nodes.length) % nodes.length; paint(); }
    const playB = btn('Play', () => { if (timer) stop(); else { playB.textContent = 'Pause'; timer = setInterval(() => { if (!root.isConnected) return stop(); go(i + 1); }, 1500); } }, 'p');
    function stop() { clearInterval(timer); timer = null; playB.textContent = 'Play'; }
    root.append(...head('🧭 RAG pipeline, end to end', 'Press Play or Step to move a packet through indexing then querying. Click or Tab to any box for detail.'),
      h('div', { class: 'wrow' }, playB, btn('Step', () => { stop(); go(i + 1); }), btn('Reset', () => { stop(); go(0); })), s, detail, takeaway);
    paint();
    new MutationObserver(paint).observe(document.documentElement, { attributes: true });
  };

  // ---------------------------------------------------------------- 2. RRF
  window.QAW.p4_rrf = function (root) {
    const docs = { A: 'KB article: fix error 0x80070057', B: 'Guide: Windows Update troubleshooting', C: 'FAQ: why updates fail', D: 'Blog: list of error codes', E: 'Release notes 22H2', F: 'Disk cleanup guide' };
    let bm = ['A', 'D', 'E', 'B', 'C', 'F'], ve = ['B', 'C', 'F', 'A', 'E', 'D'], c = 60, k = 6;
    const cI = h('input', { type: 'range', min: 1, max: 100, value: 60, class: 'wi', 'aria-label': 'RRF constant c' });
    const kI = h('input', { type: 'range', min: 2, max: 6, value: 6, class: 'wi', 'aria-label': 'Top k taken from each list' });
    const cV = h('b', {}, '60'), kV = h('b', {}, '6');
    const lists = h('div', { class: 'wrow', style: 'align-items:flex-start;gap:12px' }), out = h('div'), take = mkTake();
    const mv = (arr, j, d) => { const t = j + d; if (t < 0 || t >= arr.length) return; [arr[j], arr[t]] = [arr[t], arr[j]]; draw(); };
    function col(title, arr) {
      const d = h('div', { style: 'flex:1;min-width:150px' }, h('b', {}, title));
      arr.forEach((id, j) => d.append(h('div', { class: 'wrow', style: 'gap:4px;margin:3px 0;opacity:' + (j < k ? 1 : .4) },
        h('span', { style: 'width:20px' }, (j + 1) + '.'), h('span', { style: 'flex:1;font-size:.85em' }, id + ' ' + docs[id]),
        h('button', { type: 'button', class: 'btn', 'aria-label': 'Move ' + id + ' up in ' + title, onclick: () => mv(arr, j, -1) }, '▲'),
        h('button', { type: 'button', class: 'btn', 'aria-label': 'Move ' + id + ' down in ' + title, onclick: () => mv(arr, j, 1) }, '▼'))));
      return d;
    }
    function draw() {
      c = +cI.value; k = +kI.value; cV.textContent = c; kV.textContent = k;
      lists.textContent = ''; lists.append(col('BM25 (keyword)', bm), col('Vector (semantic)', ve));
      const sc = {};
      Object.keys(docs).forEach(id => {
        const rb = bm.indexOf(id) + 1, rv = ve.indexOf(id) + 1;
        sc[id] = { id, rb, rv, s: (rb <= k ? 1 / (rb + c) : 0) + (rv <= k ? 1 / (rv + c) : 0) };
      });
      const arr = Object.values(sc).sort((a, b) => b.s - a.s), max = arr[0].s || 1;
      out.textContent = '';
      out.append(h('b', {}, 'Fused ranking: score = 1/(rank_BM25 + c) + 1/(rank_vector + c)'));
      arr.forEach((r, j) => {
        out.append(h('div', { class: 'wrow', style: 'gap:6px;margin:3px 0' },
          h('span', { style: 'width:20px' }, (j + 1) + '.'),
          h('span', { style: 'width:150px;font-size:.85em' }, r.id + ' ' + docs[r.id]),
          h('div', { style: 'flex:1;min-width:80px;background:var(--bg3);border-radius:4px;height:14px' }, h('div', { style: 'height:14px;border-radius:4px;background:' + (j === 0 ? PAL[2] : PAL[0]) + ';width:' + (r.s / max * 100).toFixed(1) + '%' })),
          h('span', { style: 'font-size:.8em;width:150px' }, r.s.toFixed(4) + '  (BM25 #' + (r.rb <= k ? r.rb : '-') + ', vec #' + (r.rv <= k ? r.rv : '-') + ')')));
      });
      const w = arr[0];
      take.textContent = 'What you saw: ' + w.id + ' wins because it ranks well in ' + (w.rb <= k && w.rv <= k ? 'both lists' : 'one list') + '; ' + (c < 10 ? 'a small c makes the top ranks count much more.' : c > 60 ? 'a large c flattens the differences between ranks.' : 'RRF rewards agreement between keyword and semantic search without normalizing scores.');
    }
    cI.addEventListener('input', draw); kI.addEventListener('input', draw);
    root.append(...head('🔀 Hybrid search + Reciprocal Rank Fusion', 'Query: "fix error 0x80070057 when updating". Reorder either list with the arrows, then change c and k. Positions are illustrative.'),
      h('div', { class: 'wrow' }, h('label', {}, 'c = ', cV, ' '), cI, h('label', {}, 'top-k per list = ', kV, ' '), kI), lists, out, take);
    draw();
  };

  // ---------------------------------------------------------------- 3. Rerank funnel
  window.QAW.p4_rerank = function (root) {
    const N = 50, COLS = 10;
    let gold = 23, keep = 5, after = false;
    // deterministic pseudo-random
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const noise = Array.from({ length: N }, rnd), hard = Array.from({ length: N }, rnd);
    const gI = h('input', { type: 'range', min: 1, max: 50, value: gold, class: 'wi', 'aria-label': 'First-stage rank of the gold chunk' });
    const kI = h('input', { type: 'range', min: 3, max: 10, value: keep, class: 'wi', 'aria-label': 'Chunks kept for the prompt' });
    const gV = h('b', {}, gold), kV = h('b', {}, keep);
    const s = svg('svg', { viewBox: '0 0 610 250', style: 'width:100%;height:auto;max-width:640px', role: 'img', 'aria-label': 'Grid of 50 candidate chunks, each labelled with its first-stage rank. The gold chunk is marked with a star.' });
    const cells = [];
    for (let r = 1; r <= N; r++) {
      const g = svg('g', { style: 'transition:transform ' + (reduced() ? '0s' : '.7s') + ' ease' }, svg('rect', { width: 52, height: 36, rx: 6, 'stroke-width': 2 }), svg('text', { x: 26, y: 23, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600 }, ''));
      cells.push(g); s.append(g);
    }
    const hdr = svg('text', { x: 6, y: 14, 'font-size': 12, 'font-weight': 700 }, '');
    s.append(hdr);
    const info = h('div', { class: 'apanel', 'aria-live': 'polite' }), take = mkTake();
    const rb = h('button', { type: 'button', class: 'btn p', onclick: () => { after = !after; rb.textContent = after ? 'Back to first-stage order' : 'Rerank with cross-encoder'; draw(); } }, 'Rerank with cross-encoder');
    function draw() {
      gold = +gI.value; keep = +kI.value; gV.textContent = gold; kV.textContent = keep;
      const tx = css('--tx'), bd = css('--bd'), bg = css('--bg2');
      // cross-encoder score: gold ~0.95, hard negatives up to 0.8, others lower
      const cross = r => r === gold ? 0.95 : (hard[r - 1] > 0.9 ? 0.6 + 0.2 * noise[r - 1] : 0.1 + 0.4 * noise[r - 1] * (1 - r / 120));
      const ids = Array.from({ length: N }, (_, j) => j + 1);
      const order = after ? ids.slice().sort((a, b) => cross(b) - cross(a)) : ids;
      order.forEach((r, pos) => {
        const g = cells[r - 1], x = 8 + (pos % COLS) * 60, y = 24 + Math.floor(pos / COLS) * 44, kept = pos < keep, isG = r === gold;
        g.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        const rc = g.firstChild, t = g.lastChild;
        rc.setAttribute('fill', isG ? PAL[2] : kept ? PAL[4] : bg);
        rc.setAttribute('stroke', kept ? tx : bd);
        rc.setAttribute('stroke-dasharray', kept ? '' : '3 3');
        rc.setAttribute('opacity', kept || isG ? 1 : .75);
        t.setAttribute('fill', isG || kept ? '#000' : tx);
        t.textContent = (isG ? '★' : '#') + r;
      });
      hdr.setAttribute('fill', tx);
      hdr.textContent = (after ? 'Cross-encoder order' : 'First-stage (bi-encoder) order') + ' - solid blue = kept for the prompt (top ' + keep + '), ★ = gold chunk, # = first-stage rank';
      const pos = order.indexOf(gold) + 1, inCtx = pos <= keep;
      info.textContent = 'Gold chunk position: #' + pos + ' of 50 -> ' + (inCtx ? 'IN the prompt' : 'NOT in the prompt (the LLM never sees it)') + '. Extra rerank latency is typically ~50-300 ms (illustrative).';
      take.textContent = !after ? 'What you saw: embedding search put the best chunk at rank ' + gold + ', ' + (gold <= keep ? 'so it happened to survive.' : 'so a top-' + keep + ' cutoff throws the answer away.') : 'What you saw: the cross-encoder reads query and chunk together, lifted the gold chunk to #' + pos + ', and the top ' + keep + ' now hold the answer: retrieval gave recall, reranking gave precision.';
    }
    gI.addEventListener('input', draw); kI.addEventListener('input', draw);
    root.append(...head('🔻 Rerank funnel: top-50 to top-' + 5, 'Set where the first stage ranked the gold chunk, then press Rerank. Scores are simulated, the effect is the real pattern.'),
      h('div', { class: 'wrow' }, h('label', {}, 'Gold chunk first-stage rank = ', gV, ' '), gI, h('label', {}, 'Keep top ', kV, ' '), kI, rb), s, info, take);
    draw();
    new MutationObserver(draw).observe(document.documentElement, { attributes: true });
  };

  // ---------------------------------------------------------------- 4. Grounding + context budget
  window.QAW.p4_context = function (root) {
    const chunks = [
      { id: 'a', t: 'Annual plans: full refund within 30 days of purchase.', tok: 140, rel: true },
      { id: 'b', t: 'Monthly plans: refund within 7 days of the billing date.', tok: 120, rel: false },
      { id: 'c', t: 'Company history: founded in 2015, offices in three countries.', tok: 160, rel: false },
      { id: 'd', t: 'Shipping policy: hardware ships in 3-5 business days.', tok: 130, rel: false }
    ];
    let order = chunks.map(x => x.id), on = { a: true, b: true, c: false, d: false }, inject = true, strict = true, budget = 400;
    const bI = h('input', { type: 'range', min: 100, max: 600, step: 10, value: budget, class: 'wi', 'aria-label': 'Context token budget' });
    const bV = h('b', {}, budget);
    const injC = h('input', { type: 'checkbox', checked: 'checked', class: 'cbx', id: nid('inj') }), strC = h('input', { type: 'checkbox', checked: 'checked', class: 'cbx', id: nid('str') });
    injC.addEventListener('change', () => { inject = injC.checked; draw(); }); strC.addEventListener('change', () => { strict = strC.checked; draw(); });
    const list = h('div'), bar = h('div', { style: 'height:16px;border-radius:4px;background:var(--bg3);overflow:hidden;display:flex;margin:6px 0' }), barT = h('div', { style: 'font-size:.85em' });
    const prompt = h('pre', { style: 'color:var(--tx);white-space:pre-wrap;font-size:.8em;background:var(--bg3);padding:8px;border-radius:8px;margin:6px 0' }), ans = h('div', { class: 'apanel', 'aria-live': 'polite' }), take = mkTake();
    const get = id => chunks.find(x => x.id === id);
    function draw() {
      budget = +bI.value; bV.textContent = budget;
      list.textContent = '';
      order.forEach((id, j) => {
        const ch = get(id);
        const cb = h('input', { type: 'checkbox', class: 'cbx', 'aria-label': 'Include chunk ' + id, onchange: e => { on[id] = e.target.checked; draw(); } });
        cb.checked = on[id];
        const mv = d => () => { const t = j + d; if (t < 0 || t >= order.length) return; [order[j], order[t]] = [order[t], order[j]]; draw(); };
        list.append(h('div', { class: 'wrow', style: 'gap:6px;margin:3px 0' }, cb, h('span', { style: 'flex:1;font-size:.85em' }, '[' + id + '] ' + ch.t + ' (' + ch.tok + ' tok)'),
          h('button', { type: 'button', class: 'btn', 'aria-label': 'Move chunk ' + id + ' up', onclick: mv(-1) }, '▲'), h('button', { type: 'button', class: 'btn', 'aria-label': 'Move chunk ' + id + ' down', onclick: mv(1) }, '▼')));
      });
      // fill budget in order
      let used = 0; const fit = [], drop = [];
      order.filter(id => on[id]).forEach(id => { const ch = get(id); if (inject && used + ch.tok <= budget) { used += ch.tok; fit.push(id); } else drop.push(id); });
      bar.textContent = '';
      fit.forEach(id => bar.append(h('div', { title: id, style: 'height:16px;font-size:11px;text-align:center;color:#000;border-right:2px solid var(--bg);background:' + (get(id).rel ? PAL[2] : PAL[1]) + ';width:' + (get(id).tok / 600 * 100) + '%' }, id)));
      barT.textContent = 'Context tokens: ' + used + ' / ' + budget + (drop.length ? '  | dropped (over budget or unchecked): ' + drop.join(', ') : '') + '  (green = relevant, orange = distractor)';
      let p = 'SYSTEM: ' + (strict ? 'Answer ONLY from the documents. Cite as [n]. If the answer is not there, say you do not know.' : 'You are a helpful support assistant.') + '\n';
      if (inject) { p += '<documents>\n'; fit.forEach((id, j) => { p += '<doc id="' + (j + 1) + '">' + get(id).t + '</doc>\n'; }); p += '</documents>\n'; }
      p += 'USER: What is the refund window for annual plans?';
      prompt.textContent = p;
      const hasRel = fit.includes('a'), firstId = fit[0], pos = fit.indexOf('a');
      let a, t;
      if (!inject || !fit.length) { a = 'Model answer (ungrounded): "Refunds are usually available within 14 days." - fluent and plausible, but a guess with no source.'; t = 'the model fills the gap with a plausible guess because nothing grounds it'; }
      else if (hasRel) { a = 'Model answer: "Annual plans can be refunded in full within 30 days of purchase [' + (pos + 1) + '].", checkable against its citation.'; t = 'the relevant evidence is in context, so the truthful answer is also the most probable one' + (fit.length >= 3 && pos > 0 && pos < fit.length - 1 ? ' (but it sits in the middle of the context, where models attend less: put it first or last)' : ''); }
      else if (strict) { a = 'Model answer: "The provided documents do not say. I do not know."', t = 'retrieval missed, but the grounding instruction turns a fabrication into an honest gap'; }
      else { a = 'Model answer: "' + (fit.includes('b') ? 'Refunds are within 7 days [1].' : 'I believe it is around 14 days.') + '" - confident, but built on the wrong evidence.'; t = 'without a refusal rule, bad or missing retrieval still yields a confident wrong answer'; }
      ans.textContent = a;
      take.textContent = 'What you saw: ' + t + '.';
    }
    bI.addEventListener('input', draw);
    root.append(...head('📎 Grounding and context injection', 'Toggle retrieval, the refusal rule, which chunks go in, their order and the token budget. Token counts are illustrative.'),
      h('div', { class: 'wrow' }, h('label', { for: injC.id }, injC, ' Inject retrieved context'), h('label', { for: strC.id }, strC, ' "Answer only from context, else say I do not know"'), h('label', {}, 'Budget = ', bV, ' tokens '), bI),
      list, bar, barT, prompt, ans, take);
    draw();
  };
})();
