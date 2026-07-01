/* ── AUTH GUARD ── */
(function () {
  import('../assets/js/firebase.js').then(function (firebase) {
    firebase.useSessionPersistence().then(function () {
      firebase.auth.onAuthStateChanged(async function (user) {
        if (!user) { window.location.replace('../login.html'); return; }
        var profile = await firebase.ensureUserProfile(user);
        if (!profile || profile.role !== 'admin') {
          window.location.replace(firebase.getPortalRoute(profile && profile.role));
          return;
        }

        var title = document.querySelector('.topbar h1');
        var chipName = document.querySelector('.user-chip strong');
        var chipRole = document.querySelector('.user-chip small');
        var avatar = document.querySelector('.user-chip-avatar');
        var h = new Date().getHours();
        var greeting = 'Good ' + (h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening') + ', ' + (profile.name || 'Admin');

        if (title) title.textContent = greeting;
        if (chipName) chipName.textContent = profile.name || user.displayName || 'Admin User';
        if (chipRole) chipRole.textContent = 'Administrator';
        if (avatar) {
          avatar.textContent = (profile.name || 'Admin User').trim().split(' ').map(function (part) { return part[0]; }).join('').slice(0, 2).toUpperCase();
        }
      });
    });
  });
})();

/* ── PORTAL TABS ── */
document.addEventListener('DOMContentLoaded', function () {
  var links    = document.querySelectorAll('[data-section]');
  var sections = document.querySelectorAll('.portal-section');
  var title    = document.getElementById('pageTitle');

  function showSection(id) {
    sections.forEach(function (s) {
      if (s.id === id) {
        s.classList.add('active');
        if (title) title.textContent = s.dataset.title || title.textContent;
      } else {
        s.classList.remove('active');
      }
    });
    links.forEach(function (l) {
      l.classList.toggle('active', l.dataset.section === id);
    });
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var id = link.dataset.section;
      history.replaceState(null, '', '#' + id);
      showSection(id);
    });
  });

  showSection(window.location.hash.replace('#', '') || 'dashboard');

  document.querySelectorAll('.logout').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      import('../assets/js/firebase.js').then(function (firebase) {
        firebase.signOutUser().finally(function () {
          window.location.href = btn.getAttribute('href');
        });
      });
    });
  });
});
