const searchInput = document.getElementById('deptSearch');
const cards = document.querySelectorAll('#deptGrid .dept-card');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  cards.forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

const modal = document.getElementById('addDeptModal');
document.getElementById('addDeptBtn').addEventListener('click', () => modal.classList.add('open'));
document.getElementById('closeModal').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('cancelModal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

document.getElementById('addDeptForm').addEventListener('submit', e => {
  e.preventDefault();
  modal.classList.remove('open');
});
