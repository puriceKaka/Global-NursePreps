/* billing.js */
document.addEventListener('DOMContentLoaded', function () {

  /* ── SEARCH ── */
  var search = document.getElementById('billingSearch');
  var rows   = document.querySelectorAll('#billingTable tr');

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
  var tabs = document.querySelectorAll('.billing-filter-tab');
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
});
