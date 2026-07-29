(() => {
    const $ = (selector) => document.querySelector(selector);

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
            if (!window.GnpSupabase?.isConfigured?.()) {
                showMessage("Supabase is not configured yet. Add the Supabase URL and anon key before resetting passwords.", "error");
                return;
            }

            await window.GnpSupabase.requestPasswordReset?.(email);
            showMessage("If that email exists in Supabase, a password reset link was sent.", "success");
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
