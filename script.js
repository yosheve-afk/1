/* ==========================================================================
   Maya Sinclair | Accountant portfolio
   Vanilla JavaScript, no dependencies.
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- Settings you can edit ---------- */

  // Where the contact form sends its data (JSON POST). Works with services like
  // Formspree, Basin or your own API. Leave empty to open the visitor's email
  // app with the message pre-filled instead.
  const FORM_ENDPOINT = '';
  const CONTACT_EMAIL = 'maya@example.com';

  /* ---------- Helpers ---------- */

  const $  = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasObserver = 'IntersectionObserver' in window;

  /* ---------- Footer year ---------- */

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: shadow once the page scrolls ---------- */

  const header = $('.site-header');
  const onScrollHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Mobile menu ---------- */

  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Close after choosing a link
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  // Close with Escape (and return focus to the button)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Close when tapping outside the header
  document.addEventListener('click', (event) => {
    if (menu.classList.contains('is-open') && !header.contains(event.target)) setMenu(false);
  });

  // Reset when the layout grows to desktop
  window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  /* ---------- Scroll spy: highlight the current section in the nav ---------- */

  if (hasObserver) {
    const navLinks = $$('.nav-links a');
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    ['about', 'services', 'experience', 'contact'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });

    // Clear the highlight when back at the very top
    window.addEventListener('scroll', () => {
      if (window.scrollY < 200) navLinks.forEach((link) => link.removeAttribute('aria-current'));
    }, { passive: true });
  }

  /* ---------- Scroll reveal (Intersection Observer) ---------- */

  const revealEls = $$('.reveal');

  // Stagger siblings inside any [data-stagger] group
  $$('[data-stagger]').forEach((group) => {
    $$(':scope > .reveal', group).forEach((el, index) => {
      el.style.transitionDelay = `${index * 90}ms`;
    });
  });

  if (hasObserver && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Hero portrait: fall back to initials if the photo is missing ---------- */

  const portrait = $('.portrait');
  const portraitImg = portrait && $('img', portrait);
  if (portraitImg) {
    const showFallback = () => portrait.classList.add('no-photo');
    portraitImg.addEventListener('error', showFallback);
    // The error may already have fired before this script ran
    if (portraitImg.complete && portraitImg.naturalWidth === 0) showFallback();
  }

  /* ---------- Trial balance animation ---------- */

  const ledger = $('#ledger');
  if (ledger) {
    const bodyRows = $$('tbody tr', ledger);
    const footRow = $('tfoot tr', ledger);
    const status = $('.ledger-status', ledger);
    const replay = $('.ledger-replay', ledger);
    const counters = $$('[data-count]', ledger);
    const format = (n) => n.toLocaleString('en-US');
    let runId = 0;

    const showFinal = () => {
      counters.forEach((el) => { el.textContent = format(Number(el.dataset.count)); });
      [...bodyRows, footRow, status].forEach((el) => el.classList.add('in'));
    };

    const countUp = (el, target, duration, id) => new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        if (id !== runId) return resolve();
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    const play = async () => {
      const id = ++runId;

      // Reset
      counters.forEach((el) => { el.textContent = '0'; });
      [...bodyRows, footRow, status].forEach((el) => el.classList.remove('in'));
      await wait(450);
      if (id !== runId) return;

      // Each account line appears and counts up in turn
      for (const row of bodyRows) {
        row.classList.add('in');
        $$('[data-count]', row).forEach((cell) => countUp(cell, Number(cell.dataset.count), 700, id));
        await wait(420);
        if (id !== runId) return;
      }

      // Totals count up together, then the balance is confirmed
      await wait(350);
      if (id !== runId) return;
      footRow.classList.add('in');
      await Promise.all($$('[data-count]', footRow).map((cell) =>
        countUp(cell, Number(cell.dataset.count), 1000, id)));
      if (id !== runId) return;
      await wait(150);
      if (id !== runId) return;
      status.classList.remove('in');
      void status.offsetWidth; // restart the stamp animation on replay
      status.classList.add('in');
    };

    if (reducedMotion || !hasObserver) {
      showFinal();
      if (replay) replay.hidden = true;
    } else {
      // Play once when the card is on screen (on phones it sits below the portrait)
      const ledgerObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          play();
        }
      }, { threshold: 0.4 });
      ledgerObserver.observe(ledger);
      if (replay) replay.addEventListener('click', play);
    }
  }

  /* ---------- Timeline: the rule fills in as you scroll ---------- */

  const timeline = $('[data-timeline]');
  if (timeline) {
    const items = $$('.t-item', timeline);
    let ticking = false;

    const updateTimeline = () => {
      ticking = false;
      const rect = timeline.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;            // reading line
      const lineY = clamp(anchor - rect.top, 0, rect.height);
      timeline.style.setProperty('--progress', `${lineY}px`);
      items.forEach((item) => item.classList.toggle('is-passed', lineY >= item.offsetTop + 12));
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateTimeline);
    };

    if (reducedMotion) {
      timeline.style.setProperty('--progress', `${timeline.offsetHeight}px`);
      items.forEach((item) => item.classList.add('is-passed'));
    } else {
      updateTimeline();
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
    }
  }

  /* ---------- Contact form ---------- */

  const form = $('#contact-form');
  if (form) {
    const status = $('.form-status', form);
    const submitBtn = $('.form-submit', form);

    const rules = {
      name: (v) => (v.trim() ? '' : 'Enter your name.'),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
        ? '' : 'Enter a valid email address, like name@company.com.'),
      message: (v) => (v.trim().length >= 10
        ? '' : 'Add a short message (at least 10 characters) so I can prepare a useful reply.')
    };

    const validateField = (name) => {
      const input = form.elements[name];
      const message = rules[name](input.value);
      $(`#${name}-error`).textContent = message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    };

    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      input.addEventListener('blur', () => validateField(name));
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validateField(name);
      });
    });

    // "Enquire about ..." links on the service cards pre-select the service
    $$('[data-service]').forEach((link) => {
      link.addEventListener('click', () => { form.elements.service.value = link.dataset.service; });
    });

    const setStatus = (text, type) => {
      status.textContent = text;
      status.className = `form-status${type ? ` is-${type}` : ''}`;
    };

    const send = async (data) => {
      if (FORM_ENDPOINT) {
        const response = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        return 'sent';
      }
      // No endpoint configured: hand off to the visitor's email app
      const subject = encodeURIComponent(`Enquiry: ${data.service}`);
      const body = encodeURIComponent(`${data.message}\n\n${data.name}\n${data.email}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      return 'mailto';
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('', '');

      const results = Object.keys(rules).map((name) => [name, validateField(name)]);
      const firstInvalid = results.find(([, ok]) => !ok);
      if (firstInvalid) {
        form.elements[firstInvalid[0]].focus();
        return;
      }

      // Honeypot: real visitors never fill this in
      if (form.elements.website.value) {
        setStatus('Message sent. I\u2019ll reply within one business day.', 'success');
        form.reset();
        return;
      }

      const data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        service: form.elements.service.value,
        message: form.elements.message.value.trim()
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending\u2026';

      try {
        const result = await send(data);
        setStatus(
          result === 'sent'
            ? `Thanks, ${data.name.split(' ')[0]}. Message sent. I\u2019ll reply within one business day.`
            : 'Your email app should open with the message ready to send.',
          'success'
        );
        form.reset();
      } catch (error) {
        console.error(error);
        setStatus(`The message didn\u2019t send. Try again, or email ${CONTACT_EMAIL} directly.`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      }
    });
  }
})();
