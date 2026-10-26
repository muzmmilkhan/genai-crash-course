// Shared helpers for the GenAI Interview Q&A module. Phase files (qa-p1.js ... qa-p6.js) register widgets on window.QAW.
// Widget contract: window.QAW.<name> = function (root) { ... }  where root is the <div class="widget"> to fill.
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
  function svg(tag, props, ...kids) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(props || {}).forEach(([k, v]) => { if (v != null) el.setAttribute(k, v); });
    kids.flat().forEach(k => { if (k != null) el.append(k.nodeType ? k : document.createTextNode(k)); });
    return el;
  }
  // Read a theme variable (--tx, --tx2, --bg, --bg2, --bg3, --bd, --ac) so canvas drawing follows light/dark mode.
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // HiDPI canvas helper: returns {c, ctx, w, hgt}; call fit() again on resize.
  function canvas(w, hgt, label) {
    const c = h('canvas', { role: 'img', 'aria-label': label || 'chart', style: `width:100%;max-width:${w}px;height:${hgt}px;display:block` });
    const ctx = c.getContext('2d');
    const o = { c, ctx, w, hgt, fit() { const d = window.devicePixelRatio || 1, cw = c.clientWidth || w; o.w = cw; c.width = cw * d; c.height = hgt * d; ctx.setTransform(d, 0, 0, d, 0, 0); } };
    return o;
  }
  // Animation loop that pauses when the widget scrolls off screen and honours reduced motion (draw once).
  function loop(root, draw) {
    let raf = 0, vis = true, t0 = performance.now();
    const step = now => { if (!root.isConnected) return; if (vis) draw((now - t0) / 1000); raf = requestAnimationFrame(step); };
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(root);
    if (reduced()) draw(0); else raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }
  window.QAW = window.QAW || {};
  window.QAH = { h, svg, css, reduced, canvas, loop };
})();
