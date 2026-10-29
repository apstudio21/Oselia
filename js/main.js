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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqMobile = window.matchMedia('(max-width: 800px)');
  const fmt = n => n.toLocaleString('uk-UA').replace(/ /g, ' ');
  const img = (name, small) => `assets/img/${name}${small ? '-s' : ''}.webp`;
  const icon = id => `<svg><use href="#i-${id}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const loadJSON = url => fetch(url, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(url); return r.json(); });
  const lock = on => document.body.classList.toggle('is-locked', on);

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
  const onScroll = () => hdr && hdr.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Телефон: список номерів (десктоп і мобільний) ---------- */
  const phonePop = $('[data-phone-pop]');
  const phoneBtns = $$('[data-phone-btn]');
  const closePhone = () => { if (!phonePop) return; phonePop.hidden = true; phoneBtns.forEach(b => b.setAttribute('aria-expanded', 'false')); };
  phoneBtns.forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = phonePop.hidden;
    closePhone();
    if (open) { phonePop.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
  }));
  document.addEventListener('click', e => { if (phonePop && !phonePop.hidden && !phonePop.contains(e.target)) closePhone(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePhone(); });
  window.addEventListener('scroll', () => { if (phonePop && !phonePop.hidden && window.scrollY > 600) closePhone(); }, { passive: true });

  /* ---------- Мобільне меню ---------- */
  const mnav = $('[data-mnav]');
  const burger = $('[data-burger]');
  if (mnav && burger) {
    const open = () => { closePhone(); mnav.hidden = false; burger.setAttribute('aria-expanded', 'true'); lock(true); };
    const close = () => { mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); lock(false); };
    burger.addEventListener('click', open);
    $$('[data-mnav-close]', mnav).forEach(b => b.addEventListener('click', close));
    $$('a', mnav).forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mnav.hidden) close(); });
  }

  /* ---------- Сезон: літо в розробці ---------- */
  $$('[data-summer]').forEach(b => b.addEventListener('click', () => {
    toast('Літня версія сайту зараз у розробці — незабаром тут з\'являться походи, озера й літні ціни.');
  }));

  /* ---------- Стартове відео ---------- */
  const heroVideo = $('.hero__video');
  function setupHeroVideo() {
    if (!heroVideo) return;
    const m = mqMobile.matches;
    const src = m ? heroVideo.dataset.srcMobile : heroVideo.dataset.srcDesktop;
    if (m && heroVideo.dataset.posterMobile) heroVideo.poster = heroVideo.dataset.posterMobile;
    if (heroVideo.dataset.current !== src) { heroVideo.dataset.current = src; heroVideo.src = src; }
    if (!reduceMotion) heroVideo.play().catch(() => {}); else heroVideo.pause();
  }
  setupHeroVideo();
  mqMobile.addEventListener?.('change', setupHeroVideo);

  /* ---------- Відео в секціях: грають лише у видимій зоні ---------- */
  const vids = $$('video[data-autoplay]');
  if ('IntersectionObserver' in window && vids.length) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      const v = en.target;
      if (en.isIntersecting && !reduceMotion) { v.preload = 'auto'; v.play().catch(() => {}); }
      else v.pause();
    }), { threshold: .2 });
    vids.forEach(v => io.observe(v));
  }

  /* ---------- Поява елементів ---------- */
  const revealIO = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { (en.target.__reveal || en.target).classList.add('is-in'); revealIO.unobserve(en.target); }
      }), { threshold: .12 })
    : null;
  const reveal = (el, cls = 'reveal') => {
    if (!revealIO || !el) return;
    el.classList.add(cls);
    const host = cls === 'reveal' ? (el.parentElement || el) : el;
    if (host !== el) host.__reveal = el;
    revealIO.observe(host);
  };
  $$('.nums__col li').forEach((li, i) => { li.style.transitionDelay = `${(i % 3) * 120}ms`; reveal(li, 'fade-up'); });
  $$('.trip').forEach((t, i) => { t.style.transitionDelay = `${i * 100}ms`; reveal(t, 'fade-up'); });
  $$('.gear__row').forEach((t, i) => { t.style.transitionDelay = `${i * 100}ms`; reveal(t, 'fade-up'); });

  /* ---------- Хвиляста рамка кухні ---------- */
  $$('[data-wave]').forEach(card => {
    const path = $('.kitchen__wave path', card);
    const draw = () => {
      const w = card.clientWidth, h = card.clientHeight;
      if (!w || !h) return;
      const A = 6, inset = 10, step = 2;
      const L = 46;                                   // приблизна довжина хвилі
      const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset;
      const sides = [
        [x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0],
        [x1, y1, x0, y1, 0, 1], [x0, y1, x0, y0, -1, 0]
      ];
      let d = '';
      sides.forEach(([ax, ay, bx, by, nx, ny], si) => {
        const len = Math.hypot(bx - ax, by - ay);
        const n = Math.max(2, Math.round(len / L));
        const cnt = Math.ceil(len / step);
        for (let k = 0; k <= cnt; k++) {
          const t = k / cnt;
          const off = A * Math.sin(t * n * Math.PI * 2);
          const x = ax + (bx - ax) * t + nx * off, y = ay + (by - ay) * t + ny * off;
          d += (si === 0 && k === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
      });
      path.setAttribute('d', d + 'Z');
    };
    draw();
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(card);
    else window.addEventListener('resize', draw);
  });

  /* ---------- Модальні вікна (меню) ---------- */
  let lastFocus = null;
  function openModal(name) {
    const m = $(`[data-modal="${name}"]`);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false; lock(true);
    $('.modal__box', m).scrollTop = 0;
    setTimeout(() => $('[data-close].round', m)?.focus(), 30);
  }
  function closeModal(m) {
    m.hidden = true; lock(false);
    lastFocus?.focus?.();
  }
  $$('.modal').forEach(m => $$('[data-close]', m).forEach(b => b.addEventListener('click', () => closeModal(m))));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = $$('.modal').find(x => !x.hidden);
    if (m) closeModal(m);
  });

  /* ---------- Номери ---------- */
  let ROOMS = [];
  const roomsGrid = $('[data-rooms]');
  const roomPick = $('[data-room-pick]');

  function roomCard(r) {
    const el = document.createElement('article');
    el.className = 'room';
    el.innerHTML = `
      <button class="room__photo" type="button" aria-label="Фото та деталі: ${esc(r.name)}">
        <img src="${img(r.photos[0], true)}" srcset="${img(r.photos[0], true)} 800w, ${img(r.photos[0])} 1600w" sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw" alt="${esc(r.name)}" loading="lazy" width="800" height="600">
        <span class="room__count">${r.photos.length} фото</span>
        <span class="room__tags">
          <span class="tag">${icon('area')}${r.area} м²</span>
          <span class="tag">${icon('guests')}до ${r.guests} гостей</span>
          <span class="tag">${icon('bed')}${esc(r.bedShort)}</span>
        </span>
      </button>
      <h3 class="room__name">${esc(r.name)}</h3>
      <p class="room__short">${esc(r.short)}</p>
      <div class="room__price"><span>Вартість за ніч</span><b>${fmt(r.priceFrom)} – ${fmt(r.priceTo)} грн</b></div>
      <div class="room__actions">
        <button class="btn btn--line" type="button" data-room-more>Детальніше</button>
        <button class="btn" type="button" data-room-book>Забронювати</button>
      </div>`;
    $('.room__photo', el).addEventListener('click', () => openRoom(r));
    $('[data-room-more]', el).addEventListener('click', () => openRoom(r));
    $('[data-room-book]', el).addEventListener('click', () => bookRoom(r));
    return el;
  }

  /* Бокова панель номера */
  const drawer = $('[data-drawer]');
  const drawerBox = $('[data-room-drawer]');
  function openRoom(r) {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawerBox.innerHTML = `
      <div class="rd__stage">
        ${r.photos.map((p, i) => `<img src="${img(p)}" alt="${esc(r.name)}, фото ${i + 1}" class="${i ? '' : 'is-on'}" ${i ? 'loading="lazy"' : ''}>`).join('')}
        <button class="round rd__arrow rd__arrow--prev" type="button" aria-label="Попереднє фото"><svg style="transform:scaleX(-1)"><use href="#i-arrow"/></svg></button>
        <button class="round rd__arrow rd__arrow--next" type="button" aria-label="Наступне фото">${icon('arrow')}</button>
        <div class="rd__dots">${r.photos.map((_, i) => `<span class="${i ? '' : 'is-on'}"></span>`).join('')}</div>
      </div>
      <div class="rd__thumbs">${r.photos.map((p, i) => `<button type="button" class="${i ? '' : 'is-on'}" aria-label="Фото ${i + 1}"><img src="${img(p, true)}" alt="" loading="lazy"></button>`).join('')}</div>
      <div class="rd__body">
        <p class="rd__sub">${esc(r.subtitle)}</p>
        <h2 id="room-title">${esc(r.name)}</h2>
        <p>${esc(r.description)}</p>
        <ul class="rd__feat">${r.features.map(f => `<li>${icon(f.icon)}${esc(f.text)}</li>`).join('')}</ul>
        <div class="rd__price"><span>Вартість за ніч</span><b>${fmt(r.priceFrom)} – ${fmt(r.priceTo)} грн</b></div>
        <button class="btn btn--full" type="button" data-rd-book>Забронювати цей номер</button>
      </div>`;
    const imgs = $$('.rd__stage img', drawerBox), th = $$('.rd__thumbs button', drawerBox), dots = $$('.rd__dots span', drawerBox);
    let i = 0;
    const go = n => {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach((x, k) => x.classList.toggle('is-on', k === i));
      th.forEach((x, k) => x.classList.toggle('is-on', k === i));
      dots.forEach((x, k) => x.classList.toggle('is-on', k === i));
    };
    $('.rd__arrow--prev', drawerBox).addEventListener('click', () => go(i - 1));
    $('.rd__arrow--next', drawerBox).addEventListener('click', () => go(i + 1));
    th.forEach((b, k) => b.addEventListener('click', () => go(k)));
    let x0 = null;
    const stage = $('.rd__stage', drawerBox);
    stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    drawer.onkeydown = e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); };
    $('[data-rd-book]', drawerBox).addEventListener('click', () => { closeDrawer(); bookRoom(r); });
    drawer.hidden = false; lock(true);
    $('.drawer__panel', drawer).scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('is-open')));
    setTimeout(() => $('.drawer__x', drawer)?.focus(), 60);
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open'); lock(false);
    setTimeout(() => { drawer.hidden = true; }, reduceMotion ? 0 : 600);
    lastFocus?.focus?.();
  }
  if (drawer) {
    $$('[data-close]', drawer).forEach(b => b.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }

  /* Мініатюри номерів у бронюванні */
  function renderPicker() {
    if (!roomPick) return;
    roomPick.innerHTML = `
      <label><input type="radio" name="room" value="Будь-який вільний" checked>
        <span class="rpick__any">${icon('bed')}</span>
        <span><b>Будь-який вільний</b><small>підберемо під вашу компанію</small></span>
        <span class="rpick__check">${icon('check')}</span></label>` +
      ROOMS.map(r => `
      <label><input type="radio" name="room" value="${esc(r.name)}" data-guests="${r.guests}">
        <img src="${img(r.photos[0], true)}" alt="" loading="lazy">
        <span><b>${esc(r.name)}</b><small>до ${r.guests} гостей · від ${fmt(r.priceFrom)} грн</small></span>
        <span class="rpick__check">${icon('check')}</span></label>`).join('');
    $$('input', roomPick).forEach(inp => inp.addEventListener('change', () => {
      const g = $('input[name="guests"]', form), max = +inp.dataset.guests;
      if (g && max && +g.value > max) g.value = max;
    }));
  }

  if (roomsGrid || roomPick) {
    loadJSON('data/rooms.json').then(d => {
      ROOMS = d.rooms || [];
      if (roomsGrid) {
        roomsGrid.innerHTML = '';
        ROOMS.forEach(r => { const c = roomCard(r); roomsGrid.appendChild(c); reveal($('.room__photo img', c)); });
      }
      renderPicker();
    }).catch(() => {
      if (roomsGrid) roomsGrid.innerHTML = '<p class="muted">Не вдалося завантажити номери. Оновіть сторінку або напишіть нам у месенджер.</p>';
    });
  }

  /* ---------- Меню ---------- */
  const menuBody = $('[data-menu-body]');
  const menuTabs = $('[data-menu-tabs]');
  let menuLoaded = false, menuSpy = null;
  function renderMenu(d) {
    menuBody.innerHTML = d.sections.map((s, i) => `
      <section class="menu__sec" id="menu-${i}" data-i="${i}">
        <h3><span class="ic">${icon(s.icon || 'plate')}</span>${esc(s.title)}</h3>
        ${s.note ? `<p class="menu__note">${esc(s.note)}</p>` : ''}
        <div class="menu__list">${s.items.map(([n, w, p]) => `<div class="menu__row"><span>${esc(n)}</span><small>${esc(w)}</small><b>${fmt(p)} грн</b></div>`).join('')}</div>
      </section>`).join('');
    menuTabs.innerHTML = d.sections.map((s, i) => `<button type="button" data-to="${i}" class="${i ? '' : 'is-on'}">${icon(s.icon || 'plate')}${esc(s.title)}</button>`).join('');
    const box = $('.modal__box--menu');
    const tabs = $$('button', menuTabs);
    const setOn = i => {
      tabs.forEach((x, k) => x.classList.toggle('is-on', k === i));
      const t = tabs[i]; if (t) menuTabs.scrollTo({ left: t.offsetLeft - (menuTabs.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    };
    let jumping = false;
    tabs.forEach((b, k) => b.addEventListener('click', () => {
      const sec = document.getElementById('menu-' + k);
      if (!sec) return;
      jumping = true; setOn(k);
      box.scrollTo({ top: sec.offsetTop - menuTabs.offsetHeight + 4, behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => { jumping = false; }, 700);
    }));
    box.addEventListener('scroll', () => {
      if (jumping) return;
      const secs = $$('.menu__sec', menuBody);
      const y = box.scrollTop + menuTabs.offsetHeight + 40;
      let cur = 0;
      secs.forEach((s, k) => { if (s.offsetTop <= y) cur = k; });
      if (!tabs[cur].classList.contains('is-on')) setOn(cur);
    }, { passive: true });
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

  /* ---------- Лайтбокс ---------- */
  const lb = $('[data-lightbox]');
  const lbStage = $('[data-lb-stage]');
  let lbItems = [], lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    lbStage.innerHTML = it.type === 'video'
      ? `<video src="${it.src}" autoplay loop playsinline controls muted aria-label="${esc(it.alt)}"></video>`
      : `<img src="${it.src}" alt="${esc(it.alt)}">`;
    $$('.lightbox__nav', lb).forEach(b => { b.hidden = lbItems.length < 2; });
  }
  function lbOpen(items, i, from) {
    if (!lb) return;
    lbItems = items; lastFocus = from || document.activeElement;
    lbShow(i); lb.hidden = false; lock(true);
    $('[data-close]', lb).focus();
  }
  if (lb) {
    const lbClose = () => { lb.hidden = true; lbStage.innerHTML = ''; lock(false); lastFocus?.focus?.(); };
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
  const galItems = $$('[data-gallery] .gal__item');
  const galData = galItems.map(it => ({ src: it.dataset.src, type: it.dataset.type, alt: $('img', it)?.alt || '' }));
  galItems.forEach((it, i) => it.addEventListener('click', () => lbOpen(galData, i, it)));

  /* ---------- Відгуки з фото ---------- */
  const revTrack = $('[data-reviews]');
  if (revTrack) {
    loadJSON('data/reviews.json').then(d => {
      revTrack.innerHTML = d.reviews.map((r, ri) => `
        <article class="rev">
          ${r.photos && r.photos.length ? `<div class="rev__photos">${r.photos.slice(0, 2).map((p, k) => `<button type="button" data-rev="${ri}" data-k="${k}" aria-label="Фото гостя ${esc(r.name)}"><img src="assets/img/rev/${p}.webp" alt="Фото з відгуку: ${esc(r.name)}" loading="lazy"></button>`).join('')}</div>` : ''}
          <div class="rev__body">
            <div class="rev__top"><span class="stars" aria-label="Оцінка ${r.stars} з 5">${icon('star').repeat(r.stars)}</span><svg class="q" aria-hidden="true"><use href="#i-quote"/></svg></div>
            <p class="rev__text">${esc(r.text)}</p>
            <button class="rev__more" type="button" hidden>Читати повністю</button>
            <div class="rev__who"><span class="rev__ava" aria-hidden="true">${esc(r.name.trim()[0])}</span><span><b>${esc(r.name)}</b><span>${esc(r.date)}, Google</span></span></div>
          </div>
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
      $$('[data-rev]', revTrack).forEach(b => b.addEventListener('click', () => {
        const r = d.reviews[+b.dataset.rev];
        lbOpen(r.photos.map(p => ({ src: `assets/img/rev/${p}.webp`, type: 'img', alt: `Фото з відгуку: ${r.name}` })), +b.dataset.k, b);
      }));
    }).catch(() => {});
    const step = dir => revTrack.scrollBy({ left: dir * ((revTrack.firstElementChild?.offsetWidth || 380) + 20), behavior: 'smooth' });
    $('[data-rev-prev]')?.addEventListener('click', () => step(-1));
    $('[data-rev-next]')?.addEventListener('click', () => step(1));
  }

  /* ---------- Бронювання ---------- */
  const form = $('[data-booking]');
  const STAYS = ['Ретрит', 'Корпоратив'];
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
    $('#booking, #retreat-booking')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function bookRoom(r) {
    selectWhat('Номер');
    const inp = roomPick && $$('input[name="room"]', roomPick).find(i => i.value === r.name);
    if (inp) { inp.checked = true; inp.dispatchEvent(new Event('change')); }
    goBooking();
  }
  $$('[data-book]').forEach(b => b.addEventListener('click', () => { selectWhat(b.dataset.book); goBooking(); }));

  if (form) {
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const inEl = $('input[name="in"]', form), outEl = $('input[name="out"]', form);
    inEl.min = iso(new Date()); outEl.min = iso(new Date());
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
      const isStay = what === 'Номер' || STAYS.includes(what);
      if (!f.get('in')) {
        err.textContent = isStay ? 'Вкажіть дату заїзду.' : 'Вкажіть бажану дату.';
        err.hidden = false; inEl.classList.add('is-bad'); inEl.focus();
        return;
      }
      err.hidden = true;
      const lines = ['Вітаю! Хочу забронювати в Оселі:'];
      if (isStay) {
        lines.push(what === 'Номер' ? `Номер: ${f.get('room') || 'Будь-який вільний'}` : what);
        const out = f.get('out');
        lines.push(`Дати: ${dateUA(f.get('in'))}${out ? ' – ' + dateUA(out) + ` (${nights(f.get('in'), out)} ноч.)` : ''}`);
      } else {
        lines.push(what);
        lines.push(`Дата: ${dateUA(f.get('in'))}`);
      }
      lines.push(`${STAYS.includes(what) ? 'Учасників' : 'Гостей'}: ${f.get('guests')}`);
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
  (() => {
    const c = $('[data-snow]');
    if (!c || reduceMotion) return;
    const ctx = c.getContext('2d');
    let W = 0, H = 0, dpr = 1, flakes = [], raf = 0;
    const mk = any => {
      const r = (Math.random() * 2.2 + .8) * dpr;
      return { x: Math.random() * W, y: any ? Math.random() * H : -10 * dpr, r, v: (r / dpr) * .32 + .25, s: Math.random() * Math.PI * 2, a: Math.random() * .45 + .35 };
    };
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      flakes = Array.from({ length: Math.round(Math.min(110, innerWidth / 13)) }, () => mk(true));
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      ctx.shadowColor = 'rgba(40,60,55,.28)'; ctx.shadowBlur = 3 * dpr;
      for (const f of flakes) {
        f.y += f.v * dpr; f.s += .012; f.x += Math.sin(f.s) * .35 * dpr;
        if (f.y > H + 10) Object.assign(f, mk(false));
        ctx.beginPath(); ctx.fillStyle = `rgba(255,255,255,${f.a})`;
        ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    addEventListener('resize', size);
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) tick(); });
    size(); tick();
  })();
})();
