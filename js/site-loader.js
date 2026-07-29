(function () {
    if (document.getElementById('gnpGlobalLoader')) return;

    var loader;
    var slowTimer;
    var firstEntryTimer;
    var firstEntryActive = false;
    var visible = false;
    var firstEntryKey = 'gnp_loader_seen_once';
    var scriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
    var logoUrl = new URL('../logo/finalLogo.jpg', scriptUrl).href;
    var faviconUrl = new URL('/favicon.svg', window.location.origin).href;

    function ensureHeadLink(rel, href, type) {
        if (!document.head) return;

        var selector = 'link[rel="' + rel + '"][href="' + href + '"]';
        if (document.head.querySelector(selector)) return;

        var link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (type) link.type = type;
        document.head.appendChild(link);
    }

    ensureHeadLink('icon', faviconUrl, 'image/svg+xml');
    ensureHeadLink('shortcut icon', faviconUrl, 'image/svg+xml');

    function createLoader() {
        if (loader) return loader;

        loader = document.createElement('div');
        loader.className = 'gnp-global-loader hide';
        loader.id = 'gnpGlobalLoader';
        loader.setAttribute('aria-live', 'polite');
        loader.setAttribute('aria-label', 'Loading Global NursePrep');
        loader.innerHTML = [
            '<div class="gnp-global-loader-card">',
            '<span class="gnp-global-loader-mark"><img src="' + logoUrl + '" alt="Global NursePrep logo"></span>',
            '<strong>Global NursePrep</strong>',
            '<span class="gnp-loader-track" aria-hidden="true"><span></span></span>',
            '<span id="gnpLoaderMessage">Checking connection</span>',
            '</div>'
        ].join('');

        return loader;
    }

    function attachLoader() {
        var node = createLoader();
        if (document.body && !document.getElementById('gnpGlobalLoader')) {
            document.body.prepend(node);
        }
    }

    function setMessage(message) {
        attachLoader();
        var messageNode = document.getElementById('gnpLoaderMessage');
        if (messageNode) messageNode.textContent = message;
    }

    function showLoader(message) {
        attachLoader();
        setMessage(message || 'Loading platform');
        visible = true;
        loader.classList.remove('hide');
    }

    function hideLoader() {
        if (!loader) return;
        visible = false;
        loader.classList.add('hide');
    }

    function showOffline() {
        showLoader('Network is down. Waiting for connection...');
    }

    function hideIfOnline() {
        if (navigator.onLine !== false) {
            hideLoader();
        }
    }

    function showCourseClickLoader(message) {
        if (navigator.onLine === false) {
            showOffline();
            return;
        }

        showLoader(message || 'Opening course...');
        window.setTimeout(function () {
            if (navigator.onLine !== false) hideLoader();
        }, 3000);
    }

    function showFirstEntryLoader() {
        firstEntryActive = true;
        showLoader('Loading Global NursePrep...');
        window.clearTimeout(firstEntryTimer);
        firstEntryTimer = window.setTimeout(function () {
            firstEntryActive = false;
            if (navigator.onLine !== false) hideLoader();
        }, 4000);
    }

    if (navigator.onLine === false) {
        if (document.body) showOffline();
        else document.addEventListener('DOMContentLoaded', showOffline);
    } else {
        try {
            if (sessionStorage.getItem(firstEntryKey) !== '1') {
                sessionStorage.setItem(firstEntryKey, '1');
                if (document.body) showFirstEntryLoader();
                else document.addEventListener('DOMContentLoaded', function () {
                    showFirstEntryLoader();
                });
            }
        } catch (error) {
            if (document.body) showFirstEntryLoader();
        }

        slowTimer = window.setTimeout(function () {
            if (document.readyState !== 'complete') {
                showLoader('Network is slow. Loading platform...');
            }
        }, 900);
    }

    window.addEventListener('load', function () {
        window.clearTimeout(slowTimer);
        if (visible && !firstEntryActive && navigator.onLine !== false) {
            window.setTimeout(hideLoader, 450);
        }
    });

    window.addEventListener('offline', showOffline);
    window.addEventListener('online', hideIfOnline);

    document.addEventListener('click', function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        var courseLink = event.target.closest ? event.target.closest('[data-course-loader]') : null;
        if (!courseLink) return;

        showCourseClickLoader('Opening ' + courseLink.textContent.trim() + '...');
    }, true);

    window.GlobalNursePrepLoader = {
        show: showCourseClickLoader,
        hide: hideLoader,
        offline: showOffline
    };
}());
