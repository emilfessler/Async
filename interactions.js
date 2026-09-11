(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.querySelector('body > section > div > div') || document.querySelector('body > div');
  if (!root) return;

  document.body.classList.add('motion-page');

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const sections = [...root.children].filter((element) => element instanceof HTMLElement);
  const hero = sections[1];

  const reveal = (element, delay = 0, direction = 'up') => {
    if (!(element instanceof HTMLElement)) return;
    element.classList.add('motion-reveal', `motion-${direction}`);
    element.style.setProperty('--motion-delay', `${Math.min(delay, 420)}ms`);
  };

  if (sections[0]) {
    sections[0].classList.add('motion-intro', 'motion-intro-bar');
  }

  if (hero) {
    hero.classList.add('motion-hero');
    const heroParts = [...hero.children].filter((element) => element instanceof HTMLElement);
    const nav = heroParts.find((element) => element.querySelector('a img[alt="Async IT"]'));
    const canvas = hero.querySelector('async-arcs');
    const heroCopy = heroParts.find((element) => element.querySelector('h1'));
    const stats = heroParts.find((element) => {
      const text = element.textContent || '';
      return /Postes supervisés|Réponse moyenne|Hébergement suisse/.test(text);
    });

    if (nav) nav.classList.add('motion-intro', 'motion-intro-nav');
    if (heroCopy) {
      [...heroCopy.children].forEach((element, index) => {
        if (element instanceof HTMLElement) {
          element.classList.add('motion-intro', 'motion-intro-copy');
          element.style.setProperty('--intro-delay', `${160 + index * 95}ms`);
        }
      });
    }
    if (stats) {
      [...stats.children].forEach((element, index) => {
        if (element instanceof HTMLElement) {
          element.classList.add('motion-intro', 'motion-intro-stat');
          element.style.setProperty('--intro-delay', `${470 + index * 75}ms`);
        }
      });
    }

    if (canvas instanceof HTMLElement && !reducedMotion) {
      canvas.classList.add('motion-arcs');
      let pointerX = 0;
      let pointerY = 0;
      let currentX = 0;
      let currentY = 0;
      let scrollY = 0;
      let raf = 0;

      const renderParallax = () => {
        currentX += (pointerX - currentX) * 0.055;
        currentY += (pointerY - currentY) * 0.055;
        canvas.style.transform = `translate3d(${currentX}px, ${currentY + scrollY}px, 0) scale(1.08)`;
        raf = requestAnimationFrame(renderParallax);
      };

      hero.addEventListener('pointermove', (event) => {
        const bounds = hero.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
      }, { passive: true });

      hero.addEventListener('pointerleave', () => {
        pointerX = 0;
        pointerY = 0;
      }, { passive: true });

      const updateHeroScroll = () => {
        const bounds = hero.getBoundingClientRect();
        scrollY = Math.max(-22, Math.min(22, -bounds.top * 0.035));
      };
      window.addEventListener('scroll', updateHeroScroll, { passive: true });
      updateHeroScroll();
      raf = requestAnimationFrame(renderParallax);
      window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
    }
  }

  sections.slice(2).forEach((section, sectionIndex) => {
    const children = [...section.children].filter((element) => element instanceof HTMLElement);
    const style = section.getAttribute('style') || '';
    const isLightSurface = /background:\s*#(?:F3F4F1|F4F7FB|FFFFFF)/i.test(style);

    if (isLightSurface) {
      section.classList.add('motion-static-surface');
      children.slice(0, 8).forEach((element, index) => {
        reveal(element, Math.min(index * 70, 350), 'up');
      });
    } else {
      reveal(section, 0, sectionIndex % 3 === 1 ? 'left' : sectionIndex % 3 === 2 ? 'right' : 'up');
      children.slice(0, 8).forEach((element, index) => {
        element.classList.add('motion-reveal-child');
        element.style.setProperty('--child-delay', `${Math.min(index * 70, 350)}ms`);
      });
    }
  });

  document.querySelectorAll('a[style*="border-radius"]').forEach((element) => {
    element.classList.add('motion-button');
  });

  document.querySelectorAll('article, div[style*="border-radius: 16px"], div[style*="border-radius: 14px"]').forEach((element) => {
    const style = element.getAttribute('style') || '';
    const isWhiteCard = /background:\s*#(?:F3F4F1|F4F7FB|FFFFFF)/i.test(style);
    if (!isWhiteCard && !element.closest('.motion-hero') && element instanceof HTMLElement) {
      element.classList.add('motion-card');
    }
  });

  const counters = [...document.querySelectorAll('.motion-intro-stat > span:first-child')];
  const animateCounter = (counter) => {
    if (counter.dataset.counterDone === 'true') return;
    counter.dataset.counterDone = 'true';
    const target = Number(counter.dataset.counterTarget);
    const suffix = counter.dataset.counterSuffix || '';
    const start = performance.now();
    const duration = 1050;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      counter.textContent = `${Math.round(target * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  counters.forEach((counter) => {
    const original = (counter.textContent || '').trim();
    const match = original.match(/^(\d+)(.*)$/);
    if (!match || reducedMotion) return;
    counter.dataset.counterTarget = match[1];
    counter.dataset.counterSuffix = match[2];
    counter.textContent = `0${match[2]}`;
  });

  if (!reducedMotion) {
    window.setTimeout(() => counters.filter((counter) => counter.dataset.counterTarget).forEach(animateCounter), 620);
  }

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);

      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.motion-reveal').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('.motion-reveal').forEach((element) => element.classList.add('is-visible'));
  }

  let scrollTicking = false;
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  requestAnimationFrame(() => document.body.classList.add('motion-ready'));
})();
