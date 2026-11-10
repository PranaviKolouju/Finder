(() => {
  const { escape: e, rating, travelLabel, timeLabel, hoursLabel, dateLabel } = Finder.domain;
  const { saved, badge, saveButton, header, card } = Finder.views;
  function details(p) {
    const reviewSection = p.reviews.length ? `<div class="review-section"><div class="section-row"><h2>Reviews</h2><span class="rating">${rating(p)} ★</span></div>${p.reviews.map(r => `<article class="review"><div><strong>${e(r.name)}</strong><span aria-label="${r.rating} out of 5 stars">${'★'.repeat(r.rating)}<span class="muted">${'☆'.repeat(5 - r.rating)}</span></span></div><p>${e(r.text)}</p></article>`).join('')}</div>` : '';
    return `
      <div class="place-panel-header">
        <button class="icon-button" data-action="close-details" aria-label="Close location details">×</button>
      </div>
      <div class="detail-layout">
        ${Finder.gallery.render(p, `detail-${p.id}`)}
        <div class="detail-copy">
          <p class="eyebrow">${e(p.type)} · ${e(travelLabel(p))}</p>
          <div class="place-title-row"><h1 id="place-title">${e(p.name)}</h1>${saveButton(p, true)}</div>
          <p class="address">${e(p.address)}</p>
          <dl class="facts">
            <div><dt>Hours</dt><dd>${hoursLabel(p.open)} – ${hoursLabel(p.close)}</dd></div>
            <div><dt>Noise level</dt><dd>${p.noise}</dd></div>
            <div><dt>Group size</dt><dd>Up to ${p.capacity} people</dd></div>
            <div><dt>${p.busyness ? 'Typical busyness' : 'Availability'}</dt><dd><span class="status-dot"></span>${e(p.status)}</dd></div>
          </dl>
          <h2 class="small-heading">Amenities</h2>
          <div class="amenity-tags">${p.amenities.map(badge).join('')}</div>
          <div class="detail-actions">
            ${p.rooms.length
              ? `<button class="primary" data-action="reserve" data-id="${p.id}">Reserve a room</button>`
              : ''}
          </div>
        </div>
        ${reviewSection}
      </div>`;
  }

  function comparisonCard(p) {
    return `
      <article class="comparison-card">
        <div class="comparison-overview">
          ${Finder.gallery.render(p, `compare-${p.id}`)}
          <div class="comparison-summary">
            <div class="comparison-title"><span class="letter-badge">${p.letter}</span><h2>${e(p.name)}</h2></div>
            <dl class="comparison-facts">
          <div><dt>Location type</dt><dd>${e(p.type)}</dd></div>
          <div><dt>Distance</dt><dd>${e(travelLabel(p))}</dd></div>
          <div><dt>Hours</dt><dd>${hoursLabel(p.open)}–${hoursLabel(p.close)}</dd></div>
          <div><dt>Noise level</dt><dd>${e(p.noise)}</dd></div>
          <div><dt>Group size</dt><dd>Up to ${p.capacity} people</dd></div>
          <div><dt>Typical busyness</dt><dd>${e(p.busyness || p.status)}</dd></div>
          <div class="comparison-amenities"><dt>Amenities</dt><dd class="amenity-tags">${p.amenities.map(badge).join('')}</dd></div>
            </dl>
          </div>
        </div>
        ${p.reviews.length ? `
          <section class="comparison-reviews" aria-label="Reviews for ${e(p.name)}">
            <div class="section-row"><h3>Reviews</h3><span class="rating">${rating(p)} ★</span></div>
            ${p.reviews.map(r => `<div class="comparison-review-item"><div><strong>${e(r.name)}</strong><span class="rating" aria-label="${r.rating} out of 5 stars">${'★'.repeat(r.rating)}<span class="muted">${'☆'.repeat(5 - r.rating)}</span></span></div><p>${e(r.text)}</p></div>`).join('')}
          </section>` : ''}
        <div class="comparison-actions">
          ${p.rooms.length
            ? `<button class="primary" data-action="reserve" data-id="${p.id}">Reserve a room</button>`
            : ''}
          ${saveButton(p)}
        </div>
      </article>`;
  }

  function compare(state) {
    const places = state.compare.map(id => Finder.places.find(p => p.id === id));
    return `${header('compare')}
      <main id="main" class="page-content comparison-page">
        <h1 class="sr-only">Comparison</h1>
        <div class="comparison-toolbar"><a class="secondary comparison-back" href="#explore">← Back to Explore</a></div>
        ${places.length !== 2
          ? ''
          : `<div class="comparison-grid" style="--columns:2">${places.map(comparisonCard).join('')}</div>`}
      </main>`;
  }

  function savedCard(p) {
    const photo = p.images.find(Boolean);
    return `
      <article class="saved-card">
        ${photo ? `<img class="saved-photo" src="${e(photo)}" alt="${e(p.name)}">` : ''}
        <div class="saved-card-content">
          <div class="saved-title-row"><h2>${e(p.name)}</h2>${saveButton(p, true)}</div>
          <p class="saved-place-type">${e(p.type)} · ${e(travelLabel(p))}</p>
          <p class="saved-address">${e(p.address)}</p>
          <dl class="saved-facts">
            <div><dt>Hours</dt><dd>${hoursLabel(p.open)} – ${hoursLabel(p.close)}</dd></div>
            <div><dt>Noise level</dt><dd>${e(p.noise)}</dd></div>
            <div><dt>Group size</dt><dd>Up to ${p.capacity} people</dd></div>
            <div><dt>Typical busyness</dt><dd>${e(p.busyness || p.status)}</dd></div>
            ${p.reviews.length ? `<div><dt>Rating</dt><dd>★ ${rating(p)} / 5</dd></div>` : ''}
            ${p.rooms.length ? `<div><dt>Study rooms</dt><dd>${p.rooms.length} reservable rooms</dd></div>` : ''}
          </dl>
          <h3 class="saved-amenities-heading">Amenities</h3>
          <div class="amenity-tags">${p.amenities.map(badge).join('')}</div>
        </div>
      </article>`;
  }

  function savedPage() {
    const places = Finder.places.filter(p => saved(p.id));
    return `${header('saved')}
      <main id="main" class="page-content">
        <div class="page-heading"><h1>Saved places</h1></div>
        ${places.length
          ? `<div class="saved-grid">${places.map(savedCard).join('')}</div>`
          : ''}
      </main>`;
  }
  Object.assign(Finder.views, { details, compare, savedPage });
})();
