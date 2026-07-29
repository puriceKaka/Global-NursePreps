window.GnpApi = (() => {
    const DEFAULT_TIMEOUT_MS = 12000;

    function getSession() {
        return window.GnpUtils?.getSession?.() || null;
    }

    function getAuthHeaders() {
        const session = getSession();
        if (!session?.authToken) return {};
        return {
            Authorization: `${session.tokenType || "Bearer"} ${session.authToken}`,
            "X-GNP-User": session.userId,
            "X-GNP-Session": session.id || ""
        };
    }

    async function request(path, options = {}) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
        const retries = Number.isFinite(options.retries) ? options.retries : 1;
        const headers = {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
            ...(options.headers || {})
        };

        try {
            const response = await fetch(path, {
                ...options,
                credentials: "include",
                headers,
                signal: controller.signal
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }
            return data;
        } catch (error) {
            if (retries > 0 && error.name !== "AbortError") {
                return request(path, { ...options, retries: retries - 1 });
            }
            throw error;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    return {
        getSession,
        getAuthHeaders,
        request
    };
})();
