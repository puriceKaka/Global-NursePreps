const search = document.getElementById('userSearch');
const roleFilter = document.getElementById('roleFilter');
const statusFilter = document.getElementById('statusFilter');
const rows = () => document.querySelectorAll('#userTable tr');

function applyFilters() {
  const q = search.value.toLowerCase();
  const role = roleFilter.value;
  const status = statusFilter.value;
  rows().forEach(r => {
    const text = r.textContent.toLowerCase();
    const matchQ = text.includes(q);
    const matchRole = role === 'all' || r.dataset.role === role;
    const matchStatus = status === 'all' || r.dataset.status === status;
    r.style.display = (matchQ && matchRole && matchStatus) ? '' : 'none';
  });
}

search.addEventListener('input', applyFilters);
roleFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);
