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

    async function sha256Hex(text) {
        if (!window.crypto || !window.crypto.subtle) return text;
        const data = new TextEncoder().encode(text);
        const hash = await window.crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
        const password = ($("#passwordInput")?.value || "").trim();
        const confirm = ($("#confirmPasswordInput")?.value || "").trim();
        const btn = $("#resetBtn");

        if (!email || !password || !confirm) {
            showMessage("Please complete all fields.", "error");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must be at least 6 characters.", "error");
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

            users[index] = {
                ...users[index],
                passwordHash: await sha256Hex(password),
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
    });
})();
