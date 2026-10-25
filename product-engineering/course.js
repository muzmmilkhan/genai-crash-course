// Interactive widgets for the AI Product Engineering course. Everything runs locally.
(function () {
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

  // ---------- stack picker ----------
  const STACKS = {
    'AI document assistant (RAG)': [['Version control', 'GitHub'], ['Database', 'Supabase (Postgres) for users'], ['Vector database', 'ChromaDB to prototype, Pinecone to scale'], ['Caching', 'Redis for repeated questions'], ['File storage', 'S3 for uploaded documents'], ['Authentication', 'Auth0 or Firebase Auth'], ['Security', 'Rate limiting on every model call'], ['Monitoring', 'Grafana with token cost metrics']],
    'Subscription SaaS': [['Version control', 'GitHub with Actions'], ['Database', 'NeonDB or Supabase'], ['Authentication', 'Auth0 or Firebase Auth'], ['Payments', 'Stripe, or Razorpay for India'], ['Notifications', 'SendGrid for receipts and resets'], ['CDN', 'Cloudflare'], ['Environment', 'Platform env vars, then Vault'], ['Monitoring', 'Prometheus and Grafana']],
    'Video or media platform': [['File storage', 'S3, Azure Blob or GCS'], ['CDN', 'CloudFront or Cloudflare (essential)'], ['Database', 'Postgres for metadata'], ['Caching', 'Redis for hot listings'], ['Authentication', 'Firebase Auth'], ['Notifications', 'Push through Firebase'], ['Monitoring', 'ELK stack for logs']],
    'Mobile app with alerts': [['Authentication', 'Firebase Auth'], ['Database', 'MongoDB Atlas or Firestore'], ['Notifications', 'Firebase push, Twilio or Exotel for SMS'], ['File storage', 'GCS or S3 for images'], ['Security', 'Rate limiting and HTTPS'], ['Monitoring', 'Grafana dashboards']],
  };
  W.stackpicker = root => {
    const out = h('div', { class: 'apanel' });
    const sel = h('select', { class: 'wi', 'aria-label': 'Product type', onchange: draw }, Object.keys(STACKS).map(k => h('option', { value: k }, k)));
    function draw() {
      out.textContent = '';
      out.append(h('table', {}, h('tr', {}, h('th', {}, 'Component'), h('th', {}, 'Starter choice')),
        STACKS[sel.value].map(([c, t]) => h('tr', {}, h('td', {}, c), h('td', {}, t)))));
    }
    root.append(h('h4', {}, '🧩 Stack picker'), h('label', {}, 'Product type: ', sel), out);
    draw();
  };

  // ---------- lifecycle ordering ----------
  const STEPS = ['BRD', 'PRD', 'HLD', 'LLD', 'Sprint planning', 'Wireframes', 'Coding', 'Testing', 'Fixing', 'Deployment'];
  W.sdlcorder = root => {
    let items = STEPS.map((s, i) => ({ s, i }));
    for (let k = items.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [items[k], items[j]] = [items[j], items[k]]; }
    const list = h('div'), msg = h('p', { class: 'score', 'aria-live': 'polite' });
    function move(k, d) { const t = k + d; if (t < 0 || t >= items.length) return; [items[k], items[t]] = [items[t], items[k]]; msg.textContent = ''; draw(); }
    function draw(show) {
      list.textContent = '';
      items.forEach((it, k) => list.append(h('div', { class: 'brow' + (show ? (it.i === k ? ' top' : '') : '') },
        h('span', { class: 'bl' }, (k + 1) + '. ' + it.s),
        h('button', { class: 'btn', type: 'button', 'aria-label': 'Move ' + it.s + ' up', onclick: () => move(k, -1) }, '↑'),
        h('button', { class: 'btn', type: 'button', 'aria-label': 'Move ' + it.s + ' down', onclick: () => move(k, 1) }, '↓'),
        show ? h('span', {}, it.i === k ? ' ✅' : ' ❌') : null)));
    }
    const check = h('button', { class: 'btn p', type: 'button', onclick: () => { const n = items.filter((it, k) => it.i === k).length; msg.textContent = n === items.length ? 'Perfect order.' : `${n} of ${items.length} in the right place. Adjust and check again.`; draw(true); } }, 'Check order');
    root.append(h('h4', {}, '🔢 Order the lifecycle'), list, h('div', { class: 'wrow' }, check), msg);
    draw();
  };

  document.querySelectorAll('.widget[data-widget]').forEach(el => { const f = W[el.dataset.widget]; if (f) f(el); });
})();
