(() => {
    const LEGACY_STORAGE_KEY = "gnp-learning-state-v2";
    const STORAGE_KEY_PREFIX = "gnp-learning-state-v2";

    const COURSE_IMAGES = {
        nurseTablet: "https://images.unsplash.com/photo-1580281657527-47c57d5a0b8b?auto=format&fit=crop&q=80&w=1200",
        simulationLab: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
        lectureRoom: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
        medicationTray: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=1200",
        pediatricCare: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200",
        criticalCare: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80&w=1200"
    };

    const COURSE_META = [
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
        selectedCourseId: COURSE_META[0]?.id || "",
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

    function getSession() {
        return safeJsonParse(localStorage.getItem("nurseprep_session"), null);
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

        const legacy = safeJsonParse(localStorage.getItem(LEGACY_STORAGE_KEY), null);
        if (legacy && typeof legacy === "object") {
            const migrated = normalizeState(legacy);
            localStorage.setItem(key, JSON.stringify(migrated));
            return migrated;
        }

        return normalizeState({ ...DEFAULT_STATE });
    }

    function saveState(state) {
        localStorage.setItem(getStorageKey(), JSON.stringify(state));
    }

    function getCourseMeta(courseId) {
        return COURSE_META.find((c) => c.id === courseId) || null;
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
        getSession,
        getUserId,
        getStorageKey,
        loadState,
        saveState,
        getCourseMeta,
        ensureCourseProgress,
        getProgressPercent,
        enrollCourse,
        cancelEnrollment
    };
})();

