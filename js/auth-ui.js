/* Auth UI helpers: hide UI elements when no authenticated session exists */
(function () {
    function getSession() {
        if (window.GnpUtils && typeof window.GnpUtils.getSession === 'function') {
            try { return window.GnpUtils.getSession(); } catch (e) { /* fallthrough */ }
        }
        return null;
    }

    function hideIfNotAuth() {
        var session = getSession();
        if (session) return; // signed out logic only

        // Hide common menu toggles / hamburger buttons
        ['#menuToggle', '#navToggle', '.nav-toggle', '.icon-button#menuToggle'].forEach(function (s) {
            document.querySelectorAll(s).forEach(function (el) { el.classList.add('hidden'); });
        });

        // Hide drawer elements (sidebar)
        document.querySelectorAll('#drawer, #drawerOverlay').forEach(function (el) { el.classList.add('hidden'); });

        // Hide logout buttons
        document.querySelectorAll('#logoutBtn, .logout-button, .nav-actions .logout-button').forEach(function (el) { el.classList.add('hidden'); });

        // Hide any explicit Exam Prep / exam links by href
        document.querySelectorAll('a[href*="EXAMINATION%20PREP%20SITE"], a[href*="exam-lobby"], a[href*="exam-lobby"]')
            .forEach(function (el) { el.classList.add('hidden'); });

        // Hide topbar / hero pill buttons that open exam prep
        document.querySelectorAll('.topbar-actions .pill-button, .hero-actions .pill-button, .pill-button').forEach(function (el) {
            var href = el.getAttribute('href') || '';
            if (href.indexOf('EXAMINATION%20PREP%20SITE') !== -1 || href.indexOf('exam-lobby') !== -1 || el.textContent.trim().toLowerCase().indexOf('exam') !== -1) {
                el.classList.add('hidden');
            }
        });

        // Hide nav links that contain the text "exam prep" (case-insensitive)
        document.querySelectorAll('nav a, .site-nav a, .nav-actions a').forEach(function (a) {
            try {
                var txt = (a.textContent || '').trim().toLowerCase();
                if (txt === 'exam prep' || txt.indexOf('exam') === 0 || txt.indexOf('open exam prep') !== -1) a.classList.add('hidden');
            } catch (e) { }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideIfNotAuth);
    else hideIfNotAuth();
}());
