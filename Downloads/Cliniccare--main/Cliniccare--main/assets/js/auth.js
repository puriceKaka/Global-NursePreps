// ── ClinicCare shared auth utility ──
// Firebase-backed portal bootstrap.

var CC = window.CC || {};
var firebasePromise = null;

function loadFirebase() {
  if (!firebasePromise) firebasePromise = import('./firebase.js');
  return firebasePromise;
}

function getInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(' ');
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

function getFirstName(name) {
  if (!name) return 'there';
  return name.trim().split(' ')[0];
}

function getHour() {
  var h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function requireRole(role) {
  return loadFirebase().then(function (firebase) {
    return firebase.useSessionPersistence().then(function () {
      return new Promise(function (resolve) {
        firebase.auth.onAuthStateChanged(async function (user) {
          if (!user) {
            window.location.href = '../login.html';
            resolve(null);
            return;
          }

          var profile = await firebase.ensureUserProfile(user);
          if (role && profile.role !== role) {
            window.location.href = firebase.getPortalRoute(profile.role);
            resolve(null);
            return;
          }

          resolve(profile);
        });
      });
    });
  });
}

function initPortal(role) {
  loadFirebase().then(function (firebase) {
    firebase.useSessionPersistence().then(function () {
      firebase.auth.onAuthStateChanged(async function (user) {
        if (!user) {
          window.location.href = '../login.html';
          return;
        }

        var profile = await firebase.ensureUserProfile(user);
        if (role && profile.role !== role) {
          window.location.href = firebase.getPortalRoute(profile.role);
          return;
        }

        var name = profile.name || user.displayName || 'User';
        var email = profile.email || user.email || '';
        var initials = getInitials(name);
        var first = getFirstName(name);
        var greeting = 'Good ' + getHour() + ', ' + (profile.role === 'doctor' ? name : first);

        document.querySelectorAll('[data-cc-name]').forEach(function (el) { el.textContent = name; });
        document.querySelectorAll('[data-cc-first]').forEach(function (el) { el.textContent = first; });
        document.querySelectorAll('[data-cc-initials]').forEach(function (el) { el.textContent = initials; });
        document.querySelectorAll('[data-cc-greeting]').forEach(function (el) { el.textContent = greeting; });
        document.querySelectorAll('[data-cc-email]').forEach(function (el) {
          if (el.tagName === 'INPUT') el.value = email;
          else el.textContent = email;
        });
        document.querySelectorAll('[data-cc-role]').forEach(function (el) {
          el.textContent = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
        });

        document.querySelectorAll('[data-cc-logout], .logout').forEach(function (el) {
          el.addEventListener('click', function (e) {
            if (el.tagName === 'A' && el.getAttribute('href')) return;
            e.preventDefault();
            firebase.signOutUser().finally(function () {
              window.location.href = '../login.html';
            });
          });
        });
      });
    });
  });
}

function initLanding() {
  loadFirebase().then(function (firebase) {
    firebase.useSessionPersistence().then(function () {
      firebase.auth.onAuthStateChanged(async function (user) {
        var actions = document.querySelector('.nav-actions');
        var mobileMenu = document.querySelector('.mobile-menu');
        if (!user || !actions) return;

        var profile = await firebase.ensureUserProfile(user);
        var portal = firebase.getPortalRoute(profile.role);
        var first = getFirstName(profile.name || user.displayName || 'User');
        var initials = getInitials(profile.name || user.displayName || 'User');

        actions.innerHTML =
          '<div class="nav-user-chip">' +
            '<div class="nav-user-avatar">' + initials + '</div>' +
            '<span>Hi, ' + first + '</span>' +
          '</div>' +
          '<a class="btn btn-primary" href="' + portal + '">Go to Portal →</a>';

        if (mobileMenu) {
          var signIn = mobileMenu.querySelector('a[href="login.html"]');
          var getStarted = mobileMenu.querySelector('a[href="signup.html"]');
          if (signIn) signIn.remove();
          if (getStarted) {
            getStarted.textContent = 'Go to Portal →';
            getStarted.href = portal;
          }
        }

        var heroActions = document.querySelector('.hero-actions');
        if (heroActions) {
          heroActions.innerHTML =
            '<a class="btn btn-primary btn-lg" href="' + portal + '">Go to Your Portal →</a>' +
            '<a class="btn btn-ghost btn-lg" href="#portals">Explore Features</a>';
        }

        var heroBadge = document.querySelector('.hero-badge');
        if (heroBadge) {
          heroBadge.innerHTML = '<span class="badge-dot"></span> Welcome back, ' + first + '!';
        }
      });
    });
  });
}

CC.getInitials = getInitials;
CC.getFirstName = getFirstName;
CC.requireRole = requireRole;
CC.initPortal = initPortal;
CC.initLanding = initLanding;
window.CC = CC;
