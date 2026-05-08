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

    async function sha256Hex(text) {
        if (!window.crypto || !window.crypto.subtle) return text;
        const data = new TextEncoder().encode(text);
        const hash = await window.crypto.subtle.digest('SHA-256', data);
        const bytes = Array.from(new Uint8Array(hash));
        return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
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
        saveJson(STORAGE_KEYS.users, users);
    }

    function getSession() {
        return loadJson(STORAGE_KEYS.session, null);
    }

    function redirectIfLoggedIn() {
        const session = getSession();
        if (session && session.userId) {
            window.location.replace('homepage.html');
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

    async function onSubmit(event) {
        event.preventDefault();
        clearError();

        const name = ($('#nameInput')?.value || '').trim();
        const email = ($('#emailInput')?.value || '').trim().toLowerCase();
        const password = ($('#passwordInput')?.value || '').trim();
        const confirm = ($('#confirmInput')?.value || '').trim();
        const btn = $('#registerBtn');

        if (!name || !email || !password || !confirm) {
            showError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
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
            const users = getUsers();
            const exists = users.some((u) => (u.email || '').toLowerCase() === email);
            if (exists) {
                showError('That email is already registered. Please login instead.');
                return;
            }

            const passwordHash = await sha256Hex(password);
            const user = {
                id: uid('user'),
                name: window.GnpUtils?.sanitizeText?.(name) || name,
                email,
                passwordHash,
                role: 'student',
                profile: {
                    displayName: window.GnpUtils?.sanitizeText?.(name) || name,
                    learningGoal: 'Nursing exam preparation',
                    createdFrom: 'register'
                },
                createdAt: new Date().toISOString()
            };

            setUsers([user, ...users]);

            saveJson(STORAGE_KEYS.session, {
                id: uid('session'),
                userId: user.id,
                name: user.name,
                email: user.email,
                loginAt: new Date().toISOString()
            });

            window.location.replace('homepage.html');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Create account';
            }
        }
    }

    function main() {
        redirectIfLoggedIn();
        $('#togglePasswordBtn')?.addEventListener('click', togglePassword);
        $('#registerForm')?.addEventListener('submit', onSubmit);
    }

    document.addEventListener('DOMContentLoaded', main);
})();
