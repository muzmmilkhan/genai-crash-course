// Tiny dependency-free 3D renderer (canvas). Drag to rotate; auto-rotates until touched.
(function () {
  function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; }

  function Scene(canvas, build, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let yaw = opts.yaw ?? 0.6, pitch = opts.pitch ?? 0.35, auto = true, drag = null, W = 0, H = 0, t = 0;
    const items = build();
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rot(p) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      let x = p[0] * cy - p[2] * sy, z = p[0] * sy + p[2] * cy, y = p[1] * cp - z * sp;
      z = p[1] * sp + z * cp; return [x, y, z];
    }
    function proj(p) {
      const r = rot(p), f = 520, k = f / (f + r[2] * 90 + 260);
      const sc = Math.min(W, H * 1.6) / 9;
      return { x: W / 2 + r[0] * sc * k * 1.6, y: H / 2 - r[1] * sc * k * 1.6, z: r[2], k };
    }
    function frame() {
      if (canvas.clientWidth && canvas.clientWidth !== W) resize();
      if (!canvas.clientWidth) { requestAnimationFrame(frame); return; }
      t += 0.016; if (auto) yaw += 0.004;
      ctx.clearRect(0, 0, W, H);
      const tx = css('--tx'), tx2 = css('--tx2');
      const draws = [];
      items.forEach(it => {
        if (it.type === 'line') {
          const a = proj(it.a), b = proj(it.b);
          draws.push({ z: (a.z + b.z) / 2 - 0.01, f: () => { ctx.globalAlpha = it.alpha ?? 0.35; ctx.strokeStyle = it.color || tx2; ctx.lineWidth = it.w || 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.globalAlpha = 1; } });
        } else if (it.type === 'pt') {
          const p = proj(it.p), pulse = it.pulse ? 1 + 0.25 * Math.sin(t * 4) : 1;
          const r = (it.r || 5) * p.k * 1.4 * pulse;
          draws.push({ z: p.z, f: () => {
            if (it.glow) { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3); g.addColorStop(0, it.color + '88'); g.addColorStop(1, it.color + '00'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, 7); ctx.fill(); }
            it.sx = p.x; it.sy = p.y; ctx.globalAlpha = (it.dim ? 0.3 : 1) * Math.max(0.35, Math.min(1, 0.55 + p.k * 0.5 - 0.3)); ctx.fillStyle = it.color; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
            if (it.label) { ctx.globalAlpha = it.dim ? 0.35 : 1; ctx.fillStyle = tx; ctx.font = (it.bold ? '600 ' : '') + Math.max(10, 12 * p.k * (it.fs || 1.2)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(it.label, p.x, p.y - r - 5); ctx.globalAlpha = 1; }
          } });
        } else if (it.type === 'text') {
          const p = proj(it.p);
          draws.push({ z: p.z, f: () => { ctx.fillStyle = it.color || tx2; ctx.font = (it.bold ? '600 ' : '') + '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(it.text, p.x, p.y); } });
        } else if (it.type === 'box') {
          const [cx, cy, cz] = it.c, [w, h, d] = it.s, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy, y1 = cy + h, z0 = cz - d / 2, z1 = cz + d / 2;
          const V = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
          const faces = [[0, 1, 2, 3, 0.7], [4, 5, 6, 7, 0.85], [0, 1, 5, 4, 0.55], [3, 2, 6, 7, 1.0], [0, 3, 7, 4, 0.65], [1, 2, 6, 5, 0.75]];
          faces.forEach(fc => {
            const pts = fc.slice(0, 4).map(i => proj(V[i])), z = pts.reduce((s, q) => s + q.z, 0) / 4;
            draws.push({ z, f: () => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.globalAlpha = 0.92; ctx.fillStyle = it.color; ctx.fill(); ctx.globalAlpha = fc[4] < 0.8 ? 0.25 : 0; ctx.fillStyle = '#000'; ctx.fill(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.6; ctx.stroke(); ctx.globalAlpha = 1; } });
          });
          if (it.label) { const p = proj([cx, y1 + 0.25, cz]); draws.push({ z: p.z - 5, f: () => { ctx.fillStyle = tx; ctx.font = '600 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(it.label, p.x, p.y); } }); }
        }
      });
      draws.sort((a, b) => b.z - a.z).forEach(d => d.f());
      requestAnimationFrame(frame);
    }
    let down = null;
    canvas.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; down = [e.clientX, e.clientY]; auto = false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; yaw += (e.clientX - drag[0]) * 0.008; pitch = Math.max(-1.3, Math.min(1.3, pitch + (e.clientY - drag[1]) * 0.008)); drag = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', e => {
      drag = null;
      if (opts.onPick && down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) {
        const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let best = null, bd = 24;
        items.forEach(it => { if (it.type === 'pt' && it.id != null && it.sx != null) { const d = Math.hypot(it.sx - mx, it.sy - my); if (d < bd) { bd = d; best = it; } } });
        opts.onPick(best);
      }
      down = null;
    });
    canvas.addEventListener('dblclick', () => { auto = true; });
    window.addEventListener('resize', resize); resize(); frame();
    return { items };
  }
  window.VizScene = Scene;

  const PAL = ['#007aff', '#ff9500', '#34c759', '#af52de', '#ff3b30', '#30b0c7'];

  const scenes = {
    // Words as points: similar meanings sit close together.
    embed() {
      const groups = [
        { c: [-3, 1.2, 0.5], col: PAL[0], name: 'Animals', w: ['cat', 'dog', 'horse', 'lion', 'wolf'] },
        { c: [3, 0.8, -1], col: PAL[1], name: 'Code', w: ['function', 'class', 'loop', 'variable', 'bug'] },
        { c: [0, -2.2, 2.2], col: PAL[2], name: 'Countries', w: ['France', 'Japan', 'Brazil', 'Kenya', 'Peru'] },
        { c: [0.5, 3, -2.2], col: PAL[3], name: 'Food', w: ['pizza', 'rice', 'bread', 'soup', 'pasta'] }
      ];
      const r = rng(7), out = [];
      groups.forEach(g => {
        out.push({ type: 'text', p: [g.c[0], g.c[1] + 1.5, g.c[2]], text: g.name.toUpperCase(), color: g.col, bold: true });
        g.w.forEach(w => {
          const p = [g.c[0] + (r() - .5) * 2.2, g.c[1] + (r() - .5) * 2.2, g.c[2] + (r() - .5) * 2.2];
          out.push({ type: 'line', a: g.c, b: p, color: g.col, alpha: .25 });
          out.push({ type: 'pt', p, r: 5, color: g.col, label: w });
        });
        out.push({ type: 'pt', p: g.c, r: 3, color: g.col, glow: true });
      });
      return out;
    },
    // An agent with tools orbiting it.
    agent() {
      const tools = ['Read files', 'Edit files', 'Run shell', 'Search code', 'Git', 'Browser', 'MCP server', 'Web fetch'];
      const out = [{ type: 'pt', p: [0, 0, 0], r: 14, color: '#5856D6', label: 'Agent (LLM)', glow: true, bold: true, fs: 1.1 }];
      tools.forEach((n, i) => {
        const a = i / tools.length * Math.PI * 2, y = Math.sin(i * 1.7) * 1.6, R = 3.6;
        const p = [Math.cos(a) * R, y, Math.sin(a) * R];
        out.push({ type: 'line', a: [0, 0, 0], b: p, color: PAL[i % 6], alpha: .5, w: 1.5 });
        out.push({ type: 'pt', p, r: 7, color: PAL[i % 6], label: n });
      });
      return out;
    },
    // Query vector retrieving nearest document chunks.
    rag() {
      const r = rng(21), topics = [[-3, 1, 0, PAL[0]], [3, 1.5, -1, PAL[1]], [0, -2, 2, PAL[2]], [0.5, 2.5, 2.5, PAL[3]]];
      const pts = []; topics.forEach(t => { for (let i = 0; i < 9; i++) pts.push({ p: [t[0] + (r() - .5) * 2.6, t[1] + (r() - .5) * 2.6, t[2] + (r() - .5) * 2.6], c: t[3] }); });
      const q = [-2.2, 0.4, 0.6];
      const d = pts.map(o => Math.hypot(o.p[0] - q[0], o.p[1] - q[1], o.p[2] - q[2]));
      const top = d.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(x => x[1]);
      const out = [];
      pts.forEach((o, i) => out.push({ type: 'pt', p: o.p, r: top.includes(i) ? 6 : 4, color: o.c, glow: top.includes(i), label: top.includes(i) ? 'chunk ' + (top.indexOf(i) + 1) : '' }));
      top.forEach(i => out.push({ type: 'line', a: q, b: pts[i].p, color: '#ff3b30', alpha: .9, w: 2 }));
      out.push({ type: 'pt', p: q, r: 9, color: '#ff3b30', label: 'Your question', pulse: true, glow: true, bold: true });
      out.push({ type: 'text', p: [0, -4, 0], text: 'Dots = document chunks (color = topic). Red lines = top-3 nearest to the query.' });
      return out;
    },
    // Illustrative relative cost: task difficulty x effort level.
    bars() {
      const tasks = ['Simple edit', 'Refactor', 'Hard bug'], eff = ['Low', 'Medium', 'High'];
      const val = [[1, 1.4, 2], [2, 3.2, 5], [2.6, 5, 9]]; // illustrative only
      const cols = [PAL[2], PAL[1], PAL[4]], out = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const h = val[i][j] * 0.55;
        out.push({ type: 'box', c: [(j - 1) * 2, 0, (i - 1) * 2], s: [1.4, h, 1.4], color: cols[j], label: val[i][j] + '×' });
      }
      tasks.forEach((n, i) => out.push({ type: 'text', p: [-4.2, 0, (i - 1) * 2], text: n, bold: true }));
      eff.forEach((n, j) => out.push({ type: 'text', p: [(j - 1) * 2, 0, 3.6], text: n + ' effort', color: cols[j], bold: true }));
      out.push({ type: 'text', p: [0, -1, 0], text: 'Illustrative relative token cost (not measured data)' });
      return out;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('canvas[data-viz]').forEach(c => { const s = scenes[c.dataset.viz]; if (s) Scene(c, s, { yaw: c.dataset.viz === 'bars' ? 0.7 : 0.6, pitch: c.dataset.viz === 'bars' ? 0.5 : 0.35 }); });
  });
})();
