(() => {
    const STORAGE_KEYS = {
        users: 'nurseprep_users',
        session: 'nurseprep_session',
        rememberedLogin: 'nurseprep_remembered_login'
    };
    const LECTURER_SESSION_KEY = 'gnp_lecturer_session';
    const ADMIN_SESSION_KEY = 'gnp_admin_session';

    const $ = (selector) => document.querySelector(selector);

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== 'string' || raw.trim() === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function loadJson(key, fallback) {
        return safeJsonParse(localStorage.getItem(key), fallback);
    }

    function saveJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function uid(prefix = 'id') {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return `${prefix}_${window.crypto.randomUUID()}`;
        }
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    }

    function showError(message) {
        const box = $('#errorBox');
        if (!box) return;
        box.textContent = message;
        box.classList.remove('hidden');
    }

    function clearError() {
        const box = $('#errorBox');
        if (!box) return;
        box.textContent = '';
        box.classList.add('hidden');
    }

    function getUsers() {
        const users = loadJson(STORAGE_KEYS.users, []);
        return Array.isArray(users) ? users : [];
    }

    function getSession() {
        return loadJson(STORAGE_KEYS.session, null);
    }

    function redirectIfLoggedIn() {
        const session = getSession();
        if (session && session.userId) {
            window.location.replace(window.GnpUtils?.getNextUrl?.('homepage.html') || 'homepage.html');
        }
    }

    function togglePassword() {
        const input = $('#passwordInput');
        const btn = $('#togglePasswordBtn');
        if (!input || !btn) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }

    function handleSocialLogin(event) {
        const provider = event.currentTarget?.dataset?.provider || 'this provider';
        showError(`${provider} sign-in is ready in the UI. Connect OAuth/Firebase provider keys before enabling live sign-in.`);
    }

    async function onSubmit(event) {
        event.preventDefault();
        clearError();

        const email = ($('#emailInput')?.value || '').trim().toLowerCase();
        const password = ($('#passwordInput')?.value || '').trim();
        const btn = $('#loginBtn');

        if (!email || !password) {
            showError('Please enter your email and password.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Logging in...';
        }

        try {
            const users = getUsers();
            const user = users.find((u) => (u.email || '').toLowerCase() === email);
            if (!user) {
                showError('Account not found. Please create an account first.');
                return;
            }

            const passwordOk = await window.GnpAuthSecurity.verifyPassword(password, user);
            if (!passwordOk) {
                showError('Incorrect password. Try again.');
                return;
            }

            await window.GnpAuthSecurity.upgradePasswordIfNeeded(password, user, (upgradedUser) => {
                saveJson(STORAGE_KEYS.users, users.map((item) => item.id === user.id ? upgradedUser : item));
            });

            localStorage.removeItem(LECTURER_SESSION_KEY);
            localStorage.removeItem(ADMIN_SESSION_KEY);
            saveJson(STORAGE_KEYS.session, {
                id: uid('session'),
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'student',
                loginAt: new Date().toISOString()
            });

            if ($('#rememberMe')?.checked) {
                saveJson(STORAGE_KEYS.rememberedLogin, { email, password });
            } else {
                localStorage.removeItem(STORAGE_KEYS.rememberedLogin);
            }

            window.location.replace(window.GnpUtils?.getNextUrl?.('homepage.html') || 'homepage.html');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Login';
            }
        }
    }

    function main() {
        redirectIfLoggedIn();
        const remembered = loadJson(STORAGE_KEYS.rememberedLogin, null);
        if (remembered && typeof remembered.email === 'string' && typeof remembered.password === 'string') {
            if ($('#emailInput')) $('#emailInput').value = remembered.email;
            if ($('#passwordInput')) $('#passwordInput').value = remembered.password;
            if ($('#rememberMe')) $('#rememberMe').checked = true;
        }
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === '1') {
            showError('Account created. Please login with your email and password.');
            const email = params.get('email');
            if (email && $('#emailInput')) {
                $('#emailInput').value = email;
            }
        }
        $('#togglePasswordBtn')?.addEventListener('click', togglePassword);
        $('#loginForm')?.addEventListener('submit', onSubmit);
        document.querySelectorAll('[data-provider]').forEach((button) => {
            button.addEventListener('click', handleSocialLogin);
        });
    }

    document.addEventListener('DOMContentLoaded', main);
})();
