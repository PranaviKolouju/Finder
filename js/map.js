Finder.map = (() => {
  const limits = { minZoom: 0.75, maxZoom: 2.5, step: 0.25 };
  let zoom = 1;
  const { escape: e, travelLabel } = Finder.domain;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function changeZoom(delta) {
    zoom = clamp(Math.round((zoom + delta) * 100) / 100, limits.minZoom, limits.maxZoom);
  }

  function reset() {
    zoom = 1;
  }

  function render(places) {
    const [currentX, currentY] = Finder.currentLocation.map;
    return `<section class="map" aria-label="Study places map">
      <div class="map-world" style="transform:scale(${zoom})"><img class="map-image" src="assets/image.png" alt="Map background with interactive study place markers." draggable="false">
      ${places.map(p => `<button class="map-pin" style="left:${p.map[0]}%;top:${p.map[1]}%" data-action="details" data-id="${p.id}" aria-label="View ${e(p.name)}, ${e(travelLabel(p))} from current location" title="${e(p.name)} · ${e(travelLabel(p))} from current location"><span>${p.letter}</span></button>`).join('')}
      <div class="you-pin" style="left:${currentX}%;top:${currentY}%" role="img" aria-label="Current location" title="Current location"><span aria-hidden="true">★</span></div></div>
      <div class="map-controls"><button data-action="zoom" data-delta="${limits.step}" aria-label="Zoom map in" ${zoom >= limits.maxZoom ? 'disabled' : ''}>+</button><span class="map-zoom-level" aria-live="polite">${Math.round(zoom * 100)}%</span><button data-action="zoom" data-delta="-${limits.step}" aria-label="Zoom map out" ${zoom <= limits.minZoom ? 'disabled' : ''}>−</button><button data-action="recenter" aria-label="Reset map view">⌖</button></div>
    </section>`;
  }

  return { render, changeZoom, reset };
})();
