window.Finder = window.Finder || {};
Finder.domain = (() => {
  const emptyFilters = () => ({ date: '', group: '', type: '', start: '', end: '', noise: '', travel: '', amenities: [] });
  const minutes = time => time ? Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]) : null;
  function filterError(f) {
    if (Boolean(f.start) !== Boolean(f.end)) return 'Choose both a start and an end time.';
    if (f.start && minutes(f.end) === minutes(f.start)) return 'Choose different start and end times.';
    return '';
  }
  function openDuring(place, start, end) {
    const opening = Math.round(place.open * 60);
    let closing = Math.round(place.close * 60);
    if (closing <= opening) closing += 1440;
    const visitStart = minutes(start);
    let visitEnd = minutes(end);
    if (visitEnd < visitStart) visitEnd += 1440;
    return [-1440, 0, 1440].some(offset =>
      visitStart >= opening + offset && visitEnd <= closing + offset);
  }
  function reservationTimes(place, name, start = '') {
    const opening = Math.round(place.open * 60);
    let closing = Math.round(place.close * 60);
    if (closing <= opening) closing += 1440;
    const choices = [];
    for (let value = opening + (name === 'end' ? 30 : 0); value <= closing - (name === 'start' ? 30 : 0); value += 30) {
      const time = `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
      if (name !== 'end' || !start || (start !== time && openDuring(place, start, time))) choices.push(time);
    }
    return choices;
  }
  function matches(place, f, query = '') {
    return (!query || `${place.name} ${place.type}`.toLowerCase().includes(query.toLowerCase()))
      && (!f.group || place.capacity >= Number(f.group))
      && (!f.type || place.type === f.type)
      && (!f.noise || place.noise === f.noise)
      && (!f.travel || (place.travelMode || 'walk') === f.travel)
      && f.amenities.every(a => place.amenities.includes(a))
      && (!f.start || openDuring(place, f.start, f.end));
  }
  const timeLabel = value => { const [rawHour, m] = value.split(':').map(Number); const h = rawHour % 24; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const hoursLabel = hour => timeLabel(`${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`);
  const slotEnd = start => `${String(Number(start.split(':')[0]) + 1).padStart(2, '0')}:00`;
  const groupOptions = [['1', '1'], ['2', '2–3'], ['4', '4–5'], ['6', '6+']];
  const groupValue = value => Number(value) >= 6 ? '6' : Number(value) >= 4 ? '4' : Number(value) >= 2 ? '2' : '1';
  const groupLabel = value => ({ '1': '1 person', '2': '2–3 people', '4': '4–5 people', '6': '6+ people' })[value] || `${value} people`;
  const travelLabel = p => `${p.travelMinutes} min ${p.travelMode || 'walk'}`;
  const rating = p => p.reviews.length ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1) : null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function weekDates(reference = dateToday()) {
    const monday = new Date(`${reference}T12:00:00`);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
  }
  const isThisWeek = (value, reference = dateToday()) => weekDates(reference).includes(value);
  const dateLabel = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const bookingEnd = booking => booking.end || slotEnd(booking.start);
  const dateMinutes = date => Date.parse(`${date}T00:00:00Z`) / 60000;
  const roomWindows = room => room.availability || (room.slots || []).map(start => ({ start, end: slotEnd(start) }));
  function roomAvailableDuring(room, date, start, end, bookings) {
    if (!start || !end || minutes(start) === minutes(end)) return false;
    const origin = dateMinutes(date);
    if (!Number.isFinite(origin)) return false;
    const from = origin + minutes(start);
    let to = origin + minutes(end);
    if (to < from) to += 1440;
    const windows = [-1, 0, 1].flatMap(day => roomWindows(room).map(window => {
      const begin = origin + day * 1440 + minutes(window.start);
      let finish = origin + day * 1440 + minutes(window.end);
      if (finish <= begin) finish += 1440;
      return [begin, finish];
    })).sort((a, b) => a[0] - b[0]);
    let coveredUntil = from;
    for (const [begin, finish] of windows) {
      if (begin <= coveredUntil && finish > coveredUntil) coveredUntil = finish;
    }
    if (coveredUntil < to) return false;
    return !bookings.some(booking => {
      if (booking.roomId !== room.id) return false;
      const bookedFrom = dateMinutes(booking.date) + minutes(booking.start);
      let bookedTo = dateMinutes(booking.date) + minutes(bookingEnd(booking));
      if (bookedTo < bookedFrom) bookedTo += 1440;
      return bookedFrom < to && bookedTo > from;
    });
  }
  function roomHasAmenity(room, amenity) {
    const normalize = value => value.toLowerCase().replace(/^\d+\s+/, '').replace(/s$/, '');
    return room.amenities.some(value => normalize(value) === normalize(amenity));
  }
  function roomMatches(room, criteria, bookings) {
    if (room.capacity < Number(criteria.group || 1)) return false;
    if (!(criteria.amenities || []).every(amenity => roomHasAmenity(room, amenity))) return false;
    if (criteria.start && criteria.end) return roomAvailableDuring(room, criteria.date, criteria.start, criteria.end, bookings);
    return roomWindows(room).length > 0;
  }
  function available(room, date, start, bookings) {
    return roomAvailableDuring(room, date, start, slotEnd(start), bookings);
  }
  function meetingReady(criteria) {
    return Boolean(criteria.date && criteria.date >= dateToday() && isThisWeek(criteria.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(criteria.start || '') && /^([01]\d|2[0-3]):[0-5]\d$/.test(criteria.end || '') && criteria.start !== criteria.end);
  }
  return { reservationTimes, emptyFilters, minutes, filterError, openDuring, matches, timeLabel, hoursLabel, slotEnd, groupOptions, groupValue, groupLabel, travelLabel, rating, escape, dateToday, weekDates, isThisWeek, dateLabel, bookingEnd, roomWindows, roomAvailableDuring, roomHasAmenity, roomMatches, available, meetingReady };
})();
