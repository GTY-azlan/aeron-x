'use strict';
/* ═══════════════════════════════════════════════════════════
   CINEMATIC.JS — Premium interactions for Aeron X
   ═══════════════════════════════════════════════════════════ */

// ── Scroll Progress Bar ──────────────────────────────────────
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

// ── Ambient Orbs ─────────────────────────────────────────────
(function initOrbs() {
  if (window.innerWidth < 768) return;
  [1, 2].forEach(n => {
    const orb = document.createElement('div');
    orb.className = `ambient-orb ambient-orb-${n}`;
    document.body.appendChild(orb);
  });
})();

// ── Nav scroll state ─────────────────────────────────────────
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Hero Parallax ─────────────────────────────────────────────
(function initHeroParallax() {
  const heroBg = document.querySelector('.hero-bg img, .hero-video-wrap video');
  if (!heroBg) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `translateY(${y * 0.35}px) scale(1.05)`;
    }
  }, { passive: true });
})();

// ── Scroll Storytelling (IntersectionObserver) ────────────────
(function initStoryReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.story-section').forEach(el => io.observe(el));
})();

// ── Animated Stat Counter ─────────────────────────────────────
(function initStatCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const raw = el.dataset.count;
      if (!raw) return;
      const isFloat = raw.includes('.');
      const end = parseFloat(raw);
      const suffix = el.dataset.suffix || '';
      let start = 0; const dur = 1400; const startTime = performance.now();
      const tick = now => {
        const p = Math.min((now - startTime) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = isFloat ? (start + (end - start) * ease).toFixed(1) : Math.round(start + (end - start) * ease);
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => io.observe(el));
})();

// ── Cinematic Card Click Transition ──────────────────────────
(function initCinematicClick() {
  // Create overlay + portal elements
  const overlay = document.createElement('div');
  overlay.id = 'cinematic-overlay';
  document.body.appendChild(overlay);

  const portal = document.createElement('div');
  portal.id = 'car-portal';
  portal.innerHTML = '<img src="" alt=""/>';
  document.body.appendChild(portal);

  const portalImg = portal.querySelector('img');

  function launchCinematic(card, targetUrl) {
    const img = card.querySelector('img');
    if (!img) { window.location.href = targetUrl; return; }

    const rect = img.getBoundingClientRect();

    // Clone image to portal, starting from card position
    portalImg.src = img.src;
    portalImg.style.position = 'fixed';
    portalImg.style.left = rect.left + 'px';
    portalImg.style.top  = rect.top  + 'px';
    portalImg.style.width  = rect.width  + 'px';
    portalImg.style.height = rect.height + 'px';
    portalImg.style.maxWidth  = 'none';
    portalImg.style.maxHeight = 'none';
    portalImg.style.transform = 'scale(1)';
    portalImg.style.filter    = 'blur(0)';
    portalImg.style.opacity   = '1';
    portalImg.style.transition = 'none';
    portalImg.style.objectFit = 'cover';
    portalImg.style.borderRadius = '0';

    // Fade out other cards
    document.querySelectorAll('.vehicle-card').forEach(c => {
      if (c !== card) {
        c.style.transition = 'opacity .4s ease';
        c.style.opacity = '0';
      }
    });
    // Fade out nav, hero content
    ['nav', '.hero-content', '.section-title', '.vehicles-section > *:not(#vehiclesGrid)'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.transition = 'opacity .4s ease';
        el.style.opacity = '0';
      });
    });

    overlay.classList.add('active');
    portal.classList.add('active');

    // Animate: zoom to center + expand
    requestAnimationFrame(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const targetW = Math.min(vw * 0.85, 1100);
      const targetH = targetW * (9/16);
      const targetL = (vw - targetW) / 2;
      const targetT = (vh - targetH) / 2;

      portalImg.style.transition = 'all .75s cubic-bezier(.16,1,.3,1)';
      portalImg.style.left   = targetL + 'px';
      portalImg.style.top    = targetT + 'px';
      portalImg.style.width  = targetW + 'px';
      portalImg.style.height = targetH + 'px';
      portalImg.style.filter = 'blur(0) brightness(1.15)';
      portalImg.style.boxShadow = '0 40px 120px rgba(0,0,0,.9)';
    });

    // Navigate after animation
    setTimeout(() => { window.location.href = targetUrl; }, 820);
  }

  // Attach to vehicle cards
  document.addEventListener('click', e => {
    const viewBtn = e.target.closest('.btn-view3d');
    if (viewBtn) {
      e.preventDefault();
      const card = viewBtn.closest('.vehicle-card');
      launchCinematic(card, viewBtn.href);
    }
  });
})();

