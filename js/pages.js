/* =========================================================
   PROJET P3V – Script commun pour toutes les pages
   ========================================================= */

(function() {
  'use strict';

  /* ── LOADER ── */
  const loader = document.getElementById('pageLoader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');
  let pct = 0;
  const lt = setInterval(() => {
    pct += Math.random() * 22;
    if (pct >= 100) { pct = 100; clearInterval(lt); }
    if (loaderFill) loaderFill.style.width = pct + '%';
    if (loaderPct) loaderPct.textContent = Math.round(pct) + '%';
    if (pct === 100) setTimeout(() => {
      loader?.classList.add('hidden');
      revealOnScroll();
    }, 300);
  }, 55);

  /* ── CURSOR ── */
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let mx=0,my=0,fx=0,fy=0;
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    if(cursor){cursor.style.left=mx+'px';cursor.style.top=my+'px';}
  });
  (function anim(){
    fx+=(mx-fx)*.14; fy+=(my-fy)*.14;
    if(follower){follower.style.left=fx+'px';follower.style.top=fy+'px';}
    requestAnimationFrame(anim);
  })();

  /* ── HEADER SCROLL ── */
  const header = document.getElementById('site-header');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const cur = window.pageYOffset;
    if(cur>80 && cur>lastScroll) header?.classList.add('nav-hidden');
    else header?.classList.remove('nav-hidden');
    lastScroll = cur;
    const btn = document.getElementById('backToTop');
    if(btn){ cur>400?btn.classList.add('visible'):btn.classList.remove('visible'); }
    revealOnScroll();
    animateProgressBars();
  },{passive:true});

  document.getElementById('backToTop')?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

  /* ── BURGER ── */
  const burgerBtn = document.getElementById('burgerBtn');
  const navLinks = document.getElementById('navLinks');
  burgerBtn?.addEventListener('click', () => {
    burgerBtn.classList.toggle('open');
    navLinks?.classList.toggle('open');
  });
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burgerBtn?.classList.remove('open');
    navLinks.classList.remove('open');
  }));

  /* ── SCROLL REVEAL ── */
  function revealOnScroll() {
    const wH = window.innerHeight;
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top < wH * 0.9) {
        el.classList.add('visible');
        el.querySelectorAll('.count-it').forEach(c => {
          if(!c.dataset.done){ c.dataset.done='true'; animCounter(c, parseInt(c.dataset.target),1800); }
        });
      }
    });
    document.querySelectorAll('.tl-item').forEach(el => {
      if(el.getBoundingClientRect().top < wH*.88) el.classList.add('visible');
    });
  }

  /* ── PROGRESS BARS ── */
  function animateProgressBars() {
    document.querySelectorAll('.pi-fill:not(.animated)').forEach(bar => {
      if(bar.getBoundingClientRect().top < window.innerHeight*.95)
        bar.classList.add('animated');
    });
  }

  /* ── COUNTERS ── */
  function animCounter(el, target, dur) {
    let v = 0; const step = target/(dur/16);
    const t = setInterval(() => {
      v += step;
      if(v>=target){v=target;clearInterval(t);}
      el.textContent = Math.floor(v).toLocaleString('fr-FR');
    }, 16);
  }

  /* ── SMOOTH ANCHOR ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const tgt = document.querySelector(a.getAttribute('href'));
      if(tgt){e.preventDefault();tgt.scrollIntoView({behavior:'smooth'});}
    });
  });

  window.addEventListener('load', () => {
    revealOnScroll();
    animateProgressBars();
  });

  /* ── METHODOLOGY SLIDER ── */
  document.querySelectorAll('.m-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      const wrap = btn.closest('.methodo-slider-wrap');
      wrap.querySelectorAll('.m-nav-btn').forEach(b => b.classList.remove('active'));
      wrap.querySelectorAll('.methodo-slide').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      wrap.querySelector(`#mstep-${step}`)?.classList.add('active');
    });
  });

  /* ── METHODOLOGY INTERNAL TABS ── */
  document.querySelectorAll('.ms-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.sub;
      const slide = btn.closest('.methodo-slide');
      slide.querySelectorAll('.ms-tab-btn').forEach(b => b.classList.remove('active'));
      slide.querySelectorAll('.ms-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      slide.querySelector(`.ms-tab-content[data-sub="${sub}"]`)?.classList.add('active');
    });
  });

  // Export helpers
  window.P3V = { animCounter, revealOnScroll };
})();
