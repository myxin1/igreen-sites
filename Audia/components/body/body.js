// Audia landing body interactions.

(function () {
  const HERO_VARIANT_KEY = 'audia_hero_variant';
  const LEGACY_HEADER_VARIANT_KEY = 'audia_header_variant';
  const DEFAULT_BEAM_COUNT = 96;
  const BEAMS_COUNT = 30;

  const VALID_VARIANTS = ['original', 'cybercore', 'beams', 'sparkles'];

  // ── Cybercore (CSS spans) ─────────────────────────────────────────────────

  function ensureHeroCybercoreScene(hero) {
    if (!hero || hero.querySelector('.hero-cybercore-scene')) return;

    const scene = document.createElement('div');
    scene.className = 'hero-cybercore-scene';
    scene.setAttribute('aria-hidden', 'true');

    const beams = document.createElement('div');
    beams.className = 'hero-cybercore-beams';

    Array.from({ length: DEFAULT_BEAM_COUNT }).forEach((_, index) => {
      const beam = document.createElement('span');
      const duration = Math.random() * 2.4 + 3.2;
      const isSecondary = Math.random() < 0.22;

      beam.className = `hero-cybercore-beam${isSecondary ? ' secondary' : ''}`;
      beam.style.left = `${Math.random() * 100}%`;
      beam.style.width = `${Math.floor(Math.random() * 2) + 1}px`;
      beam.style.animationDelay = `${Math.random() * 3.4}s`;
      beam.style.animationDuration = `${duration}s, ${duration}s`;
      beam.dataset.beamId = String(index);
      beams.appendChild(beam);
    });

    scene.appendChild(beams);
    hero.insertBefore(scene, hero.firstChild);
  }

  // ── Beams (Canvas diagonal) ───────────────────────────────────────────────

  let beamsAnimFrame = 0;

  function createCanvasBeam(w, h) {
    const angle = -35 + Math.random() * 10;
    return {
      x: Math.random() * w * 1.5 - w * 0.25,
      y: Math.random() * h * 1.5 - h * 0.25,
      width: 30 + Math.random() * 60,
      length: h * 2.5,
      angle,
      speed: 0.6 + Math.random() * 1.2,
      opacity: 0.12 + Math.random() * 0.16,
      hue: 190 + Math.random() * 70,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  function resetCanvasBeam(beam, index, total, canvas) {
    const col = index % 3;
    const spacing = canvas.width / 3;
    beam.y = canvas.height + 100;
    beam.x = col * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
    beam.width = 100 + Math.random() * 100;
    beam.speed = 0.5 + Math.random() * 0.4;
    beam.hue = 190 + (index * 70) / total;
    beam.opacity = 0.2 + Math.random() * 0.1;
    return beam;
  }

  function drawCanvasBeam(ctx, beam) {
    ctx.save();
    ctx.translate(beam.x, beam.y);
    ctx.rotate((beam.angle * Math.PI) / 180);

    const po = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2);
    const grad = ctx.createLinearGradient(0, 0, 0, beam.length);
    grad.addColorStop(0,   `hsla(${beam.hue},85%,65%,0)`);
    grad.addColorStop(0.1, `hsla(${beam.hue},85%,65%,${po * 0.5})`);
    grad.addColorStop(0.4, `hsla(${beam.hue},85%,65%,${po})`);
    grad.addColorStop(0.6, `hsla(${beam.hue},85%,65%,${po})`);
    grad.addColorStop(0.9, `hsla(${beam.hue},85%,65%,${po * 0.5})`);
    grad.addColorStop(1,   `hsla(${beam.hue},85%,65%,0)`);

    ctx.fillStyle = grad;
    ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
    ctx.restore();
  }

  function startBeamsAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let beams = [];
    let cw = 0;
    let ch = 0;

    function resize() {
      cw = window.innerWidth;
      ch = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
      if (!ch) ch = window.innerHeight;

      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      beams = Array.from({ length: BEAMS_COUNT }, () => createCanvasBeam(cw, ch));
    }

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    canvas._beamsCleanup = () => window.removeEventListener('resize', onResize);

    function tick() {
      ctx.clearRect(0, 0, cw, ch);
      ctx.filter = 'blur(35px)';

      beams.forEach((beam, i) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) resetCanvasBeam(beam, i, beams.length, { width: cw, height: ch });
        drawCanvasBeam(ctx, beam);
      });

      beamsAnimFrame = requestAnimationFrame(tick);
    }

    tick();
  }

  function stopBeamsAnimation() {
    if (beamsAnimFrame) {
      cancelAnimationFrame(beamsAnimFrame);
      beamsAnimFrame = 0;
    }
  }

  function ensureHeroBeamsCanvas(hero) {
    if (!hero || hero.querySelector('.hero-beams-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-beams-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
  }

  // ── Sparkles (Canvas particles) ───────────────────────────────────────────

  let sparklesAnimFrame = 0;
  const SPARKLES_COUNT = 120;

  function getSparkleColors() {
    const isDark = (document.documentElement.dataset.theme || 'dark') !== 'light';
    return isDark
      ? { primary: '217,119,87', secondary: '255,200,160' }
      : { primary: '184,95,66',  secondary: '217,119,87'  };
  }

  function createSparkle(cw, ch) {
    const speed = 0.08 + Math.random() * 0.7;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * cw,
      y: Math.random() * ch,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.4 + Math.random() * 2,
      opacity: Math.random(),
      opacitySpeed: 0.006 + Math.random() * 0.014,
      opacityDir: Math.random() < 0.5 ? 1 : -1,
      isPrimary: Math.random() < 0.65,
    };
  }

  function startSparklesAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let particles = [];
    let cw = 0;
    let ch = 0;

    function resize() {
      cw = window.innerWidth;
      ch = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
      if (!ch) ch = window.innerHeight;

      canvas.width  = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width  = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: SPARKLES_COUNT }, () => createSparkle(cw, ch));
    }

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    canvas._sparklesCleanup = () => window.removeEventListener('resize', onResize);

    function tick() {
      ctx.clearRect(0, 0, cw, ch);
      const colors = getSparkleColors();

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0)  p.x = cw;
        if (p.x > cw) p.x = 0;
        if (p.y < 0)  p.y = ch;
        if (p.y > ch) p.y = 0;

        p.opacity += p.opacitySpeed * p.opacityDir;
        if (p.opacity >= 1)    { p.opacity = 1;    p.opacityDir = -1; }
        if (p.opacity <= 0.05) { p.opacity = 0.05; p.opacityDir =  1; }

        const rgb = p.isPrimary ? colors.primary : colors.secondary;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.opacity})`;
        ctx.fill();
      });

      sparklesAnimFrame = requestAnimationFrame(tick);
    }

    tick();
  }

  function stopSparklesAnimation() {
    if (sparklesAnimFrame) {
      cancelAnimationFrame(sparklesAnimFrame);
      sparklesAnimFrame = 0;
    }
  }

  function ensureHeroSparklesCanvas(hero) {
    if (!hero || hero.querySelector('.hero-sparkles-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-sparkles-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
  }

  // ── Variant apply ─────────────────────────────────────────────────────────

  function applyHeroVariant(variant) {
    const hero = document.getElementById('hero');
    if (!hero) return;

    stopBeamsAnimation();
    stopSparklesAnimation();

    if (variant === 'cybercore') {
      ensureHeroCybercoreScene(hero);
    } else if (variant === 'beams') {
      ensureHeroBeamsCanvas(hero);
      const canvas = hero.querySelector('.hero-beams-canvas');
      if (canvas) startBeamsAnimation(canvas);
    } else if (variant === 'sparkles') {
      ensureHeroSparklesCanvas(hero);
      const canvas = hero.querySelector('.hero-sparkles-canvas');
      if (canvas) startSparklesAnimation(canvas);
    }

    hero.classList.toggle('is-cybercore', variant === 'cybercore');
    hero.classList.toggle('is-beams',     variant === 'beams');
    hero.classList.toggle('is-sparkles',  variant === 'sparkles');
    document.documentElement.dataset.heroVariant = variant;
  }

  function normalizeVariant(v) {
    return VALID_VARIANTS.includes(v) ? v : 'original';
  }

  function initHeroVariant() {
    const legacyVariant = localStorage.getItem(LEGACY_HEADER_VARIANT_KEY);
    const savedVariant = normalizeVariant(localStorage.getItem(HERO_VARIANT_KEY) || legacyVariant || 'original');

    localStorage.setItem(HERO_VARIANT_KEY, savedVariant);
    if (legacyVariant) localStorage.removeItem(LEGACY_HEADER_VARIANT_KEY);
    applyHeroVariant(savedVariant);
  }

  function initReveal() {
    const revealItems = document.querySelectorAll('.reveal');
    if (!revealItems.length) return;

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((element) => element.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealItems.forEach((element) => observer.observe(element));
  }

  function initLeadForm() {
    const form = document.getElementById('leads-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const emailInput = document.getElementById('leads-email');
      const nameInput = document.getElementById('leads-name');
      const success = document.getElementById('leads-success');
      const email = emailInput?.value.trim() || '';

      if (!email || !email.includes('@')) {
        emailInput?.focus();
        return;
      }

      const leads = JSON.parse(localStorage.getItem('audia_leads') || '[]');
      leads.push({
        name: nameInput?.value.trim() || '',
        email,
        ts: Date.now(),
      });
      localStorage.setItem('audia_leads', JSON.stringify(leads));

      if (success) success.hidden = false;
    });
  }

  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          navLinks.forEach((link) => link.classList.remove('active'));
          const link = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (link) link.classList.add('active');
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  // ── Hero Boxes (same engine as footer) ───────────────────────────────────
  const HERO_BOXES_KEY = 'audia_hero_boxes';
  const heroBoxColors = ['#D97757', '#E8956E', '#F2B08D', '#A85A3F', '#FFFFFF'];

  function buildHeroBoxes(boxesEl) {
    if (!boxesEl) return;
    boxesEl.innerHTML = '';
    const isSmall = window.matchMedia('(max-width: 640px)').matches;
    const cols = isSmall ? 12 : 24;
    const rows = isSmall ? 9 : 15;
    boxesEl.style.setProperty('--hero-box-cols', cols);
    for (let i = 0; i < rows * cols; i++) {
      const cell = document.createElement('span');
      cell.className = 'hero-box-cell';
      cell.addEventListener('mouseenter', () => {
        const color = heroBoxColors[Math.floor(Math.random() * heroBoxColors.length)];
        cell.style.backgroundColor = color;
        cell.style.borderColor = color;
        window.setTimeout(() => {
          cell.style.backgroundColor = '';
          cell.style.borderColor = '';
        }, 650);
      });
      boxesEl.appendChild(cell);
    }
  }

  function isHeroBoxesOn() {
    const v = localStorage.getItem(HERO_BOXES_KEY);
    return v === null ? true : v === 'true';
  }

  function applyHeroBoxes(active) {
    const boxesEl = document.querySelector('.hero-boxes');
    if (!boxesEl) return;
    boxesEl.classList.toggle('is-visible', active);
    localStorage.setItem(HERO_BOXES_KEY, String(active));
    document.querySelectorAll('[data-dev-hero-boxes]').forEach(btn => {
      btn.classList.toggle('primary', active);
    });
  }

  function initHeroBoxes() {
    const boxesEl = document.querySelector('.hero-boxes');
    if (!boxesEl) return;
    buildHeroBoxes(boxesEl);
    applyHeroBoxes(isHeroBoxesOn());
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => buildHeroBoxes(boxesEl), 200);
    });
  }

  // ── Hero Stats Count-Up ───────────────────────────────────────────────────
  const HERO_STATS_DURATION = 720;
  const HERO_STATS_STAGGER = 70;

  function initBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    const toggleVisibility = () => {
      button.classList.toggle('is-visible', window.scrollY > Math.min(window.innerHeight * 0.65, 520));
    };

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
  }

  function animateCountUp(el, delay = 0) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (isNaN(target) || el.dataset.countAnimated === 'true') return;

    el.dataset.countAnimated = 'true';
    el.textContent = '0' + suffix;

    window.setTimeout(() => {
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / HERO_STATS_DURATION, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        el.textContent = Math.round(ease * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, delay);
  }

  function animateHeroStats(stats) {
    stats.forEach((el, index) => {
      animateCountUp(el, index * HERO_STATS_STAGGER);
    });
  }

  function initStatCounters() {
    const stats = document.querySelectorAll('.hero-stat-num[data-count]');
    if (!stats.length) return;
    window.setTimeout(() => {
      animateHeroStats(stats);
    }, 220);
  }

  function initBody() {
    initHeroVariant();
    initReveal();
    initLeadForm();
    initActiveNav();
    initHeroBoxes();
    initBackToTop();
    initStatCounters();
  }

  window.audiaHeroBoxes = { apply: applyHeroBoxes, isOn: isHeroBoxesOn };

  window.audiaHero = {
    apply: (variant) => {
      const nextVariant = normalizeVariant(variant);
      localStorage.setItem(HERO_VARIANT_KEY, nextVariant);
      localStorage.removeItem(LEGACY_HEADER_VARIANT_KEY);
      applyHeroVariant(nextVariant);
    },
    current: () => normalizeVariant(localStorage.getItem(HERO_VARIANT_KEY) || 'original'),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBody);
  } else {
    initBody();
  }
})();
