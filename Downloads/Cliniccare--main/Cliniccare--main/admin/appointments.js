const search = document.getElementById('apptSearch');
const filter = document.getElementById('statusFilter');
const rows = () => document.querySelectorAll('#apptTable tr');

function applyFilters() {
  const q = search.value.toLowerCase();
  const s = filter.value;
  rows().forEach(r => {
    const text = r.textContent.toLowerCase();
    const status = r.dataset.status;
    r.style.display = (text.includes(q) && (s === 'all' || status === s)) ? '' : 'none';
  });
}

search.addEventListener('input', applyFilters);
filter.addEventListener('change', applyFilters);

const modal = document.getElementById('addApptModal');
document.getElementById('addApptBtn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('closeModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('cancelModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('addApptForm').addEventListener('submit', e => { e.preventDefault(); modal.classList.remove('open'); });
