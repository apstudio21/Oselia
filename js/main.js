/* =========================================================
   Оселя — інтерактив сайту
   ========================================================= */
(() => {
  'use strict';

  const CONTACTS = {
    telegram: 'oselia_dragobrat',      // Telegram рецепції (t.me/…)
    viber: '+380960901234'             // номер Viber рецепції
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 800px)').matches;
  const fmt = n => n.toLocaleString('uk-UA').replace(/ /g, ' ');
  const img = (name, small) => `assets/img/${name}${small ? '-s' : ''}.webp`;
  const loadJSON = url => fetch(url, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(url); return r.json(); });

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Тост ---------- */
  const toastEl = $('[data-toast]');
  let toastTimer;
  function toast(text, ms = 5200) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  /* ---------- Хедер ---------- */
  const hdr = $('[data-hdr]');
  const forceSolid = document.body.hasAttribute('data-solid-header');
  function onScroll() {
    if (!hdr) return;
    hdr.classList.toggle('is-solid', forceSolid || window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Телефон-поповер ---------- */
  const phoneBtn = $('[data-phone-btn]');
  const phonePop = $('#phone-pop');
  if (phoneBtn && phonePop) {
    const close = () => { phonePop.hidden = true; phoneBtn.setAttribute('aria-expanded', 'false'); };
    phoneBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = phonePop.hidden;
      phonePop.hidden = !open;
      phoneBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => { if (!phonePop.hidden && !phonePop.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---------- Мобільне меню ---------- */
  const mnav = $('[data-mnav]');
  const burger = $('[data-burger]');
  if (mnav && burger) {
    const open = () => { mnav.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.classList.add('is-locked'); };
    const close = () => { mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked'); };
    burger.addEventListener('click', open);
    $$('[data-mnav-close]', mnav).forEach(b => b.addEventListener('click', close));
    $$('a', mnav).forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) close(); });
  }

  /* ---------- Сезон: зима / літо ---------- */
  const heroVideo = $('.hero__video');
  function setupHeroVideo() {
    if (!heroVideo) return;
    const src = isMobile() ? heroVideo.dataset.srcMobile : heroVideo.dataset.srcDesktop;
    if (isMobile() && heroVideo.dataset.posterMobile) heroVideo.poster = heroVideo.dataset.posterMobile;
    if (heroVideo.dataset.current !== src) {
      heroVideo.dataset.current = src;
      heroVideo.src = src;
    }
    if (root.dataset.season === 'winter' && !reduceMotion) heroVideo.play().catch(() => {});
    else heroVideo.pause();
  }
  function setSeason(s, user) {
    root.dataset.season = s;
    try { localStorage.setItem('oselia-season', s); } catch (e) {}
    if (user) {
      const url = new URL(location.href);
      url.searchParams.set('season', s);
      history.replaceState(null, '', url);
    }
    setupHeroVideo();
    snow.toggle(s === 'winter');
    syncChips();
  }
  $$('[data-set-season]').forEach(b => {
    b.addEventListener('click', () => setSeason(b.dataset.setSeason, true));
  });
  window.matchMedia('(max-width: 800px)').addEventListener?.('change', setupHeroVideo);

  /* ---------- Відео в секціях: грають лише у видимій зоні ---------- */
  const vids = $$('video[data-autoplay]');
  if ('IntersectionObserver' in window && vids.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const v = en.target;
        if (en.isIntersecting && !reduceMotion) { v.preload = 'auto'; v.play().catch(() => {}); }
        else v.pause();
      });
    }, { threshold: .25 });
    vids.forEach(v => io.observe(v));
  }

  /* ---------- Поява фото ---------- */
  const revealIO = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { en.target.__reveal.classList.add('is-in'); revealIO.unobserve(en.target); }
      }), { threshold: .12 })
    : null;
  // спостерігаємо за батьківським блоком: сам елемент прихований clip-path
  const reveal = el => {
    if (!revealIO) return;
    el.classList.add('reveal');
    const host = el.parentElement || el;
    host.__reveal = el;
    revealIO.observe(host);
  };

  /* ---------- Модальні вікна ---------- */
  let lastFocus = null;
  function openModal(name) {
    const m = $(`[data-modal="${name}"]`);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add('is-locked');
    const box = $('.modal__box', m);
    box.scrollTop = 0;
    setTimeout(() => $('[data-close].round', m)?.focus(), 30);
  }
  function closeModal(m) {
    m.hidden = true;
    if (!$$('.modal').some(x => !x.hidden) && (!mnav || mnav.hidden)) document.body.classList.remove('is-locked');
    lastFocus?.focus?.();
  }
  $$('.modal').forEach(m => {
    $$('[data-close]', m).forEach(b => b.addEventListener('click', () => closeModal(m)));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = $$('.modal').find(x => !x.hidden);
    if (m) closeModal(m);
  });

  /* ---------- Номери ---------- */
  let ROOMS = [];
  const roomsGrid = $('[data-rooms]');
  const roomSelect = $('[data-room-select]');

  function roomCard(r) {
    const el = document.createElement('article');
    el.className = 'room';
    el.innerHTML = `
      <button class="room__photo ridge" type="button" aria-label="Фото та деталі: ${r.name}">
        <img src="${img(r.photos[0], true)}" srcset="${img(r.photos[0], true)} 800w, ${img(r.photos[0])} 1600w" sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" alt="${r.name}" loading="lazy" width="800" height="600">
        <span class="room__count">${r.photos.length} фото</span>
      </button>
      <h3 class="room__name">${r.name}</h3>
      <p class="room__meta"><span>${r.area} м²</span><span>${r.guests} ${r.guests === 1 ? 'гість' : 'гості'}</span><span>${r.beds}</span></p>
      <p class="room__short">${r.short}</p>
      <div class="room__price"><span>Вартість</span><b>${fmt(r.priceFrom)} – ${fmt(r.priceTo)} грн</b></div>
      <div class="room__actions">
        <button class="btn btn--line" type="button" data-room-more>Детальніше</button>
        <button class="btn" type="button" data-room-book>Забронювати</button>
      </div>`;
    $('.room__photo', el).addEventListener('click', () => showRoom(r));
    $('[data-room-more]', el).addEventListener('click', () => showRoom(r));
    $('[data-room-book]', el).addEventListener('click', () => bookRoom(r));
    return el;
  }

  function showRoom(r) {
    const box = $('[data-room-modal]');
    if (!box) return;
    box.innerHTML = `
      <div class="rm__gallery">
        <div class="rm__stage">
          ${r.photos.map((p, i) => `<img src="${img(p)}" alt="${r.name}, фото ${i + 1}" class="${i ? '' : 'is-on'}" ${i ? 'loading="lazy"' : ''}>`).join('')}
          <button class="round rm__arrow rm__arrow--prev" type="button" aria-label="Попереднє фото"><svg style="transform:scaleX(-1)"><use href="#i-arrow"/></svg></button>
          <button class="round rm__arrow rm__arrow--next" type="button" aria-label="Наступне фото"><svg><use href="#i-arrow"/></svg></button>
        </div>
        <div class="rm__thumbs">
          ${r.photos.map((p, i) => `<button type="button" class="${i ? '' : 'is-on'}" aria-label="Фото ${i + 1}"><img src="${img(p, true)}" alt="" loading="lazy"></button>`).join('')}
        </div>
      </div>
      <div class="rm__info">
        <p class="rm__sub">${r.subtitle}</p>
        <h2 id="room-title">${r.name}</h2>
        <p>${r.description}</p>
        <ul class="rm__feat">${r.features.map(f => `<li>${f}</li>`).join('')}</ul>
        <div class="rm__price"><span>Вартість</span><b>${fmt(r.priceFrom)} – ${fmt(r.priceTo)} грн</b></div>
        <button class="btn btn--full" type="button" data-rm-book>Забронювати цей номер</button>
      </div>`;
    const imgs = $$('.rm__stage img', box);
    const th = $$('.rm__thumbs button', box);
    let i = 0;
    const go = n => {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach((x, k) => x.classList.toggle('is-on', k === i));
      th.forEach((x, k) => x.classList.toggle('is-on', k === i));
      th[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    };
    $('.rm__arrow--prev', box).addEventListener('click', () => go(i - 1));
    $('.rm__arrow--next', box).addEventListener('click', () => go(i + 1));
    th.forEach((b, k) => b.addEventListener('click', () => go(k)));
    // свайп
    let x0 = null;
    const stage = $('.rm__stage', box);
    stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    box.onkeydown = e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); };
    $('[data-rm-book]', box).addEventListener('click', () => { closeModal($('[data-modal="room"]')); bookRoom(r); });
    openModal('room');
  }

  if (roomsGrid) {
    loadJSON('data/rooms.json').then(d => {
      ROOMS = d.rooms || [];
      roomsGrid.innerHTML = '';
      ROOMS.forEach(r => {
        const card = roomCard(r);
        roomsGrid.appendChild(card);
        reveal($('.room__photo', card));
      });
      if (roomSelect) ROOMS.forEach(r => {
        const o = document.createElement('option');
        o.value = r.name; o.textContent = `${r.name} — до ${r.guests} гостей`;
        roomSelect.appendChild(o);
      });
    }).catch(() => {
      roomsGrid.innerHTML = '<p class="muted">Не вдалося завантажити номери. Оновіть сторінку або напишіть нам у месенджер.</p>';
    });
  }

  /* ---------- Меню ---------- */
  const menuBody = $('[data-menu-body]');
  const menuTabs = $('[data-menu-tabs]');
  let menuLoaded = false;
  function renderMenu(d) {
    menuBody.innerHTML = d.sections.map((s, i) => `
      <section class="menu__sec" id="menu-${i}">
        <h3>${s.title}</h3>
        ${s.items.map(([n, w, p]) => `<div class="menu__row"><span>${n}</span><small>${w}</small><b>${fmt(p)} грн</b></div>`).join('')}
      </section>`).join('');
    menuTabs.innerHTML = d.sections.map((s, i) => `<button type="button" data-to="menu-${i}" class="${i ? '' : 'is-on'}">${s.title}</button>`).join('');
    $$('button', menuTabs).forEach(b => b.addEventListener('click', () => {
      $$('button', menuTabs).forEach(x => x.classList.toggle('is-on', x === b));
      document.getElementById(b.dataset.to)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    menuLoaded = true;
  }
  $$('[data-open-menu]').forEach(b => b.addEventListener('click', () => {
    if (!menuBody) return;
    if (!menuLoaded) {
      menuBody.innerHTML = '<p class="muted" style="padding:24px 0">Завантажуємо меню…</p>';
      loadJSON('data/menu.json').then(renderMenu).catch(() => { menuBody.innerHTML = '<p class="muted">Меню тимчасово недоступне.</p>'; });
    }
    openModal('menu');
  }));

  /* ---------- Відгуки ---------- */
  const revTrack = $('[data-reviews]');
  if (revTrack) {
    loadJSON('data/reviews.json').then(d => {
      revTrack.innerHTML = d.reviews.map(r => `
        <article class="rev">
          <span class="stars" aria-label="Оцінка ${r.stars} з 5">${'<svg><use href="#i-star"/></svg>'.repeat(r.stars)}</span>
          <p class="rev__text">${r.text}</p>
          <button class="rev__more" type="button" hidden>Читати повністю</button>
          <div class="rev__who"><b>${r.name}</b><span>${r.date}, Google</span></div>
        </article>`).join('');
      $$('.rev', revTrack).forEach(card => {
        const t = $('.rev__text', card), more = $('.rev__more', card);
        if (t.scrollHeight > t.clientHeight + 4) {
          more.hidden = false;
          more.addEventListener('click', () => {
            const open = card.classList.toggle('is-open');
            more.textContent = open ? 'Згорнути' : 'Читати повністю';
          });
        }
      });
    }).catch(() => {});
    const step = dir => revTrack.scrollBy({ left: dir * (revTrack.firstElementChild?.offsetWidth || 380) * 1.05, behavior: 'smooth' });
    $('[data-rev-prev]')?.addEventListener('click', () => step(-1));
    $('[data-rev-next]')?.addEventListener('click', () => step(1));
  }

  /* ---------- Галерея / лайтбокс ---------- */
  const lb = $('[data-lightbox]');
  const lbStage = $('[data-lb-stage]');
  const galItems = $$('[data-gallery] .gal__item');
  let lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + galItems.length) % galItems.length;
    const it = galItems[lbIndex];
    const alt = $('img', it)?.alt || '';
    lbStage.innerHTML = it.dataset.type === 'video'
      ? `<video src="${it.dataset.src}" autoplay loop playsinline controls muted aria-label="${alt}"></video>`
      : `<img src="${it.dataset.src}" alt="${alt}">`;
  }
  if (lb && galItems.length) {
    galItems.forEach((it, i) => it.addEventListener('click', () => {
      lastFocus = it;
      lbShow(i); lb.hidden = false; document.body.classList.add('is-locked');
      $('[data-close]', lb).focus();
    }));
    const lbClose = () => { lb.hidden = true; lbStage.innerHTML = ''; document.body.classList.remove('is-locked'); lastFocus?.focus?.(); };
    $('[data-close]', lb).addEventListener('click', lbClose);
    $('[data-lb-prev]', lb).addEventListener('click', () => lbShow(lbIndex - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => lbShow(lbIndex + 1));
    lb.addEventListener('click', e => { if (e.target === lb || e.target === lbStage) lbClose(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose();
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });
  }

  /* ---------- Бронювання ---------- */
  const form = $('[data-booking]');
  const STAYS = ['Ретрит', 'Корпоратив'];
  function syncChips() {
    if (!form) return;
    // якщо обраний варіант прихований (інший сезон) — повертаємось на «Номер»
    const checked = $('input[name="what"]:checked', form);
    if (checked && checked.closest('[data-only]') && getComputedStyle(checked.closest('label')).display === 'none') {
      $('input[name="what"][value="Номер"]', form).checked = true;
    }
    updateForm();
  }
  function updateForm() {
    if (!form) return;
    const what = $('input[name="what"]:checked', form)?.value || 'Номер';
    const isRoom = what === 'Номер';
    const isStay = isRoom || STAYS.includes(what);
    const rf = $('[data-room-field]', form);
    if (rf) rf.hidden = !isRoom;
    $('[data-out-field]', form).style.display = isStay ? '' : 'none';
    $('[data-date-label-in]', form).textContent = isStay ? 'Заїзд' : 'Дата';
  }
  function selectWhat(value) {
    if (!form) return;
    const inp = $$('input[name="what"]', form).find(i => i.value === value);
    if (inp) inp.checked = true;
    updateForm();
  }
  function goBooking() {
    $('#booking')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => $('input[name="in"]', form)?.focus({ preventScroll: true }), 700);
  }
  function bookRoom(r) {
    selectWhat('Номер');
    if (roomSelect) roomSelect.value = r.name;
    const g = $('input[name="guests"]', form);
    if (g && +g.value > r.guests) g.value = r.guests;
    goBooking();
  }
  $$('[data-book]').forEach(b => b.addEventListener('click', () => { selectWhat(b.dataset.book); goBooking(); }));

  if (form) {
    const today = new Date();
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const inEl = $('input[name="in"]', form), outEl = $('input[name="out"]', form);
    inEl.min = iso(today); outEl.min = iso(today);
    inEl.addEventListener('change', () => {
      inEl.classList.remove('is-bad');
      if (inEl.value) {
        const n = new Date(inEl.value); n.setDate(n.getDate() + 1);
        outEl.min = iso(n);
        if (!outEl.value || outEl.value <= inEl.value) outEl.value = iso(n);
      }
    });
    $$('input[name="what"]', form).forEach(i => i.addEventListener('change', updateForm));
    $$('[data-step]', form).forEach(b => b.addEventListener('click', () => {
      const g = $('input[name="guests"]', form);
      g.value = Math.min(40, Math.max(1, (+g.value || 1) + (+b.dataset.step)));
    }));
    updateForm();

    const err = $('[data-booking-err]', form);
    const dateUA = v => v ? v.split('-').reverse().join('.') : '';
    const nights = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

    form.addEventListener('submit', e => {
      e.preventDefault();
      const via = e.submitter?.dataset.send || 'telegram';
      const f = new FormData(form);
      const what = f.get('what');
      if (!f.get('in')) {
        err.textContent = (what === 'Номер' || STAYS.includes(what)) ? 'Вкажіть дату заїзду.' : 'Вкажіть бажану дату.';
        err.hidden = false; inEl.classList.add('is-bad'); inEl.focus();
        return;
      }
      err.hidden = true;
      const lines = ['Вітаю! Хочу забронювати в Оселі:'];
      if (what === 'Номер' || STAYS.includes(what)) {
        lines.push(what === 'Номер' ? `Номер: ${f.get('room')}` : what);
        const out = f.get('out');
        lines.push(`Дати: ${dateUA(f.get('in'))}${out ? ' – ' + dateUA(out) + ` (${nights(f.get('in'), out)} ноч.)` : ''}`);
      } else {
        lines.push(`${what}`);
        lines.push(`Дата: ${dateUA(f.get('in'))}`);
      }
      lines.push(`Гостей: ${f.get('guests')}`);
      if (f.get('name')) lines.push(`Ім'я: ${f.get('name')}`);
      if (f.get('note')) lines.push(`Коментар: ${f.get('note')}`);
      lines.push('(заявка з сайту oselia.org)');
      const text = lines.join('\n');

      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      if (via === 'viber') {
        location.href = `viber://chat?number=${encodeURIComponent(CONTACTS.viber)}&draft=${encodeURIComponent(text)}`;
        toast('Відкриваємо Viber. Якщо текст не підставився — він уже скопійований, просто вставте його в чат.');
      } else {
        window.open(`https://t.me/${CONTACTS.telegram}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        toast('Відкриваємо Telegram. Якщо текст не підставився — він уже скопійований, просто вставте його в чат.');
      }
    });
  }

  /* ---------- Сніг ---------- */
  const snow = (() => {
    const c = $('[data-snow]');
    if (!c || reduceMotion) return { toggle() {} };
    const ctx = c.getContext('2d');
    let W = 0, H = 0, dpr = 1, flakes = [], raf = 0, on = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      const count = Math.round(Math.min(110, innerWidth / 13));
      flakes = Array.from({ length: count }, () => mk(true));
    }
    function mk(any) {
      const r = (Math.random() * 2.2 + .8) * dpr;
      return { x: Math.random() * W, y: any ? Math.random() * H : -10 * dpr, r, v: (r / dpr) * .32 + .25, s: Math.random() * Math.PI * 2, a: Math.random() * .45 + .35 };
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.y += f.v * dpr; f.s += .012; f.x += Math.sin(f.s) * .35 * dpr;
        if (f.y > H + 10) Object.assign(f, mk(false));
        ctx.beginPath(); ctx.fillStyle = `rgba(255,255,255,${f.a})`; ctx.shadowColor = 'rgba(40,60,55,.28)'; ctx.shadowBlur = 3 * dpr;
        ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    function toggle(state) {
      on = state;
      cancelAnimationFrame(raf);
      if (on && !document.hidden) { if (!flakes.length) size(); tick(); }
      else ctx.clearRect(0, 0, W, H);
    }
    addEventListener('resize', () => { if (on) size(); });
    document.addEventListener('visibilitychange', () => toggle(on));
    size();
    return { toggle };
  })();

  setSeason(root.dataset.season || 'winter', false);
})();
