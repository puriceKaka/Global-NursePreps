/* profile.js */
document.addEventListener('DOMContentLoaded', function () {

  /* ── PERSONAL INFO FORM ── */
  var editPersonalBtn = document.getElementById('editPersonalBtn');
  var cancelPersonalBtn = document.getElementById('cancelPersonalBtn');
  var savePersonalBtn = document.getElementById('savePersonalBtn');
  var personalActions = document.getElementById('personalActions');
  var personalInputs = document.querySelectorAll('#personalForm input, #personalForm select');
  var originalPersonalValues = {};

  function enablePersonalEdit() {
    personalInputs.forEach(function (input) {
      originalPersonalValues[input.id] = input.value;
      input.disabled = false;
    });
    personalActions.classList.remove('hidden');
    editPersonalBtn.textContent = 'Editing…';
    editPersonalBtn.disabled = true;
  }

  function cancelPersonalEdit() {
    personalInputs.forEach(function (input) {
      input.value = originalPersonalValues[input.id];
      input.disabled = true;
    });
    personalActions.classList.add('hidden');
    editPersonalBtn.textContent = 'Edit';
    editPersonalBtn.disabled = false;
  }

  function savePersonalInfo() {
    // In real app, send to server
    personalInputs.forEach(function (input) { input.disabled = true; });
    personalActions.classList.add('hidden');
    editPersonalBtn.textContent = 'Edit';
    editPersonalBtn.disabled = false;
    showSuccessMessage('Personal information updated successfully');
  }

  if (editPersonalBtn) editPersonalBtn.addEventListener('click', enablePersonalEdit);
  if (cancelPersonalBtn) cancelPersonalBtn.addEventListener('click', cancelPersonalEdit);
  if (savePersonalBtn) savePersonalBtn.addEventListener('click', savePersonalInfo);

  /* ── EMERGENCY CONTACT FORM ── */
  var editEmergencyBtn = document.getElementById('editEmergencyBtn');
  var cancelEmergencyBtn = document.getElementById('cancelEmergencyBtn');
  var saveEmergencyBtn = document.getElementById('saveEmergencyBtn');
  var emergencyActions = document.getElementById('emergencyActions');
  var emergencyInputs = document.querySelectorAll('#emergencyForm input');
  var originalEmergencyValues = {};

  function enableEmergencyEdit() {
    emergencyInputs.forEach(function (input) {
      originalEmergencyValues[input.id] = input.value;
      input.disabled = false;
    });
    emergencyActions.classList.remove('hidden');
    editEmergencyBtn.textContent = 'Editing…';
    editEmergencyBtn.disabled = true;
  }

  function cancelEmergencyEdit() {
    emergencyInputs.forEach(function (input) {
      input.value = originalEmergencyValues[input.id];
      input.disabled = true;
    });
    emergencyActions.classList.add('hidden');
    editEmergencyBtn.textContent = 'Edit';
    editEmergencyBtn.disabled = false;
  }

  function saveEmergencyInfo() {
    emergencyInputs.forEach(function (input) { input.disabled = true; });
    emergencyActions.classList.add('hidden');
    editEmergencyBtn.textContent = 'Edit';
    editEmergencyBtn.disabled = false;
    showSuccessMessage('Emergency contact updated successfully');
  }

  if (editEmergencyBtn) editEmergencyBtn.addEventListener('click', enableEmergencyEdit);
  if (cancelEmergencyBtn) cancelEmergencyBtn.addEventListener('click', cancelEmergencyEdit);
  if (saveEmergencyBtn) saveEmergencyBtn.addEventListener('click', saveEmergencyInfo);

  /* ── CHANGE PASSWORD ── */
  var changePasswordBtn = document.getElementById('changePasswordBtn');
  var currentPasswordInput = document.getElementById('currentPassword');
  var newPasswordInput = document.getElementById('newPassword');
  var confirmPasswordInput = document.getElementById('confirmPassword');

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function () {
      var current = currentPasswordInput.value;
      var newPass = newPasswordInput.value;
      var confirm = confirmPasswordInput.value;

      if (!current || !newPass || !confirm) {
        showErrorMessage('Please fill in all password fields');
        return;
      }

      if (newPass !== confirm) {
        showErrorMessage('New passwords do not match');
        return;
      }

      if (newPass.length < 8) {
        showErrorMessage('Password must be at least 8 characters');
        return;
      }

      // In real app, send to server
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
      showSuccessMessage('Password changed successfully');
    });
  }

  /* ── SAVE NOTIFICATIONS ── */
  var saveNotificationsBtn = document.getElementById('saveNotificationsBtn');
  if (saveNotificationsBtn) {
    saveNotificationsBtn.addEventListener('click', function () {
      showSuccessMessage('Notification preferences saved');
    });
  }

  /* ── SUCCESS/ERROR MESSAGES ── */
  function showSuccessMessage(message) {
    var alert = createAlert(message, 'success');
    document.querySelector('.portal-main').prepend(alert);
    setTimeout(function () { alert.remove(); }, 4000);
  }

  function showErrorMessage(message) {
    var alert = createAlert(message, 'error');
    document.querySelector('.portal-main').prepend(alert);
    setTimeout(function () { alert.remove(); }, 4000);
  }

  function createAlert(message, type) {
    var div = document.createElement('div');
    div.className = 'profile-alert profile-alert-' + type;
    div.innerHTML = '<span>' + message + '</span><button onclick="this.parentElement.remove()">✕</button>';
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:0.85rem;font-weight:600;animation:fadeUp 0.3s both';
    if (type === 'success') {
      div.style.background = 'rgba(13,148,136,0.1)';
      div.style.color = '#0d9488';
      div.style.border = '1px solid rgba(13,148,136,0.2)';
    } else {
      div.style.background = 'rgba(220,38,38,0.1)';
      div.style.color = '#dc2626';
      div.style.border = '1px solid rgba(220,38,38,0.2)';
    }
    return div;
  }
});