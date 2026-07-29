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

        if (password.length < 8) {
            showError('Password must be at least 8 characters.');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Logging in...';
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                showError(data.error || 'Login failed. Please check your details and try again.');
                return;
            }
            window.GnpUtils?.setSession?.(data);
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
        const params = new URLSearchParams(window.location.search);
        const next = window.GnpUtils?.getNextUrl?.('');
        if (next) {
            document.querySelectorAll('a[href="register.html"]').forEach((link) => {
                link.href = `register.html?next=${encodeURIComponent(next)}`;
            });
        }
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
