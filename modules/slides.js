// Slide view, copy buttons, checklists and mini quizzes for module pages.
(function () {
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const page = document.body.dataset.page;

  // copy buttons
  $$('pre').forEach(pre => {
    const b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.textContent = 'Copy';
    b.onclick = () => { navigator.clipboard.writeText(pre.innerText.replace(/Copy$/, '').trim()).then(() => { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1200); }); };
    pre.appendChild(b);
  });

  // checklists persisted per page
  $$('ul.tasks input').forEach((cb, i) => {
    const k = 'task:' + page + ':' + i;
    cb.checked = localStorage.getItem(k) === '1'; cb.closest('li').classList.toggle('done', cb.checked);
    cb.onchange = () => { localStorage.setItem(k, cb.checked ? '1' : '0'); cb.closest('li').classList.toggle('done', cb.checked); };
  });

  // mini quizzes
  $$('.mq').forEach(box => {
    const data = JSON.parse(box.dataset.quiz); let score = 0, done = 0;
    const result = document.createElement('p'); result.className = 'score';
    data.forEach(q => {
      const w = document.createElement('div'); w.className = 'qq';
      const h = document.createElement('h3'); h.textContent = q.q; w.appendChild(h);
      const ex = document.createElement('p'); ex.className = 'exp'; ex.style.display = 'none'; ex.textContent = q.e;
      q.o.forEach((t, i) => {
        const b = document.createElement('button'); b.className = 'opt'; b.type = 'button'; b.textContent = t;
        b.onclick = () => {
          $$('.opt', w).forEach((x, j) => { x.disabled = true; if (j === q.c) x.classList.add('ok'); else if (j === i) x.classList.add('no'); });
          ex.style.display = 'block'; done++; if (i === q.c) score++;
          if (done === data.length) result.textContent = 'Score: ' + score + ' / ' + data.length;
        };
        w.appendChild(b);
      });
      w.appendChild(ex); box.appendChild(w);
    });
    box.appendChild(result);
  });

  // slide view
  const slides = $$('main section[data-slide]');
  if (!slides.length) return;
  const toggle = $('#viewToggle'), links = $$('.side a[data-i]'), pager = $('#pager');
  let idx = 0, on = (localStorage.getItem('cc-view') || 'slides') === 'slides';

  function show(i, push) {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, j) => s.classList.toggle('cur', j === idx));
    links.forEach((a, j) => a.classList.toggle('active', j === idx));
    $('#slideCount').textContent = (idx + 1) + ' / ' + slides.length;
    $('#progressBar').style.width = ((idx + 1) / slides.length * 100) + '%';
    $('#prevSlide').disabled = idx === 0; $('#nextSlide').disabled = idx === slides.length - 1;
    pager.classList.toggle('show', idx === slides.length - 1);
    if (push) history.replaceState(null, '', '#s' + idx);
    window.scrollTo(0, 0);
  }
  function apply() {
    document.body.classList.toggle('slides', on);
    toggle.textContent = on ? '☰ Scroll view' : '▦ Slide view';
    if (on) show(idx, true);
  }
  toggle.onclick = () => { on = !on; localStorage.setItem('cc-view', on ? 'slides' : 'scroll'); apply(); };
  $('#prevSlide').onclick = () => show(idx - 1, true);
  $('#nextSlide').onclick = () => show(idx + 1, true);
  links.forEach((a, j) => a.addEventListener('click', e => { if (on) { e.preventDefault(); show(j, true); } }));
  document.addEventListener('keydown', e => {
    if (!on || e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') show(idx + 1, true);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(idx - 1, true);
  });
  const m = location.hash.match(/^#s(\d+)$/); if (m) idx = +m[1];
  window.addEventListener('hashchange', () => { const h = location.hash.match(/^#s(\d+)$/); if (h && on) show(+h[1]); });
  apply();
})();
