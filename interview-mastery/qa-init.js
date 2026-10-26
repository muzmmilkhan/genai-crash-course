// Runs last: builds every widget placeholder, wires progress tracking for the question cards.
(function () {
  // Build each widget the first time it becomes visible, so canvases get a real width
  // (slides and closed question cards are display:none until opened).
  function build(el) {
    if (el.dataset.built) return; el.dataset.built = '1';
    const f = window.QAW && window.QAW[el.dataset.widget];
    if (!f) { console.warn('Missing widget:', el.dataset.widget); return; }
    try { f(el); } catch (err) { el.append('This visual failed to load.'); console.error(el.dataset.widget, err); }
  }
  const els = Array.from(document.querySelectorAll('.widget[data-widget]'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); build(e.target); } }), { rootMargin: '200px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(build);

  // question cards: remember which ones were practiced
  const cards = Array.from(document.querySelectorAll('details.qa'));
  const bar = document.getElementById('qaProgress');
  function update() {
    const n = cards.filter(c => c.querySelector('.practiced input').checked).length;
    if (bar) bar.textContent = n + ' of ' + cards.length + ' questions practiced';
  }
  cards.forEach(c => {
    const cb = c.querySelector('.practiced input'), k = 'qa:' + c.id;
    cb.checked = localStorage.getItem(k) === '1'; c.classList.toggle('done', cb.checked);
    cb.addEventListener('change', () => { localStorage.setItem(k, cb.checked ? '1' : '0'); c.classList.toggle('done', cb.checked); update(); });
  });
  update();
  const open = document.getElementById('qaToggleAll');
  if (open) open.addEventListener('click', () => { const all = cards.some(c => !c.open); cards.forEach(c => c.open = all); open.textContent = all ? 'Collapse all' : 'Expand all'; });
  // deep link: #q-p3q5 opens that card
  const m = location.hash.match(/^#(p\dq\d+)$/); if (m) { const c = document.getElementById(m[1]); if (c) { const sec = c.closest('section[data-slide]'); if (sec) { const i = Array.from(document.querySelectorAll('main section[data-slide]')).indexOf(sec); const a = document.querySelector(".side a[data-i='" + i + "']"); if (a) a.click(); } c.open = true; c.scrollIntoView(); } }
})();
