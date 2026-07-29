window.GnpAdminApi = (() => {
    const DEFAULT_TIMEOUT_MS = 12000;
    const STORAGE_KEYS = {
        account: "gnp_admin_account",
        session: "gnp_admin_session",
        state: "gnp_admin_state"
    };

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function loadJson(key, fallback) {
        try {
            return safeJsonParse(localStorage.getItem(key), fallback);
        } catch {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    function defaultState() {
        const createdAt = new Date().toISOString();
        return {
            courses: [],
            lecturers: [],
            groups: [],
            meetings: [],
            exams: [],
            resources: [],
            payments: [
                {
                    id: "pay_student_1",
                    payerRole: "student",
                    payerName: "Student Account",
                    item: "NCLEX-RN Comprehensive Prep",
                    method: "M-Pesa",
                    amount: 3500,
                    status: "recorded",
                    createdAt
                },
                {
                    id: "pay_lecturer_1",
                    payerRole: "lecturer",
                    payerName: "Nurse Educator",
                    item: "Professional Lecturer Subscription",
                    method: "PayPal",
                    amount: 2500,
                    status: "recorded",
                    createdAt
                }
            ],
            learningStates: {}
        };
    }

    function normalizeState(candidate = {}) {
        const state = candidate && typeof candidate === "object" ? candidate : {};
        const defaults = defaultState();
        return {
            courses: Array.isArray(state.courses) ? state.courses : defaults.courses,
            lecturers: Array.isArray(state.lecturers) ? state.lecturers : defaults.lecturers,
            groups: Array.isArray(state.groups) ? state.groups : defaults.groups,
            meetings: Array.isArray(state.meetings) ? state.meetings : defaults.meetings,
            exams: Array.isArray(state.exams) ? state.exams : defaults.exams,
            resources: Array.isArray(state.resources) ? state.resources : defaults.resources,
            payments: Array.isArray(state.payments) ? state.payments : defaults.payments,
            learningStates: state.learningStates && typeof state.learningStates === "object" ? state.learningStates : defaults.learningStates
        };
    }

    function getLocalAccount() {
        return loadJson(STORAGE_KEYS.account, null);
    }

    function getLocalSession() {
        return loadJson(STORAGE_KEYS.session, null);
    }

    function setLocalSession(session) {
        if (session) {
            saveJson(STORAGE_KEYS.session, session);
        } else {
            localStorage.removeItem(STORAGE_KEYS.session);
        }
    }

    function getLocalState() {
        return normalizeState(loadJson(STORAGE_KEYS.state, defaultState()));
    }

    function setLocalState(state) {
        const next = normalizeState(state);
        saveJson(STORAGE_KEYS.state, next);
        return next;
    }

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

    function localSessionUser() {
        const session = getLocalSession();
        if (!session?.userId || session.role !== "admin") {
            return null;
        }
        return {
            id: session.userId,
            email: session.email || "",
            role: "admin"
        };
    }

    async function requestLocal(path, options = {}) {
        const method = String(options.method || "GET").toUpperCase();
        const body = options.body || {};
        const cleanPath = String(path || "");

        if (method === "GET" && cleanPath === "/api/admin/status") {
            const account = getLocalAccount();
            return {
                configured: Boolean(account?.email),
                bootstrapEnabled: true,
                localFallback: true
            };
        }

        if (method === "POST" && cleanPath === "/api/admin/bootstrap") {
            const name = String(body.name || "").trim();
            const email = String(body.email || "").trim().toLowerCase();
            const password = String(body.password || "");
            const passwordCheck = window.GnpAuthSecurity?.validatePassword?.(password);
            if (!name || !email || !passwordCheck?.ok) {
                throw new Error(passwordCheck?.message || "A valid administrator name, email, and strong password are required.");
            }

            const existing = getLocalAccount();
            if (existing?.email) {
                throw new Error("An admin account already exists.");
            }

            const record = window.GnpAuthSecurity?.createPasswordRecord
                ? await window.GnpAuthSecurity.createPasswordRecord(password)
                : {
                    passwordHash: password,
                    passwordSalt: "",
                    passwordIterations: 1,
                    passwordVersion: 1
                };
            const account = {
                id: "admin_primary",
                name,
                email,
                role: "admin",
                ...record,
                createdAt: new Date().toISOString()
            };
            saveJson(STORAGE_KEYS.account, account);

            const tokens = window.GnpAuthSecurity?.createSessionTokens?.(8) || {};
            setLocalSession({
                id: "admin_session",
                userId: account.id,
                name: account.name || email,
                email,
                role: "admin",
                provider: "local-admin",
                loginAt: new Date().toISOString(),
                verified: true,
                verificationStatus: "verified",
                ...tokens
            });

            return {
                user: {
                    id: account.id,
                    email: account.email,
                    role: "admin"
                }
            };
        }

        if (method === "POST" && cleanPath === "/api/admin/login") {
            const email = String(body.email || "").trim().toLowerCase();
            const password = String(body.password || "");
            const account = getLocalAccount();

            if (!account?.email || account.email !== email) {
                throw new Error("No local admin account is configured yet.");
            }

            const passwordOk = window.GnpAuthSecurity?.verifyPassword
                ? await window.GnpAuthSecurity.verifyPassword(password, account)
                : false;
            if (!passwordOk) {
                throw new Error("Invalid admin email or password.");
            }

            const tokens = window.GnpAuthSecurity?.createSessionTokens?.(8) || {};
            setLocalSession({
                id: "admin_session",
                userId: account.id,
                name: account.name || account.email,
                email: account.email,
                role: "admin",
                provider: "local-admin",
                loginAt: new Date().toISOString(),
                verified: true,
                verificationStatus: "verified",
                ...tokens
            });

            return {
                user: {
                    id: account.id,
                    email: account.email,
                    role: "admin"
                }
            };
        }

        if (method === "POST" && cleanPath === "/api/admin/logout") {
            setLocalSession(null);
            return { loggedOut: true };
        }

        if (method === "GET" && cleanPath === "/api/admin/me") {
            const user = localSessionUser();
            if (!user) {
                throw new Error("Admin login required.");
            }
            return { user };
        }

        if (method === "GET" && cleanPath === "/api/admin/state") {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            return { state: getLocalState() };
        }

        if (method === "PUT" && cleanPath === "/api/admin/state") {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            return { state: setLocalState(body.state || {}) };
        }

        if (method === "POST" && cleanPath === "/api/admin/seed") {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            const state = getLocalState();
            const nextState = setLocalState({
                ...state,
                payments: Array.isArray(state.payments) && state.payments.length ? state.payments : defaultState().payments
            });
            return { state: nextState };
        }

        if (method === "GET" && cleanPath === "/api/admin/courses") {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            return { courses: getLocalState().courses || [] };
        }

        if (method === "PUT" && cleanPath === "/api/admin/courses") {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            const state = getLocalState();
            const courses = Array.isArray(body.courses) ? body.courses : [];
            const nextState = setLocalState({
                ...state,
                courses
            });
            return { courses: nextState.courses };
        }

        if (method === "DELETE" && cleanPath.startsWith("/api/admin/courses/")) {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            const courseId = decodeURIComponent(cleanPath.slice("/api/admin/courses/".length));
            const state = getLocalState();
            const nextState = setLocalState({
                ...state,
                courses: (state.courses || []).filter((course) => String(course.id || "") !== courseId)
            });
            return { courses: nextState.courses };
        }

        if (method === "POST" && cleanPath === "/api/admin/pdf-to-lessons") {
            if (!localSessionUser()) {
                throw new Error("Admin login required.");
            }
            const fileName = String(body.fileName || "uploaded.pdf").trim();
            const lessonBase = fileName.replace(/\.pdf$/i, "") || "PDF";
            return {
                fileName,
                contentNotes: `Uploaded PDF: ${fileName}`,
                generatedLessons: [
                    {
                        title: `${lessonBase} Overview`,
                        lectureTitle: "PDF lesson 1",
                        objective: `Understand the uploaded material from ${fileName}.`,
                        body: `Uploaded PDF: ${fileName}`,
                        concepts: ["Overview", "Assessment cues", "Safe action"],
                        summary: `Auto-generated lesson from ${fileName}.`
                    },
                    {
                        title: `${lessonBase} Application`,
                        lectureTitle: "PDF lesson 2",
                        objective: `Apply the uploaded material from ${fileName} to nursing practice.`,
                        body: `Uploaded PDF: ${fileName}`,
                        concepts: ["Application", "Clinical action", "Review"],
                        summary: `Auto-generated lesson from ${fileName}.`
                    },
                    {
                        title: `${lessonBase} Review`,
                        lectureTitle: "PDF lesson 3",
                        objective: `Review the uploaded material from ${fileName}.`,
                        body: `Uploaded PDF: ${fileName}`,
                        concepts: ["Review", "Readiness", "Recall"],
                        summary: `Auto-generated lesson from ${fileName}.`
                    }
                ]
            };
        }

        throw new Error("Admin backend is unavailable.");
    }

    function withFallback(path, options, fallback) {
        return request(path, options).catch(async () => {
            if (typeof fallback === "function") {
                return fallback();
            }
            return fallback;
        });
    }

    return {
        request,
        status: () => withFallback("/api/admin/status", { method: "GET" }, () => requestLocal("/api/admin/status", { method: "GET" })),
        me: () => withFallback("/api/admin/me", { method: "GET" }, () => requestLocal("/api/admin/me", { method: "GET" })),
        login: ({ email, password }) => withFallback("/api/admin/login", {
            method: "POST",
            body: { email, password }
        }, () => requestLocal("/api/admin/login", {
            method: "POST",
            body: { email, password }
        })),
        bootstrap: ({ name, email, password }) => withFallback("/api/admin/bootstrap", {
            method: "POST",
            body: { name, email, password }
        }, () => requestLocal("/api/admin/bootstrap", {
            method: "POST",
            body: { name, email, password }
        })),
        logout: async () => {
            try {
                return await withFallback(
                    "/api/admin/logout",
                    { method: "POST" },
                    () => requestLocal("/api/admin/logout", { method: "POST" })
                );
            } finally {
                // Never leave the local fallback session available after logout.
                setLocalSession(null);
            }
        },
        loadState: () => withFallback("/api/admin/state", { method: "GET" }, () => requestLocal("/api/admin/state", { method: "GET" })),
        saveState: (state) => withFallback("/api/admin/state", {
            method: "PUT",
            body: { state }
        }, () => requestLocal("/api/admin/state", {
            method: "PUT",
            body: { state }
        })),
        seedState: () => withFallback("/api/admin/seed", { method: "POST" }, () => requestLocal("/api/admin/seed", { method: "POST" })),
        loadCourses: () => withFallback("/api/admin/courses", { method: "GET" }, () => requestLocal("/api/admin/courses", { method: "GET" })),
        saveCourses: (courses) => withFallback("/api/admin/courses", {
            method: "PUT",
            body: { courses }
        }, () => requestLocal("/api/admin/courses", {
            method: "PUT",
            body: { courses }
        })),
        generateLessonsFromPdf: ({ fileName, pdfDataUrl }) => withFallback("/api/admin/pdf-to-lessons", {
            method: "POST",
            body: { fileName, pdfDataUrl }
        }, () => requestLocal("/api/admin/pdf-to-lessons", {
            method: "POST",
            body: { fileName, pdfDataUrl }
        })),
        deleteCourse: (courseId) => withFallback(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
            method: "DELETE"
        }, () => requestLocal(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
            method: "DELETE"
        }))
    };
})();
