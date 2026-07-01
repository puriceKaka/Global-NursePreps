const search = document.getElementById('logSearch');
const filter = document.getElementById('logFilter');
const rows = () => document.querySelectorAll('#logTable tr');

function applyFilters() {
  const q = search.value.toLowerCase();
  const t = filter.value;
  rows().forEach(r => {
    const text = r.textContent.toLowerCase();
    const type = r.dataset.type;
    r.style.display = (text.includes(q) && (t === 'all' || type === t)) ? '' : 'none';
  });
}

search.addEventListener('input', applyFilters);
filter.addEventListener('change', applyFilters);
document.getElementById('clearLogsBtn').addEventListener('click', () => {
  search.value = '';
  filter.value = 'all';
  applyFilters();
});
