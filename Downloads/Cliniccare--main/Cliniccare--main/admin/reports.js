const preview = document.getElementById('reportPreview');
const previewTitle = document.getElementById('previewTitle');

document.querySelectorAll('.report-card button').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.report-card');
    previewTitle.textContent = card.querySelector('h3').textContent;
    preview.style.display = '';
    preview.scrollIntoView({ behavior: 'smooth' });
  });
});

document.getElementById('downloadReport').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,Report data placeholder';
  a.download = 'report.csv';
  a.click();
});
