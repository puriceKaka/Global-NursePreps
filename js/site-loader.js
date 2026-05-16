(function () {
    if (document.getElementById('gnpGlobalLoader')) return;

    var loader;
    var slowTimer;
    var navigationTimer;
    var visible = false;
    var scriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
    var logoUrl = new URL('../logo/finalLogo.jpg', scriptUrl).href;

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

    function isNavigationLink(link) {
        if (!link || !link.href) return false;
        if (link.hasAttribute('download')) return false;
        if (link.target && link.target.toLowerCase() !== '_self') return false;

        var href = link.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#') return false;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

        try {
            var targetUrl = new URL(link.href, window.location.href);
            if (targetUrl.origin !== window.location.origin) return true;
            return targetUrl.pathname !== window.location.pathname ||
                targetUrl.search !== window.location.search ||
                targetUrl.hash !== window.location.hash;
        } catch (error) {
            return false;
        }
    }

    function showNavigationLoader(message) {
        window.clearTimeout(navigationTimer);
        showLoader(message || 'Opening page...');
        navigationTimer = window.setTimeout(function () {
            if (navigator.onLine !== false) hideLoader();
        }, 1400);
    }

    if (navigator.onLine === false) {
        if (document.body) showOffline();
        else document.addEventListener('DOMContentLoaded', showOffline);
    } else {
        slowTimer = window.setTimeout(function () {
            if (document.readyState !== 'complete') {
                showLoader('Network is slow. Loading platform...');
            }
        }, 900);
    }

    window.addEventListener('load', function () {
        window.clearTimeout(slowTimer);
        if (visible && navigator.onLine !== false) {
            window.setTimeout(hideLoader, 450);
        }
    });

    window.addEventListener('offline', showOffline);
    window.addEventListener('online', hideIfOnline);

    document.addEventListener('click', function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        var link = event.target.closest ? event.target.closest('a[href]') : null;
        if (!isNavigationLink(link)) return;

        var isCourseLink = /courses\.html/i.test(link.href);
        showNavigationLoader(isCourseLink ? 'Opening courses...' : 'Opening page...');
    }, true);

    window.addEventListener('pageshow', function () {
        window.clearTimeout(navigationTimer);
        if (navigator.onLine !== false) hideLoader();
    });

    window.GlobalNursePrepLoader = {
        show: showNavigationLoader,
        hide: hideLoader,
        offline: showOffline
    };
}());
