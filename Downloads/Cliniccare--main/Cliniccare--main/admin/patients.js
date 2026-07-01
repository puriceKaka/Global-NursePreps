const searchInput = document.getElementById('patientSearch');
const statusFilter = document.getElementById('statusFilter');
const rows = document.querySelectorAll('#patientTable tr');

function filterTable() {
  const q = searchInput.value.toLowerCase();
  const status = statusFilter.value;
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const rowStatus = row.dataset.status;
    const matchSearch = text.includes(q);
    const matchStatus = status === 'all' || rowStatus === status;
    row.style.display = matchSearch && matchStatus ? '' : 'none';
  });
}

searchInput.addEventListener('input', filterTable);
statusFilter.addEventListener('change', filterTable);

// Modal
const modal = document.getElementById('addPatientModal');
document.getElementById('addPatientBtn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('closeModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('cancelModal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

document.getElementById('addPatientForm').addEventListener('submit', e => {
  e.preventDefault();
  modal.classList.remove('open');
});
