document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('passwordToggle');
  var pwInput = document.getElementById('password');
  if (toggle && pwInput) {
    toggle.addEventListener('click', function () {
      var hidden = pwInput.type === 'password';
      pwInput.type = hidden ? 'text' : 'password';
      toggle.textContent = hidden ? 'Hide' : 'Show';
    });
  }

  var bar = document.getElementById('pwBar');
  var label = document.getElementById('pwLabel');
  if (pwInput && bar && label) {
    pwInput.addEventListener('input', function () {
      var v = pwInput.value;
      var score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      var levels = [
        { w: '0%', bg: '#e5e7eb', text: 'Enter a password' },
        { w: '25%', bg: '#ef4444', text: 'Weak' },
        { w: '50%', bg: '#f97316', text: 'Fair' },
        { w: '75%', bg: '#eab308', text: 'Good' },
        { w: '100%', bg: '#22c55e', text: 'Strong' }
      ];
      var l = v.length === 0 ? levels[0] : levels[score];
      bar.style.width = l.w;
      bar.style.background = l.bg;
      label.textContent = l.text;
      label.style.color = l.bg;
    });
  }

  var form = document.getElementById('signupForm');
  if (!form) return;

  import('./firebase.js').then(function (firebase) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstName = document.getElementById('firstName').value.trim();
      var lastName = document.getElementById('lastName').value.trim();
      var email = document.getElementById('email').value.trim().toLowerCase();
      var role = document.getElementById('role').value;
      var password = document.getElementById('password').value;

      if (!role) { alert('Please select an account type.'); return; }
      if (!password || password.length < 6) { alert('Please use a password with at least 6 characters.'); return; }

      var displayName = (firstName + ' ' + lastName).trim();
      firebase.signUp(email, password, { name: displayName, role: role }).then(function () {
        window.location.href = firebase.getPortalRoute(role);
      }).catch(function (error) {
        var message = 'Unable to create account.';
        if (error && error.code === 'auth/email-already-in-use') message = 'That email is already registered. Please sign in instead.';
        else if (error && error.code === 'auth/weak-password') message = 'Password must be at least 6 characters.';
        alert(message);
      });
    });
  });
});
