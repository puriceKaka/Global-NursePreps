window.GnpUtils = (() => {
    function safeJsonParse(raw, fallback = null) {
        if (typeof raw !== "string" || raw.trim() === "") return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function sanitizeText(value) {
        return String(value || "").replace(/[<>&"']/g, (char) => ({
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            "\"": "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function getSession() {
        return safeJsonParse(localStorage.getItem("nurseprep_session"), null);
    }

    function requireAuth(nextUrl = "homepage.html") {
        const session = getSession();
        if (session?.userId) return session;
        const next = encodeURIComponent(nextUrl);
        window.location.href = `login.html?next=${next}`;
        return null;
    }

    function getNextUrl(fallback = "homepage.html") {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        return next && !next.startsWith("http") ? next : fallback;
    }

    function toast(message) {
        const box = document.createElement("div");
        box.className = "gnp-toast";
        box.textContent = message;
        document.body.appendChild(box);
        window.setTimeout(() => box.remove(), 3200);
    }

    return {
        safeJsonParse,
        sanitizeText,
        getSession,
        requireAuth,
        getNextUrl,
        toast
    };
})();
