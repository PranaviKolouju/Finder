Finder.store = (() => {
  const key = 'finder-v1';
  let durable = true;
  let state;
  try {
    let stored = localStorage.getItem(key);
    if (!stored) {
      for (let i = 0; i < localStorage.length; i++) {
        const previousKey = localStorage.key(i);
        if (/^finder-.+-v1$/.test(previousKey)) {
          stored = localStorage.getItem(previousKey);
          if (stored) { localStorage.setItem(key, stored); break; }
        }
      }
    }
    state = JSON.parse(stored || '{}');
  } catch { state = {}; durable = false; }
  state = { saved: Array.isArray(state?.saved) ? state.saved.filter(id => Finder.places.some(p => p.id === id)) : [], bookings: Array.isArray(state?.bookings) ? state.bookings.filter(b => b && Finder.places.some(p => p.id === b.placeId && p.rooms.some(r => r.id === b.roomId)) && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(b.start) && (!b.end || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(b.end))) : [] };
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { durable = false; } };
  function toggleSaved(id) { state.saved = state.saved.includes(id) ? state.saved.filter(x => x !== id) : [...state.saved, id]; save(); }
  function addBooking(booking) { state.bookings.push(booking); save(); }
  function removeBooking(id) { const item = state.bookings.find(b => b.id === id); state.bookings = state.bookings.filter(b => b.id !== id); save(); return item; }
  return { get state() { return state; }, get durable() { return durable; }, toggleSaved, addBooking, removeBooking };
})();
