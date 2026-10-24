// Interactive widgets for the Interview and Portfolio Mastery course. Everything runs locally.
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    });
    kids.flat().forEach(k => { if (k != null) el.append(k.nodeType ? k : document.createTextNode(k)); });
    return el;
  }
  const W = {};

  // ---------- 30-second resume scan ----------
  const LINES = [
    ['Alex Morgan', false, 'Name and contact details are clear.'],
    ['Software person. Hardworking. Team player. Fast learner.', true, 'Vague tagline. Say what you do and the result you deliver.'],
    ['Skills: Python, Java, C++, Excel, Word, PowerPoint, HTML, Photoshop, SQL, Go, Rust, Perl, COBOL', true, 'A wall of unfocused skills. Tailor the list to the role.'],
    ['Built RAG assistant that cut support resolution time by 40% (12k users)', false, 'Outcome-driven with a metric. Keep this.'],
    ['Worked on various backend tasks', true, 'No outcome, no detail. Recruiters skip lines like this.'],
    ['Project 1: To-do app', true, 'A small, generic project. Too many of these dilute the strong ones.'],
    ['Project 2: Calculator', true, 'Another small project that adds noise.'],
    ['Project 3: Weather app', true, 'Tutorial-style projects show little. Cut it.'],
    ['Deployed LLM API on AWS with monitoring; p95 latency under 1.2 s', false, 'Concrete, recent and relevant. Keep this.'],
    ['Links: linkedin.com/in/alexm | github.com/alexm | alexm.dev', false, 'Profile links make it easy to verify you.'],
    ['Experience from 2009 to 2016 in detail, 4 pages in total', true, 'Old experience and length. Focus on the last 2 to 3 years, within 1 to 2 pages.'],
  ];
  W.scan30 = root => {
    let t = 30, timer = null, over = false;
    const flagged = new Set();
    const clock = h('div', { class: 'sampout' }, '30 s');
    const list = h('div', { class: 'hsents' });
    const out = h('div', { class: 'apanel', style: 'display:none' });
    const go = h('button', { class: 'btn p', type: 'button' }, 'Start the 30-second scan');
    const done = h('button', { class: 'btn', type: 'button', style: 'display:none' }, 'Show answers');
    LINES.forEach((l, i) => {
      const d = h('div', { class: 'hs', style: 'display:block', tabindex: '0', role: 'button', 'aria-pressed': 'false' }, l[0]);
      const tog = () => { if (!timer || over) return; flagged.has(i) ? flagged.delete(i) : flagged.add(i); d.classList.toggle('flag'); d.setAttribute('aria-pressed', String(flagged.has(i))); };
      d.addEventListener('click', tog);
      d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
      list.append(d);
    });
    list.style.filter = 'blur(6px)';
    function reveal() {
      clearInterval(timer); over = true; list.style.filter = ''; done.style.display = 'none'; clock.textContent = 'Time is up';
      let hit = 0, miss = 0, wrong = 0;
      out.style.display = 'block'; out.textContent = '';
      LINES.forEach((l, i) => {
        const f = flagged.has(i), bad = l[1];
        if (f && bad) hit++; else if (!f && bad) miss++; else if (f && !bad) wrong++;
        if (bad || f) out.append(h('p', {}, (bad ? (f ? '✅ ' : '⚠️ Missed: ') : '❌ Not a problem: ') + l[0] + ' - ' + l[2]));
      });
      out.prepend(h('p', { class: 'score' }, `Caught ${hit} of ${hit + miss} red flags` + (wrong ? `, ${wrong} false alarm${wrong > 1 ? 's' : ''}.` : '.')));
    }
    go.onclick = () => {
      t = 30; over = false; flagged.clear(); out.style.display = 'none';
      list.querySelectorAll('.hs').forEach(x => { x.classList.remove('flag'); x.setAttribute('aria-pressed', 'false'); });
      list.style.filter = ''; go.textContent = 'Restart'; done.style.display = ''; clock.textContent = t + ' s';
      clearInterval(timer);
      timer = setInterval(() => { t--; clock.textContent = t + ' s'; if (t <= 0) reveal(); }, 1000);
    };
    done.onclick = reveal;
    root.append(h('h4', {}, '⏱️ The 30-second resume scan'), h('p', { class: 'wnote' }, 'Click every line that would make a recruiter stop reading. Press start when ready.'), h('div', { class: 'wrow' }, go, done, clock), list, out);
  };

  // ---------- resume scorecard ----------
  const CRITERIA = [
    'One page (two at most)', 'One-line tagline that states my expertise', 'Only my strongest few projects are listed',
    'Bullets lead with outcomes and metrics', 'Experience focuses on the last 2 to 3 years', 'Skills are tailored to the target role',
    'Education and certifications are included', 'Links to LinkedIn, GitHub and website are at the top',
  ];
  W.scorecard = root => {
    const meter = h('div', { class: 'meter' }, h('div'));
    const msg = h('p', { class: 'score' });
    const boxes = CRITERIA.map(c => h('label', { class: 'cbx' }, h('input', { type: 'checkbox', onchange: upd }), c));
    function upd() {
      const n = boxes.filter(b => b.firstChild.checked).length, f = n / CRITERIA.length, bar = meter.firstChild;
      bar.style.width = (f * 100) + '%'; bar.style.background = f < .5 ? '#ff3b30' : f < .85 ? '#ff9500' : '#34c759';
      msg.textContent = `${n} / ${CRITERIA.length} - ` + (f < .5 ? 'Needs work before you apply.' : f < .85 ? 'Getting there. Fix the unchecked items.' : 'Strong. Now tailor it per role.');
    }
    root.append(h('h4', {}, '📋 Resume scorecard'), h('div', { class: 'cbxs' }, boxes), meter, msg);
    upd();
  };

  // ---------- A/B test tracker ----------
  W.abtest = root => {
    const rows = [['Technical lead', 20, 3], ['Architect', 20, 5], ['Manager', 20, 1]].map(([n, a, c]) => ({ n, a, c }));
    const body = h('div');
    const msg = h('p', { class: 'score' });
    function draw() {
      body.textContent = '';
      const rates = rows.map(r => r.a > 0 ? r.c / r.a : 0), best = Math.max(...rates);
      rows.forEach((r, i) => {
        const num = (k, label) => h('label', {}, label + ' ', h('input', { class: 'wi', style: 'width:80px;display:inline-block;margin:0 8px 0 0', type: 'number', min: '0', value: r[k], oninput: e => { r[k] = Math.max(0, +e.target.value || 0); sum(); } }));
        const row = h('div', { class: 'brow' + (rates[i] === best && best > 0 ? ' top' : '') }, h('span', { class: 'bl wide' }, r.n), num('a', 'Sent'), num('c', 'Calls'), h('span', { class: 'bt' }, h('span', { class: 'bf', style: `display:block;width:${best ? rates[i] / best * 100 : 0}%;background:#ff6b00` })), h('span', { class: 'bp' }, (rates[i] * 100).toFixed(0) + '%'));
        row.dataset.i = i; body.append(row);
      });
      sum();
    }
    function sum() {
      rows.forEach((r, i) => { const p = body.children[i] && body.children[i].querySelector('.bp'); if (p) p.textContent = (r.a ? r.c / r.a * 100 : 0).toFixed(0) + '%'; });
      const small = rows.some(r => r.a < 15), best = rows.reduce((a, b) => (b.a && b.c / b.a > (a.a ? a.c / a.a : -1)) ? b : a, rows[0]);
      msg.textContent = (best.a ? `Leading version: ${best.n}. ` : '') + (small ? 'Sample is still small (under 15 applications per version), so treat this as a hint, not proof.' : 'Enough applications per version to start trusting the pattern.');
    }
    root.append(h('h4', {}, '🧪 Resume A/B tracker'), h('p', { class: 'wnote' }, 'Edit the numbers to log applications sent and interview calls per resume version.'), body, msg);
    draw();
  };

  document.querySelectorAll('.widget[data-widget]').forEach(el => { const f = W[el.dataset.widget]; if (f) f(el); });
})();
