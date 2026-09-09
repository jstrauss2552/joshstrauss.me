(() => {
  const shell = document.querySelector('.home .site-shell');
  const main = document.querySelector('.home main');
  if (!shell || !main) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');
  svg.setAttribute('class', 'scroll-trail');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  path.setAttribute('class', 'scroll-trail__line');
  svg.append(path);
  document.body.append(svg);

  let frame = 0;
  let needsMeasure = true;
  let length = 0;
  let viewportHeight = 0;
  let scrollRange = 1;
  let samples = [];
  let drawn = null;
  let lastTime = 0;

  // A natural cubic spline shares both slope and curvature at every join.
  // Unlike independent S-bends, it never forces a sharp turn at a section edge.
  function curvePath(points, width) {
    const count = points.length;
    const gaps = points.slice(1).map((point, i) => point.y - points[i].y);
    const upper = Array(count).fill(0);
    const values = Array(count).fill(0);
    const curvature = Array(count).fill(0);
    for (let i = 1; i < count - 1; i += 1) {
      const previous = gaps[i - 1];
      const next = gaps[i];
      const divisor = 2 * (previous + next) - previous * upper[i - 1];
      const change = 6 * ((points[i + 1].x - points[i].x) / next - (points[i].x - points[i - 1].x) / previous);
      upper[i] = next / divisor;
      values[i] = (change - previous * values[i - 1]) / divisor;
    }
    for (let i = count - 2; i > 0; i -= 1) curvature[i] = values[i] - upper[i] * curvature[i + 1];

    const segments = gaps.map((height, i) => {
      const start = points[i];
      const end = points[i + 1];
      const slope = (end.x - start.x) / height;
      const startSlope = slope - height * (2 * curvature[i] + curvature[i + 1]) / 6;
      const endSlope = slope + height * (curvature[i] + 2 * curvature[i + 1]) / 6;
      return [
        { x: start.x + height * startSlope / 3, y: start.y + height / 3 },
        { x: end.x - height * endSlope / 3, y: end.y - height / 3 },
        end
      ];
    });

    // Fit the entire curve together if needed; clamping individual handles creates kinks.
    const xs = [points[0].x, ...segments.flat().map(point => point.x)];
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const scale = Math.min(1, (width - 32) / Math.max(1, right - left));
    const offset = left < 16 || right > width - 16 ? width / 2 - scale * (left + right) / 2 : 0;
    const coordinate = point => `${point.x * scale + offset} ${point.y}`;
    return `M ${coordinate(points[0])} ${segments.map(segment => `C ${segment.map(coordinate).join(', ')}`).join(' ')}`;
  }

  function measure() {
    const scrollY = window.scrollY;
    const bounds = shell.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    viewportHeight = window.innerHeight;
    const pageHeight = Math.max(bounds.bottom + scrollY, viewportHeight);
    scrollRange = Math.max(1, pageHeight - viewportHeight);
    const points = [];
    const add = (fraction, y) => points.push({ x: bounds.left + bounds.width * fraction, y });
    const through = (selector, fraction, depth) => {
      const rect = main.querySelector(selector).getBoundingClientRect();
      add(fraction, rect.top + scrollY + rect.height * depth);
    };

    const title = main.querySelector('h1').getBoundingClientRect();
    const mobile = width <= 700;
    add(.79, title.bottom + scrollY + 24);
    // Uneven landmarks let the line linger, drift, and sweep across several blocks.
    // The stacked mobile layout has its own route instead of squeezing desktop bends.
    const route = mobile ? [
      ['#gumgauge', .31, .32],
      ['#mise', .24, .74],
      ['#giltedge', .49, .68],
      ['.side-projects', .76, .40],
      ['.sites-section', .63, .30],
      ['.sites-section', .69, .78],
      ['.about-section', .32, .32],
      ['.about-section', .40, .80],
      ['.background-section', .48, .28],
      ['.background-section', .28, .76],
      ['.reading-section', .51, .46],
      ['#contact', .61, .40]
    ] : [
      ['#gumgauge', .32, .35],
      ['#mise', .22, .72],
      ['.side-projects', .48, .42],
      ['.sites-section', .86, .62],
      ['.about-section', .66, .28],
      ['.about-section', .71, .75],
      ['.background-section', .26, .28],
      ['.background-section', .36, .72],
      ['.reading-section', .43, .36],
      ['#contact', .73, .30]
    ];
    for (const [selector, fraction, depth] of route) through(selector, fraction, depth);
    add(mobile ? .54 : .62, pageHeight - 20);
    // Small screens and expanded sections can move anchors; keep bends well separated.
    const anchors = [];
    for (const point of points) {
      if (!anchors.length || point.y - anchors[anchors.length - 1].y > 120) anchors.push(point);
    }

    svg.style.width = `${width}px`;
    svg.style.height = `${pageHeight}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${pageHeight}`);
    path.setAttribute('d', curvePath(anchors, width));
    length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    // All geometry is cached on resize. Scroll frames only interpolate numbers.
    samples = Array.from({ length: 385 }, (_, i) => ({
      distance: length * i / 384, y: path.getPointAtLength(length * i / 384).y
    }));
    needsMeasure = false;
  }

  function targetDistance() {
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
    return before.distance + fraction * (after.distance - before.distance);
  }

  function draw(time) {
    frame = 0;
    if (motion.matches) return;
    const resized = needsMeasure;
    if (resized) measure();
    const target = targetDistance();
    if (drawn === null || resized) drawn = target;
    else {
      const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
      drawn += (target - drawn) * (1 - Math.exp(-elapsed / 110));
    }
    if (Math.abs(target - drawn) < .2) drawn = target;
    path.style.strokeDashoffset = `${length - drawn}`;
    svg.classList.add('is-ready');
    // Only run while catching up to a scroll gesture; there is no idle animation loop.
    if (drawn !== target) {
      lastTime = time;
      frame = window.requestAnimationFrame(draw);
    } else lastTime = 0;
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
      lastTime = 0;
      svg.classList.remove('is-ready');
    } else invalidate();
  });
  if ('ResizeObserver' in window) new ResizeObserver(invalidate).observe(shell);
  window.addEventListener('load', invalidate, { once: true });
  schedule();
})();
