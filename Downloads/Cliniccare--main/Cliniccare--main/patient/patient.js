/* ── AUTH GUARD + USER INJECTION ── */
(function () {
  import('../assets/js/firebase.js').then(function (firebase) {
    firebase.useSessionPersistence().then(function () {
      firebase.auth.onAuthStateChanged(async function (user) {
        if (!user) { window.location.replace('../login.html'); return; }
        var profile = await firebase.ensureUserProfile(user);
        if (!profile || profile.role !== 'patient') {
          window.location.replace(firebase.getPortalRoute(profile && profile.role));
          return;
        }

        var render = function () {
          var name = profile.name || user.displayName || 'Patient';
          var initials = (name.trim().split(' ').map(function (p) { return p[0]; }).join('')).toUpperCase().slice(0, 2);
          var first = name.trim().split(' ')[0];
          var h = new Date().getHours();
          var greet = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

          document.querySelectorAll('[data-cc-name]').forEach(function (el) { el.textContent = name; });
          document.querySelectorAll('[data-cc-first]').forEach(function (el) { el.textContent = first; });
          document.querySelectorAll('[data-cc-initials]').forEach(function (el) { el.textContent = initials; });
          document.querySelectorAll('[data-cc-greeting]').forEach(function (el) { el.textContent = 'Good ' + greet + ', ' + first; });
          document.querySelectorAll('[data-cc-name-input]').forEach(function (el) { el.value = name; });
          document.querySelectorAll('[data-cc-email]').forEach(function (el) {
            if (el.tagName === 'INPUT') el.value = profile.email || user.email || '';
            else el.textContent = profile.email || user.email || '';
          });

          var un = document.getElementById('userName');
          if (un) un.textContent = name;
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', render, { once: true });
        } else {
          render();
        }

        var db = firebase.db;
        var q = firebase.query;
        var c = firebase.collection;
        var w = firebase.where;
        var o = firebase.orderBy;
        var l = firebase.limit;
        var getDocs = firebase.getDocs;

        async function safeGet(ref) {
          try {
            return await getDocs(ref);
          } catch (error) {
            return { empty: true, docs: [] };
          }
        }

        function formatMoney(value) {
          return '$' + Number(value || 0).toFixed(2);
        }

        function formatDate(value) {
          if (!value) return '--';
          var date = value.toDate ? value.toDate() : new Date(value);
          if (Number.isNaN(date.getTime())) return '--';
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function formatTime(value) {
          if (!value) return '--';
          var date = value.toDate ? value.toDate() : new Date(value);
          if (Number.isNaN(date.getTime())) return '--';
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }

        var apptSnap = await safeGet(q(c(db, 'appointments'), w('patientId', '==', user.uid)));
        var upcoming = apptSnap.docs
          .map(function (docSnap) { return docSnap.data(); })
          .filter(function (item) {
            if (!item.scheduledAt) return true;
            var when = item.scheduledAt.toDate ? item.scheduledAt.toDate() : new Date(item.scheduledAt);
            return !Number.isNaN(when.getTime()) && when >= new Date();
          })
          .sort(function (a, b) {
            var aTime = a.scheduledAt && a.scheduledAt.toDate ? a.scheduledAt.toDate().getTime() : new Date(a.scheduledAt || 0).getTime();
            var bTime = b.scheduledAt && b.scheduledAt.toDate ? b.scheduledAt.toDate().getTime() : new Date(b.scheduledAt || 0).getTime();
            return aTime - bTime;
          });

        var nextAppt = upcoming[0] || null;
        var apptCount = upcoming.length;
        var apptEl = document.querySelector('[data-dashboard-next-appointment]');
        if (apptEl) {
          if (nextAppt) {
            var whenValue = nextAppt.scheduledAt || nextAppt.date || null;
            var whenDate = whenValue && whenValue.toDate ? whenValue.toDate() : new Date(whenValue || '');
            var month = Number.isNaN(whenDate.getTime()) ? '--' : whenDate.toLocaleDateString('en-US', { month: 'short' });
            var day = Number.isNaN(whenDate.getTime()) ? '--' : String(whenDate.getDate());
            apptEl.innerHTML =
              '<div class="appointment-date"><span class="day">' + day + '</span><span class="month">' + month + '</span></div>' +
              '<div class="appointment-details">' +
                '<h4>' + (nextAppt.doctorName || nextAppt.doctor || 'Doctor') + '</h4>' +
                '<p>' + (nextAppt.reason || nextAppt.service || 'Appointment') + '</p>' +
                '<p>' + (Number.isNaN(whenDate.getTime()) ? '--' : formatDate(whenDate)) + ' · ' + (nextAppt.time || formatTime(whenDate)) + '</p>' +
              '</div>';
          } else {
            apptEl.innerHTML =
              '<div class="appointment-date"><span class="day">--</span><span class="month">--</span></div>' +
              '<div class="appointment-details"><h4>No appointments yet</h4><p>Book your first appointment to see it here.</p></div>';
          }
        }

        var billSnap = await safeGet(q(c(db, 'billing'), w('patientId', '==', user.uid)));
        var unpaidTotal = 0;
        var unpaidCount = 0;
        billSnap.docs.forEach(function (docSnap) {
          var item = docSnap.data();
          if (String(item.status || '').toLowerCase() !== 'paid') {
            unpaidCount += 1;
            unpaidTotal += Number(item.amount || 0);
          }
        });

        var messageSnap = await safeGet(q(c(db, 'messages'), w('recipientId', '==', user.uid)));
        var unreadCount = 0;
        messageSnap.docs.forEach(function (docSnap) {
          var item = docSnap.data();
          if (!item.read) unreadCount += 1;
        });

        var recordsSnap = await safeGet(q(c(db, 'medicalRecords'), w('patientId', '==', user.uid)));
        var recordCount = recordsSnap.docs.length;

        var apptCountEl = document.querySelector('[data-dashboard-appointments]');
        var apptNoteEl = document.querySelector('[data-dashboard-appointments-note]');
        if (apptCountEl) apptCountEl.textContent = String(apptCount);
        if (apptNoteEl) apptNoteEl.textContent = apptCount ? 'Upcoming from your schedule' : 'No upcoming appointments';

        var balanceEl = document.querySelector('[data-dashboard-balance]');
        var balanceNoteEl = document.querySelector('[data-dashboard-balance-note]');
        if (balanceEl) balanceEl.textContent = formatMoney(unpaidTotal);
        if (balanceNoteEl) balanceNoteEl.textContent = unpaidCount ? unpaidCount + ' unpaid bill' + (unpaidCount === 1 ? '' : 's') : 'All bills are paid';

        var messageEl = document.querySelector('[data-dashboard-messages]');
        var messageNoteEl = document.querySelector('[data-dashboard-messages-note]');
        if (messageEl) messageEl.textContent = String(unreadCount);
        if (messageNoteEl) messageNoteEl.textContent = unreadCount ? 'Unread messages in your inbox' : 'No unread messages';

        var recordEl = document.querySelector('[data-dashboard-records]');
        var recordNoteEl = document.querySelector('[data-dashboard-records-note]');
        if (recordEl) recordEl.textContent = String(recordCount);
        if (recordNoteEl) recordNoteEl.textContent = recordCount ? 'Records available to view' : 'No records yet';

        var msgList = document.querySelector('[data-dashboard-messages-list]');
        if (msgList) {
          var recentMessages = messageSnap.docs
            .map(function (docSnap) { return docSnap.data(); })
            .sort(function (a, b) {
              var aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
              var bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
              return bTime - aTime;
            })
            .slice(0, 2);

          if (recentMessages.length) {
            msgList.innerHTML = recentMessages.map(function (item) {
              var title = item.subject || 'Message';
              var body = item.body || 'No preview available';
              var time = formatDate(item.createdAt);
              return '<div class="message-item"><div class="message-content"><h4>' + title + '</h4><p>' + body + '</p><span class="message-time">' + time + '</span></div></div>';
            }).join('');
          } else {
            msgList.innerHTML = '<div class="message-item"><div class="message-content"><h4>No messages yet</h4><p>Your inbox will appear here once the clinic sends something.</p><span class="message-time">--</span></div></div>';
          }
        }
      });
    });
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.logout, [data-cc-logout]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      import('../assets/js/firebase.js').then(function (firebase) {
        firebase.signOutUser().finally(function () {
          window.location.href = '../login.html';
        });
      });
    });
  });

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      import('../assets/js/firebase.js').then(function (firebase) {
        firebase.signOutUser().finally(function () {
          window.location.href = '../login.html';
        });
      });
    });
  }
});
