const searchInput = document.getElementById('doctorSearch');
const deptFilter = document.getElementById('deptFilter');
const cards = document.querySelectorAll('#doctorGrid .doctor-card');

function filterDoctors() {
  const q = searchInput.value.toLowerCase();
  const dept = deptFilter.value;
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const cardDept = card.dataset.dept;
    const matchSearch = text.includes(q);
    const matchDept = dept === 'all' || cardDept === dept;
    card.style.display = matchSearch && matchDept ? '' : 'none';
  });
}

searchInput.addEventListener('input', filterDoctors);
deptFilter.addEventListener('change', filterDoctors);

const modal = document.getElementById('addDoctorModal');
document.getElementById('addDoctorBtn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('closeModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('cancelModal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

document.getElementById('addDoctorForm').addEventListener('submit', e => {
  e.preventDefault();
  modal.classList.remove('open');
});
