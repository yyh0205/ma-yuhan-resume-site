(() => {
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.reading-progress');
  let progressFrame = 0;
  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (progress) progress.style.transform = `scaleX(${fraction})`;
    progressFrame = 0;
  };
  const requestProgress = () => {
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateProgress);
  };
  updateProgress();
  window.addEventListener('scroll', requestProgress, { passive: true });
  window.addEventListener('resize', requestProgress);
  window.addEventListener('load', requestProgress);
  if ('ResizeObserver' in window) new ResizeObserver(requestProgress).observe(document.body);

  const portrait = document.querySelector('.signal-card');
  if (portrait && !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    portrait.addEventListener('pointermove', (event) => {
      const bounds = portrait.getBoundingClientRect();
      portrait.style.setProperty('--photo-x', `${(event.clientX - bounds.left - bounds.width / 2) / bounds.width * 8}px`);
      portrait.style.setProperty('--photo-y', `${(event.clientY - bounds.top - bounds.height / 2) / bounds.height * 8}px`);
    });
    portrait.addEventListener('pointerleave', () => {
      portrait.style.setProperty('--photo-x', '0px');
      portrait.style.setProperty('--photo-y', '0px');
    });
  }

  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const setActiveNavigation = () => {
    const anchors = navLinks
      .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter(({ section }) => section);
    const current = anchors.reduce((active, item) => (
      item.section.getBoundingClientRect().top <= window.innerHeight * 0.35 ? item : active
    ), anchors[0]);

    anchors.forEach(({ link }) => link.classList.toggle('is-current', link === current?.link));
  };
  setActiveNavigation();
  window.addEventListener('scroll', setActiveNavigation, { passive: true });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const experienceCards = [...document.querySelectorAll('.experience-card')];
  const emptyState = document.querySelector('.empty-state');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;

      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      experienceCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.hidden = !show;
        if (show) {
          visibleCount += 1;
          card.classList.add('is-visible');
        }
      });
      if (emptyState) emptyState.hidden = visibleCount > 0;
    });
  });

  const feedback = document.querySelector('.copy-feedback');
  let feedbackTimer;
  const showFeedback = (message) => {
    if (!feedback) return;
    feedback.textContent = message;
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => { feedback.textContent = ''; }, 2800);
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  };

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy || '';
      const label = button.dataset.copyLabel || '内容';
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else if (!fallbackCopy(value)) {
          throw new Error('Copy unavailable');
        }
        showFeedback(`${label}已复制，可直接粘贴使用。`);
      } catch {
        showFeedback(`暂时无法自动复制，请手动记录${label}。`);
      }
    });
  });

  document.querySelector('[data-print]')?.addEventListener('click', () => window.print());

  const year = document.getElementById('current-year');
  const album = document.querySelector('.interest-gallery');
  const slides = [...document.querySelectorAll('.interest-item')];
  const dialog = document.querySelector('.album-dialog');
  let photoIndex = 0;
  const showPhoto = (index) => {
    photoIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-current', i === photoIndex));
    document.querySelector('[data-album-count]').textContent = `${photoIndex + 1} / ${slides.length}`;
  };
  if (album && slides.length) {
    album.classList.add('album-ready');
    showPhoto(0);
    document.querySelector('[data-album-prev]').addEventListener('click', () => showPhoto(photoIndex - 1));
    document.querySelector('[data-album-next]').addEventListener('click', () => showPhoto(photoIndex + 1));
    document.querySelector('[data-album-open]').addEventListener('click', () => {
      const source = slides[photoIndex].querySelector('img');
      const preview = dialog.querySelector('img');
      preview.src = source.src;
      preview.alt = source.alt;
      dialog.showModal();
    });
    document.querySelector('[data-album-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }
  const guide = document.querySelector('.little-guide');
  const guideToggle = document.querySelector('.guide-toggle');
  const guidePanel = document.querySelector('.guide-panel');
  if (guide && guideToggle && guidePanel) {
    const setGuideOpen = (open) => {
      guidePanel.hidden = !open;
      guideToggle.setAttribute('aria-expanded', String(open));
      guideToggle.setAttribute('aria-label', open ? '收起快捷导航' : '打开快捷导航');
    };
    guideToggle.addEventListener('click', () => setGuideOpen(guidePanel.hidden));
    guidePanel.addEventListener('click', (event) => {
      if (event.target.closest('a')) setGuideOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (!guide.contains(event.target)) setGuideOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !guidePanel.hidden) {
        setGuideOpen(false);
        guideToggle.focus();
      }
    });
  }
  if (year) year.textContent = String(new Date().getFullYear());
})();
