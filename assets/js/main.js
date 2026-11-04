/* 张烜 · Portfolio — interactions */
(() => {
  const doc = document;
  const nav = doc.getElementById('nav');
  const navToggle = doc.getElementById('navToggle');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- deep link（原生平滑滚动会吞掉首屏锚点，这里补一次） ---------- */
  if (location.hash.length > 1) {
    const jump = () => {
      const el = doc.getElementById(location.hash.slice(1));
      if (!el) return;
      const prev = doc.documentElement.style.scrollBehavior;
      doc.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 68);
      doc.documentElement.style.scrollBehavior = prev;
    };
    jump();
    addEventListener('load', jump);
  }

  /* ---------- active section ---------- */
  const links = [...doc.querySelectorAll('[data-nav]')];
  const sections = links
    .map((a) => doc.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((l) =>
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- reveal ---------- */
  const revealEls = [...doc.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
    /* 首屏内容直接显示 */
    requestAnimationFrame(() => {
      revealEls.forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('is-in');
      });
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- count up ---------- */
  const counters = [...doc.querySelectorAll('[data-count]')];
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    const pad = Number(el.dataset.pad || 0);
    const dur = 1100;
    const t0 = performance.now();
    const fmt = (v) => (pad ? String(v).padStart(pad + String(target).length, '0') : String(v));
    if (reduce) { el.textContent = fmt(target); return; }
    /* 兜底：即使 rAF 被节流也要落到终值 */
    setTimeout(() => { el.textContent = fmt(target); }, dur + 900);
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- soft parallax on the glow ---------- */
  const glow = doc.querySelector('.glow');
  if (glow && !reduce && matchMedia('(pointer:fine)').matches) {
    let raf = 0;
    addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / innerWidth - 0.5) * 26;
        const y = (e.clientY / innerHeight - 0.5) * 22;
        glow.style.transform = `translate3d(${x}px,${y}px,0)`;
        raf = 0;
      });
    }, { passive: true });
  }

  /* ---------- video modal ---------- */
  const modal = doc.getElementById('vmodal');
  if (!modal) return;
  const video = doc.getElementById('vmVideo');
  const stage = modal.querySelector('.vmodal-stage');
  const titleEl = doc.getElementById('vmTitle');
  const metaEl = doc.getElementById('vmMeta');
  const openLink = doc.getElementById('vmOpen');
  const closeBtn = modal.querySelector('.vmodal-close');
  let lastFocus = null;

  const openModal = (trigger) => {
    const src = trigger.dataset.video;
    if (!src) return;
    lastFocus = trigger;
    titleEl.textContent = trigger.dataset.title || '作品';
    metaEl.textContent = trigger.dataset.meta || '';
    video.poster = trigger.dataset.poster || '';
    video.src = src;
    video.load();
    openLink.href = src;
    stage.removeAttribute('data-ar');
    modal.classList.remove('is-vertical');
    modal.hidden = false;
    doc.body.classList.add('is-locked');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    closeBtn.focus({ preventScroll: true });

    video.addEventListener('loadedmetadata', function once() {
      video.removeEventListener('loadedmetadata', once);
      if (video.videoHeight > video.videoWidth) { stage.dataset.ar = 'vertical'; modal.classList.add('is-vertical'); }
    }, { once: true });

    const tryPlay = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
    tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    video.pause();
    video.removeAttribute('src');
    video.load();
    doc.body.classList.remove('is-locked');
    setTimeout(() => { modal.hidden = true; }, 260);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };

  doc.querySelectorAll('[data-video]').forEach((btn) =>
    btn.addEventListener('click', () => openModal(btn))
  );

  modal.querySelectorAll('[data-close]').forEach((el) =>
    el.addEventListener('click', closeModal)
  );

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      e.preventDefault();
      closeModal();
    }
    /* 焦点圈在弹窗里 */
    if (e.key === 'Tab' && !modal.hidden) {
      const focusables = modal.querySelectorAll('button, a[href], video');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });


  /* ---------- 联系方式：点击后本地还原，页面源码里不出现明文 ---------- */
  const cBtn = doc.querySelector('[data-contact-reveal]');
  const cBox = doc.querySelector('[data-contact-details]');
  if (cBtn && cBox && window.__ct) {
    const dec = (s) => String.fromCharCode(...s.split(',').map((n) => Number(n) + 7));
    cBtn.addEventListener('click', () => {
      const email = dec(window.__ct.e);
      const phone = dec(window.__ct.p);
      const wechat = dec(window.__ct.w);
      cBox.innerHTML = `
        <div class="contact-row"><span class="k">EMAIL</span><a href="mailto:${email}">${email}</a></div>
        <div class="contact-row"><span class="k">TEL</span><a href="tel:${phone}">${phone}</a></div>
        <div class="contact-row"><span class="k">WECHAT</span><span class="v">${wechat}</span></div>`;
      cBox.hidden = false;
      cBtn.hidden = true;
      cBtn.setAttribute('aria-expanded', 'true');
    }, { once: true });
  }

  /* 点卡片之外、播放完毕后不自动关闭，保留控制条 */
})();

