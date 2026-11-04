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


  // ---------- official tech logos (Devicon first, then Simple Icons, then a text badge) ----------
  const DV = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/';
  const ICON = {
    python: ['Python', 'python', 'python'], fastapi: ['FastAPI', 'fastapi', 'fastapi'], streamlit: ['Streamlit', 'streamlit', 'streamlit'], react: ['React', 'react', 'react'],
    figma: ['Figma', 'figma', 'figma'], github: ['GitHub', 'github', 'github'], linkedin: ['LinkedIn', 'linkedin', null],
    postgresql: ['PostgreSQL', 'postgresql', 'postgresql'], mysql: ['MySQL', 'mysql', 'mysql'], mongodb: ['MongoDB', 'mongodb', 'mongodb'], redis: ['Redis', 'redis', 'redis'],
    vectordb: ['Vector DB (Qdrant, Chroma, Pinecone)', null, 'qdrant'], qdrant: ['Qdrant', null, 'qdrant'],
    langchain: ['LangChain', null, 'langchain'], langgraph: ['LangGraph', null, 'langgraph'], llamaindex: ['LlamaIndex', null, null], autogen: ['AutoGen', null, null], n8n: ['n8n', null, 'n8n'],
    pytorch: ['PyTorch', 'pytorch', 'pytorch'], tensorflow: ['TensorFlow', 'tensorflow', 'tensorflow'], jax: ['JAX', null, null], huggingface: ['Hugging Face', null, 'huggingface'],
    docker: ['Docker', 'docker', 'docker'], kubernetes: ['Kubernetes', 'kubernetes', 'kubernetes'], githubactions: ['GitHub Actions', 'githubactions', 'githubactions'], mlflow: ['MLflow', null, 'mlflow'],
    story: ['Storytelling', null, null, '🎤'],
  };
  const srcs = k => { const [, d, si] = ICON[k] || []; return [...(d ? [`${DV}${d}/${d}-original.svg`, `${DV}${d}/${d}-plain.svg`] : []), ...(si ? [`https://cdn.simpleicons.org/${si}`] : [])]; };
  // Only logos confirmed on these CDNs are listed; the rest fall back to a text badge.
  // Walks the source list on each load error; calls fail() when every source is exhausted.
  function loadIcon(el, k, attr, fail) {
    const list = srcs(k); let i = 0;
    const next = () => { if (i < list.length) el.setAttribute(attr, list[i++]); else fail(); };
    el.addEventListener('error', next); next();
  }
  const mono = k => h('span', { class: 'mono', 'aria-hidden': 'true' }, (ICON[k] && ICON[k][3]) || ICON[k][0].replace(/[^A-Z0-9]/g, '').slice(0, 2) || ICON[k][0][0]);
  function chip(k) {
    const c = h('span', { class: 'ichip' });
    if (!srcs(k).length) c.append(mono(k));
    else { const img = h('img', { alt: '', width: '22', height: '22' }); c.append(img); loadIcon(img, k, 'src', () => img.replaceWith(mono(k))); }
    c.append(ICON[k][0]); return c;
  }
  document.querySelectorAll('.stackgrid[data-stack]').forEach(el => {
    JSON.parse(el.dataset.stack).forEach(([label, keys]) => el.append(h('div', { class: 'srow' }, h('b', {}, label), h('div', { class: 'ichips' }, keys.map(chip)))));
  });

  // ---------- career ladders ----------
  W.ladder = root => {
    const T = [['🔬 Researcher', '#af52de', ['Research Intern', 'Research Scientist', 'Principal Scientist']], ['🛠️ Engineer', '#007aff', ['Junior Engineer', 'SDE 1 / SDE 2', 'Lead Engineer', 'Architect']]];
    root.append(h('h4', {}, '🪜 Career paths'), ...T.map(([n, c, steps]) => h('div', { class: 'track', style: `--c:${c}` }, h('b', {}, n),
      steps.map((s, i) => h('span', { class: 'step', style: `background:color-mix(in srgb,${c} ${25 + i * 75 / (steps.length - 1)}%,var(--bg));color:${i >= steps.length / 2 ? '#fff' : 'var(--tx)'}` }, s)))),
      h('p', { class: 'wnote' }, 'Each step up adds scope: from executing tasks, to owning a system, to setting technical direction.'));
  };

  // ---------- how the GenAI stack fits together ----------
  const LANES = ['1 · PRODUCT', '2 · API & SECURITY', '3 · ORCHESTRATION', '4 · MODELS & DATA', '5 · DATA PIPELINE', '6 · OPS (packages, ships and watches every layer above)'];
  const SN = [
    { id: 'user', x: 40, y: 26, w: 170, t: 'User', sub: 'asks a question', e: '👤', c: '#8e8e93', who: 'E', d: 'The person the whole stack exists for. Every design choice should improve their answer, speed or trust.', q: 'Who is the user, and what metric tells you they are better off?' },
    { id: 'ui', x: 250, y: 26, w: 220, t: 'App UI', sub: 'Streamlit · React', i: ['streamlit', 'react'], c: '#ff6b00', who: 'E', d: 'The chat or app screen. Streamlit is the fastest way to demo, and React is common for production.', q: 'How do you stream tokens to the UI and show sources?' },
    { id: 'design', x: 510, y: 26, w: 190, t: 'Product design', sub: 'user flows · wireframes', i: ['figma'], c: '#af52de', who: 'E', d: 'User flows and wireframes decide what the AI should do before any code is written.', q: 'Walk me through the user flow of your project.' },
    { id: 'api', x: 250, y: 130, w: 220, t: 'API layer', sub: 'FastAPI · Python', i: ['fastapi', 'python'], c: '#009688', who: 'E', d: 'A Python FastAPI service exposes endpoints, validates input with Pydantic and calls the orchestration layer asynchronously.', q: 'Why FastAPI? How do you handle async calls, timeouts and retries?' },
    { id: 'guard', x: 720, y: 130, w: 120, h: 280, t: 'Security &\ngovernance', sub: 'auth · PII\nguardrails', e: '🔒', c: '#ff3b30', who: 'B', d: 'Authentication, role-based access, PII masking, prompt-injection guardrails and audit logs. It applies to every layer, not just one.', q: 'How do you stop sensitive data from leaking into prompts or logs?' },
    { id: 'orch', x: 40, y: 234, w: 640, t: 'Orchestration frameworks', sub: 'LangChain · LangGraph · LlamaIndex · AutoGen · n8n', i: ['langchain', 'langgraph', 'llamaindex', 'autogen', 'n8n'], c: '#5856D6', who: 'B', d: 'LangChain chains prompts and tools. LangGraph builds stateful agent graphs. LlamaIndex specialises in retrieval over your data. AutoGen runs multi-agent conversations. n8n wires workflows together with little code.', q: 'When would you pick LangGraph over a simple chain, or AutoGen over LangGraph?' },
    { id: 'llm', x: 40, y: 338, w: 200, t: 'Foundation models', sub: 'LLMs · multimodal · diffusion', i: ['huggingface', 'pytorch', 'tensorflow', 'jax'], c: '#ff9500', who: 'R', d: 'Pre-trained models, either called through an API or self-hosted from Hugging Face. Researchers build, fine-tune and benchmark them in PyTorch, TensorFlow or JAX.', q: 'Explain the architecture, benchmarks and training data of a model you used.' },
    { id: 'vdb', x: 260, y: 338, w: 200, t: 'Vector DB', sub: 'Qdrant · Chroma · Pinecone', i: ['qdrant'], e: '🧭', c: '#34c759', who: 'E', d: 'Stores embeddings so the app can retrieve the most relevant chunks by similarity. This is what grounds RAG answers in your data.', q: 'How do you choose chunk size, embedding model and top-k?' },
    { id: 'db', x: 480, y: 338, w: 200, t: 'SQL / NoSQL', sub: 'app data · chat history · cache', i: ['postgresql', 'mongodb', 'redis'], c: '#007aff', who: 'E', d: 'SQL for structured business data, NoSQL for chat history and documents, and Redis for caching repeated answers.', q: 'When do you use SQL, NoSQL or a vector DB, and can one database do all three?' },
    { id: 'src', x: 40, y: 442, w: 200, t: 'Data sources', sub: 'PDFs · APIs · databases', e: '📄', c: '#8e8e93', who: 'E', d: 'The raw knowledge: documents, wikis, tickets and APIs. Their quality caps your answer quality.', q: 'How do you handle messy PDFs, tables and frequently updated sources?' },
    { id: 'etl', x: 260, y: 442, w: 420, t: 'ETL & embedding pipeline', sub: 'extract · clean · chunk · embed · load', i: ['python', 'huggingface'], c: '#30b0c7', who: 'E', d: 'Python jobs that extract, clean and chunk source data, embed it with a model and load it into the vector DB and SQL/NoSQL stores on a schedule.', q: 'How do you re-index incrementally without duplicates?' },
    { id: 'cicd', x: 40, y: 546, w: 190, t: 'CI/CD', sub: 'GitHub Actions', i: ['githubactions', 'github'], c: '#6e6e73', who: 'E', d: 'Every push runs tests and evaluations, builds an image and deploys it automatically.', q: 'What runs in your pipeline before a prompt change reaches production?' },
    { id: 'docker', x: 250, y: 546, w: 190, t: 'Containers', sub: 'Docker', i: ['docker'], c: '#2496ed', who: 'E', d: 'Packages the API, workers and model servers with their dependencies so they run the same everywhere.', q: 'How do you keep a GPU model image small and fast to start?' },
    { id: 'k8s', x: 460, y: 546, w: 190, t: 'Scale & serve', sub: 'Kubernetes', i: ['kubernetes'], c: '#326ce5', who: 'E', d: 'Runs containers at scale: autoscaling, rolling deploys, GPU scheduling and self-healing.', q: 'How would you autoscale an inference service under spiky traffic?' },
    { id: 'llmops', x: 670, y: 546, w: 170, t: 'MLOps / LLMOps', sub: 'track · evaluate · monitor', i: ['mlflow'], c: '#34c759', who: 'B', d: 'Tracks experiments, model and prompt versions, evaluation scores, cost, latency and drift in production.', q: 'How do you know your app got worse after a model upgrade?' },
  ];
  const SE = [['user', 'ui'], ['design', 'ui'], ['ui', 'api'], ['api', 'guard'], ['api', 'orch'], ['orch', 'llm'], ['orch', 'vdb'], ['orch', 'db'], ['src', 'etl'], ['etl', 'vdb'], ['etl', 'db'], ['cicd', 'docker'], ['docker', 'k8s'], ['k8s', 'llmops']];
  const FLOWS = {
    '▶ Trace a request': [['user', 'A user asks a question in the app.'], ['ui', 'The UI sends it to the backend.'], ['api', 'FastAPI validates the request.'], ['guard', 'Auth, PII and guardrail checks run.'], ['orch', 'LangGraph or LangChain plans the steps.'], ['vdb', 'Relevant chunks are retrieved by similarity.'], ['llm', 'The model writes a grounded answer.'], ['ui', 'The answer streams back to the user.']],
    '▶ Trace ingestion': [['src', 'New documents arrive.'], ['etl', 'They are cleaned, chunked and embedded.'], ['vdb', 'Embeddings are loaded for retrieval.'], ['db', 'Metadata and records go to SQL/NoSQL.']],
    '▶ Trace a deploy': [['cicd', 'A push triggers tests and evaluations.'], ['docker', 'A container image is built.'], ['k8s', 'Kubernetes rolls it out and scales it.'], ['llmops', 'Quality, cost and latency are monitored.']],
  };
  const WHO = { R: 'Researcher', E: 'Engineer', B: 'Researcher and engineer' };
  W.stackmap = root => {
    const by = {}; SN.forEach(n => { n.h = n.h || 72; by[n.id] = n; });
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 860 632'); svg.setAttribute('class', 'archsvg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Layered GenAI tech stack diagram');
    let s = '<defs><marker id="amstack" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--tx2)"/></marker></defs>';
    LANES.forEach((l, i) => s += `<rect x="2" y="${8 + i * 104}" width="856" height="96" rx="14" fill="none" stroke="var(--bd)" stroke-dasharray="6 5"/><text x="14" y="${22 + i * 104}" class="lane">${l}</text>`);
    SE.forEach(([f, t]) => { const [x1, y1, x2, y2] = anchor(by[f], by[t]); s += `<line data-e="${f}-${t}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="edge" marker-end="url(#amstack)"/>`; });
    SN.forEach(n => {
      const cx = n.x + n.w / 2, cy = n.y + n.h / 2 - 27, keys = (n.i || []).filter(k => srcs(k).length), iw = keys.length * 30 - 6;
      const lines = n.t.split('\n');
      s += `<g class="anode" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.t.replace(/\n/g, ' ')}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" style="stroke:${n.c};fill:color-mix(in srgb,${n.c} 13%,var(--bg))"/>` +
        keys.map((k, j) => `<rect x="${cx - iw / 2 + j * 30 - 2}" y="${cy - 2}" width="28" height="28" rx="7" class="itile"/><image data-k="${k}" x="${cx - iw / 2 + j * 30 + 1}" y="${cy + 1}" width="22" height="22"><title>${ICON[k][0]}</title></image>`).join('') +
        `<text x="${cx}" y="${cy + 21}" class="emo" style="display:${keys.length ? 'none' : 'block'}">${n.e || ''}</text>` +
        lines.map((l, j) => `<text x="${cx}" y="${cy + 43 + j * 16}" class="t1">${l.replace(/&/g, '&amp;')}</text>`).join('') +
        n.sub.split('\n').map((l, j) => `<text x="${cx}" y="${cy + 43 + (lines.length + j) * 15}" class="t2">${l}</text>`).join('') + '</g>';
    });
    svg.innerHTML = s;
    svg.querySelectorAll('.anode').forEach(g => {
      const imgs = [...g.querySelectorAll('image')]; let left = imgs.length;
      imgs.forEach(img => loadIcon(img, img.dataset.k, 'href', () => { img.style.display = 'none'; img.previousElementSibling.style.display = 'none'; if (--left === 0) g.querySelector('.emo').style.display = 'block'; }));
    });
    const panel = h('div', { class: 'apanel' }), step = h('div', { class: 'astepnote' });
    let timer = null, role = 'all';
    function select(id, caption) {
      svg.querySelectorAll('.anode').forEach(g => g.classList.toggle('sel', g.dataset.id === id));
      const n = by[id];
      panel.replaceChildren(h('b', { style: `color:${n.c}` }, n.t.replace(/\n/g, ' '), ' · ', h('span', { style: 'color:var(--tx2);font-weight:500' }, n.sub.replace(/\n/g, ' · '))), h('p', {}, n.d), h('p', {}, h('b', {}, 'Owned by: '), WHO[n.who]), h('p', {}, h('b', {}, '🎯 Interview angle: '), n.q));
      step.textContent = caption || '';
      svg.querySelectorAll('.edge').forEach(e => e.classList.toggle('on', e.dataset.e.endsWith('-' + id) || e.dataset.e.startsWith(id + '-')));
    }
    function filter(r) {
      role = r; tabs.forEach(t => t.classList.toggle('on', t.dataset.r === r));
      svg.querySelectorAll('.anode').forEach(g => { const w = by[g.dataset.id].who; g.classList.toggle('dim', r !== 'all' && w !== r && w !== 'B'); });
    }
    svg.querySelectorAll('.anode').forEach(g => { g.addEventListener('click', () => { stop(); select(g.dataset.id); }); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop(); select(g.dataset.id); } }); });
    function stop() { clearInterval(timer); timer = null; btns.forEach(b => b.textContent = b.dataset.f); }
    const btns = Object.keys(FLOWS).map(f => { const b = h('button', { class: 'btn', type: 'button', 'data-f': f }, f); b.onclick = () => {
      const was = timer && b.textContent.startsWith('⏸'); stop(); if (was) return;
      const F = FLOWS[f]; let i = 0; b.textContent = '⏸ Pause';
      const tick = () => { const [id, cap] = F[i]; select(id, `Step ${i + 1}/${F.length}: ${cap}`); if (++i >= F.length) { clearInterval(timer); timer = null; b.textContent = f; } };
      tick(); timer = setInterval(tick, 1600);
    }; return b; });
    const tabs = [['all', 'Whole stack'], ['R', '🔬 Researcher focus'], ['E', '🛠️ Engineer focus']].map(([r, l]) => h('button', { class: 'tab', type: 'button', 'data-r': r, onclick: () => filter(r) }, l));
    root.append(h('h4', {}, '🧩 The GenAI stack, layer by layer'), h('div', { class: 'tabs' }, tabs), h('div', { class: 'wrow' }, btns), svg, step, panel,
      h('p', { class: 'wnote' }, 'Logos load from the Devicon and Simple Icons CDNs. If one cannot load, the box still shows its name.'));
    filter('all'); select('orch');
  };
  function anchor(a, b) {
    const ox1 = Math.max(a.x, b.x), ox2 = Math.min(a.x + a.w, b.x + b.w);
    if (ox1 < ox2) { const x = (ox1 + ox2) / 2; return b.y > a.y ? [x, a.y + a.h, x, b.y] : [x, a.y, x, b.y + b.h]; }
    const oy1 = Math.max(a.y, b.y), oy2 = Math.min(a.y + a.h, b.y + b.h);
    if (oy1 < oy2) { const y = (oy1 + oy2) / 2; return b.x > a.x ? [a.x + a.w, y, b.x, y] : [a.x, y, b.x + b.w, y]; }
    return [a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2];
  }

  document.querySelectorAll('.widget[data-widget]').forEach(el => { const f = W[el.dataset.widget]; if (f) f(el); });
})();
