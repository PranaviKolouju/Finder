(() => {
  const { domain: D, views: V, store } = Finder;
  const app = document.querySelector('#app');
  const dialog = document.querySelector('#place-dialog');
  const state = { detailId: null, panel: 'results', filters: D.emptyFilters(), draft: D.emptyFilters(), query: '', compareMode: false, compare: [] };
  let modal = null, toastTimer, opener = null;
  const place = id => Finder.places.find(p => p.id === id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const route = () => location.hash.slice(1) || 'portal';
  function render(focusHeading = false) {
    Finder.timePicker.close();
    const routes = { portal: V.portal, explore: () => V.explore(state), compare: () => V.compare(state), saved: V.savedPage, reservations: V.reservations };
    app.innerHTML = (routes[route()] || routes.portal)();
    document.title = `${({ portal: 'mySLU', explore: 'Explore', compare: 'Compare', saved: 'Saved places', reservations: 'Reservations' })[route()] || 'mySLU'} · Finder`;
    if (focusHeading) { const heading = app.querySelector('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }
  function toast(message) {
    clearTimeout(toastTimer);
    const el = document.querySelector('#toast');
    el.innerHTML = `<span>${D.escape(message)}</span><button data-action="dismiss-toast" aria-label="Dismiss notification">×</button>`;
    el.classList.add('visible');
    toastTimer = setTimeout(() => el.classList.remove('visible'), 5500);
  }
  function showModal(html, focusSelector) {
    Finder.timePicker.close();
    dialog.innerHTML = html;
    if (!dialog.open) { opener = document.activeElement; dialog.showModal(); }
    dialog.scrollTop = 0;
    const target = dialog.querySelector(focusSelector || '#dialog-title');
    target?.setAttribute('tabindex', '-1'); target?.focus();
  }
  function closeModal() { Finder.timePicker.close(); dialog.close(); modal = null; if (opener?.isConnected) opener.focus(); else { const heading = app.querySelector('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); } }
  function showDetails(id) {
    state.detailId = id;
    if (route() !== 'explore') { location.hash = 'explore'; return; }
    render();
    const heading = app.querySelector('#place-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 760px)').matches) app.querySelector('.place-panel')?.scrollIntoView({ block: 'start' });
  }
  function closeDetails() {
    const id = state.detailId;
    state.detailId = null;
    render();
    app.querySelector(`[data-action="details"][data-id="${id}"]`)?.focus({ preventScroll: true });
  }
  function reserve(id) {
    const selectedDate = state.filters.date;
    const date = selectedDate && selectedDate >= D.dateToday() && D.isThisWeek(selectedDate) ? selectedDate : '';
    modal = {
      kind: 'reservation', id,
      draft: { roomId: '', date, group: state.filters.group || '1', groupRange: true, start: state.filters.start || '', end: state.filters.end || '', amenities: [] }
    };
    showReservation();
  }
  function showReservation() {
    modal.kind = 'reservation';
    showModal(V.reservationForm(place(modal.id), modal.draft));
    refreshRooms();
  }
  function readReservation() {
    const form = dialog.querySelector('#reservation-form');
    if (!form) return;
    const data = new FormData(form);
    modal.draft = { date: data.get('date') || '', group: data.get('group'), groupRange: true, roomId: data.get('roomId') || '', start: data.get('start') || '', end: data.get('end') || '', amenities: data.getAll('amenities') };
  }
  function refreshRooms() {
    const p = place(modal.id), draft = modal.draft;
    for (const name of ['start', 'end']) {
      const options = D.reservationTimes(p, name, draft.start);
      if (draft[name] && !options.includes(draft[name])) draft[name] = '';
      const picker = dialog.querySelector(`.time-picker[data-name="${name}"]`);
      const current = [...picker.querySelectorAll('[data-time-value]')].map(option => option.dataset.timeValue).filter(Boolean);
      if (current.join(',') !== options.join(',') || picker.querySelector('input').value !== draft[name]) {
        const focused = picker.contains(document.activeElement);
        picker.outerHTML = Finder.timePicker.render(name, name === 'start' ? 'Start' : 'End', draft[name], 'booking', true, options);
        if (focused) dialog.querySelector(`.time-picker[data-name="${name}"] .time-trigger`).focus({ preventScroll: true });
      }
    }
    const ready = D.meetingReady(draft);
    const rooms = ready && D.openDuring(p, draft.start, draft.end) ? p.rooms.filter(room => D.roomMatches(room, draft, store.state.bookings)) : [];
    if (!rooms.some(room => room.id === draft.roomId)) draft.roomId = '';
    const focusedRoom = document.activeElement?.name === 'roomId' ? document.activeElement.value : null;
    dialog.querySelector('#room-results').innerHTML = V.roomResults(p, draft, store.state.bookings);
    for (const selector of ['#room-refinements', '#room-results', '.room-booking-footer']) dialog.querySelector(selector).hidden = !ready;
    dialog.querySelector('#reservation-form [type="submit"]').disabled = !draft.roomId;
    dialog.querySelector('#reservation-error').textContent = draft.start && draft.end && draft.start === draft.end ? 'Choose different start and end times.' : '';
    if (focusedRoom) [...dialog.querySelectorAll('[name="roomId"]')].find(input => input.value === focusedRoom)?.focus({ preventScroll: true });
  }
  function bookingValid() {
    const d = modal.draft, p = place(modal.id);
    const room = p.rooms.find(room => room.id === d.roomId);
    return D.meetingReady(d) && D.openDuring(p, d.start, d.end) && Boolean(room)
      && Number.isInteger(Number(d.group)) && Number(d.group) >= 1 && Number(d.group) <= room.capacity
      && D.roomMatches(room, d, store.state.bookings);
  }
  function toggleCompare(id, trigger) {
    if (!state.compareMode) return;
    if (state.compare.includes(id)) state.compare = state.compare.filter(x => x !== id);
    else if (state.compare.length >= 2) { if (trigger?.type === 'checkbox') trigger.checked = false; return; }
    else state.compare.push(id);
    render();
    app.querySelector(`[data-action="compare-toggle"][data-id="${id}"]`)?.focus();
  }
  const actions = {
    panel: el => { state.panel = el.dataset.panel; if (state.panel === 'filters') state.draft = clone(state.filters); render(); const target = app.querySelector(state.panel === 'filters' ? 'h1' : '#place-search'); if (state.panel === 'filters') target?.setAttribute('tabindex', '-1'); target?.focus(); },
    'cancel-filters': () => { state.panel = 'results'; render(); app.querySelector('.filters-button')?.focus(); },
    'reset-filters': () => { state.draft = D.emptyFilters(); render(); },
    'clear-filters': () => { state.filters = D.emptyFilters(); state.query = ''; render(); toast('Filteres cleared.'); },
    details: el => showDetails(el.dataset.id),
    'close-dialog': closeModal,
    'close-details': closeDetails,
    save: el => {
      const savedIndex = [...app.querySelectorAll('.saved-title-row .save-heart')].indexOf(el);
      const id = el.dataset.id; store.toggleSaved(id); const isSaved = store.state.saved.includes(id);
      document.querySelectorAll(`[data-action="save"][data-id="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', isSaved); if (b.classList.contains('save-heart')) b.innerHTML = V.heartIcon(); else b.textContent = isSaved ? '♥ Saved' : '♡ Save'; b.setAttribute('aria-label', `${isSaved ? 'Unsave' : 'Save'} ${place(id).name}`); });
      if (route() === 'saved') {
        render();
        const hearts = app.querySelectorAll('.saved-title-row .save-heart');
        const target = hearts[Math.min(savedIndex, hearts.length - 1)] || app.querySelector('h1');
        if (!hearts.length) target?.setAttribute('tabindex', '-1');
        target?.focus({ preventScroll: true });
      }
      else { const count = app.querySelector('a[href="#saved"] span'); if (count) count.textContent = store.state.saved.length; }
      toast(`${place(id).shortName} ${isSaved ? 'saved' : 'removed from saved'}.`);
    },
    'start-compare': () => { state.compareMode = true; state.compare = []; render(); app.querySelector('[data-action="compare-toggle"]')?.focus(); },
    'cancel-compare': () => { state.compareMode = false; state.compare = []; render(); app.querySelector('[data-action="start-compare"]')?.focus(); },
    'compare-toggle': el => toggleCompare(el.dataset.id, el),
    'open-compare': () => { if (state.compareMode && state.compare.length === 2) location.hash = 'compare'; },
    photo: el => updatePhoto(el, Number(el.dataset.delta)),
    'photo-dot': el => updatePhoto(el, 0, Number(el.dataset.index)),
    zoom: el => { Finder.map.changeZoom(Number(el.dataset.delta)); updateMap(); },
    recenter: () => { Finder.map.reset(); updateMap(); },
    reserve: el => reserve(el.dataset.id),
    'edit-reservation': showReservation,
    'confirm-reservation': () => {
      if (modal?.kind !== 'review') return;
      if (!bookingValid()) { showReservation(); return; }
      const booking = { ...modal.draft, placeId: modal.id, id: `F-${Date.now().toString(36).toUpperCase()}` };
      store.addBooking(booking); modal.kind = 'success'; render(); showModal(V.success(booking));
    },
    'cancel-booking': el => {
      const booking = store.state.bookings.find(b => b.id === el.dataset.id);
      if (!booking) return;
      modal = { kind: 'cancel-booking', id: booking.id };
      showModal(V.cancelReservation(booking), '[data-action="close-dialog"]');
    },
    'confirm-cancel-booking': () => {
      if (modal?.kind !== 'cancel-booking') return;
      store.removeBooking(modal.id);
      render();
      closeModal();
      toast('Reservation canceled.');
    },
    'view-reservations': () => { closeModal(); location.hash = 'reservations'; },
    'dismiss-toast': () => document.querySelector('#toast').classList.remove('visible')
  };
  function updateMap() {
    const focused = document.activeElement?.getAttribute('aria-label');
    app.querySelector('.map').outerHTML = Finder.map.render(Finder.places.filter(p => D.matches(p, state.filters, state.query)));
    if (focused) [...app.querySelectorAll('.map-controls button')].find(b => b.getAttribute('aria-label') === focused)?.focus();
  }
  function updatePhoto(el, delta, index) {
    const container = el.closest('.gallery'), key = el.dataset.key;
    const selector = el.dataset.action === 'photo-dot' ? `[data-index="${el.dataset.index}"]` : `[data-delta="${delta}"]`;
    Finder.gallery.move(key, delta, index);
    const wrapper = document.createElement('div'); wrapper.innerHTML = Finder.gallery.render(place(container.dataset.place), key);
    const next = wrapper.firstElementChild; container.replaceWith(next);
    next.querySelector(selector)?.focus({ preventScroll: true });
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]');
    if (!el || el.disabled || el.type === 'checkbox') return;
    actions[el.dataset.action]?.(el);
  });
  function readFilters(form) {
    const data = new FormData(form);
    return { date: data.get('date') || '', group: data.get('group') || '', type: data.get('type') || '', start: data.get('start'), end: data.get('end'), noise: data.get('noise') || '', travel: data.get('travel') || '', amenities: data.getAll('amenities') };
  }
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.dataset.action === 'compare-toggle') actions['compare-toggle'](el);
    if (el.closest('#reservation-form')) { readReservation(); refreshRooms(); }
    if (el.closest('#filter-form')) {
      state.draft = readFilters(el.form);
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'place-search') {
      const input = event.target, cursor = input.selectionStart;
      state.query = input.value; render(); const next = app.querySelector('#place-search'); next.focus(); if (cursor !== null) next.setSelectionRange(cursor, cursor);
    }

  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'filter-form') {
      event.preventDefault();
      state.draft = readFilters(event.target);
      if (state.draft.date && (state.draft.date < D.dateToday() || !D.isThisWeek(state.draft.date))) return;
      const error = D.filterError(state.draft);
      if (error) { app.querySelector('#filter-error').textContent = error; return; }
      state.filters = clone(state.draft); state.panel = 'results'; render(); app.querySelector('.filters-button')?.focus(); toast('Filters applied.');
    }
    if (event.target.id === 'reservation-form') {
      event.preventDefault(); readReservation();
      if (!bookingValid()) return;
      modal.kind = 'review'; const room = place(modal.id).rooms.find(r => r.id === modal.draft.roomId);
      showModal(V.reviewReservation(place(modal.id), room, modal.draft));
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.open && route() === 'explore' && state.detailId) closeDetails(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeModal(); } });
  document.addEventListener('error', event => { if (event.target.tagName === 'IMG') { const image = event.target; image.outerHTML = '<div class="missing-photo">Photo unavailable.</div>'; } }, true);
  window.addEventListener('hashchange', () => { if (dialog.open) closeModal(); render(true); });
  Finder.timePicker.init(document);
  render();
})();
