document.addEventListener('DOMContentLoaded', function () {
  import('./firebase.js').then(function (firebase) {
    firebase.useSessionPersistence().then(function () {
      firebase.auth.onAuthStateChanged(async function (user) {
        if (!user) {
          window.location.replace('../login.html');
          return;
        }

        var profile = await firebase.ensureUserProfile(user);
        if (!profile || profile.role !== 'patient') {
          window.location.replace(firebase.getPortalRoute(profile && profile.role));
        }
      });
    });
  });
});
