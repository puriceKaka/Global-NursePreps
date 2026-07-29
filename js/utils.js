window.GnpUtils = (() => {
    const SESSION_SNAPSHOT_KEY = "gnp_session_snapshot";

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

    function parseCookies() {
        return String(document.cookie || "")
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
            .reduce((cookies, part) => {
                const idx = part.indexOf("=");
                const key = idx === -1 ? part : part.slice(0, idx);
                const value = idx === -1 ? "" : part.slice(idx + 1);
                if (key) {
                    cookies[decodeURIComponent(key)] = decodeURIComponent(value || "");
                }
                return cookies;
            }, {});
    }

    function decodeJwtPayload(token) {
        const parts = String(token || "").split(".");
        if (parts.length !== 3) return null;
        try {
            const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const padded = payload + "===".slice((payload.length + 3) % 4);
            return JSON.parse(atob(padded));
        } catch {
            return null;
        }
    }

    function getSession() {
        const snapshot = safeJsonParse(sessionStorage.getItem(SESSION_SNAPSHOT_KEY), null);
        if (snapshot?.userId && snapshot?.authToken) {
            const expiresAt = Date.parse(snapshot.expiresAt || "");
            if (!Number.isFinite(expiresAt) || expiresAt > Date.now()) {
                return snapshot;
            }
            sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
        }

        const cookies = parseCookies();
        const token = String(cookies.gnp_session || "").trim();
        if (!token) return null;
        const decoded = decodeJwtPayload(token);
        if (!decoded?.sub) return null;
        const session = {
            id: `session_${decoded.sub}`,
            userId: decoded.sub,
            name: decoded.name || decoded.email || "Member",
            email: decoded.email || "",
            role: decoded.role || "student",
            loginAt: new Date((Number(decoded.iat || 0)) * 1000 || Date.now()).toISOString(),
            verified: true,
            verificationStatus: "verified",
            authToken: token,
            tokenType: "Bearer",
            expiresAt: new Date((Number(decoded.exp || 0)) * 1000 || Date.now()).toISOString()
        };
        if (window.GnpAuthSecurity?.isSessionValid && !window.GnpAuthSecurity.isSessionValid(session)) {
            return null;
        }
        return session;
    }

    function setSession(authResponse) {
        const user = authResponse?.user || {};
        const token = String(authResponse?.token || "").trim();
        if (!user.id || !token) return null;
        const decoded = decodeJwtPayload(token) || {};
        const session = {
            id: `session_${user.id}`,
            userId: user.id,
            name: user.name || decoded.name || user.email || "Member",
            email: user.email || decoded.email || "",
            role: user.role || decoded.role || "student",
            loginAt: new Date((Number(decoded.iat || 0)) * 1000 || Date.now()).toISOString(),
            verified: true,
            verificationStatus: "verified",
            authToken: token,
            tokenType: "Bearer",
            expiresAt: new Date((Number(decoded.exp || 0)) * 1000 || Date.now() + (8 * 60 * 60 * 1000)).toISOString()
        };
        sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(session));
        return session;
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
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
        setSession,
        clearSession,
        requireAuth,
        getNextUrl,
        toast
    };
})();
