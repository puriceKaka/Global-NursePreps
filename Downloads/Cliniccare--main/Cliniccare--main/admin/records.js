const search = document.getElementById('recSearch');
const filter = document.getElementById('recFilter');
const rows = () => document.querySelectorAll('#recTable tr');

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
