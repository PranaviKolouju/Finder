(() => {
  function portal() {
    return `
      <div class="portal-shell">
        <aside class="portal-sidebar">
          <div class="slu-wordmark">
            <span>Saint Louis University<small>mySLU</small></span>
          </div>
          <p class="sidebar-caption">Dashboard</p>
          <div class="portal-active">⌂ <strong>My Apps</strong></div>
        </aside>
        <main id="main" class="portal-main">
          <header class="portal-top">
            <div class="student-profile">
              <div class="profile-text">
                <strong>Jane Doe</strong>
                <span>Saint Louis University</span>
              </div>
              <svg class="profile-chevron" viewBox="0 0 16 16" aria-hidden="true">
                <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </div>
          </header>
          <div class="portal-content">
            <div class="portal-heading"><h1>My Apps</h1></div>
            <div class="portal-grid">
              <a href="#explore" class="portal-tile finder-tile" aria-label="Open Finder">
                <strong>Finder</strong>
              </a>
            </div>
          </div>
        </main>
      </div>`;
  }
  Object.assign(Finder.views, { portal });
})();
