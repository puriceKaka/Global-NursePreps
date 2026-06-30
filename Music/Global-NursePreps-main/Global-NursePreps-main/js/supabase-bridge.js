(() => {
    const CONFIG = window.GNP_SUPABASE_CONFIG || {};

    function getConfig() {
        return {
            url: String(CONFIG.url || "").trim().replace(/\/+$/, ""),
            anonKey: String(CONFIG.anonKey || "").trim()
        };
    }

    function isConfigured() {
        const config = getConfig();
        return Boolean(config.url && config.anonKey);
    }

    function authHeaders(token = "") {
        const config = getConfig();
        const bearer = token || config.anonKey;
        return {
            apikey: config.anonKey,
            Authorization: `Bearer ${bearer}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        };
    }

    async function request(path, options = {}) {
        if (!isConfigured()) {
            throw new Error("Supabase is not configured.");
        }

        const config = getConfig();
        const response = await fetch(`${config.url}${path}`, {
            method: options.method || "GET",
            headers: {
                ...authHeaders(options.token || ""),
                ...(options.headers || {})
            },
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });

        const raw = await response.text();
        let data = null;
        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch {
                data = raw;
            }
        }

        if (!response.ok) {
            const message = data?.msg || data?.error_description || data?.error || data?.message || `Supabase request failed (${response.status})`;
            throw new Error(message);
        }

        return data;
    }

    function normalizeSession(session, user) {
        if (!session?.access_token || !user?.id) {
            return null;
        }

        const expiresIn = Number(session.expires_in || 0);
        const issuedAt = new Date();
        const expiresAt = expiresIn
            ? new Date(issuedAt.getTime() + (expiresIn * 1000))
            : new Date(issuedAt.getTime() + (8 * 60 * 60 * 1000));
        const metadata = user.user_metadata || {};

        return {
            id: session.user?.id || user.id,
            userId: user.id,
            name: String(metadata.full_name || metadata.name || user.email || "Member").trim(),
            email: String(user.email || metadata.email || "").trim(),
            role: String(metadata.role || "student").trim(),
            loginAt: issuedAt.toISOString(),
            verified: Boolean(user.email_confirmed_at || metadata.verified),
            verificationStatus: user.email_confirmed_at ? "verified" : "pending",
            provider: "supabase",
            authToken: session.access_token,
            refreshToken: session.refresh_token || "",
            issuedAt: issuedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            tokenType: "Bearer"
        };
    }

    async function signUp({ email, password, data = {} }) {
        const result = await request("/auth/v1/signup", {
            method: "POST",
            body: {
                email,
                password,
                data
            }
        });
        return {
            user: result?.user || null,
            session: result?.session ? normalizeSession(result.session, result.user) : null
        };
    }

    async function signIn({ email, password }) {
        const result = await request("/auth/v1/token?grant_type=password", {
            method: "POST",
            body: {
                email,
                password
            }
        });
        return {
            user: result?.user || null,
            session: result?.access_token ? normalizeSession(result, result.user) : null
        };
    }

    async function refreshSession(refreshToken) {
        if (!refreshToken) return null;
        const result = await request("/auth/v1/token?grant_type=refresh_token", {
            method: "POST",
            body: {
                refresh_token: refreshToken
            }
        });
        return result?.access_token ? normalizeSession(result, result.user) : null;
    }

    async function signOut(accessToken, refreshToken) {
        await request("/auth/v1/logout", {
            method: "POST",
            token: accessToken,
            body: refreshToken ? { refresh_token: refreshToken } : {}
        });
    }

    async function getUser(accessToken) {
        const user = await request("/auth/v1/user", {
            method: "GET",
            token: accessToken
        });
        return user || null;
    }

    function mapCourseRow(row) {
        return {
            id: String(row.id || "").trim(),
            title: String(row.title || "").trim(),
            category: String(row.category || "Nursing").trim(),
            difficulty: String(row.difficulty || "Beginner").trim(),
            badge: String(row.badge || "New").trim(),
            durationHours: Number(row.duration_hours || 0),
            questions: Number(row.questions || 0),
            exams: Number(row.exams || 0),
            format: String(row.format || "Self-paced").trim(),
            summary: String(row.summary || "").trim(),
            image: String(row.image || "").trim(),
            moduleCount: Number(row.module_count || 1),
            access: String(row.access || "free").trim(),
            price: Number(row.price || 0),
            lecturer: String(row.lecturer || "").trim(),
            lecturerId: String(row.lecturer_id || "").trim(),
            contentNotes: String(row.content_notes || "").trim(),
            uploadedDocument: row.uploaded_document || null,
            source: String(row.source || "supabase").trim(),
            updatedAt: String(row.updated_at || "")
        };
    }

    function mapCoursePayload(course) {
        return {
            id: String(course.id || "").trim(),
            title: String(course.title || "").trim(),
            category: String(course.category || "Nursing").trim(),
            difficulty: String(course.difficulty || "Beginner").trim(),
            badge: String(course.badge || "New").trim(),
            duration_hours: Number(course.durationHours || 0),
            questions: Number(course.questions || 0),
            exams: Number(course.exams || 0),
            format: String(course.format || "Self-paced").trim(),
            summary: String(course.summary || "").trim(),
            image: String(course.image || "").trim(),
            module_count: Number(course.moduleCount || 1),
            access: String(course.access || "free").trim(),
            price: Number(course.price || 0),
            lecturer: String(course.lecturer || "").trim(),
            lecturer_id: String(course.lecturerId || "").trim(),
            content_notes: String(course.contentNotes || "").trim(),
            uploaded_document: course.uploadedDocument || null,
            source: String(course.source || "admin").trim(),
            updated_at: new Date().toISOString()
        };
    }

    async function loadCourses() {
        const rows = await request("/rest/v1/courses?select=*&order=updated_at.desc", {
            method: "GET"
        });
        return Array.isArray(rows) ? rows.map(mapCourseRow) : [];
    }

    async function saveCourses(courses, token = "") {
        const rows = Array.isArray(courses) ? courses.map(mapCoursePayload) : [];
        if (!rows.length) return [];
        await request("/rest/v1/courses?on_conflict=id", {
            method: "POST",
            token,
            body: rows,
            headers: {
                Prefer: "resolution=merge-duplicates,return=representation"
            }
        });
        return rows;
    }

    async function deleteCourse(courseId, token = "") {
        if (!courseId) return;
        await request(`/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}`, {
            method: "DELETE",
            token
        });
    }

    async function loadLearningState(userId, token = "") {
        if (!userId) return null;
        const rows = await request(`/rest/v1/learning_states?select=state_json&user_id=eq.${encodeURIComponent(userId)}&limit=1`, {
            method: "GET",
            token
        });
        const first = Array.isArray(rows) ? rows[0] : null;
        return first?.state_json || null;
    }

    async function saveLearningState(userId, state, token = "") {
        if (!userId) return null;
        await request("/rest/v1/learning_states?on_conflict=user_id", {
            method: "POST",
            token,
            body: [{
                user_id: userId,
                state_json: state,
                updated_at: new Date().toISOString()
            }],
            headers: {
                Prefer: "resolution=merge-duplicates,return=representation"
            }
        });
        return state;
    }

    window.GnpSupabase = {
        isConfigured,
        getConfig,
        request,
        normalizeSession,
        signUp,
        signIn,
        refreshSession,
        signOut,
        getUser,
        loadCourses,
        saveCourses,
        deleteCourse,
        loadLearningState,
        saveLearningState
    };
})();
