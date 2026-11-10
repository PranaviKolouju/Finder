(() => {
  const { escape: e, timeLabel, dateLabel, bookingEnd } = Finder.domain;
  const { badge, weekPicker, header } = Finder.views;
  function reservationForm(p, draft) {
    const ready = Finder.domain.meetingReady(draft);
    return `
      <div class="dialog-top dialog-close-only"><button class="icon-button" data-action="close-dialog" aria-label="Close reservation">×</button></div>
      <div class="reservation-content room-reservation">
        <h1 id="dialog-title">${e(p.name)}</h1>
        <form id="reservation-form" data-place="${p.id}" novalidate>
          <div class="room-filter-grid">
            ${weekPicker(draft.date, 'Meeting Date', false)}
            <fieldset><legend>Meeting time</legend><div class="time-fields">${Finder.timePicker.render('start', 'Start', draft.start || '', 'booking', true, Finder.domain.reservationTimes(p, 'start'))}${Finder.timePicker.render('end', 'End', draft.end || '', 'booking', true, Finder.domain.reservationTimes(p, 'end', draft.start))}</div></fieldset>
          </div>
          <div id="room-refinements" class="room-filter-grid" ${ready ? '' : 'hidden'}>
            <label class="room-group-label">Group size<select name="group">${Finder.domain.groupOptions.map(([value]) => `<option value="${value}" ${Finder.domain.groupValue(draft.group) === value ? 'selected' : ''}>${Finder.domain.groupLabel(value)}</option>`).join('')}</select></label>
            <fieldset class="room-amenity-filters"><legend>Amenities</legend><div class="choice-grid">${['Wi-Fi', 'Outlets', 'Monitors', 'Whiteboards', 'Study Rooms', 'Food/Drinks'].map(amenity => `<label class="choice"><input type="checkbox" name="amenities" value="${amenity}" ${(draft.amenities || []).includes(amenity) ? 'checked' : ''}><span>${amenity}</span></label>`).join('')}</div></fieldset>
          </div>
          <div id="room-results" ${ready ? '' : 'hidden'}>${roomResults(p, draft, Finder.store.state.bookings)}</div>
          <p id="reservation-error" class="error" role="alert"></p>
          <div class="room-booking-footer" ${ready ? '' : 'hidden'}><button class="primary" type="submit" ${!ready || !draft.roomId ? 'disabled' : ''}>Review reservation</button></div>
        </form>
      </div>`;
  }

  function roomResults(p, draft, bookings) {
    if (!Finder.domain.meetingReady(draft)) return '';
    const rooms = Finder.domain.openDuring(p, draft.start, draft.end) ? p.rooms.filter(room => Finder.domain.roomMatches(room, draft, bookings)) : [];
    return `
      <fieldset class="room-results-fieldset"><legend>Rooms <span class="room-match-count" role="status">${rooms.length} ${rooms.length === 1 ? 'match' : 'matches'}</span></legend>
        ${rooms.length ? `<div class="room-card-grid">${rooms.map(room => `
          <label class="room-option">
            <input type="radio" name="roomId" value="${room.id}" ${draft.roomId === room.id ? 'checked' : ''}>
            <span class="room-option-content"><strong>${e(room.name)}</strong><span class="room-capacity">Up to ${room.capacity} people</span><span class="amenity-tags">${room.amenities.map(badge).join('')}</span></span>
          </label>`).join('')}</div>` : '<div class="empty-state"><p>No matches. Try a different time or loosen filters.</p></div>'}
      </fieldset>`;
  }

  function reviewReservation(p, room, draft) {
    return `<div class="dialog-top"><button class="text-button" data-action="edit-reservation">← Edit reservation</button><button class="icon-button" data-action="close-dialog" aria-label="Close reservation">×</button></div><div class="reservation-content reservation-review"><h1 id="dialog-title">Confirm reservation</h1><dl class="confirmation-facts"><div><dt>Space</dt><dd>${e(room.name)}</dd></div><div><dt>Location</dt><dd>${e(p.name)}</dd></div><div><dt>Date</dt><dd>${dateLabel(draft.date)}</dd></div><div><dt>Time</dt><dd>${timeLabel(draft.start)} – ${timeLabel(bookingEnd(draft))}</dd></div><div><dt>Group size</dt><dd>${Finder.domain.groupLabel(draft.group)}</dd></div><div><dt>Includes</dt><dd>${room.amenities.map(e).join(', ')}</dd></div></dl><div class="button-row"><button class="primary" data-action="confirm-reservation">Confirm reservation</button></div></div>`;
  }

  function success() {
    return `
      <div class="dialog-top dialog-close-only"><button class="icon-button" data-action="close-dialog" aria-label="Close confirmation">×</button></div>
      <div class="reservation-content success-content">
        <span class="success-icon" aria-hidden="true">✓</span>
        <h1 id="dialog-title">Reservation confirmed</h1>
      </div>`;
  }

  function reservationCard(booking) {
    const place = Finder.places.find(p => p.id === booking.placeId);
    const room = place.rooms.find(r => r.id === booking.roomId);
    return `
      <article class="booking-card">
        <div class="booking-details">
          <h2>${e(place.name)}</h2>
          <p>${e(room.name)}</p>
          <p>${e(place.address)}</p>
          <dl class="reservation-facts">
            <div><dt>Date</dt><dd>${dateLabel(booking.date)}</dd></div>
            <div><dt>Time</dt><dd>${timeLabel(booking.start)} – ${timeLabel(bookingEnd(booking))}</dd></div>
            <div><dt>Group size</dt><dd>${booking.groupRange ? Finder.domain.groupLabel(booking.group) : `${e(booking.group)} ${Number(booking.group) === 1 ? 'person' : 'people'}`}</dd></div>
            <div><dt>Includes</dt><dd>${room.amenities.map(e).join(', ')}</dd></div>
          </dl>
        </div>
        <button class="secondary cancel-reservation" data-action="cancel-booking" data-id="${e(booking.id)}">Cancel reservation</button>
      </article>`;
  }

  function cancelReservation() {
    return `
      <div class="reservation-content cancel-confirmation">
        <h1 id="dialog-title">Cancel reservation?</h1>
        <div class="button-row">
          <button class="secondary" data-action="close-dialog">No, keep reservation</button>
          <button class="primary" data-action="confirm-cancel-booking">Yes, cancel reservation</button>
        </div>
      </div>`;
  }

  function reservations() {
    const bookings = Finder.store.state.bookings;
    return `${header('reservations')}
      <main id="main" class="page-content">
        <div class="page-heading"><h1>Reservations</h1></div>
        ${bookings.length
          ? `<div class="booking-list">${bookings.map(reservationCard).join('')}</div>`
          : ''}
      </main>`;
  }
  Object.assign(Finder.views, { reservationForm, roomResults, reviewReservation, success, cancelReservation, reservations });
})();
