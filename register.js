(() => {
    const $ = (selector) => document.querySelector(selector);

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

    function getSession() {
        return window.GnpUtils?.getSession?.() || null;
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
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: window.GnpUtils?.sanitizeText?.(name) || name,
                    email,
                    password
                })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                showError(data.error || 'Registration failed. Please try again.');
                return;
            }
            window.location.replace(window.GnpUtils?.getNextUrl?.('homepage.html') || 'homepage.html');
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
