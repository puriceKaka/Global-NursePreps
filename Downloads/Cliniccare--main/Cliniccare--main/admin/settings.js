document.getElementById('clinicForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Saved!';
  setTimeout(() => btn.textContent = 'Save Changes', 2000);
});

document.getElementById('accountForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Updated!';
  setTimeout(() => btn.textContent = 'Update Account', 2000);
});

document.getElementById('backupBtn').addEventListener('click', function () {
  this.textContent = 'Running…';
  setTimeout(() => this.textContent = 'Run Backup', 2500);
});

document.getElementById('cacheBtn').addEventListener('click', function () {
  this.textContent = 'Cleared!';
  setTimeout(() => this.textContent = 'Clear Now', 2000);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Are you sure? This will wipe all data and cannot be undone.')) {
    alert('System reset initiated.');
  }
});
