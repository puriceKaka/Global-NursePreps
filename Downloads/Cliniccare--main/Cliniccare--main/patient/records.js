/* records.js */
document.addEventListener('DOMContentLoaded', function () {

  /* ── SEARCH ── */
  var search = document.getElementById('recordSearch');
  var cards  = document.querySelectorAll('.record-card');

  if (search) {
    search.addEventListener('input', function () {
      var q = this.value.toLowerCase();
      cards.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        card.classList.toggle('hidden', q.length > 0 && !text.includes(q));
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
      cards.forEach(function (card) {
        if (filter === 'all') {
          card.classList.remove('hidden');
        } else {
          card.classList.toggle('hidden', card.dataset.status !== filter);
        }
      });
      if (search) search.value = '';
    });
  });
});
