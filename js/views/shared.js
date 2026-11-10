Finder.views = {};
(() => {
  const { escape: e, rating, travelLabel, timeLabel, dateLabel } = Finder.domain;
  const saved = id => Finder.store.state.saved.includes(id);
  const badge = text => `<span class="tag">${e(text)}</span>`;
  const heartIcon = () => '<svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const saveButton = (p, iconOnly = false) => `<button class="${iconOnly ? 'icon-button save-button save-heart' : 'text-button save-button'}" data-action="save" data-id="${p.id}" aria-pressed="${saved(p.id)}" aria-label="${saved(p.id) ? 'Unsave' : 'Save'} ${e(p.name)}">${iconOnly ? heartIcon() : (saved(p.id) ? '♥ Saved' : '♡ Save')}</button>`;
  function weekPicker(selectedDate, title = 'Meeting Date', defaultToday = true) {
    const today = Finder.domain.dateToday();
    return `<fieldset class="meeting-date"><legend>${title}</legend><div class="week-picker">${Finder.domain.weekDates().map(value => {
      const day = new Date(`${value}T12:00:00`);
      return `<label class="choice week-day ${value < today ? 'unavailable' : ''}"><input type="radio" name="date" value="${value}" ${(selectedDate || (defaultToday ? today : '')) === value ? 'checked' : ''} ${value < today ? 'disabled' : ''} aria-label="${e(dateLabel(value))}"><span><small>${day.toLocaleDateString('en-US', { weekday: 'short' })}</small><strong>${day.getDate()}</strong></span></label>`;
    }).join('')}</div></fieldset>`;
  }

  function header(route) {
    return `<header class="app-header"><a href="#explore" class="brand">Finder</a><nav aria-label="Main navigation"><a href="#explore" ${route === 'explore' ? 'aria-current="page"' : ''}>Explore</a><a href="#saved" ${route === 'saved' ? 'aria-current="page"' : ''}>Saved <span>${Finder.store.state.saved.length}</span></a><a href="#reservations" ${route === 'reservations' ? 'aria-current="page"' : ''}>Reservations <span>${Finder.store.state.bookings.length}</span></a></nav></header>`;
  }

  function comparisonSelector(p, compare) {
    const checked = compare.includes(p.id);
    const disabled = compare.length === 2 && !checked;
    return `<label class="compare-check"><input type="checkbox" data-action="compare-toggle" data-id="${p.id}" aria-label="Select ${e(p.name)} for comparison" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="sr-only">Select</span></label>`;
  }

  function card(p, compare = [], compareMode = false) {
    const selector = compareMode ? comparisonSelector(p, compare) : '';
    return `
      <div class="place-result">
        ${selector}
        <article class="place-card">
          <button class="place-open" data-action="details" data-id="${p.id}">
            <span class="letter-badge">${p.letter}</span>
            <span><strong>${e(p.shortName)}</strong><span class="place-meta">${e(p.type)} · ${e(travelLabel(p))}</span></span>
          </button>
          <div class="card-bottom">
            ${p.reviews.length ? `<span class="rating">${rating(p)} ★</span>` : ''}
            ${saveButton(p)}
          </div>
        </article>
      </div>`;
  }
  Object.assign(Finder.views, { saved, badge, heartIcon, saveButton, weekPicker, header, card });
})();
