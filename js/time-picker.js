Finder.timePicker = (() => {
  const { escape: e, timeLabel } = Finder.domain;
  const values = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
  let active = null;

  function render(name, label, value = '', scope = 'filters', required = false, options = values) {
    const id = `${scope}-${name}-time`;
    return `<div class="time-picker" data-name="${name}">
      <span id="${id}-label" class="time-field-label">${label}</span>
      <input type="hidden" name="${name}" value="${e(value)}">
      <button type="button" class="time-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-options" aria-labelledby="${id}-label ${id}-value" ${required ? 'aria-required="true"' : ''}>
        <span id="${id}-value" data-time-text>${value ? timeLabel(value) : 'Select time'}</span><span class="time-chevron" aria-hidden="true">⌄</span>
      </button>
      <div id="${id}-options" class="time-menu" role="listbox" aria-labelledby="${id}-label" hidden>
        <button type="button" role="option" class="time-option time-clear" data-time-value="" aria-selected="${!value}" tabindex="-1">Clear time</button>
        ${options.map(time => `<button type="button" role="option" class="time-option" data-time-value="${time}" aria-selected="${value === time}" tabindex="-1">${timeLabel(time)}</button>`).join('')}
      </div>
    </div>`;
  }

  function close(restoreFocus = false) {
    if (!active) return;
    const picker = active;
    picker.querySelector('.time-menu').hidden = true;
    picker.querySelector('.time-trigger').setAttribute('aria-expanded', 'false');
    active = null;
    if (restoreFocus && picker.isConnected) picker.querySelector('.time-trigger').focus({ preventScroll: true });
  }

  function open(picker) {
    close();
    active = picker;
    const trigger = picker.querySelector('.time-trigger');
    const menu = picker.querySelector('.time-menu');
    const bounds = trigger.getBoundingClientRect();
    const below = window.innerHeight - bounds.bottom - 12;
    const above = bounds.top - 12;
    const height = Math.min(240, Math.max(below, above));
    const width = Math.min(Math.max(bounds.width, 140), window.innerWidth - 16);
    menu.style.width = `${width}px`;
    menu.style.maxHeight = `${height}px`;
    menu.style.left = `${Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8))}px`;
    menu.style.top = `${below >= height ? bounds.bottom + 6 : Math.max(8, bounds.top - height - 6)}px`;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const selected = picker.querySelector('input').value;
    const preferred = selected || (picker.dataset.name === 'end' ? picker.closest('form')?.querySelector('[name="start"]')?.value : '') || '08:00';
    const option = [...menu.querySelectorAll('[role="option"]')].find(item => item.dataset.timeValue === preferred) || menu.querySelector('[role="option"]');
    option.focus({ preventScroll: true });
    option.scrollIntoView({ block: 'nearest' });
  }

  function choose(option) {
    const picker = option.closest('.time-picker');
    const input = picker.querySelector('input');
    input.value = option.dataset.timeValue;
    picker.querySelector('[data-time-text]').textContent = input.value ? timeLabel(input.value) : 'Select time';
    picker.querySelectorAll('[role="option"]').forEach(item => item.setAttribute('aria-selected', item === option));
    close(true);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function init(root) {
    root.addEventListener('click', event => {
      const trigger = event.target.closest('.time-trigger');
      if (trigger) {
        const picker = trigger.closest('.time-picker');
        if (active === picker) close(true);
        else open(picker);
        return;
      }
      const option = event.target.closest('[data-time-value]');
      if (option) { choose(option); return; }
      if (active && !active.contains(event.target)) close();
    });
    root.addEventListener('keydown', event => {
      const trigger = event.target.closest('.time-trigger');
      if (trigger && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        open(trigger.closest('.time-picker'));
        return;
      }
      if (!active) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        close(true);
        return;
      }
      if (event.key === 'Tab') { close(true); return; }
      const options = [...active.querySelectorAll('[role="option"]')];
      const index = options.indexOf(event.target);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % options.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = options.length - 1;
      else return;
      event.preventDefault();
      options[next].focus({ preventScroll: true });
      options[next].scrollIntoView({ block: 'nearest' });
    }, true);
    root.addEventListener('scroll', event => {
      if (active && !active.querySelector('.time-menu').contains(event.target)) close();
    }, true);
    window.addEventListener('resize', () => close());
  }

  return { render, init, close, values };
})();
