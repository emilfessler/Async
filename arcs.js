// <async-arcs> — anneaux concentriques lumineux dessinés en canvas, animés.
// Attributs : speed (px/s, défaut 6), period (px, défaut 150), origin-x / origin-y (fractions, défaut 0.96 / -0.08)
(function () {
  if (customElements.get('async-arcs')) return;
  class AsyncArcs extends HTMLElement {
    connectedCallback() {
      this.style.display = 'block';
      if (!this.style.position) this.style.position = 'absolute';
      if (!this.style.inset) this.style.inset = '0';
      this.style.pointerEvents = 'none';
      if (!this.c) {
        const c = document.createElement('canvas');
        c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
        this.appendChild(c);
        this.c = c; this.ctx = c.getContext('2d');
        this.t0 = performance.now();
        this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      this.start();
    }
    disconnectedCallback() { this.stop(); }
    start() {
      if (this.running) return;
      this.running = true;
      const tick = (now) => {
        if (!this.running) return;
        try { this.frame(now); } catch (e) { /* ne jamais tuer la boucle */ }
        this.raf = requestAnimationFrame(tick);
      };
      try { this.frame(performance.now()); } catch (e) {}
      this.raf = requestAnimationFrame(tick);
      this.timer = setInterval(() => { if (this.running) try { this.frame(performance.now()); } catch (e) {} }, 250);
    }
    stop() { this.running = false; cancelAnimationFrame(this.raf); clearInterval(this.timer); }
    num(name, d) { const v = parseFloat(this.getAttribute(name)); return isNaN(v) ? d : v; }
    frame(now) {
      const r = this.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
      if (this.c.width !== W || this.c.height !== H) { this.c.width = W; this.c.height = H; }
      this.draw(now, W, H, dpr);
    }
    draw(now, W, H, dpr) {
      const ctx = this.ctx;
      const t = this.reduced ? 0 : (now - this.t0) / 1000;
      const P = this.num('period', 150) * dpr;
      const speed = this.num('speed', 6) * dpr;
      const cx = W * this.num('origin-x', 0.96), cy = H * this.num('origin-y', -0.08);
      const phase = (t * speed) % P;
      const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + P;
      const breathe = 1 + 0.035 * Math.sin(t * 0.21);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04060C'; ctx.fillRect(0, 0, W, H);
      for (let r0 = phase - P; r0 < maxR; r0 += P * breathe) {
        const r1 = r0 + P * breathe;
        const ri = Math.max(0, r0);
        const g = ctx.createRadialGradient(cx, cy, ri, cx, cy, r1);
        g.addColorStop(0.00, 'rgb(10,42,150)');
        g.addColorStop(0.30, 'rgb(20,78,212)');
        g.addColorStop(0.62, 'rgb(36,116,244)');
        g.addColorStop(0.86, 'rgb(74,148,255)');
        g.addColorStop(0.955, 'rgb(120,182,255)');
        g.addColorStop(0.975, 'rgb(232,242,255)');
        g.addColorStop(0.985, 'rgb(255,255,255)');
        g.addColorStop(0.993, 'rgb(150,196,255)');
        g.addColorStop(1.00, 'rgb(10,42,150)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.arc(cx, cy, ri, 0, Math.PI * 2, true); ctx.fill();
      }
      // flou progressif vers la gauche : copies floutées fondues par un masque diagonal
      const maxBlur = this.num('blur', 26) * dpr;
      if (maxBlur > 0) {
        if (!this.b1) { this.b1 = document.createElement('canvas'); this.b1x = this.b1.getContext('2d'); }
        const b = this.b1, bx = this.b1x;
        if (b.width !== W || b.height !== H) { b.width = W; b.height = H; }
        const layers = 3;
        for (let i = 1; i <= layers; i++) {
          const amount = (maxBlur * i) / layers;
          const from = 0.62 - 0.19 * (i - 1);
          const to = from - 0.24;
          bx.setTransform(1, 0, 0, 1, 0, 0);
          bx.globalCompositeOperation = 'source-over';
          bx.clearRect(0, 0, W, H);
          bx.filter = 'blur(' + amount.toFixed(1) + 'px)';
          bx.drawImage(this.c, 0, 0);
          bx.filter = 'none';
          bx.globalCompositeOperation = 'destination-in';
          const m = bx.createLinearGradient(W * to, H * (to * 0.5), W * from, H * (from * 0.5));
          m.addColorStop(0, 'rgba(0,0,0,1)');
          m.addColorStop(1, 'rgba(0,0,0,0)');
          bx.fillStyle = m; bx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(b, 0, 0);
        }
      }
      const gx = W * (0.68 + 0.02 * Math.sin(t * 0.17)), gy = H * 1.06, gr = W * (0.95 + 0.04 * Math.sin(t * 0.13));
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      glow.addColorStop(0.00, 'rgba(255,240,236,0.95)');
      glow.addColorStop(0.28, 'rgba(255,214,218,0.62)');
      glow.addColorStop(0.55, 'rgba(190,216,255,0.28)');
      glow.addColorStop(0.85, 'rgba(190,216,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      const sheen = ctx.createLinearGradient(0, H, W, 0);
      sheen.addColorStop(0, 'rgba(255,255,255,0.10)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.42);
      core.addColorStop(0, 'rgba(4,6,12,1)'); core.addColorStop(0.45, 'rgba(4,6,12,0.9)'); core.addColorStop(1, 'rgba(4,6,12,0)');
      ctx.fillStyle = core; ctx.fillRect(0, 0, W, H);
      const veil = ctx.createLinearGradient(0, 0, W, H * 0.18);
      veil.addColorStop(0.00, 'rgba(4,6,12,0.90)'); veil.addColorStop(0.28, 'rgba(4,6,12,0.72)');
      veil.addColorStop(0.50, 'rgba(4,6,12,0.30)'); veil.addColorStop(0.68, 'rgba(4,6,12,0.04)'); veil.addColorStop(0.82, 'rgba(4,6,12,0)');
      ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
      const edges = ctx.createLinearGradient(0, 0, 0, H);
      edges.addColorStop(0, 'rgba(4,6,12,0.45)'); edges.addColorStop(0.24, 'rgba(4,6,12,0)'); edges.addColorStop(0.72, 'rgba(4,6,12,0)'); edges.addColorStop(1, 'rgba(4,6,12,0.7)');
      ctx.fillStyle = edges; ctx.fillRect(0, 0, W, H);
      // désaturation globale
      const sat = this.num('saturation', 0.7);
      if (sat < 1) {
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'rgba(128,128,128,' + (1 - sat).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  }
  customElements.define('async-arcs', AsyncArcs);
})();
