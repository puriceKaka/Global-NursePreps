const search = document.getElementById('billSearch');
const filter = document.getElementById('billFilter');
const rows = () => document.querySelectorAll('#billTable tr');

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

const modal = document.getElementById('addInvoiceModal');
document.getElementById('addInvoiceBtn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('closeInvoiceModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('cancelInvoiceModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('addInvoiceForm').addEventListener('submit', e => { e.preventDefault(); modal.classList.remove('open'); });
