window.GnpAdminApi = (() => {
    const DEFAULT_TIMEOUT_MS = 12000;

    async function request(path, options = {}) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
        const method = String(options.method || "GET").toUpperCase();
        const headers = {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        };

        try {
            const response = await fetch(path, {
                method,
                credentials: "same-origin",
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }
            return data;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    return {
        request,
        status: () => request("/api/admin/status"),
        me: () => request("/api/admin/me"),
        login: ({ email, password }) => request("/api/admin/login", {
            method: "POST",
            body: { email, password }
        }),
        bootstrap: ({ email, password, setupKey }) => request("/api/admin/bootstrap", {
            method: "POST",
            body: { email, password, setupKey }
        }),
        logout: () => request("/api/admin/logout", { method: "POST" }),
        loadState: () => request("/api/admin/state"),
        saveState: (state) => request("/api/admin/state", {
            method: "PUT",
            body: { state }
        }),
        seedState: () => request("/api/admin/seed", { method: "POST" }),
        loadCourses: () => request("/api/admin/courses"),
        saveCourses: (courses) => request("/api/admin/courses", {
            method: "PUT",
            body: { courses }
        }),
        deleteCourse: (courseId) => request(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
            method: "DELETE"
        })
    };
})();
