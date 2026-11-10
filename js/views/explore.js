(() => {
  const { escape: e, rating, timeLabel, dateLabel } = Finder.domain;
  const { saved, badge, saveButton, weekPicker, header, card } = Finder.views;
  function filters(f) {
    const group = (name, title, values) => `<fieldset><legend>${title}</legend><div class="choice-grid">${values.map(([value, label]) => `<label class="choice"><input type="radio" name="${name}" value="${value}" ${f[name] === value ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>`;
    return `
      <form id="filter-form">
        <div class="filter-fields">
          <div class="panel-heading"><h1>Filters</h1><button type="button" class="text-button" data-action="reset-filters">Reset</button></div>
          ${weekPicker(f.date)}
          <fieldset><legend>Meeting time</legend><div class="time-fields">${Finder.timePicker.render('start', 'Start', f.start, 'filters')}${Finder.timePicker.render('end', 'End', f.end, 'filters')}</div></fieldset>
          ${group('group', 'Group size', Finder.domain.groupOptions)}
          ${group('type', 'Location type', [['', 'Any'], ['Library', 'Library'], ['Coffee Shop', 'Coffee shop'], ['Campus Building', 'Campus building']])}
          ${group('travel', 'Distance', [['', 'Any'], ['walk', 'Walkable'], ['drive', 'Drivable']])}
          ${group('noise', 'Noise level', [['', 'Any'], ['Low', 'Low'], ['Moderate', 'Moderate'], ['High', 'High']])}
          <fieldset><legend>Amenities</legend><div class="choice-grid">${['Wi-Fi', 'Outlets', 'Monitors', 'Whiteboards', 'Study Rooms', 'Food/Drinks'].map(a => `<label class="choice"><input type="checkbox" name="amenities" value="${a}" ${f.amenities.includes(a) ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div></fieldset>
        </div>
        <div class="filter-footer"><p id="filter-error" class="error" role="alert"></p><div class="filter-actions"><button class="primary" type="submit">Apply filters</button><button class="text-button filter-cancel" type="button" data-action="cancel-filters">Cancel</button></div></div>
      </form>`;
  }

  function explore(state) {
    const matches = Finder.places.filter(p => Finder.domain.matches(p, state.filters, state.query));
    const active = state.filters.date || state.filters.group || state.filters.type || state.filters.noise || state.filters.travel || state.filters.start || state.filters.amenities.length;
    return `${header('explore')}<main id="main" class="explore-layout ${state.detailId ? 'has-details' : ''}"><section id="results-panel" class="results-panel ${state.panel === 'filters' ? 'filters-open' : ''}" aria-label="${state.panel === 'filters' ? 'Study filters' : 'Study places'}">${state.panel === 'filters' ? filters(state.draft) : `<h1 class="sr-only">Find study spaces</h1><label class="search-box"><span>⌕</span><input id="place-search" type="search" placeholder="Search places" value="${e(state.query)}" aria-label="Search places"></label><div class="results-summary"><span><strong>${matches.length}</strong> ${matches.length === 1 ? 'place' : 'places'}${active ? ' match' : ' nearby'}</span><div class="results-actions"><button class="secondary filters-button" data-action="panel" data-panel="filters" aria-controls="results-panel">Filters</button><button class="secondary compare-mode-button" data-action="${state.compareMode ? 'cancel-compare' : 'start-compare'}">${state.compareMode ? 'Cancel' : 'Compare'}</button></div></div>${active ? `<div class="active-filters">${[state.filters.date ? dateLabel(state.filters.date) : '', state.filters.group ? Finder.domain.groupLabel(state.filters.group) : '', state.filters.type, state.filters.travel ? (state.filters.travel === 'walk' ? 'Walkable' : 'Drivable') : '', state.filters.noise ? `${state.filters.noise} noise` : '', ...state.filters.amenities, state.filters.start ? `${timeLabel(state.filters.start)}–${timeLabel(state.filters.end)}` : ''].filter(Boolean).map(badge).join('')}<button class="text-button" data-action="clear-filters">Clear all</button></div>` : ''}<div class="place-list ${state.compareMode ? 'comparing' : ''}">${matches.length ? matches.map(p => card(p, state.compare, state.compareMode)).join('') : `<div class="empty-state"><span>⌕</span><p>No matches. Try a different day/time or loosen filters.</p><button class="secondary" data-action="clear-filters">Clear filters & search</button></div>`}</div>${state.compareMode ? `<div class="compare-tray"><button class="primary compare-submit" data-action="open-compare" ${state.compare.length !== 2 ? 'disabled' : ''}>Compare (${state.compare.length}/2)</button></div>` : ''}`}</section>${Finder.map.render(matches)}${state.detailId ? `<aside class="place-panel" aria-labelledby="place-title">${Finder.views.details(Finder.places.find(p => p.id === state.detailId))}</aside>` : ''}</main>`;
  }
  Object.assign(Finder.views, { filters, explore });
})();
