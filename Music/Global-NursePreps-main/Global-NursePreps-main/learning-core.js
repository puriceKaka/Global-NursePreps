(() => {
    const STORAGE_KEY_PREFIX = "gnp-learning-state-v2";

    const COURSE_IMAGES = {
        nurseTablet: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&q=80&w=1200",
        simulationLab: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
        lectureRoom: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
        medicationTray: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=1200",
        pediatricCare: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200",
        criticalCare: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200",
        defaultCourse: "assets/course-images/default.jpg"
    };

    const DEFAULT_COURSES = [
        {
            id: "nck-masterclass",
            title: "NCK Licensing Exam Masterclass",
            category: "Licensing Prep (NCK)",
            difficulty: "Intermediate",
            badge: "Flagship",
            durationHours: 40,
            questions: 1500,
            exams: 8,
            format: "Live + Recorded",
            summary:
                "Complete syllabus coverage, guided revision, mock exams, and structured lecturer support for the NCK pathway.",
            image: COURSE_IMAGES.nurseTablet,
            moduleCount: 3
        },
        {
            id: "nclex-comprehensive",
            title: "NCLEX-RN Comprehensive Prep",
            category: "NCLEX Preparation",
            difficulty: "Advanced",
            badge: "High Demand",
            durationHours: 52,
            questions: 2000,
            exams: 12,
            format: "Live Coaching",
            summary:
                "Next Generation case studies, CAT-style strategy, and decision-based coaching for serious NCLEX preparation.",
            image: COURSE_IMAGES.simulationLab,
            moduleCount: 3
        },
        {
            id: "lecture-series",
            title: "Global Nursing Lecture Series",
            category: "Professional Lectures",
            difficulty: "Beginner",
            badge: "Core Track",
            durationHours: 36,
            questions: 600,
            exams: 6,
            format: "Recorded",
            summary:
                "Foundational lectures across anatomy, pharmacology, med-surg, pediatrics, and community health for broad clinical grounding.",
            image: COURSE_IMAGES.lectureRoom,
            moduleCount: 3
        },
        {
            id: "pharmacology-intensive",
            title: "Pharmacology Intensive",
            category: "Pharmacology",
            difficulty: "Advanced",
            badge: "Calculation Lab",
            durationHours: 28,
            questions: 480,
            exams: 5,
            format: "Recorded + Quiz Bank",
            summary:
                "Drug classes, dosage calculations, medication safety, and rapid-fire review drills for high-stakes medication questions.",
            image: COURSE_IMAGES.medicationTray,
            moduleCount: 2
        },
        {
            id: "pediatrics-clinical",
            title: "Pediatrics Clinical Review",
            category: "Pediatrics",
            difficulty: "Intermediate",
            badge: "Clinical Focus",
            durationHours: 24,
            questions: 360,
            exams: 4,
            format: "Live Review",
            summary:
                "Growth and development, emergencies, family-centered care, and scenario-based pediatrics revision.",
            image: COURSE_IMAGES.pediatricCare,
            moduleCount: 2
        },
        {
            id: "med-surg-bootcamp",
            title: "Med-Surg Readiness Bootcamp",
            category: "Clinical Practice",
            difficulty: "Intermediate",
            badge: "Mock Ready",
            durationHours: 32,
            questions: 540,
            exams: 7,
            format: "Live + Recorded",
            summary:
                "Adult health systems review, prioritization practice, and readiness checkpoints for med-surg confidence.",
            image: COURSE_IMAGES.criticalCare,
            moduleCount: 2
        }
    ];

    const DEFAULT_STATE = {
        selectedCourseId: DEFAULT_COURSES[0]?.id || "",
        enrolledCourseIds: [],
        progress: {}
    };

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function slugify(value) {
        return String(value || "course")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "course";
    }

    function normalizeCourse(course, fallback = {}) {
        const title = String(course?.title || fallback.title || "Untitled Course").trim();
        const id = String(course?.id || fallback.id || slugify(title)).trim();
        return {
            id,
            title,
            category: String(course?.category || fallback.category || "Nursing").trim(),
            difficulty: String(course?.difficulty || fallback.difficulty || "Beginner").trim(),
            badge: String(course?.badge || fallback.badge || "New").trim(),
            durationHours: Number(course?.durationHours || fallback.durationHours || 0),
            questions: Number(course?.questions || fallback.questions || 0),
            exams: Number(course?.exams || fallback.exams || 0),
            format: String(course?.format || fallback.format || "Self-paced").trim(),
            summary: String(course?.summary || fallback.summary || "Nursing learning course.").trim(),
            image: String(course?.image || fallback.image || COURSE_IMAGES.defaultCourse).trim(),
            moduleCount: Number(course?.moduleCount || fallback.moduleCount || 1),
            access: String(course?.access || fallback.access || (Number(course?.price || fallback.price || 0) > 0 ? "paid" : "free")).trim(),
            price: Number(course?.price || fallback.price || 0),
            lecturer: String(course?.lecturer || fallback.lecturer || "").trim(),
            lecturerId: String(course?.lecturerId || fallback.lecturerId || "").trim(),
            contentNotes: String(course?.contentNotes || fallback.contentNotes || "").trim(),
            uploadedDocument: course?.uploadedDocument || fallback.uploadedDocument || null,
            lectureVideo: String(course?.lectureVideo || fallback.lectureVideo || "").trim(),
            lectureVideoName: String(course?.lectureVideoName || fallback.lectureVideoName || "").trim(),
            source: String(course?.source || fallback.source || "admin").trim()
        };
    }

    let COURSE_META = DEFAULT_COURSES.map((course) => normalizeCourse({ ...course, source: "default" }));
    let refreshCoursesPromise = null;
    let refreshStatePromise = null;

    function isSupabaseReady() {
        return Boolean(window.GnpSupabase?.isConfigured && window.GnpSupabase.isConfigured());
    }

    function getRemoteToken() {
        const session = getSession();
        return String(session?.authToken || "").trim();
    }

    function saveCourseCatalog(courses, options = {}) {
        COURSE_META = courses.map((course) => normalizeCourse(course));
        if (window.GnpLearning) {
            window.GnpLearning.COURSE_META = COURSE_META;
        }
        if (!options.skipRemote && window.GnpAdminApi?.saveCourses) {
            void window.GnpAdminApi.saveCourses(COURSE_META).catch(() => {});
        }
        window.dispatchEvent(new CustomEvent("gnp-courses-updated", { detail: { courses: COURSE_META.slice() } }));
        return COURSE_META;
    }

    function getCourses() {
        return COURSE_META.slice();
    }

    function addCourse(course) {
        const courses = getCourses();
        const normalized = normalizeCourse({
            ...course,
            id: course?.id || `${slugify(course?.title)}-${Date.now().toString(36)}`
        });
        return saveCourseCatalog([normalized, ...courses]);
    }

    function updateCourse(courseId, patch) {
        return saveCourseCatalog(getCourses().map((course) => (
            course.id === courseId ? normalizeCourse({ ...course, ...patch, id: course.id }, course) : course
        )));
    }

    function deleteCourse(courseId) {
        const next = saveCourseCatalog(getCourses().filter((course) => course.id !== courseId));
        if (window.GnpAdminApi?.deleteCourse) {
            void window.GnpAdminApi.deleteCourse(courseId).catch(() => {});
        }
        return next;
    }

    function getSession() {
        const session = safeJsonParse(localStorage.getItem("nurseprep_session"), null);
        if (!session?.userId) return null;
        if (window.GnpAuthSecurity?.isSessionValid && !window.GnpAuthSecurity.isSessionValid(session)) {
            return null;
        }
        return session;
    }

    function getUserId() {
        const session = getSession();
        return String(session?.userId || "guest").trim() || "guest";
    }

    function getStorageKey() {
        return `${STORAGE_KEY_PREFIX}:${getUserId()}`;
    }

    function normalizeState(candidate) {
        const state = candidate && typeof candidate === "object" ? candidate : {};
        state.selectedCourseId = typeof state.selectedCourseId === "string" ? state.selectedCourseId : DEFAULT_STATE.selectedCourseId;
        state.enrolledCourseIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];
        state.progress = state.progress && typeof state.progress === "object" ? state.progress : {};
        return state;
    }

    function loadState() {
        const key = getStorageKey();
        const fromKey = safeJsonParse(localStorage.getItem(key), null);
        if (fromKey) {
            return normalizeState(fromKey);
        }

        return normalizeState({ ...DEFAULT_STATE });
    }

    function saveState(state, options = {}) {
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
        if (!options.skipRemote && isSupabaseReady()) {
            const token = getRemoteToken();
            if (token) {
                void window.GnpSupabase.saveLearningState(getUserId(), state, token).catch(() => {});
            }
        }
    }

    function getCourseMeta(courseId) {
        return getCourses().find((c) => c.id === courseId) || null;
    }

    function ensureCourseProgress(state, courseId, meta = null) {
        state.progress = state.progress && typeof state.progress === "object" ? state.progress : {};

        if (!state.progress[courseId]) {
            state.progress[courseId] = {
                courseId,
                courseTitle: "",
                courseCategory: "",
                courseDifficulty: "",
                totalModules: 0,
                currentModuleIndex: 0,
                completedModules: [],
                notes: {},
                quizAnswers: {},
                quizChecked: {},
                quizPassed: {},
                certificate: null,
                lastVisited: ""
            };
        }

        const progress = state.progress[courseId];
        progress.courseId = courseId;
        progress.courseTitle = typeof progress.courseTitle === "string" ? progress.courseTitle : "";
        progress.courseCategory = typeof progress.courseCategory === "string" ? progress.courseCategory : "";
        progress.courseDifficulty = typeof progress.courseDifficulty === "string" ? progress.courseDifficulty : "";
        progress.totalModules = Number.isFinite(progress.totalModules) ? progress.totalModules : 0;
        progress.currentModuleIndex = Number.isFinite(progress.currentModuleIndex) ? progress.currentModuleIndex : 0;
        progress.completedModules = Array.isArray(progress.completedModules) ? progress.completedModules : [];
        progress.notes = progress.notes && typeof progress.notes === "object" ? progress.notes : {};
        progress.quizAnswers = progress.quizAnswers && typeof progress.quizAnswers === "object" ? progress.quizAnswers : {};
        progress.quizChecked = progress.quizChecked && typeof progress.quizChecked === "object" ? progress.quizChecked : {};
        progress.quizPassed = progress.quizPassed && typeof progress.quizPassed === "object" ? progress.quizPassed : {};
        progress.certificate = progress.certificate && typeof progress.certificate === "object" ? progress.certificate : null;
        progress.lastVisited = typeof progress.lastVisited === "string" ? progress.lastVisited : "";

        const resolvedMeta = meta || getCourseMeta(courseId);
        if (resolvedMeta) {
            progress.courseTitle = progress.courseTitle || resolvedMeta.title;
            progress.courseCategory = progress.courseCategory || resolvedMeta.category;
            progress.courseDifficulty = progress.courseDifficulty || resolvedMeta.difficulty;
            if (!progress.totalModules && Number.isFinite(resolvedMeta.moduleCount)) {
                progress.totalModules = resolvedMeta.moduleCount;
            }
        }

        return progress;
    }

    async function refreshCourses() {
        if (refreshCoursesPromise) {
            return refreshCoursesPromise;
        }

        refreshCoursesPromise = (async () => {
            try {
                const remoteCourses = await window.GnpAdminApi?.loadCourses?.();
                if (Array.isArray(remoteCourses?.courses) && remoteCourses.courses.length > 0) {
                    return saveCourseCatalog(remoteCourses.courses, { skipRemote: true });
                }

                return COURSE_META;
            } catch {
                return COURSE_META;
            } finally {
                refreshCoursesPromise = null;
            }
        })();

        return refreshCoursesPromise;
    }

    async function refreshCurrentUserState() {
        if (!isSupabaseReady()) {
            return loadState();
        }

        const token = getRemoteToken();
        if (!token) {
            return loadState();
        }

        if (refreshStatePromise) {
            return refreshStatePromise;
        }

        refreshStatePromise = (async () => {
            try {
                const remoteState = await window.GnpSupabase.loadLearningState(getUserId(), token);
                if (remoteState && typeof remoteState === "object") {
                    const merged = normalizeState(remoteState);
                    localStorage.setItem(getStorageKey(), JSON.stringify(merged));
                    window.dispatchEvent(new CustomEvent("gnp-learning-state-updated", { detail: { state: merged } }));
                    return merged;
                }

                const localState = loadState();
                await window.GnpSupabase.saveLearningState(getUserId(), localState, token);
                return localState;
            } catch {
                return loadState();
            } finally {
                refreshStatePromise = null;
            }
        })();

        return refreshStatePromise;
    }

    function getProgressPercent(courseId, state = null) {
        const resolved = state || loadState();
        const meta = getCourseMeta(courseId);
        const progress = ensureCourseProgress(resolved, courseId, meta);
        const total = progress.totalModules || meta?.moduleCount || 0;
        if (!total) return 0;
        return Math.round((progress.completedModules.length / total) * 100);
    }

    function enrollCourse(courseId) {
        const state = loadState();
        const meta = getCourseMeta(courseId);
        if (!state.enrolledCourseIds.includes(courseId)) {
            state.enrolledCourseIds.push(courseId);
        }
        state.selectedCourseId = courseId;
        ensureCourseProgress(state, courseId, meta);
        saveState(state);
        return state;
    }

    function cancelEnrollment(courseId) {
        const state = loadState();
        state.enrolledCourseIds = state.enrolledCourseIds.filter((id) => id !== courseId);
        saveState(state);
        return state;
    }

    window.GnpLearning = {
        COURSE_IMAGES,
        COURSE_META,
        DEFAULT_COURSES,
        getSession,
        getUserId,
        getStorageKey,
        getCourses,
        refreshCourses,
        addCourse,
        updateCourse,
        deleteCourse,
        loadState,
        saveState,
        refreshCurrentUserState,
        getCourseMeta,
        ensureCourseProgress,
        getProgressPercent,
        enrollCourse,
        cancelEnrollment
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (window.GnpLearning?.refreshCourses) {
            void window.GnpLearning.refreshCourses();
        }
        if (window.GnpLearning?.refreshCurrentUserState) {
            void window.GnpLearning.refreshCurrentUserState();
        }
    });
})();
