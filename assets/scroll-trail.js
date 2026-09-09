(() => {
  const shell = document.querySelector('.home .site-shell');
  const main = document.querySelector('.home main');
  if (!shell || !main) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const namespace = 'http://www.w3.org/2000/svg';
  const element = (name, attributes = {}) => {
    const node = document.createElementNS(namespace, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  };
  const layers = ['back', 'front'].map(name => {
    const svg = element('svg', {
      class: `scroll-trail scroll-trail--${name}`,
      'aria-hidden': 'true', focusable: 'false'
    });
    const mask = element('mask', {
      id: `scroll-trail-${name}-mask`, maskUnits: 'userSpaceOnUse',
      x: 0, y: 0, 'mask-type': 'luminance'
    });
    const defs = element('defs');
    defs.append(mask);
    const path = element('path', {
      class: 'scroll-trail__line', mask: `url(#scroll-trail-${name}-mask)`
    });
    svg.append(defs, path);
    document.body.append(svg);
    return { svg, mask, path };
  });

  let frame = 0;
  let needsMeasure = true;
  let length = 0;
  let pageHeight = 0;
  let viewportHeight = 0;
  let scrollRange = 1;
  let samples = [];

  function measure() {
    const scrollY = window.scrollY;
    const box = node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height };
    };
    const bounds = box(shell);
    const width = document.documentElement.clientWidth;
    viewportHeight = window.innerHeight;
    pageHeight = Math.max(bounds.top + bounds.height, viewportHeight);
    scrollRange = Math.max(1, pageHeight - viewportHeight);
    const points = [];
    const add = (fraction, y) => points.push({ x: bounds.left + bounds.width * fraction, y });
    const visit = (selector, turns) => {
      const rect = box(main.querySelector(selector));
      for (const [x, y] of turns) add(x, rect.top + rect.height * y);
    };

    const title = box(main.querySelector('h1'));
    if (width > 700) {
      const intro = box(main.querySelector('.hero__intro'));
      const current = box(main.querySelector('.current-index'));
      const heroGap = ((intro.left + intro.width + current.left) / 2 - bounds.left) / bounds.width;
      add(heroGap, title.top + title.height + 18);
      visit('.hero', [[heroGap - .015, .87], [.16, .98]]);
      visit('#gumgauge', [[.16, .05], [.78, .92]]);
      visit('#mise', [[.84, .07], [.17, .96]]);
      visit('.side-projects', [[.50, .02], [.50, 1.03], [.67, 1.18]]);
      visit('.sites-section', [[.67, .10], [.67, 1.04], [.22, 1.20]]);
      visit('.about-section', [[.22, .04], [.39, .12], [.39, .42], [.22, .68], [.39, .98]]);
      visit('.background-section', [[.57, .02], [.59, .42], [.56, .90]]);
      visit('.reading-section', [[.50, .15], [.50, .76], [.18, .98]]);
    } else {
      const leftEdge = (8 - bounds.left) / bounds.width;
      const rightEdge = (width - 8 - bounds.left) / bounds.width;
      add(rightEdge, title.top + title.height + 18);
      visit('.hero', [[rightEdge, .87], [.16, .98]]);
      visit('#gumgauge', [[.16, .05], [.78, .92]]);
      visit('#mise', [[.82, .07], [.18, .94]]);
      visit('#giltedge', [[.16, .08], [.82, .94]]);
      visit('.side-projects', [[rightEdge, .06], [rightEdge, 1.01], [leftEdge, 1.06]]);
      visit('.sites-section', [[leftEdge, .10], [leftEdge, 1.01], [.85, 1.06]]);
      visit('.about-section', [[rightEdge, .06], [rightEdge, .98]]);
      visit('.background-section', [[leftEdge, .02], [leftEdge, .99]]);
      visit('.reading-section', [[rightEdge, .14], [rightEdge, .85], [.18, .98]]);
    }
    visit('#contact', [[.16, .10], [.88, .90]]);
    add(.70, pageHeight - 20);
    points.sort((a, b) => a.y - b.y);

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const next = points[i];
      const bend = (next.y - previous.y) * .48;
      d += ` C ${previous.x} ${previous.y + bend}, ${next.x} ${next.y - bend}, ${next.x} ${next.y}`;
    }

    // Keep the drawing clear of words, controls, and brand artwork in either layer.
    const protectedBoxes = [...shell.querySelectorAll(
      'h1, h2, h3, p, li, summary, .entry__meta, .hero__topline, .hero__actions, .current-index, .logo-slot, .site-header, .contact-links, .sheet-footer, .about-copy'
    )].filter(node => node.getClientRects().length).map(box);
    const cards = [...main.querySelectorAll('.venture, .contact-section')].map(node => ({
      ...box(node), inset: node.id === 'gumgauge' ? 0 : 28
    }));

    for (const [index, { svg, mask, path }] of layers.entries()) {
      svg.style.width = `${width}px`;
      svg.style.height = `${pageHeight}px`;
      svg.setAttribute('viewBox', `0 0 ${width} ${pageHeight}`);
      mask.setAttribute('width', width);
      mask.setAttribute('height', pageHeight);
      const cutouts = protectedBoxes.map(rect => element('rect', {
        x: rect.left - 7, y: rect.top - 7, width: rect.width + 14,
        height: rect.height + 14, rx: 5, fill: 'black'
      }));
      // The rear stroke disappears under cards. The front stroke overlaps only their edges.
      if (index === 1) {
        for (const rect of cards) cutouts.push(element('rect', {
          x: rect.left + rect.inset, y: rect.top + rect.inset,
          width: rect.width - rect.inset * 2, height: rect.height - rect.inset * 2,
          rx: Math.max(0, 18 - rect.inset), fill: 'black'
        }));
      }
      mask.replaceChildren(element('rect', { width, height: pageHeight, fill: 'white' }), ...cutouts);
      path.setAttribute('d', d);
    }

    const path = layers[0].path;
    length = path.getTotalLength();
    for (const layer of layers) layer.path.style.strokeDasharray = `${length} ${length}`;
    // Cache height along the curve so scrolling needs no path measurements.
    samples = Array.from({ length: 257 }, (_, i) => ({
      distance: length * i / 256, y: path.getPointAtLength(length * i / 256).y
    }));
    needsMeasure = false;
  }

  function draw() {
    frame = 0;
    if (motion.matches) return;
    if (needsMeasure) measure();
    const scrollY = Math.max(0, window.scrollY);
    const progress = Math.min(1, scrollY / scrollRange);
    const revealY = scrollY + viewportHeight * (.65 + .35 * progress);
    let low = 0;
    let high = samples.length - 1;
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (samples[middle].y < revealY) low = middle;
      else high = middle;
    }
    const before = samples[low];
    const after = samples[high];
    const fraction = Math.min(1, Math.max(0, (revealY - before.y) / Math.max(1, after.y - before.y)));
    const distance = before.distance + fraction * (after.distance - before.distance);
    for (const { svg, path } of layers) {
      path.style.strokeDashoffset = `${length - distance}`;
      svg.classList.add('is-ready');
    }
  }

  function schedule() {
    if (!motion.matches && !frame) frame = window.requestAnimationFrame(draw);
  }

  function invalidate() {
    needsMeasure = true;
    schedule();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  main.addEventListener('toggle', invalidate, true);
  shell.addEventListener('animationend', invalidate);
  motion.addEventListener('change', () => {
    if (motion.matches) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      for (const { svg } of layers) svg.classList.remove('is-ready');
    } else invalidate();
  });

  if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(shell);
  window.addEventListener('load', invalidate, { once: true });
  schedule();
})();
