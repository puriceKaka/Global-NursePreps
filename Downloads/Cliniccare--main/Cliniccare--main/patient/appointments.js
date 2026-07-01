/* appointments.js */
document.addEventListener('DOMContentLoaded', function () {

  /* ── SEARCH ── */
  var search = document.getElementById('apptSearch');
  var rows   = document.querySelectorAll('#apptTable tr');

  if (search) {
    search.addEventListener('input', function () {
      var q = this.value.toLowerCase();
      rows.forEach(function (row) {
        var text = row.textContent.toLowerCase();
        row.classList.toggle('hidden', q.length > 0 && !text.includes(q));
      });
    });
  }

  /* ── FILTER TABS ── */
  var tabs = document.querySelectorAll('.appt-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var filter = tab.dataset.filter;
      rows.forEach(function (row) {
        if (filter === 'all') {
          row.classList.remove('hidden');
        } else {
          row.classList.toggle('hidden', row.dataset.status !== filter);
        }
      });
      if (search) search.value = '';
    });
  });

  /* ── BOOK MODAL ── */
  var modal        = document.getElementById('bookModal');
  var openBtn      = document.getElementById('openBookModal');
  var closeBtn     = document.getElementById('closeBookModal');
  var cancelBtn    = document.getElementById('cancelBookModal');
  var form         = document.getElementById('bookForm');

  function openModal()  { modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); }

  if (openBtn)   openBtn.addEventListener('click', openModal);
  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var service = document.getElementById('apptService').value;
      var doctor  = document.getElementById('apptDoctor').value;
      var date    = document.getElementById('apptDate').value;
      var time    = document.getElementById('apptTime').value;

      var tbody = document.getElementById('apptTable');
      var tr = document.createElement('tr');
      tr.dataset.status = 'pending';
      tr.innerHTML =
        '<td>' + date + '</td>' +
        '<td>' + time + '</td>' +
        '<td>' + service + '</td>' +
        '<td>' + doctor + '</td>' +
        '<td><span class="badge badge-yellow">Pending</span></td>' +
        '<td><button class="btn btn-ghost btn-sm">Details</button></td>';
      tbody.prepend(tr);

      closeModal();
    });
  }
});
