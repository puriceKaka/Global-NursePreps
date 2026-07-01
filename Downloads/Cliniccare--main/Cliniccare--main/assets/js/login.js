document.addEventListener('DOMContentLoaded', function () {
  import('./firebase.js').then(function (firebase) {
    var form = document.getElementById('loginForm');
    var passwordInput = document.getElementById('password');
    var toggle = document.getElementById('passwordToggle');

    if (toggle && passwordInput) {
      toggle.addEventListener('click', function () {
        var hidden = passwordInput.type === 'password';
        passwordInput.type = hidden ? 'text' : 'password';
        toggle.textContent = hidden ? 'Hide' : 'Show';
      });
    }

    firebase.useSessionPersistence().then(function () {
      if (firebase.auth.currentUser) {
        firebase.ensureUserProfile(firebase.auth.currentUser).then(function (profile) {
          window.location.href = firebase.getPortalRoute(profile.role);
        });
      }
    });

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email').value.trim().toLowerCase();
      var pass = passwordInput.value;

      firebase.signIn(email, pass).then(function (credential) {
        return firebase.ensureUserProfile(credential.user);
      }).then(function (profile) {
        window.location.href = firebase.getPortalRoute(profile.role);
      }).catch(function () {
        showError('Incorrect email or password. Please try again.');
      });
    });
  });
});

function showError(msg) {
  var el = document.getElementById('errorMessage');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}
