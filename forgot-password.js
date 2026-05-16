(() => {
    const USERS_KEY = "nurseprep_users";
    const $ = (selector) => document.querySelector(selector);

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function getUsers() {
        const users = safeJsonParse(localStorage.getItem(USERS_KEY), []);
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function showMessage(text, type) {
        const box = $("#messageBox");
        if (!box) return;
        box.textContent = text;
        box.className = `message ${type}`;
    }

    async function onSubmit(event) {
        event.preventDefault();

        const email = ($("#emailInput")?.value || "").trim().toLowerCase();
        const password = $("#passwordInput")?.value || "";
        const confirm = $("#confirmPasswordInput")?.value || "";
        const btn = $("#resetBtn");

        if (!email || !password || !confirm) {
            showMessage("Please complete all fields.", "error");
            return;
        }

        const passwordCheck = window.GnpAuthSecurity?.validatePassword(password);
        if (!passwordCheck?.ok) {
            showMessage(passwordCheck?.message || "Use a stronger password.", "error");
            return;
        }

        if (password !== confirm) {
            showMessage("Passwords do not match.", "error");
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = "Updating...";
        }

        try {
            const users = getUsers();
            const index = users.findIndex((user) => String(user.email || "").toLowerCase() === email);

            if (index === -1) {
                showMessage("Account not found. Please check the email or create an account.", "error");
                return;
            }

            const passwordRecord = await window.GnpAuthSecurity.createPasswordRecord(password);
            users[index] = {
                ...users[index],
                ...passwordRecord,
                passwordUpdatedAt: new Date().toISOString()
            };

            saveUsers(users);
            showMessage("Password updated. You can now log in with the new password.", "success");
            event.target.reset();
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Reset password";
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        $("#resetForm")?.addEventListener("submit", onSubmit);
        document.querySelectorAll("[data-toggle-password]").forEach((button) => {
            button.addEventListener("click", () => {
                const input = document.getElementById(button.dataset.togglePassword);
                if (!input) return;
                const show = input.type === "password";
                input.type = show ? "text" : "password";
                button.classList.toggle("is-password-visible", show);
                button.setAttribute("aria-label", show ? "Hide password" : "Show password");
            });
        });
    });
})();
