(() => {
  const shell = document.querySelector('.home .site-shell');
  const main = document.querySelector('.home main');
  if (!shell || !main) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  svg.setAttribute('class', 'scroll-trail');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  path.setAttribute('class', 'scroll-trail__line');
  svg.append(path);
  document.body.append(svg);

  let frame = 0;
  let needsMeasure = true;
  let length = 0;
  let scrollRange = 1;

  function measure() {
    const bounds = shell.getBoundingClientRect();
    const pageHeight = Math.max(bounds.bottom + window.scrollY, window.innerHeight);
    const gap = bounds.left < 28 ? 6 : 16;
    const width = Math.max(8, Math.min(76, bounds.left - gap));
    const padding = width > 24 ? 6 : 3;
    const start = main.getBoundingClientRect().top + window.scrollY + 18;
    const end = Math.max(start + 1, pageHeight - 48);
    const turns = [0.5, 0.94, 0.08, 0.78, 0.22, 0.9, 0.12, 0.66];
    const spans = [220, 310, 250, 340, 270, 300];
    const xAt = (turn) => padding + turn * (width - padding * 2);
    let x = xAt(turns[0]);
    let y = start;
    let d = `M ${x} ${y}`;

    for (let i = 1; y < end; i += 1) {
      const nextY = Math.min(end, y + spans[(i - 1) % spans.length]);
      const nextX = xAt(turns[i % turns.length]);
      const bend = (nextY - y) * 0.52;
      d += ` C ${x} ${y + bend}, ${nextX} ${nextY - bend}, ${nextX} ${nextY}`;
      x = nextX;
      y = nextY;
    }

    svg.style.left = `${Math.max(0, bounds.left - width - gap)}px`;
    svg.style.width = `${width}px`;
    svg.style.height = `${pageHeight}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${pageHeight}`);
    path.setAttribute('d', d);
    length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    scrollRange = Math.max(1, pageHeight - window.innerHeight);
    needsMeasure = false;
  }

  function draw() {
    frame = 0;
    if (motion.matches) return;
    if (needsMeasure) measure();
    // A small opening stroke introduces the trail; it finishes at the page bottom.
    const progress = Math.min(1, Math.max(0, (window.scrollY + 72) / (scrollRange + 72)));
    path.style.strokeDashoffset = `${length * (1 - progress)}`;
    svg.classList.add('is-ready');
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
  motion.addEventListener('change', () => {
    if (motion.matches) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      svg.classList.remove('is-ready');
    } else {
      invalidate();
    }
  });

  if ('ResizeObserver' in window) {
    // Observe the content, not the SVG, so resizing the trail cannot feed back.
    new ResizeObserver(invalidate).observe(shell);
  } else {
    main.addEventListener('toggle', invalidate, true);
    window.addEventListener('load', invalidate, { once: true });
  }
  schedule();
})();
