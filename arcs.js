// <async-arcs> — dégradé concentrique Async dessiné en canvas.
(function () {
  if (customElements.get('async-arcs')) return;

  class AsyncArcs extends HTMLElement {
    connectedCallback() {
      this.style.display = 'block';
      if (!this.style.position) this.style.position = 'absolute';
      if (!this.style.inset) this.style.inset = '0';
      this.style.pointerEvents = 'none';
      if (!this.c) {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
        this.appendChild(canvas);
        this.c = canvas;
        this.ctx = canvas.getContext('2d');
        this.t0 = performance.now();
        this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.makeGrain();
      }
      this.start();
    }

    disconnectedCallback() { this.stop(); }
    num(name, fallback) {
      const value = parseFloat(this.getAttribute(name));
      return Number.isNaN(value) ? fallback : value;
    }
    start() {
      if (this.running) return;
      this.running = true;
      const tick = (now) => {
        if (!this.running) return;
        try { this.frame(now); } catch (error) { /* conserver le fond en cas de frame perdue */ }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
    makeGrain() {
      const size = 96;
      const grain = document.createElement('canvas');
      grain.width = size; grain.height = size;
      const context = grain.getContext('2d');
      const pixels = context.createImageData(size, size);
      let seed = 8731;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let index = 0; index < pixels.data.length; index += 4) {
        const value = Math.round(96 + random() * 96);
        pixels.data[index] = value;
        pixels.data[index + 1] = value;
        pixels.data[index + 2] = value;
        pixels.data[index + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      this.grain = grain;
    }
    frame(now) {
      const bounds = this.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * dpr);
      const height = Math.round(bounds.height * dpr);
      if (this.c.width !== width || this.c.height !== height) {
        this.c.width = width;
        this.c.height = height;
        this.grainPattern = null;
      }
      this.draw(now, width, height, dpr);
    }
    draw(now, width, height, dpr) {
      const ctx = this.ctx;
      const time = this.reduced ? 0 : (now - this.t0) / 1000;
      const period = this.num('period', 150) * dpr;
      const speed = this.num('speed', 6) * dpr;
      const centerX = width * this.num('origin-x', 0.96);
      const centerY = height * this.num('origin-y', -0.08);
      const phase = (time * speed) % period;
      const maxRadius = Math.hypot(Math.max(centerX, width - centerX), Math.max(centerY, height - centerY)) + period;
      const breathe = 1 + 0.035 * Math.sin(time * 0.21);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#04060C';
      ctx.fillRect(0, 0, width, height);
      for (let radius = phase - period; radius < maxRadius; radius += period * breathe) {
        const outer = radius + period * breathe;
        const inner = Math.max(0, radius);
        const gradient = ctx.createRadialGradient(centerX, centerY, inner, centerX, centerY, outer);
        gradient.addColorStop(0.00, 'rgb(10,42,150)');
        gradient.addColorStop(0.30, 'rgb(20,78,212)');
        gradient.addColorStop(0.62, 'rgb(36,116,244)');
        gradient.addColorStop(0.86, 'rgb(74,148,255)');
        gradient.addColorStop(0.955, 'rgb(120,182,255)');
        gradient.addColorStop(0.975, 'rgb(232,242,255)');
        gradient.addColorStop(0.985, 'rgb(255,255,255)');
        gradient.addColorStop(0.993, 'rgb(150,196,255)');
        gradient.addColorStop(1.00, 'rgb(10,42,150)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outer, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, inner, 0, Math.PI * 2, true);
        ctx.fill();
      }

      const maxBlur = this.num('blur', 26) * dpr;
      if (maxBlur > 0) {
        if (!this.blurCanvas) {
          this.blurCanvas = document.createElement('canvas');
          this.blurContext = this.blurCanvas.getContext('2d');
        }
        const blur = this.blurCanvas;
        const bx = this.blurContext;
        if (blur.width !== width || blur.height !== height) {
          blur.width = width; blur.height = height;
        }
        for (let layer = 1; layer <= 3; layer++) {
          const amount = maxBlur * layer / 3;
          const from = 0.62 - 0.19 * (layer - 1);
          const to = from - 0.24;
          bx.setTransform(1, 0, 0, 1, 0, 0);
          bx.globalCompositeOperation = 'source-over';
          bx.clearRect(0, 0, width, height);
          bx.filter = 'blur(' + amount.toFixed(1) + 'px)';
          bx.drawImage(this.c, 0, 0);
          bx.filter = 'none';
          bx.globalCompositeOperation = 'destination-in';
          const mask = bx.createLinearGradient(width * to, height * to * 0.5, width * from, height * from * 0.5);
          mask.addColorStop(0, 'rgba(0,0,0,1)');
          mask.addColorStop(1, 'rgba(0,0,0,0)');
          bx.fillStyle = mask;
          bx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(blur, 0, 0);
        }
      }

      const glowX = width * (0.68 + 0.02 * Math.sin(time * 0.17));
      const glowY = height * 1.06;
      const glowRadius = width * (0.95 + 0.04 * Math.sin(time * 0.13));
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
      glow.addColorStop(0.00, 'rgba(255,240,236,0.95)');
      glow.addColorStop(0.28, 'rgba(255,214,218,0.62)');
      glow.addColorStop(0.55, 'rgba(190,216,255,0.28)');
      glow.addColorStop(0.85, 'rgba(190,216,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'source-over';
      const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.42);
      core.addColorStop(0, 'rgba(4,6,12,1)');
      core.addColorStop(0.45, 'rgba(4,6,12,0.9)');
      core.addColorStop(1, 'rgba(4,6,12,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, width, height);
      const veil = ctx.createLinearGradient(0, 0, width, height * 0.18);
      veil.addColorStop(0.00, 'rgba(4,6,12,0.90)');
      veil.addColorStop(0.28, 'rgba(4,6,12,0.72)');
      veil.addColorStop(0.50, 'rgba(4,6,12,0.30)');
      veil.addColorStop(0.68, 'rgba(4,6,12,0.04)');
      veil.addColorStop(0.82, 'rgba(4,6,12,0)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);
      const edges = ctx.createLinearGradient(0, 0, 0, height);
      edges.addColorStop(0, 'rgba(4,6,12,0.45)');
      edges.addColorStop(0.24, 'rgba(4,6,12,0)');
      edges.addColorStop(0.72, 'rgba(4,6,12,0)');
      edges.addColorStop(1, 'rgba(4,6,12,0.7)');
      ctx.fillStyle = edges;
      ctx.fillRect(0, 0, width, height);

      const saturation = this.num('saturation', 0.7);
      if (saturation < 1) {
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'rgba(128,128,128,' + (1 - saturation).toFixed(3) + ')';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(4,6,12,0.065)';
      ctx.fillRect(0, 0, width, height);
      this.drawGrain(ctx, time, width, height);
    }
    drawGrain(ctx, time, width, height) {
      if (!this.grain) return;
      ctx.save();
      const step = Math.floor(time * 8);
      ctx.translate(-((step * 17) % 96), -((step * 29) % 96));
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = this.num('grain', 0.038);
      if (!this.grainPattern) this.grainPattern = ctx.createPattern(this.grain, 'repeat');
      ctx.fillStyle = this.grainPattern;
      ctx.fillRect(0, 0, width + 96, height + 96);
      ctx.restore();
    }
  }

  customElements.define('async-arcs', AsyncArcs);
})();