// ── Mouse-based 3D tilt on cards ─────────────────────────────
(function initCardTilt() {
  document.querySelectorAll('.vehicle-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateY(${x * 8}deg) rotateX(${-y * 5}deg)`;
      card.style.transition = 'transform .1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    });
  });
})();

// ── Page Hero Parallax (pages other than index) ───────────────
(function initPageHeroParallax() {
  const hero = document.querySelector('.page-hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < hero.offsetHeight * 1.5) {
      hero.style.backgroundPositionY = `calc(50% + ${y * 0.3}px)`;
    }
  }, { passive: true });
})();

// ── Micro-interaction: button ripple ─────────────────────────
(function initRipple() {
  document.querySelectorAll('.btn-primary, .btn-view3d, .order-btn, .shop-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const r = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(r.width, r.height);
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${size}px; height:${size}px;
        left:${e.clientX - r.left - size/2}px;
        top:${e.clientY - r.top - size/2}px;
        background:rgba(255,255,255,.2);
        transform:scale(0); animation:rippleAnim .5s ease forwards;
      `;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });
  // Inject ripple keyframe once
  if (!document.getElementById('ripple-style')) {
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = '@keyframes rippleAnim{to{transform:scale(2.5);opacity:0}}';
    document.head.appendChild(s);
  }
})();

// ── Sound Toggle (ambient) ────────────────────────────────────
(function initSound() {
  const btn = document.createElement('button');
  btn.id = 'sound-toggle';
  btn.setAttribute('aria-label', 'Toggle ambient sound');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path class="sound-waves" d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>`;
  document.body.appendChild(btn);

  let audio = null; let playing = false;
  btn.addEventListener('click', () => {
    if (!audio) {
      // Subtle ambient hum — use a simple oscillator via Web Audio
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 55;
        gain.gain.value = 0.03;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start();
        audio = { ctx, osc, gain };
      } catch(e) { return; }
    }
    playing = !playing;
    audio.gain.gain.setTargetAtTime(playing ? 0.03 : 0, audio.ctx.currentTime, 0.5);
    btn.style.color = playing ? '#fff' : '';
    btn.style.borderColor = playing ? 'rgba(255,255,255,.3)' : '';
    btn.querySelector('.sound-waves').style.opacity = playing ? '1' : '0.3';
  });
})();

// ── Intro Screen ─────────────────────────────────────────────
(function initIntro() {
  const screen = document.getElementById('intro-screen');
  if (!screen) return;

  // Skip if already seen this session
  if (sessionStorage.getItem('cx-intro-seen')) {
    screen.classList.add('hidden');
    return;
  }

  const btn = screen.querySelector('.intro-start-btn');
  const progress = screen.querySelector('.intro-progress');

  // Auto-progress bar
  requestAnimationFrame(() => { if (progress) progress.style.width = '100%'; });

  function dismiss() {
    sessionStorage.setItem('cx-intro-seen', '1');
    screen.classList.add('hidden');
  }

  if (btn) btn.addEventListener('click', dismiss);
  // Auto-dismiss after 3.5s
  setTimeout(dismiss, 3500);
})();
