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

    async function requestPasswordReset(email, redirectTo = "") {
        if (!email) return null;
        const body = {
            email: String(email).trim()
        };
        if (redirectTo) {
            body.redirect_to = String(redirectTo).trim();
        }
        return request("/auth/v1/recover", {
            method: "POST",
            body
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
        const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
        return {
            id: String(row.id || "").trim(),
            title: String(row.title || "").trim(),
            unit: String(row.unit || "").trim(),
            subunit: String(row.subunit || "").trim(),
            category: String(row.category || "Nursing").trim(),
            difficulty: String(row.difficulty || "Beginner").trim(),
            badge: String(row.badge || "New").trim(),
            durationHours: Number(row.duration_hours || 0),
            questions: Number(row.questions || 0),
            exams: Number(row.exams || 0),
            format: String(row.format || "Self-paced").trim(),
            summary: String(row.summary || "").trim(),
            image: String(row.image || "").trim(),
            courseImage: String(row.course_image || row.courseImage || row.image || "").trim(),
            moduleCount: Number(row.module_count || 1),
            moduleTitles: Array.isArray(row.module_titles) ? row.module_titles : [],
            access: String(row.access || "free").trim(),
            price: Number(row.price || 0),
            lecturer: String(row.lecturer || "").trim(),
            lecturerId: String(row.lecturer_id || "").trim(),
            contentNotes: String(row.content_notes || "").trim(),
            uploadedDocument: row.uploaded_document || null,
            lessonBackgroundImage: String(row.lesson_background_image || "").trim(),
            documentCoverImage: String(row.document_cover_image || "").trim(),
            generatedLessons: Array.isArray(row.generated_lessons) ? row.generated_lessons : [],
            lectureVideo: String(row.lecture_video || "").trim(),
            lectureVideoName: String(row.lecture_video_name || "").trim(),
            lectureVideoSource: String(row.lecture_video_source || "").trim(),
            faculty: String(metadata.faculty || "").trim(),
            department: String(metadata.department || "").trim(),
            courseCode: String(metadata.courseCode || "").trim(),
            language: String(metadata.language || "English").trim(),
            prerequisites: Array.isArray(metadata.prerequisites) ? metadata.prerequisites : [],
            learningOutcomes: Array.isArray(metadata.learningOutcomes) ? metadata.learningOutcomes : [],
            assignments: Array.isArray(metadata.assignments) ? metadata.assignments : [],
            assessments: Array.isArray(metadata.assessments) ? metadata.assessments : [],
            resources: Array.isArray(metadata.resources) ? metadata.resources : [],
            announcements: Array.isArray(metadata.announcements) ? metadata.announcements : [],
            discussions: Array.isArray(metadata.discussions) ? metadata.discussions : [],
            analytics: metadata.analytics && typeof metadata.analytics === "object" ? metadata.analytics : {},
            lectureVideoAsset: metadata.lectureVideoAsset || null,
            status: String(row.status || metadata.status || "published").trim(),
            source: String(row.source || "supabase").trim(),
            updatedAt: String(row.updated_at || "")
        };
    }

    function mapCoursePayload(course) {
        return {
            id: String(course.id || "").trim(),
            title: String(course.title || "").trim(),
            unit: String(course.unit || "").trim(),
            subunit: String(course.subunit || "").trim(),
            category: String(course.category || "Nursing").trim(),
            difficulty: String(course.difficulty || "Beginner").trim(),
            badge: String(course.badge || "New").trim(),
            duration_hours: Number(course.durationHours || 0),
            questions: Number(course.questions || 0),
            exams: Number(course.exams || 0),
            format: String(course.format || "Self-paced").trim(),
            summary: String(course.summary || "").trim(),
            image: String(course.image || "").trim(),
            course_image: String(course.courseImage || course.image || "").trim(),
            module_count: Number(course.moduleCount || 1),
            module_titles: Array.isArray(course.moduleTitles) ? course.moduleTitles : [],
            access: String(course.access || "free").trim(),
            price: Number(course.price || 0),
            lecturer: String(course.lecturer || "").trim(),
            lecturer_id: String(course.lecturerId || "").trim(),
            content_notes: String(course.contentNotes || "").trim(),
            uploaded_document: course.uploadedDocument || null,
            lesson_background_image: String(course.lessonBackgroundImage || "").trim(),
            document_cover_image: String(course.documentCoverImage || "").trim(),
            generated_lessons: Array.isArray(course.generatedLessons) ? course.generatedLessons : [],
            lecture_video: String(course.lectureVideo || "").trim(),
            lecture_video_name: String(course.lectureVideoName || "").trim(),
            lecture_video_source: String(course.lectureVideoSource || "").trim(),
            source: String(course.source || "admin").trim(),
            status: String(course.status || "published").trim(),
            metadata: {
                faculty: String(course.faculty || "").trim(),
                department: String(course.department || "").trim(),
                courseCode: String(course.courseCode || "").trim(),
                language: String(course.language || "English").trim(),
                prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
                learningOutcomes: Array.isArray(course.learningOutcomes) ? course.learningOutcomes : [],
                assignments: Array.isArray(course.assignments) ? course.assignments : [],
                assessments: Array.isArray(course.assessments) ? course.assessments : [],
                resources: Array.isArray(course.resources) ? course.resources : [],
                announcements: Array.isArray(course.announcements) ? course.announcements : [],
                discussions: Array.isArray(course.discussions) ? course.discussions : [],
                analytics: course.analytics && typeof course.analytics === "object" ? course.analytics : {},
                lectureVideoAsset: course.lectureVideoAsset || null
            },
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

    function safeStoragePart(value) {
        return String(value || "file")
            .normalize("NFKD")
            .replace(/[^\w.-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();
    }

    async function uploadCourseMaterial(file, { courseId, kind = "document", token = "" } = {}) {
        if (!file || !courseId || !token) {
            throw new Error("A signed-in lecturer or administrator and a course are required for uploads.");
        }
        const config = getConfig();
        const bucket = kind === "video" ? "course-videos" : "course-documents";
        const path = `${safeStoragePart(courseId)}/${Date.now()}-${safeStoragePart(file.name)}`;
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const uploadResponse = await fetch(`${config.url}/storage/v1/object/${bucket}/${encodedPath}`, {
            method: "POST",
            headers: {
                apikey: config.anonKey,
                Authorization: `Bearer ${token}`,
                "Content-Type": file.type || "application/octet-stream",
                "x-upsert": "false"
            },
            body: file
        });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
            throw new Error(uploadResult?.message || uploadResult?.error || `File upload failed (${uploadResponse.status}).`);
        }

        const signed = await request(`/storage/v1/object/sign/${bucket}/${encodedPath}`, {
            method: "POST",
            token,
            body: { expiresIn: 60 * 60 * 24 * 7 }
        });
        const signedPath = String(signed?.signedURL || signed?.signedUrl || "");
        const signedUrl = signedPath.startsWith("http") ? signedPath : `${config.url}/storage/v1${signedPath}`;
        const session = window.GnpUtils?.getSession?.() || {};
        void request("/rest/v1/media_assets", {
            method: "POST",
            token,
            body: [{
                owner_id: session.userId || null,
                course_id: courseId,
                bucket_name: bucket,
                storage_path: path,
                public_url: null,
                file_name: file.name,
                file_kind: kind === "video" ? "video" : "document",
                mime_type: file.type || null,
                size_bytes: file.size,
                metadata: { originalName: file.name }
            }]
        }).catch(() => {});
        return { bucket, path, signedUrl, url: signedUrl };
    }

    async function signCourseMaterial(bucket, path, token = "", expiresIn = 3600) {
        if (!bucket || !path || !token) return "";
        const config = getConfig();
        const encodedPath = String(path).split("/").map(encodeURIComponent).join("/");
        const signed = await request(`/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`, {
            method: "POST",
            token,
            body: { expiresIn }
        });
        const signedPath = String(signed?.signedURL || signed?.signedUrl || "");
        return signedPath.startsWith("http") ? signedPath : `${config.url}/storage/v1${signedPath}`;
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
        requestPasswordReset,
        getUser,
        loadCourses,
        saveCourses,
        deleteCourse,
        uploadCourseMaterial,
        signCourseMaterial,
        loadLearningState,
        saveLearningState
    };
})();
