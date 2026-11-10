Finder.gallery = (() => {
  const positions = {};
  const counts = {};
  const { escape: e } = Finder.domain;
  function illustration(p, index) {
    const colors = ['#dce4e6', '#e6e1d8', '#dde1d8', '#dfe0e8', '#e7dfd9'];
    return `<svg viewBox="0 0 600 320" aria-hidden="true" class="room-art"><rect width="600" height="320" fill="${colors[index]}"/><path d="M0 245H600M400 0V245M0 320L110 245M600 320L490 245" stroke="#b7bdbb" fill="none"/><rect x="45" y="38" width="160" height="151" rx="2" fill="#f3f5f1" stroke="#a2adaa" stroke-width="5"/><path d="M125 40V187M47 115H203" stroke="#a2adaa" stroke-width="5"/><path d="M265 0V49M252 49H278L290 70H240Z" stroke="#777f7a" fill="#f7f4eb" stroke-width="4"/><rect x="224" y="182" width="230" height="16" rx="5" fill="#8c9693"/><path d="M245 198V277M434 198V277" stroke="#7b8581" stroke-width="9"/><path d="M210 231H260M219 233V287M251 233V287M420 231H475M428 233V287M467 233V287" stroke="#929c97" stroke-width="8"/><rect x="307" y="147" width="55" height="35" rx="3" fill="#c1cbc6" stroke="#7b8581" stroke-width="3"/><path d="M530 250V177M530 205Q488 185 500 162Q536 158 530 205M530 222Q565 201 559 180Q528 174 530 222" stroke="#879b89" fill="#a7b7a5" stroke-width="3"/><path d="M508 244H552L545 280H516Z" fill="#c2aba0"/></svg>`;
  }
  function render(p, key) {
    const count = p.images.length;
    counts[key] = count;
    const index = (positions[key] || 0) % count;
    const src = p.images[index];
    return `<div class="gallery" data-gallery="${key}" data-place="${p.id}">
      <div class="gallery-picture">${src ? `<img src="${e(src)}" alt="${e(p.name)}, photo ${index + 1}">` : illustration(p, index)}</div>
      <div class="gallery-controls"><button class="icon-button" data-action="photo" data-key="${key}" data-delta="-1" aria-label="Previous photo of ${e(p.name)}">←</button><div class="dots" aria-label="Photo ${index + 1} of ${count}">${p.images.map((_, i) => `<button data-action="photo-dot" data-key="${key}" data-index="${i}" class="dot ${i === index ? 'active' : ''}" aria-label="${e(p.name)}, photo ${i + 1}" ${i === index ? 'aria-current="true"' : ''}></button>`).join('')}</div><span class="photo-count">${index + 1} / ${count}</span><button class="icon-button" data-action="photo" data-key="${key}" data-delta="1" aria-label="Next photo of ${e(p.name)}">→</button></div></div>`;
  }
  function move(key, delta, index) {
    const count = counts[key] || 3;
    positions[key] = index === undefined ? ((positions[key] || 0) + delta + count) % count : index;
  }
  return { render, move };
})();
