// Phase 5 visuals: Agents and Tool Calling. Registers p5_* widgets on window.QAW. Pure vanilla JS, offline.
(function () {
  const { h, svg } = window.QAH;
  const QAW = window.QAW;
  const PAL = ['#5856D6', '#ff9500', '#34c759', '#ff3b30', '#0a84ff', '#af52de'];
  const SVGNS_STYLE = 'width:100%;height:auto;display:block;';

  const btn = (label, on, cls) => h('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), onclick: on }, label);
  const head = (title, note) => [h('h4', null, title), h('p', { class: 'wnote' }, note)];
  const T = (x, y, s, o) => {
    o = o || {};
    return svg('text', {
      x, y, 'text-anchor': o.a || 'middle', 'dominant-baseline': 'middle',
      style: `fill:${o.fill || 'var(--tx)'};font-size:${o.fs || 11}px;font-weight:${o.w || 400};${o.halo ? 'stroke:var(--bg2);stroke-width:3px;paint-order:stroke;' : ''}font-family:inherit`
    }, s);
  };
  function defsArrow(id, color) {
    return svg('defs', null, svg('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      svg('path', { d: 'M0,0 L10,5 L0,10 z', style: `fill:${color}` })));
  }
  let uid = 0;

  // Play / Step / Reset controller. getTotal() may change; render(i) draws state for step index i (-1 = initial).
  function player(root, getTotal, render, ms) {
    let i = -1, timer = null, vis = true;
    const bPlay = btn('Play', toggle, 'p');
    const bStep = btn('Step', () => { stop(); set(i + 1); });
    const bReset = btn('Reset', () => { stop(); set(-1); });
    function set(n) { i = Math.max(-1, Math.min(getTotal() - 1, n)); render(i); if (i >= getTotal() - 1) stop(); }
    function stop() { if (timer) clearInterval(timer); timer = null; bPlay.textContent = 'Play'; bPlay.setAttribute('aria-pressed', 'false'); }
    function toggle() {
      if (timer) { stop(); return; }
      if (i >= getTotal() - 1) set(-1);
      bPlay.textContent = 'Pause'; bPlay.setAttribute('aria-pressed', 'true');
      timer = setInterval(() => { if (!root.isConnected || !vis) { stop(); return; } set(i + 1); }, ms);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; if (!vis) stop(); }).observe(root);
    return { el: h('div', { class: 'wrow', style: 'gap:8px;flex-wrap:wrap;margin:8px 0' }, bPlay, bStep, bReset), set, get i() { return i; }, refresh() { set(Math.min(i, getTotal() - 1)); } };
  }

  // ---------------------------------------------------------------------------------------------
  // 1. Agent loop
  // ---------------------------------------------------------------------------------------------
  QAW.p5_agentloop = function (root) {
    const PH = ['Perceive', 'Reason', 'Act', 'Observe'];
    const STEPS = [
      [0, 'Goal', 'Customer says an item from order 4521 arrived damaged and asks for a refund.'],
      [1, 'Thought', 'I need the order details first.'],
      [2, 'Action', 'lookup_order(order_id="4521")'],
      [3, 'Observation', '{status:"delivered", total:49.00, days_since:6}'],
      [1, 'Thought', 'Check the refund policy for damaged items.'],
      [2, 'Action', 'get_policy(topic="damaged_refund")'],
      [3, 'Observation', '"Full refund within 30 days; auto-approve up to $100"'],
      [1, 'Thought', 'Eligible and under the limit. Issue the refund.'],
      [2, 'Action', 'issue_refund(order_id="4521", amount=49.00)'],
      [3, 'Observation', '{ok:true, refund_id:"R-881"}'],
      [1, 'Thought', 'Notify the customer, then finish.'],
      [2, 'Action', 'send_email(to=customer, body="Refund R-881 issued")'],
      [3, 'Observation', '{sent:true}'],
      [1, 'Final answer', 'Refund of $49.00 issued (R-881) and a confirmation email was sent.']
    ];
    let limit = STEPS.length, approval = false;
    const id = 'ag' + (++uid);
    const nodes = [[130, 36], [226, 130], [130, 224], [34, 130]];
    const g = svg('g');
    const diagram = svg('svg', { viewBox: '0 0 260 260', style: 'width:100%;max-width:260px;height:auto;flex:0 0 auto', role: 'img', 'aria-label': 'Agent loop diagram: perceive, reason, act, observe in a cycle' });
    diagram.append(defsArrow(id, 'var(--tx2)'), g);
    const trace = h('ol', { 'aria-live': 'polite', style: 'margin:0;padding-left:20px;font-size:13px;max-height:260px;overflow:auto;flex:1 1 220px' });
    const stat = h('div', { class: 'apanel', style: 'font-size:13px;margin-top:8px' });
    const take = h('p', { class: 'wnote', style: 'font-weight:600' });
    const lim = h('input', { type: 'range', min: 3, max: STEPS.length, value: STEPS.length, 'aria-label': 'Maximum steps allowed', class: 'wi', style: 'width:150px' });
    const limv = h('span', null, String(STEPS.length));
    const chk = h('input', { type: 'checkbox', id: id + 'c' });
    const pl = player(root, () => limit, render, 1100);

    function draw(active) {
      g.replaceChildren();
      for (let k = 0; k < 4; k++) {
        const a = nodes[k], b = nodes[(k + 1) % 4];
        const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
        g.append(svg('line', { x1: a[0] + ux * 40, y1: a[1] + uy * 30, x2: b[0] - ux * 40, y2: b[1] - uy * 30, 'marker-end': `url(#${id})`, style: 'stroke:var(--tx2);stroke-width:1.5' }));
      }
      nodes.forEach((p, k) => {
        const on = k === active;
        g.append(svg('rect', { x: p[0] - 38, y: p[1] - 17, width: 76, height: 34, rx: 8, style: `fill:${on ? PAL[k % 4 === 0 ? 0 : [0, 1, 2, 4][k]] : 'var(--bg3)'};stroke:${on ? 'var(--tx)' : 'var(--bd)'};stroke-width:${on ? 2.5 : 1}` }));
        g.append(T(p[0], p[1], (k + 1) + '. ' + PH[k], { fill: on ? '#fff' : 'var(--tx)', w: on ? 700 : 500 }));
      });
      g.append(T(130, 130, 'repeat until', { fs: 10, fill: 'var(--tx2)' }), T(130, 144, 'done or limit', { fs: 10, fill: 'var(--tx2)' }));
    }
    function render(i) {
      const n = i + 1;
      trace.replaceChildren();
      for (let k = 0; k <= i; k++) {
        const s = STEPS[k];
        let extra = '';
        if (approval && k === 8) extra = '  [paused: human approved irreversible action]';
        trace.append(h('li', { style: k === i ? 'font-weight:700' : '' }, h('b', null, s[1] + ': '), h('code', null, s[2]), extra));
      }
      if (n === 0) trace.append(h('li', { style: 'list-style:none;margin-left:-20px;color:var(--tx2)' }, 'Press Play or Step to start.'));
      draw(i >= 0 ? STEPS[i][0] : -1);
      const ctx = 800 + 90 * n;
      let billed = 0; for (let k = 1; k <= n; k++) billed += 800 + 90 * k;
      stat.textContent = `Step ${n} of ${limit} allowed | context now about ${ctx} tokens | input tokens billed so far about ${billed} (illustrative: the whole context is resent each step)`;
      if (n === 0) take.textContent = 'What you just saw: nothing yet. Each lap of the loop adds one thought, one tool call and one observation.';
      else if (i === limit - 1 && limit < STEPS.length) take.textContent = `What you just saw: the step limit (${limit}) stopped the agent before it finished. The guardrail worked, but the task is incomplete.`;
      else if (i === STEPS.length - 1) take.textContent = 'What you just saw: the model, not the developer, chose every step, and it stopped itself when the goal was met.';
      else take.textContent = `What you just saw: ${PH[STEPS[i][0]]} step. The tool result goes back into context, so the next thought can build on it.`;
    }
    lim.addEventListener('input', () => { limit = +lim.value; limv.textContent = lim.value; pl.refresh(); });
    chk.addEventListener('change', () => { approval = chk.checked; pl.refresh(); });
    root.append(...head('🔁 Agent loop: order refund trace', 'Play or step through a scripted refund agent (illustrative trace). Lower the step limit or toggle approval to see guardrails.'),
      h('div', { class: 'wrow', style: 'gap:14px;align-items:flex-start;flex-wrap:wrap' }, diagram, trace),
      pl.el,
      h('div', { class: 'wrow', style: 'gap:12px;flex-wrap:wrap;align-items:center;font-size:13px' },
        h('label', null, 'Step limit: ', lim, ' ', limv),
        h('label', { class: 'cbx' }, chk, ' Require human approval for refunds')),
      stat, take);
    render(-1);
  };

  // ---------------------------------------------------------------------------------------------
  // 2. Tool calling sequence
  // ---------------------------------------------------------------------------------------------
  QAW.p5_toolcall = function (root) {
    const L = ['User', 'App (your code)', 'LLM', 'Tool / API'];
    const X = [70, 245, 430, 615];
    let bad = false;
    const good = [
      [0, 1, 'Where is my order #4521?', 'The user talks to your app, not to the model directly.', 'App'],
      [1, 2, 'messages + tool schemas', 'The request carries the conversation and JSON Schema descriptions of every tool.', 'App'],
      [2, 1, 'tool_use get_order_status {order_id:"4521"}', 'The model only EMITS a structured request. It runs nothing.', 'LLM'],
      [1, 1, 'validate args + permissions', 'Your code checks the arguments and decides whether to allow the call.', 'App'],
      [1, 3, "get_order_status('4521')", 'Your runtime executes the real function.', 'App'],
      [3, 1, '{status:"out for delivery"}', 'The tool returns a result to your code.', 'Tool'],
      [1, 2, 'tool_result appended, call again', 'The result is appended to the conversation and the model is called again.', 'App'],
      [2, 1, 'Your order is out for delivery.', 'With the observation in context, the model writes the final answer.', 'LLM'],
      [1, 0, 'Your order #4521 is out for delivery.', 'The app delivers the reply.', 'App']
    ];
    const badSeq = [
      good[0], good[1],
      [2, 1, 'tool_use get_order_status {order_id:""}', 'The model filled the argument badly (models can).', 'LLM'],
      [1, 1, 'validation FAILS: not executed', 'Server-side validation rejects the call, so nothing runs.', 'App'],
      [1, 2, 'tool_result is_error: order_id required', 'The error goes back as a result the model can recover from.', 'App'],
      [2, 1, 'tool_use get_order_status {order_id:"4521"}', 'The model retries with a corrected argument.', 'LLM'],
      good[4], good[5], good[6], good[7], good[8]
    ];
    const seq = () => (bad ? badSeq : good);
    const id = 'tc' + (++uid);
    const S = svg('svg', { viewBox: '0 0 700 450', style: SVGNS_STYLE, role: 'img', 'aria-label': 'Sequence diagram between user, app, LLM and tool showing that the model only emits a tool call and the app executes it' });
    const note = h('div', { class: 'apanel', 'aria-live': 'polite', style: 'font-size:13px;margin-top:6px' });
    const take = h('p', { class: 'wnote', style: 'font-weight:600' });
    const chk = h('input', { type: 'checkbox' });
    const pl = player(root, () => seq().length, render, 1200);
    function render(i) {
      const m = seq();
      S.replaceChildren(defsArrow(id, 'var(--tx)'));
      L.forEach((l, k) => {
        const hot = i >= 0 && m[i] && (m[i][0] === k || m[i][1] === k);
        S.append(svg('rect', { x: X[k] - 62, y: 6, width: 124, height: 28, rx: 7, style: `fill:${k === 2 ? PAL[0] : k === 1 ? PAL[1] : 'var(--bg3)'};stroke:var(--bd);stroke-width:${hot ? 2.5 : 1}` }),
          T(X[k], 20, l, { fs: 12, w: 700, fill: k === 2 || k === 1 ? '#fff' : 'var(--tx)' }),
          svg('line', { x1: X[k], y1: 34, x2: X[k], y2: 440, style: 'stroke:var(--bd);stroke-dasharray:4 4' }));
      });
      for (let k = 0; k <= i; k++) {
        const [a, b, lab] = m[k], y = 66 + k * 36, cur = k === i;
        const col = a === 2 ? PAL[0] : a === 1 || b === 1 ? PAL[1] : 'var(--tx)';
        const st = `stroke:${cur ? col : 'var(--tx2)'};stroke-width:${cur ? 2.8 : 1.4};fill:none;${a === 2 ? 'stroke-dasharray:0' : ''}`;
        if (a === b) {
          S.append(svg('path', { d: `M${X[a]},${y - 8} h38 v16 h-38`, 'marker-end': `url(#${id})`, style: st }), T(X[a] + 46, y, lab, { a: 'start', fs: 11, w: cur ? 700 : 400 }));
        } else {
          const dir = b > a ? 1 : -1;
          S.append(svg('line', { x1: X[a], y1: y, x2: X[b] - dir * 2, y2: y, 'marker-end': `url(#${id})`, style: st }),
            T((X[a] + X[b]) / 2, y - 10, lab, { fs: 11, w: cur ? 700 : 400, halo: true }));
        }
      }
      if (i < 0) { note.textContent = 'Press Play or Step. Four parties exchange messages; watch which one actually runs code.'; take.textContent = 'What you just saw: nothing yet.'; return; }
      const e = m[i];
      note.textContent = `Step ${i + 1}/${m.length} | Acting party: ${e[4]} | ${e[3]}`;
      if (i === m.length - 1) take.textContent = 'What you just saw: the LLM only produced text and JSON; your app validated and executed the function, then handed the result back.';
      else if (e[4] === 'LLM') take.textContent = 'What you just saw: the model writes a request as structured text. It cannot touch your database or the internet by itself.';
      else take.textContent = 'What you just saw: real work (validation, execution, delivery) happens in your code, which is where security checks belong.';
    }
    chk.addEventListener('change', () => { bad = chk.checked; pl.set(-1); });
    root.append(...head('🔧 Tool calling round-trip', 'Step through the message flow. Toggle the checkbox to see what happens when the model fills an argument wrongly.'),
      pl.el, h('label', { class: 'cbx', style: 'font-size:13px' }, chk, ' Model supplies a bad argument (validation demo)'), S, note, take);
    render(-1);
  };

  // ---------------------------------------------------------------------------------------------
  // 3. Multi-agent topology explorer
  // ---------------------------------------------------------------------------------------------
  QAW.p5_topology = function (root) {
    const ROLES = ['Researcher', 'Coder', 'Reviewer', 'Analyst', 'Writer', 'Critic'];
    const TOPO = ['Supervisor', 'Pipeline', 'Debate', 'Hierarchical', 'Handoff'];
    let topo = 0, n = 3;
    const W = 600, Hh = 270;
    const id = 'tp' + (++uid);
    const S = svg('svg', { viewBox: `0 0 ${W} ${Hh}`, style: SVGNS_STYLE, role: 'img', 'aria-label': 'Multi-agent topology diagram with animated messages' });
    const dot = svg('circle', { r: 6, style: 'fill:#ff9500;stroke:var(--tx);stroke-width:1.5' });
    const costBar = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('div'));
    const latBar = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('div'));
    const costTxt = h('span'), latTxt = h('span');
    const take = h('p', { class: 'wnote', style: 'font-weight:600' });
    const tabs = h('div', { class: 'wrow', role: 'tablist', 'aria-label': 'Topology', style: 'gap:6px;flex-wrap:wrap' });
    const sl = h('input', { type: 'range', min: 2, max: 6, value: 3, 'aria-label': 'Number of worker agents', class: 'wi', style: 'width:140px' });
    const slv = h('span', null, '3');
    let edges = [], pos = [];

    function layout() {
      pos = []; edges = [];
      const row = (cnt, y, pad) => Array.from({ length: cnt }, (_, k) => [pad + (W - 2 * pad) * (cnt === 1 ? 0.5 : k / (cnt - 1)), y]);
      const names = [];
      if (topo === 0) {
        pos.push([300, 45]); names.push('Supervisor');
        row(n, 205, 70).forEach((p, k) => { pos.push(p); names.push(ROLES[k]); });
        for (let k = 1; k <= n; k++) { edges.push([0, k, 0, 0.45]); edges.push([k, 0, 0.55, 1]); }
      } else if (topo === 1) {
        row(n, 135, 60).forEach((p, k) => { pos.push(p); names.push(ROLES[k]); });
        for (let k = 0; k < n - 1; k++) edges.push([k, k + 1, k / (n - 1), (k + 1) / (n - 1)]);
      } else if (topo === 2) {
        pos.push([300, 135]); names.push('Judge');
        for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + 2 * Math.PI * k / n; pos.push([300 + 200 * Math.cos(a), 135 + 100 * Math.sin(a)]); names.push(ROLES[k]); }
        for (let k = 1; k <= n; k++) { const nx = k % n + 1; edges.push([k, nx, 0, 0.35]); edges.push([nx, k, 0.35, 0.7]); edges.push([k, 0, 0.7, 1]); }
      } else if (topo === 3) {
        const gcount = Math.ceil(n / 2);
        pos.push([300, 30]); names.push('Lead');
        row(gcount, 120, 150).forEach((p, k) => { pos.push(p); names.push('Sub-lead ' + (k + 1)); });
        row(n, 225, 60).forEach((p, k) => { pos.push(p); names.push(ROLES[k]); });
        for (let k = 0; k < gcount; k++) { edges.push([0, 1 + k, 0, 0.25]); edges.push([1 + k, 0, 0.75, 1]); }
        for (let k = 0; k < n; k++) { const par = 1 + Math.floor(k / 2); edges.push([par, 1 + gcount + k, 0.25, 0.5]); edges.push([1 + gcount + k, par, 0.5, 0.75]); }
      } else {
        pos.push([300, 135]); names.push('Triage');
        for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + 2 * Math.PI * k / n; pos.push([300 + 220 * Math.cos(a), 135 + 100 * Math.sin(a)]); names.push(ROLES[k] + ' (specialist)'); }
        edges.push([0, 1, 0, 1 / n]);
        for (let k = 1; k < n; k++) edges.push([k, k + 1, k / n, (k + 1) / n]);
      }
      layout.names = names;
    }
    // illustrative cost model: 1.0 = one agent solving the same task alone (units of task-sized context)
    function model() {
      const g = Math.ceil(n / 2);
      return [
        [2 + 0.8 * n, 3], [n * 1.0, n], [2 * n + 1, 3], [2 + 1.5 * g + 0.8 * n, 5], [0.9 * n, n]
      ][topo];
    }
    const TAKE = [
      'Supervisor: workers run in parallel, so latency stays flat while token cost grows with every worker.',
      'Pipeline: each agent waits for the one before, so latency grows with length and a bad early output poisons the rest.',
      'Debate: agents critique each other for two rounds before a judge decides, which buys accuracy at the highest token price.',
      'Hierarchical: extra sub-leads help organise large jobs but add layers of overhead and delay.',
      'Handoff: control moves to whichever specialist should own the next step, so only one agent is active at a time.'
    ];
    function draw(t) {
      const dim = 'var(--bd)';
      S.replaceChildren(defsArrow(id, 'var(--tx2)'));
      edges.forEach(e => {
        const a = pos[e[0]], b = pos[e[1]];
        S.append(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'marker-end': `url(#${id})`, style: `stroke:${dim};stroke-width:1.5;${topo === 4 ? 'stroke-dasharray:5 3' : ''}` }));
      });
      pos.forEach((p, k) => {
        const nm = layout.names[k], w = Math.max(84, nm.length * 6.4 + 14), top = k === 0 && (topo === 0 || topo === 3 || topo === 2 || topo === 4);
        S.append(svg('rect', { x: p[0] - w / 2, y: p[1] - 15, width: w, height: 30, rx: 8, style: `fill:${top ? PAL[0] : 'var(--bg3)'};stroke:var(--bd);stroke-width:1.2;${top ? '' : 'stroke-dasharray:0'}` }),
          T(p[0], p[1], nm, { fs: 11, w: 600, fill: top ? '#fff' : 'var(--tx)' }));
      });
      const ph = (t * 0.25) % 1;
      let cur = null;
      edges.forEach(e => { if (ph >= e[2] && ph < e[3]) cur = e; });
      if (cur) {
        const q = (ph - cur[2]) / (cur[3] - cur[2]), a = pos[cur[0]], b = pos[cur[1]];
        dot.setAttribute('cx', a[0] + (b[0] - a[0]) * q); dot.setAttribute('cy', a[1] + (b[1] - a[1]) * q);
        S.append(dot);
      }
    }
    function update() {
      layout();
      const [c, d] = model();
      costBar.firstChild.style.width = Math.min(100, c / 14 * 100) + '%';
      latBar.firstChild.style.width = Math.min(100, d / 6 * 100) + '%';
      costTxt.textContent = `Token cost: about ${c.toFixed(1)}x a single agent`;
      latTxt.textContent = `Sequential depth: ${d} step${d > 1 ? 's' : ''}${topo === 0 || topo === 2 ? ' (workers in parallel)' : ''}`;
      take.textContent = 'What you just saw: ' + TAKE[topo] + ' Numbers are illustrative.';
      [...tabs.children].forEach((b, k) => { b.setAttribute('aria-selected', String(k === topo)); b.classList.toggle('p', k === topo); });
      draw(0);
    }
    TOPO.forEach((nm, k) => tabs.append(h('button', { type: 'button', class: 'btn', role: 'tab', onclick: () => { topo = k; update(); } }, nm)));
    sl.addEventListener('input', () => { n = +sl.value; slv.textContent = sl.value; update(); });
    root.append(...head('🕸️ Multi-agent topology explorer', 'Pick a topology and slide the worker count. The orange dot shows messages moving; bars show a toy cost and latency model (illustrative).'),
      tabs, h('div', { class: 'wrow', style: 'gap:10px;align-items:center;margin:8px 0;font-size:13px' }, h('label', null, 'Workers: ', sl, ' ', slv)),
      S,
      h('div', { style: 'font-size:13px' }, costTxt, costBar, latTxt, latBar,
        h('p', { class: 'wnote' }, 'Cost = tokens relative to one agent doing the whole task alone (1.0x). Rule of thumb: start with one agent, add more only when the task decomposes.')),
      take);
    update();
    const stopLoop = window.QAH.loop(root, t => draw(t));
    if (!stopLoop) return;
  };

  // ---------------------------------------------------------------------------------------------
  // 4. Memory stack and compaction
  // ---------------------------------------------------------------------------------------------
  QAW.p5_memory = function (root) {
    const SYS = 500, GOAL = 200;
    let cap = 8000, summary = 0, items = [], store = [], log = [], poolIdx = 0, query = 0;
    const POOL = [
      { t: 'User is vegetarian', tags: ['diet', 'food', 'vegetarian', 'eat'] },
      { t: 'Customer is on the Enterprise plan', tags: ['plan', 'tier', 'enterprise', 'billing'] },
      { t: 'Deploy target is AWS Mumbai', tags: ['deploy', 'region', 'aws', 'cloud'] },
      { t: 'Prefers short answers', tags: ['style', 'short', 'answer', 'format'] }
    ];
    const QUERIES = [
      { q: 'What should we cook for the user?', kw: ['diet', 'food', 'eat'] },
      { q: 'Which plan limits apply?', kw: ['plan', 'tier', 'billing'] },
      { q: 'Where do we deploy?', kw: ['deploy', 'region', 'cloud'] },
      { q: 'How should the reply look?', kw: ['style', 'answer', 'format'] }
    ];
    const bar = h('div', { role: 'img', 'aria-label': 'Context window usage', style: 'display:flex;height:34px;border:1px solid var(--bd);border-radius:8px;overflow:hidden;background:var(--bg3)' });
    const legend = h('div', { style: 'font-size:12px;margin:4px 0;color:var(--tx2)' });
    const status = h('div', { class: 'apanel', 'aria-live': 'polite', style: 'font-size:13px' });
    const logEl = h('ul', { style: 'margin:6px 0;padding-left:18px;font-size:12px;max-height:90px;overflow:auto' });
    const storeEl = h('div', { style: 'font-size:13px' });
    const scoreEl = h('div', { style: 'font-size:12px;overflow-x:auto' });
    const take = h('p', { class: 'wnote', style: 'font-weight:600' });
    const capSel = h('select', { class: 'wi', 'aria-label': 'Context window size' },
      [4000, 8000, 16000].map(v => h('option', { value: v, selected: v === 8000 ? 'selected' : null }, (v / 1000) + 'K tokens')));
    const qSel = h('select', { class: 'wi', 'aria-label': 'Question to recall memory for' }, QUERIES.map((q, k) => h('option', { value: k }, q.q)));
    const total = () => SYS + GOAL + summary + items.reduce((s, x) => s + x.tok, 0);
    const say = m => { log.unshift(m); log = log.slice(0, 6); };
    function fitWindow() {
      while (total() > cap) {
        const k = items.findIndex(x => x.kind !== 'recall') >= 0 ? items.findIndex(x => x.kind !== 'recall') : 0;
        if (!items.length) break;
        const d = items.splice(k, 1)[0];
        say(`Overflow: sliding window dropped the oldest ${d.kind} (${d.tok} tokens). The agent has forgotten it.`);
      }
    }
    function add(kind, tok, label) { items.push({ kind, tok, label }); fitWindow(); render(); }
    function compact() {
      const freed = items.filter(x => x.kind !== 'recall').reduce((s, x) => s + x.tok, 0);
      if (!freed) { say('Nothing to compact yet.'); render(); return; }
      summary = Math.min(1200, summary + 350);
      items = items.filter(x => x.kind === 'recall');
      say(`Compaction: ${freed} tokens of turns and tool output replaced by a running summary (summary now ${summary} tokens). Goal and system prompt stay pinned.`);
      render();
    }
    function write() {
      if (poolIdx >= POOL.length) { say('Long-term store: all sample facts already saved.'); render(); return; }
      const f = POOL[poolIdx++]; store.push({ ...f, age: store.length });
      say(`Write path: extracted "${f.t}", checked for duplicates, stored with embedding and timestamp.`);
      render();
    }
    function recall() {
      if (!store.length) { say('Read path: long-term store is empty, nothing to retrieve.'); render(); return; }
      const kw = QUERIES[query].kw;
      const rows = store.map((f, k) => {
        const sim = f.tags.filter(t => kw.includes(t)).length / kw.length;
        const rec = (k + 1) / store.length;
        return { f, sim, rec, score: 0.7 * sim + 0.3 * rec };
      }).sort((a, b) => b.score - a.score);
      const best = rows[0];
      scoreEl.replaceChildren(h('table', null, h('tr', null, ['Memory', 'Similarity', 'Recency', 'Score'].map(x => h('th', null, x))),
        rows.map(r => h('tr', { style: r === best && r.score > 0.5 ? 'font-weight:700' : '' }, h('td', null, r.f.t), h('td', null, r.sim.toFixed(2)), h('td', null, r.rec.toFixed(2)), h('td', null, r.score.toFixed(2))))),
        h('div', { class: 'wnote' }, 'Score = 0.7 x similarity + 0.3 x recency (toy weights, in the spirit of Generative Agents).'));
      if (best.score > 0.5) { items.push({ kind: 'recall', tok: 120, label: best.f.t }); say(`Read path: injected "${best.f.t}" into context (120 tokens). Only this memory is paid for.`); fitWindow(); }
      else say('Read path: no memory scored high enough, nothing injected.');
      render();
    }
    function clearAll() { summary = 0; items = []; store = []; log = []; poolIdx = 0; scoreEl.replaceChildren(); render(); }
    function render() {
      const tot = total(), pct = tot / cap * 100;
      const seg = (tok, color, letter, title) => h('div', { title, style: `flex:0 0 ${tok / cap * 100}%;background:${color};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;overflow:hidden;border-right:1px solid var(--bg)` }, letter);
      const col = { turn: PAL[4], tool: PAL[1], recall: PAL[2] };
      const ltr = { turn: 'U', tool: 'T', recall: 'M' };
      bar.replaceChildren(seg(SYS, '#6b6b7a', 'S', 'System prompt (pinned)'), seg(GOAL, PAL[0], 'G', 'Goal (pinned)'));
      if (summary) bar.append(seg(summary, PAL[5], 'Σ', 'Running summary'));
      items.forEach(x => bar.append(seg(x.tok, col[x.kind], ltr[x.kind], x.label || x.kind)));
      bar.setAttribute('aria-label', `Context window ${Math.round(pct)} percent full, ${tot} of ${cap} tokens`);
      legend.textContent = 'S system (pinned) | G goal (pinned) | Σ summary | U conversation turn | T tool result | M recalled long-term memory';
      status.textContent = `Context: ${tot} / ${cap} tokens (${Math.round(pct)}%). These ${tot} tokens are resent on every step.` + (pct > 75 ? ' Warning: nearly full, compact now or risk context rot and overflow.' : '');
      logEl.replaceChildren(...log.map(m => h('li', null, m)));
      storeEl.replaceChildren(h('b', null, 'Long-term store (outside the window): '), store.length ? h('ul', { style: 'margin:4px 0;padding-left:18px' }, store.map(f => h('li', null, f.t))) : h('span', { style: 'color:var(--tx2)' }, 'empty'));
      take.textContent = log.length && log[0].startsWith('Overflow') ? 'What you just saw: without compaction, the window silently forgets its oldest content, so the agent can lose track of what it did.'
        : summary && !items.length ? 'What you just saw: compaction trades detail for room. Pinned goal and system prompt survive; the rest becomes a summary.'
        : 'What you just saw: short-term memory is the context window (complete but token-priced); long-term memory is external and only the retrieved part enters the window.';
    }
    capSel.addEventListener('change', () => { cap = +capSel.value || 8000; fitWindow(); render(); });
    qSel.addEventListener('change', () => { query = +qSel.value || 0; });
    root.append(...head('🧠 Memory stack: window, compaction, long-term store', 'Fill the context window, compact it, then save a fact and recall it later. Token sizes are illustrative.'),
      h('div', { class: 'wrow', style: 'gap:8px;flex-wrap:wrap;align-items:center;font-size:13px' }, h('label', null, 'Window: ', capSel)),
      h('div', { class: 'wrow', style: 'gap:8px;flex-wrap:wrap;margin:8px 0' },
        btn('Add user turn (+700)', () => add('turn', 700, 'User and assistant turn')),
        btn('Add tool result (+1800)', () => add('tool', 1800, 'Raw tool output')),
        btn('Compact', compact, 'p'), btn('Reset', clearAll)),
      bar, legend, status, logEl,
      h('hr', { style: 'border:0;border-top:1px solid var(--bd);margin:8px 0' }),
      storeEl,
      h('div', { class: 'wrow', style: 'gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0;font-size:13px' },
        btn('Write next fact to long-term', write), h('label', null, 'Question: ', qSel), btn('Recall', recall, 'p')),
      scoreEl, take);
    render();
  };
})();
