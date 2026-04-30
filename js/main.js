/* =========================================================
   PROJET P3V – Script principal
   Animations, Hero Slider, Scroll Reveal, Compteurs, etc.
   ========================================================= */

(function() {
  'use strict';

  /* ── 0. CINEMATIC STORY INTRO ── */
  (function initStoryIntro() {
    const wrap        = document.getElementById('storyIntro');
    if (!wrap) return;

    const TOTAL       = 5;
    const bgLayers    = document.querySelectorAll('.si-bg-layer');
    const chapters    = document.querySelectorAll('.si-chapter');
    const dots        = document.querySelectorAll('.sid');
    const progressFl  = document.getElementById('siProgressFill');
    const scrollHint  = document.getElementById('siScrollHint');
    let   current     = 0;
    let   isMobile    = window.innerWidth <= 768;

    /* — switch chapter — */
    function goChapter(idx) {
      if (idx < 0 || idx >= TOTAL || idx === current) return;
      chapters[current]?.classList.remove('active');
      bgLayers[current]?.classList.remove('active');
      dots[current]?.classList.remove('active');

      current = idx;

      chapters[current]?.classList.add('active');
      bgLayers[current]?.classList.add('active');
      dots[current]?.classList.add('active');

      // hide scroll hint after ch0
      if (scrollHint) scrollHint.classList.toggle('hidden', current > 0);
    }

    /* — scroll handler — */
    function onScroll() {
      if (isMobile) return;
      const wrapTop    = wrap.getBoundingClientRect().top + window.pageYOffset;
      const scrolled   = window.pageYOffset - wrapTop;
      const scrollRange = wrap.offsetHeight - window.innerHeight;

      // header mode
      const inStory = scrolled >= 0 && scrolled <= scrollRange + 40;
      document.body.classList.toggle('story-mode', inStory);

      if (scrolled < 0 || scrolled > scrollRange + 50) return;

      const progress = Math.max(0, Math.min(1, scrolled / scrollRange));
      const idx      = Math.min(Math.round(progress * (TOTAL - 1)), TOTAL - 1);

      if (progressFl) progressFl.style.width = (progress * 100) + '%';
      if (idx !== current) goChapter(idx);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { isMobile = window.innerWidth <= 768; });

    /* — dot clicks — */
    dots.forEach((d, i) => d.addEventListener('click', () => {
      const wrapTop    = wrap.getBoundingClientRect().top + window.pageYOffset;
      const scrollRange = wrap.offsetHeight - window.innerHeight;
      window.scrollTo({ top: wrapTop + (i / (TOTAL - 1)) * scrollRange, behavior: 'smooth' });
    }));

    /* — mobile: swipe — */
    let tX = 0;
    wrap.addEventListener('touchstart', e => { tX = e.touches[0].clientY; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      const diff = tX - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) goChapter(diff > 0 ? current + 1 : current - 1);
    }, { passive: true });

    /* — init — */
    onScroll();
  })();

  const loader = document.getElementById('pageLoader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');

  let pct = 0;
  const loaderTimer = setInterval(() => {
    pct += Math.random() * 18;
    if (pct >= 100) { pct = 100; clearInterval(loaderTimer); }
    if (loaderFill) loaderFill.style.width = pct + '%';
    if (loaderPct) loaderPct.textContent = Math.round(pct) + '%';
    if (pct === 100) {
      setTimeout(() => {
        if (loader) loader.classList.add('hidden');
        initReveal();
      }, 380);
    }
  }, 60);

  /* ── 2. CUSTOM CURSOR ── */
  const cursor = document.getElementById('cursor');
  const cursorFollower = document.getElementById('cursorFollower');
  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
  });

  function animateFollower() {
    fx += (mx - fx) * 0.14;
    fy += (my - fy) * 0.14;
    if (cursorFollower) {
      cursorFollower.style.left = fx + 'px';
      cursorFollower.style.top = fy + 'px';
    }
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('mouseenter', () => { if(cursor) cursor.style.transform = 'translate(-50%,-50%) scale(2.5)'; });
    el.addEventListener('mouseleave', () => { if(cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1)'; });
  });

  /* ── 3. HEADER SCROLL ── */
  const header = document.getElementById('site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.pageYOffset;
    if (current > 80 && current > lastScroll) {
      header && header.classList.add('nav-hidden');
    } else {
      header && header.classList.remove('nav-hidden');
    }
    lastScroll = current;

    // Back to top
    const btn = document.getElementById('backToTop');
    if (btn) {
      if (current > 400) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }

    // Active nav link
    updateActiveNav();

    // Trigger reveal
    revealOnScroll();

    // Animate progress bars when visible
    animateProgressBars();
  }, { passive: true });

  document.getElementById('backToTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── 4. BURGER MENU ── */
  const burgerBtn = document.getElementById('burgerBtn');
  const navLinks = document.getElementById('navLinks');

  burgerBtn?.addEventListener('click', () => {
    burgerBtn.classList.toggle('open');
    navLinks?.classList.toggle('open');
  });

  // Close on link click
  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burgerBtn?.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  /* ── 5. HERO SLIDER ── */
  const slides = document.querySelectorAll('.hbs-slide');
  const bullets = document.querySelectorAll('.hb');
  let currentSlide = 0;
  let slideInterval;

  function goToSlide(index) {
    slides[currentSlide]?.classList.remove('active');
    bullets[currentSlide]?.classList.remove('active');
    currentSlide = index;
    slides[currentSlide]?.classList.add('active');
    bullets[currentSlide]?.classList.add('active');
  }

  function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
  }

  function startSlider() {
    slideInterval = setInterval(nextSlide, 6000);
  }

  if (slides.length > 0) {
    startSlider();
    bullets.forEach(b => {
      b.addEventListener('click', () => {
        clearInterval(slideInterval);
        goToSlide(parseInt(b.dataset.slide));
        startSlider();
      });
    });
  }

  /* ── 6. HERO PARTICULES ── */
  function createParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    const count = window.innerWidth < 600 ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 5 + 2;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        --dur:${Math.random() * 8 + 5}s;
        --delay:${Math.random() * 4}s;
      `;
      container.appendChild(p);
    }
  }
  createParticles();

  /* ── 7. HERO STAT COUNTERS ── */
  function animateCounter(el, target, duration) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = Math.floor(start).toLocaleString('fr-FR');
    }, 16);
  }

  let heroCountsDone = false;
  function triggerHeroCounts() {
    if (heroCountsDone) return;
    document.querySelectorAll('.hero-count').forEach(el => {
      animateCounter(el, parseInt(el.dataset.target), 1600);
    });
    heroCountsDone = true;
  }

  // Trigger after loader
  setTimeout(triggerHeroCounts, 1200);

  /* ── 8. SCROLL REVEAL ── */
  function initReveal() {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.transitionDelay = el.style.transitionDelay || el.dataset.delay ? (el.dataset.delay + 'ms') : '0ms';
    });
    revealOnScroll();
  }

  function revealOnScroll() {
    const wH = window.innerHeight;
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < wH * 0.9) {
        el.classList.add('visible');

        // Trigger count-it inside
        el.querySelectorAll('.count-it').forEach(c => {
          if (!c.dataset.done) {
            c.dataset.done = 'true';
            animateCounter(c, parseInt(c.dataset.target), 1800);
          }
        });
      }
    });

    // Timeline
    document.querySelectorAll('.tl-item').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < wH * 0.88) el.classList.add('visible');
    });
  }

  /* ── 9. BARRES DE PROGRESSION ── */
  let barsDone = false;
  function animateProgressBars() {
    if (barsDone) return;
    document.querySelectorAll('.pi-fill').forEach(bar => {
      const rect = bar.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        bar.classList.add('animated');
        barsDone = true;
      }
    });
  }

  /* ── 10. TABS PAYS ── */
  document.querySelectorAll('.pays-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pays = btn.dataset.pays;

      // Boutons
      document.querySelectorAll('.pays-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Panels
      document.querySelectorAll('.pays-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + pays);
      if (panel) {
        panel.classList.add('active');
        // Reset et relancer les barres
        barsDone = false;
        setTimeout(animateProgressBars, 100);
      }
    });
  });

  /* ── 11. FILTRES GALERIE ── */
  const galerieItems = document.querySelectorAll('.galerie-item');
  document.querySelectorAll('.gf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      galerieItems.forEach(item => {
        if (filter === 'all' || item.dataset.cat === filter) {
          item.style.display = '';
          setTimeout(() => { item.style.opacity = '1'; item.style.transform = '' }, 10);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(.95)';
          setTimeout(() => { item.style.display = 'none' }, 300);
        }
      });
    });
  });

  /* ── 12. LIGHTBOX GALERIE ── */
  const modal = document.getElementById('galerieModal');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalCat = document.getElementById('modalCat');

  galerieItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('.gi-img');
      const title = item.querySelector('.gi-info h4')?.textContent || '';
      const desc = item.querySelector('.gi-info span')?.textContent || '';
      const cat = item.dataset.cat || '';
      if (modalImg) modalImg.src = img?.src || '';
      if (modalTitle) modalTitle.textContent = title;
      if (modalDesc) modalDesc.textContent = desc;
      if (modalCat) modalCat.textContent = cat.toUpperCase();
      modal?.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function closeModal() {
    modal?.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  /* ── 13. FORMULAIRE DE CONTACT ── */
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  contactForm?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    btn.disabled = true;
    setTimeout(() => {
      contactForm.style.display = 'none';
      if (formSuccess) formSuccess.style.display = 'block';
    }, 1400);
  });

  /* ── 14. ACTUALITÉS DEPUIS DB ── */
  async function loadActualites() {
    const grid = document.getElementById('actuGrid');
    if (!grid) return;

    try {
      const res = await fetch('tables/actualites?limit=3&sort=created_at');
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        grid.innerHTML = '';
        data.data.forEach(actu => {
          grid.insertAdjacentHTML('beforeend', buildActuCard(actu));
        });
      } else {
        grid.innerHTML = buildDefaultActus();
      }
    } catch (e) {
      grid.innerHTML = buildDefaultActus();
    }
  }

  function buildActuCard(a) {
    const date = a.date_publication || new Date(a.created_at).toLocaleDateString('fr-FR');
    const img = a.image_url || 'images/hero-ppv-vaccination.jpg';
    const cat = a.categorie || 'Actualité';
    return `
      <div class="actu-card" data-reveal="up">
        <img src="${img}" alt="${a.titre}" class="actu-img" onerror="this.src='images/hero-ppv-vaccination.jpg'"/>
        <div class="actu-body">
          <div class="actu-meta">
            <span class="actu-cat">${cat}</span>
            <span class="actu-date"><i class="fas fa-calendar-alt"></i>${date}</span>
          </div>
          <h3>${a.titre}</h3>
          <p>${(a.contenu || '').substring(0, 130)}${a.contenu?.length > 130 ? '...' : ''}</p>
          <a href="actualites.html" class="actu-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>`;
  }

  function buildDefaultActus() {
    return `
      <div class="actu-card" data-reveal="up">
        <img src="images/hero-formation-ppv.jpg" alt="Atelier de formation" class="actu-img"/>
        <div class="actu-body">
          <div class="actu-meta"><span class="actu-cat">Formation</span><span class="actu-date"><i class="fas fa-calendar-alt"></i>Mars 2024</span></div>
          <h3>Atelier de validation des référentiels de compétences PPV</h3>
          <p>Un atelier régional de validation des référentiels de compétences des para-professionnels vétérinaires s'est tenu à Dakar en présence de toutes les parties prenantes...</p>
          <a href="actualites.html" class="actu-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
      <div class="actu-card" data-reveal="up" style="transition-delay:.1s">
        <img src="images/ppv-examen-animal.jpg" alt="Mission terrain Bénin" class="actu-img"/>
        <div class="actu-body">
          <div class="actu-meta"><span class="actu-cat">Terrain</span><span class="actu-date"><i class="fas fa-calendar-alt"></i>Février 2024</span></div>
          <h3>Mission de suivi au Bénin : les PPV à l'œuvre dans le Nord</h3>
          <p>Une mission de suivi-évaluation dans les zones d'intervention au nord du Bénin a permis de mesurer l'impact concret des formations sur les pratiques des PPV certifiés...</p>
          <a href="actualites.html" class="actu-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
      <div class="actu-card" data-reveal="up" style="transition-delay:.2s">
        <img src="images/reunion-communautaire.jpg" alt="Réunion Lomé" class="actu-img"/>
        <div class="actu-body">
          <div class="actu-meta"><span class="actu-cat">Événement</span><span class="actu-date"><i class="fas fa-calendar-alt"></i>Janvier 2024</span></div>
          <h3>Atelier de plaidoyer pour la reconnaissance légale des PPV au Togo</h3>
          <p>Le projet P3V a organisé un atelier de plaidoyer réunissant élus, ministères et organisations de la société civile togolaise pour la formalisation du statut des PPV...</p>
          <a href="actualites.html" class="actu-link">Lire la suite <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>`;
  }

  /* ── 15. ACTIVE NAV LINK ── */
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a');
    let current = '';
    sections.forEach(s => {
      const top = s.getBoundingClientRect().top;
      if (top <= 120) current = s.id;
    });
    navItems.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href')?.includes(current) && current) a.classList.add('active');
    });
  }

  /* ── 16. SMOOTH ANCHOR ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── 17. STORY SLIDER — scroll-driven (scrollytelling) ── */
  (function initStorySlider() {
    const TOTAL        = 6;
    const section      = document.getElementById('histoire');
    const progressFill = document.getElementById('storyProgressFill');
    const prevBtn      = document.getElementById('storyPrev');
    const nextBtn      = document.getElementById('storyNext');
    const scCurrent    = document.getElementById('scCurrent');
    const scTotal      = document.getElementById('scTotal');
    const navBtns      = document.querySelectorAll('.sn-btn');

    if (!section) return; // Not on index page

    if (scTotal) scTotal.textContent = TOTAL;

    let current     = 0;
    let isAnimating = false;
    let isMobile    = window.innerWidth <= 768;

    /* ─── UI update ─── */
    function updateUI(idx) {
      navBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
      if (progressFill) progressFill.style.width = ((idx + 1) / TOTAL * 100) + '%';
      if (scCurrent) scCurrent.textContent = idx + 1;
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === TOTAL - 1;
    }

    /* ─── Slide switch ─── */
    function goTo(idx) {
      if (isAnimating || idx < 0 || idx >= TOTAL || idx === current) return;
      isAnimating = true;

      const from = document.getElementById('sslide-' + current);
      const to   = document.getElementById('sslide-' + idx);

      if (from) { from.classList.remove('active'); from.style.display = 'none'; }
      if (to)   {
        to.style.display = 'grid';
        void to.offsetWidth; // force reflow → restart animation
        to.classList.add('active');
      }

      current = idx;
      updateUI(current);
      setTimeout(() => { isAnimating = false; }, 600);
    }

    /* ─────────────────────────────────────────────
       SCROLL-JACKING (desktop only)
       The section height = 7 × 100vh.
       Sticky panel = 100vh pinned at top.
       Scroll range available = 7×vh - 1×vh = 6×vh.
       We divide that range by (TOTAL - 1) to get
       one "step" per slide transition.
    ───────────────────────────────────────────── */
    function getSectionTop() {
      return section.getBoundingClientRect().top + window.pageYOffset;
    }

    function onScroll() {
      if (isMobile) return; // use buttons on mobile

      const scrolled       = window.pageYOffset - getSectionTop();
      const scrollRange    = section.offsetHeight - window.innerHeight; // ≈ 6 × vh

      // Outside the section? Do nothing.
      if (scrolled < 0 || scrolled > scrollRange + 50) return;

      // Map scroll offset → slide index [0 … TOTAL-1]
      const progress   = Math.max(0, Math.min(1, scrolled / scrollRange));
      const slideIndex = Math.min(Math.round(progress * (TOTAL - 1)), TOTAL - 1);

      if (slideIndex !== current) goTo(slideIndex);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* ─── Resize: recalculate mobile breakpoint ─── */
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 768;
    });

    /* ─── Nav tabs (always work) ─── */
    navBtns.forEach((btn, i) => btn.addEventListener('click', () => {
      if (!isMobile) {
        // Scroll page to matching position so scroll-jacking stays in sync
        const sectionTop  = getSectionTop();
        const scrollRange = section.offsetHeight - window.innerHeight;
        const targetScroll = sectionTop + (i / (TOTAL - 1)) * scrollRange;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else {
        goTo(i);
      }
    }));

    /* ─── Mobile buttons ─── */
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

    /* ─── Mobile swipe ─── */
    let touchStartX = 0;
    const slidesContainer = document.getElementById('storySlides');
    if (slidesContainer) {
      slidesContainer.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      slidesContainer.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
      }, { passive: true });
    }

    /* ─── Init ─── */
    updateUI(0);
  })();

  /* ── 18. METHODOLOGY SLIDER (Délégation) ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.m-nav-btn');
    if (!btn) return;
    const step = btn.dataset.step;
    const wrap = btn.closest('.methodo-slider-wrap');
    if (!wrap) return;
    wrap.querySelectorAll('.m-nav-btn').forEach(b => b.classList.remove('active'));
    wrap.querySelectorAll('.methodo-slide').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    wrap.querySelector(`#mstep-${step}`)?.classList.add('active');
  });

  /* ── 19. METHODOLOGY INTERNAL TABS (Délégation) ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ms-tab-btn');
    if (!btn) return;
    const sub = btn.dataset.sub;
    const slide = btn.closest('.methodo-slide');
    if (!slide) return;
    slide.querySelectorAll('.ms-tab-btn').forEach(b => b.classList.remove('active'));
    slide.querySelectorAll('.ms-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    slide.querySelector(`.ms-tab-content[data-sub="${sub}"]`)?.classList.add('active');
  });

  /* ── 20. INIT ── */
  window.addEventListener('load', () => {
    loadActualites();
    revealOnScroll();
    animateProgressBars();
  });

})();

/* ── YouTube lazy-load (global function) ── */
function loadYTVideo() {
  const thumb  = document.getElementById('ssYTThumb');
  const frame  = document.getElementById('ssYTFrame');
  const iframe = document.getElementById('ssYTIframe');
  if (!thumb || !frame || !iframe) return;

  // Use a P3V/OMSA related video; fall back to WOAH channel
  iframe.src = 'https://www.youtube.com/embed/PJtOZo-WEJ0?autoplay=1&rel=0&modestbranding=1';
  thumb.style.display  = 'none';
  frame.style.display  = 'block';
}

