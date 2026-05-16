(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== 'string' || raw.trim() === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function getBrandLogoSrc() {
        const bySrc = document.querySelector("img[src*='finalLogo']");
        if (bySrc?.getAttribute("src")) {
            return bySrc.getAttribute("src");
        }

        const byAlt = document.querySelector("img[alt*='logo' i]");
        if (byAlt?.getAttribute("src")) {
            return byAlt.getAttribute("src");
        }

        return "";
    }

    function syncDrawerOffset() {
        const header = document.querySelector(".topbar, .navbar, .header, .public-nav");
        const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
        document.documentElement.style.setProperty("--drawer-top", `${headerHeight}px`);
    }

    function openDrawer() {
        syncDrawerOffset();
        $('#drawer')?.classList.remove('hidden');
        $('#drawerOverlay')?.classList.remove('hidden');
        $('#drawerOverlay')?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('drawer-open');
    }

    function closeDrawer() {
        $('#drawer')?.classList.add('hidden');
        $('#drawerOverlay')?.classList.add('hidden');
        $('#drawerOverlay')?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('drawer-open');
    }

    function scrollToTarget(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function updateDrawerUser() {
        const session = safeJsonParse(localStorage.getItem('nurseprep_session'), null);
        const logoSrc = getBrandLogoSrc();

        const avatar = $('#drawerAvatar');
        if (avatar) {
            const existingImg = avatar.querySelector("img");
            if (logoSrc) {
                if (!existingImg) {
                    avatar.innerHTML = `<img src="${logoSrc}" alt="Global NursePrep logo">`;
                } else if (existingImg.getAttribute("src") !== logoSrc) {
                    existingImg.setAttribute("src", logoSrc);
                }
            }
        }

        if (!session) return;

        const name = String(session.name || 'Member').trim() || 'Member';
        const email = String(session.email || '—').trim() || '—';

        const drawerName = $('#drawerName');
        if (drawerName) drawerName.textContent = name;

        const drawerEmail = $('#drawerEmail');
        if (drawerEmail) drawerEmail.textContent = email;

        if (avatar && !avatar.querySelector("img") && !avatar.textContent.trim()) {
            avatar.textContent = name.slice(0, 1).toUpperCase() || "N";
        }
    }

    function initDrawerNav() {
        const menuToggle = $('#menuToggle');
        const closeBtn = $('#drawerClose');
        const overlay = $('#drawerOverlay');
        const drawer = $('#drawer');
        if (!menuToggle || !closeBtn || !overlay || !drawer) return;

        menuToggle.addEventListener('click', openDrawer);
        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeDrawer();
        });

        $$('.drawer-link').forEach((item) => {
            item.addEventListener('click', (event) => {
                const target = item.dataset.target;
                if (target) {
                    const el = document.getElementById(target);
                    if (el) {
                        event.preventDefault();
                        scrollToTarget(target);
                    }
                }
                closeDrawer();
            });
        });

        window.addEventListener('resize', syncDrawerOffset);
        window.addEventListener('orientationchange', syncDrawerOffset);
        syncDrawerOffset();
    }

    function ensurePuriceButton() {
        if (document.body.classList.contains("purice-page") || $("#chatButton")) return;

        const isNested = window.location.pathname.includes("/EXAMINATION%20PREP%20SITE/") ||
            window.location.pathname.includes("/EXAMINATION PREP SITE/");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chat-button";
        button.id = "chatButton";
        button.textContent = "Purice AI";
        button.addEventListener("click", () => {
            window.location.href = isNested ? "../purice-ai.html" : "purice-ai.html";
        });
        document.body.appendChild(button);
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateDrawerUser();
        initDrawerNav();
        ensurePuriceButton();
    });
})();
