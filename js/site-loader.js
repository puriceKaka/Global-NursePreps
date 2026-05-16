(function () {
    if (document.getElementById('gnpGlobalLoader')) return;

    var loader;
    var slowTimer;
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
        showLoader('Network is low or offline. Waiting for connection...');
    }

    function hideIfOnline() {
        if (navigator.onLine !== false) {
            hideLoader();
        }
    }

    if (navigator.onLine === false) {
        if (document.body) showOffline();
        else document.addEventListener('DOMContentLoaded', showOffline);
    } else {
        slowTimer = window.setTimeout(function () {
            if (document.readyState !== 'complete') {
                showLoader('Network is slow. Loading platform...');
            }
        }, 1800);
    }

    window.addEventListener('load', function () {
        window.clearTimeout(slowTimer);
        if (visible && navigator.onLine !== false) {
            window.setTimeout(hideLoader, 450);
        }
    });

    window.addEventListener('offline', showOffline);
    window.addEventListener('online', hideIfOnline);
}());
