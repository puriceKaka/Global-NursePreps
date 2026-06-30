(() => {
    const STORAGE_KEYS = {
        users: 'nurseprep_users',
        session: 'nurseprep_session'
    };

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
        try {
            return safeJsonParse(localStorage.getItem(key), fallback);
        } catch {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            showError('Storage is unavailable. Please enable browser storage and try again.');
            return false;
        }
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

    function setUsers(users) {
        return saveJson(STORAGE_KEYS.users, users);
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
        btn.classList.toggle('is-password-visible', show);
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }

    function togglePasswordByButton(button) {
        const input = document.getElementById(button.dataset.togglePassword || '');
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? 'Hide' : 'Show';
        button.classList.toggle('is-password-visible', show);
        button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }

    async function onSubmit(event) {
        event.preventDefault();
        clearError();

        const name = ($('#nameInput')?.value || '').trim();
        const email = ($('#emailInput')?.value || '').trim().toLowerCase();
        const password = $('#passwordInput')?.value || '';
        const confirm = $('#confirmInput')?.value || '';
        const btn = $('#registerBtn');

        if (!name || !email || !password || !confirm) {
            showError('Please fill in all fields.');
            return;
        }

        const passwordCheck = window.GnpAuthSecurity?.validatePassword(password);
        if (!passwordCheck?.ok) {
            showError(passwordCheck?.message || 'Use a stronger password.');
            return;
        }

        if (password !== confirm) {
            showError('Passwords do not match.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Creating...';
        }

        try {
            if (window.GnpSupabase?.isConfigured?.()) {
                const auth = await window.GnpSupabase.signUp({
                    email,
                    password,
                    data: {
                        full_name: window.GnpUtils?.sanitizeText?.(name) || name,
                        name,
                        role: 'student'
                    }
                });

                if (!auth?.user) {
                    showError('Registration failed. Please try again.');
                    return;
                }

                if (auth.session) {
                    saveJson(STORAGE_KEYS.session, auth.session);
                    if (window.GnpLearning?.refreshCurrentUserState) {
                        await window.GnpLearning.refreshCurrentUserState();
                    }
                    const next = window.GnpUtils?.getNextUrl?.('homepage.html');
                    window.location.replace(next || 'homepage.html');
                    return;
                }

                window.location.replace(`login.html?registered=1&email=${encodeURIComponent(email)}`);
                return;
            }

            const users = getUsers();
            const exists = users.some((u) => (u.email || '').toLowerCase() === email);
            if (exists) {
                showError('That email is already registered. Please login instead.');
                return;
            }

            const passwordRecord = await window.GnpAuthSecurity.createPasswordRecord(password);
            const user = {
                id: uid('user'),
                name: window.GnpUtils?.sanitizeText?.(name) || name,
                email,
                ...passwordRecord,
                role: 'student',
                verified: false,
                emailVerified: false,
                verificationStatus: 'pending',
                verificationToken: window.GnpAuthSecurity?.createClientToken?.('gnp_verify') || uid('verify'),
                profile: {
                    displayName: window.GnpUtils?.sanitizeText?.(name) || name,
                    learningGoal: 'Nursing exam preparation',
                    createdFrom: 'register'
                },
                createdAt: new Date().toISOString()
            };

            if (!setUsers([user, ...users])) {
                return;
            }
            localStorage.removeItem(STORAGE_KEYS.session);
            const next = window.GnpUtils?.getNextUrl?.('');
            const nextParam = next ? `&next=${encodeURIComponent(next)}` : '';
            window.location.replace(`login.html?registered=1&email=${encodeURIComponent(email)}${nextParam}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Create account';
            }
        }
    }

    function main() {
        redirectIfLoggedIn();
        const policy = $('#passwordPolicy');
        if (policy && window.GnpAuthSecurity?.PASSWORD_POLICY_TEXT) {
            policy.textContent = window.GnpAuthSecurity.PASSWORD_POLICY_TEXT;
        }
        $('#togglePasswordBtn')?.addEventListener('click', togglePassword);
        const next = window.GnpUtils?.getNextUrl?.('');
        if (next) {
            document.querySelectorAll('a[href="login.html"]').forEach((link) => {
                link.href = `login.html?next=${encodeURIComponent(next)}`;
            });
        }
        document.querySelectorAll('[data-toggle-password]').forEach((button) => {
            button.addEventListener('click', () => togglePasswordByButton(button));
        });
        $('#registerForm')?.addEventListener('submit', onSubmit);
    }

    document.addEventListener('DOMContentLoaded', main);
})();
