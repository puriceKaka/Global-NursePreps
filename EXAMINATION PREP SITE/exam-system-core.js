(() => {
    const STATE_KEY = "gnp-secure-exam-system-v1";
    const ACTIVE_SESSION_KEY = "gnp-active-exam-session-v1";
    const LAST_RESULT_KEY = "gnp-last-exam-result-v1";
    const ROLE_KEY = "gnp-exam-role-v1";
    const MAX_WARNINGS = 5;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") {
            return fallback;
        }
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function uid(prefix = "id") {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return `${prefix}_${window.crypto.randomUUID()}`;
        }
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function shuffle(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function getSession() {
        return safeJsonParse(localStorage.getItem("nurseprep_session"), null);
    }

    function getCurrentUser() {
        const session = getSession();
        return {
            userId: String(session?.userId || "student-demo").trim() || "student-demo",
            name: String(session?.name || "Student Nurse").trim() || "Student Nurse",
            email: String(session?.email || "student@globalnurseprep.demo").trim() || "student@globalnurseprep.demo"
        };
    }

    function inferRole() {
        const queryRole = new URLSearchParams(window.location.search).get("role");
        if (queryRole && ["student", "lecturer", "admin"].includes(queryRole)) {
            localStorage.setItem(ROLE_KEY, queryRole);
            return queryRole;
        }

        const session = getSession();
        const sessionRole = String(session?.role || "").toLowerCase();
        if (["student", "lecturer", "admin"].includes(sessionRole)) {
            localStorage.setItem(ROLE_KEY, sessionRole);
            return sessionRole;
        }

        const stored = localStorage.getItem(ROLE_KEY);
        if (stored && ["student", "lecturer", "admin"].includes(stored)) {
            return stored;
        }

        return "student";
    }

    function setRole(role) {
        const nextRole = ["student", "lecturer", "admin"].includes(role) ? role : "student";
        localStorage.setItem(ROLE_KEY, nextRole);
        return nextRole;
    }

    function buildQuestionSet(trackLabel) {
        const focus = {
            nclex: {
                urgentCue: "sudden shortness of breath with dropping oxygen saturation",
                medication: "warfarin",
                monitoring: "INR monitoring",
                doseAction: "high-Fowler's",
                caseTopic: "sepsis deterioration",
                scenarioCourse: "NCLEX-RN"
            },
            adult: {
                urgentCue: "rapid respiratory distress after surgery",
                medication: "furosemide",
                monitoring: "potassium and urine output",
                doseAction: "semi-Fowler's",
                caseTopic: "post-operative hypoxia",
                scenarioCourse: "Adult Health"
            },
            pharmacology: {
                urgentCue: "new confusion after a high-alert infusion begins",
                medication: "digoxin",
                monitoring: "apical pulse",
                doseAction: "upright",
                caseTopic: "high-alert medication response",
                scenarioCourse: "Pharmacology"
            },
            community: {
                urgentCue: "sudden worsening wheeze during home follow-up",
                medication: "isoniazid",
                monitoring: "liver function assessment",
                doseAction: "high-Fowler's",
                caseTopic: "community follow-up escalation",
                scenarioCourse: "Community Health"
            },
            triage: {
                urgentCue: "chest pain with new hypotension in triage",
                medication: "nitroglycerin",
                monitoring: "blood pressure assessment",
                doseAction: "semi-Fowler's",
                caseTopic: "rapid triage prioritization",
                scenarioCourse: "Triage Practice"
            }
        }[trackLabel] || {
            urgentCue: "an acute change in breathing and mentation",
            medication: "digoxin",
            monitoring: "apical pulse",
            doseAction: "high-Fowler's",
            caseTopic: "acute deterioration",
            scenarioCourse: "Nursing Practice"
        };

        return [
            {
                id: uid("q"),
                type: "mcq",
                category: "Clinical Judgment",
                difficulty: "Priority",
                points: 1,
                prompt: `Which finding requires the most urgent follow-up in this ${focus.scenarioCourse} exam?`,
                options: shuffle([
                    focus.urgentCue,
                    "A routine meal preference question",
                    "A stable chronic issue with no change from baseline",
                    "A completed care task already documented as effective"
                ]),
                correctAnswer: focus.urgentCue,
                explanation: "The exam is testing the ability to spot an acute change that could lead to rapid deterioration."
            },
            {
                id: uid("q"),
                type: "true_false",
                category: "Safe Care",
                difficulty: "Foundational",
                points: 1,
                prompt: "True or False: The RN can delegate the initial assessment of an unstable patient complaint to unlicensed assistive personnel.",
                options: ["True", "False"],
                correctAnswer: "False",
                explanation: "Initial assessment of instability requires RN-level clinical judgment."
            },
            {
                id: uid("q"),
                type: "fill_blank",
                category: "Immediate Response",
                difficulty: "Application",
                points: 1,
                prompt: `Before applying oxygen support, position the unstable patient in ${focus.doseAction} or ________ if tolerated.`,
                acceptableAnswers: ["upright", "high fowler's", "high-fowler's", "high fowlers", "semi-fowler's", "semi fowler's"],
                explanation: "Positioning is often one of the safest early responses in respiratory compromise."
            },
            {
                id: uid("q"),
                type: "matching",
                category: "Medication Safety",
                difficulty: "Application",
                points: 3,
                prompt: "Match each medication or task with the safest monitoring priority.",
                pairs: [
                    { left: focus.medication, right: focus.monitoring },
                    { left: "Morphine IV", right: "Respiratory rate assessment" },
                    { left: "Insulin administration", right: "Blood glucose reassessment" }
                ],
                choices: shuffle([
                    focus.monitoring,
                    "Respiratory rate assessment",
                    "Blood glucose reassessment"
                ]),
                explanation: "These items test whether the nurse connects medications with the most relevant safety checks."
            },
            {
                id: uid("q"),
                type: "drag_drop",
                category: "Priority Order",
                difficulty: "Priority",
                points: 3,
                prompt: "Drag the actions into the safest first-to-last order for initial response.",
                items: [
                    { id: "assess", label: "Assess airway, breathing, and current vital signs" },
                    { id: "support", label: "Position the patient and apply immediate supportive care" },
                    { id: "escalate", label: "Escalate to the lecturer or provider/rapid team with focused findings" }
                ],
                zones: [
                    { id: "first", label: "First action" },
                    { id: "second", label: "Second action" },
                    { id: "third", label: "Third action" }
                ],
                correctOrder: ["assess", "support", "escalate"],
                explanation: "Assess first, support immediately, and escalate with a focused update."
            },
            {
                id: uid("q"),
                type: "case_study",
                category: "Case Study",
                difficulty: "Priority",
                points: 2,
                caseStudy: {
                    title: `${focus.scenarioCourse} Case Study`,
                    summary: `A patient is being monitored for ${focus.caseTopic}. Over the last 20 minutes the nurse notes increasing restlessness, a rising pulse, lower blood pressure, and reduced urine output.`,
                    cues: [
                        "Restlessness and anxiety are increasing",
                        "Blood pressure is trending downward",
                        "Urine output has fallen since the previous check"
                    ]
                },
                prompt: "Which interpretation is the safest?",
                options: shuffle([
                    "These are worsening perfusion cues and the patient may be deteriorating.",
                    "These are normal findings after any nursing intervention.",
                    "The priority is to delay action until the next scheduled review.",
                    "No intervention is required if the patient can still answer questions."
                ]),
                correctAnswer: "These are worsening perfusion cues and the patient may be deteriorating.",
                explanation: "Trend recognition matters more than one isolated value in case-style questions."
            },
            {
                id: uid("q"),
                type: "essay",
                category: "Written Response",
                difficulty: "Professional",
                points: 5,
                prompt: "In 4 to 6 sentences, explain how you would prioritize your first nursing actions, what you would monitor next, and what information you would escalate.",
                placeholder: "Type your structured nursing response here...",
                rubric: "Manual grading: clarity of priority action, safety reasoning, monitoring plan, and escalation quality.",
                explanation: "Essay responses are reviewed manually by the lecturer or admin."
            }
        ];
    }

    function buildDefaultState() {
        return {
            role: inferRole(),
            exams: [
                {
                    id: "nclex-rn-window-may",
                    title: "NCLEX-RN Window Examination",
                    course: "NCLEX-RN Comprehensive Prep",
                    category: "Licensure",
                    ownerRole: "lecturer",
                    ownerName: "Grace Wanjiku, RN, MSN",
                    assignmentScope: "NCLEX Cohort A",
                    assignedStudents: ["student-demo"],
                    durationMinutes: 120,
                    questionCount: 7,
                    passMark: 70,
                    mode: "real",
                    lifecycle: "upcoming",
                    publishState: "published",
                    resultPublication: "manual",
                    browserLock: true,
                    webcamRequired: true,
                    randomizeQuestions: true,
                    randomizeOptions: true,
                    scheduleLabel: "May 15, 2026 • 10:00 AM EAT",
                    availabilityWindow: "Window opens in 7 days",
                    instructions: [
                        "Join 10 minutes early to complete camera, microphone, and browser checks.",
                        "This is a lecturer-assigned real exam. Only assigned students may enter the secure workspace.",
                        "Essay responses remain pending until the lecturer completes manual marking."
                    ],
                    materials: [
                        { label: "Exam blueprint", type: "PDF", size: "1.4 MB" },
                        { label: "Medication revision slides", type: "PPT", size: "4.8 MB" }
                    ],
                    questionTypes: ["MCQ", "True/False", "Essay", "Fill in the blank", "Matching", "Drag and drop", "Case study"],
                    questions: buildQuestionSet("nclex"),
                    analytics: {
                        assignedStudents: 48,
                        submitted: 31,
                        averageScore: 78,
                        flaggedViolations: 4
                    },
                    approvalState: "approved"
                },
                {
                    id: "adult-health-midterm-live",
                    title: "Adult Health Secure Midterm",
                    course: "Med-Surg Readiness Bootcamp",
                    category: "Clinical Practice",
                    ownerRole: "lecturer",
                    ownerName: "Dr. Njeri Otieno",
                    assignmentScope: "Adult Health Class B",
                    assignedStudents: ["student-demo"],
                    durationMinutes: 90,
                    questionCount: 7,
                    passMark: 68,
                    mode: "real",
                    lifecycle: "active",
                    publishState: "published",
                    resultPublication: "manual",
                    browserLock: true,
                    webcamRequired: true,
                    randomizeQuestions: true,
                    randomizeOptions: true,
                    scheduleLabel: "Active now • closes in 90 minutes",
                    availabilityWindow: "Available for the current exam window",
                    instructions: [
                        "Enter fullscreen before you begin and remain inside the examination workspace.",
                        "Auto-save runs during each answer change and every note update.",
                        "The exam auto-submits if time expires or major violations exceed the warning limit."
                    ],
                    materials: [
                        { label: "Exam instructions", type: "PDF", size: "580 KB" },
                        { label: "Clinical guideline deck", type: "PPT", size: "3.2 MB" }
                    ],
                    questionTypes: ["MCQ", "True/False", "Essay", "Fill in the blank", "Matching", "Drag and drop", "Case study"],
                    questions: buildQuestionSet("adult"),
                    analytics: {
                        assignedStudents: 36,
                        submitted: 12,
                        averageScore: 74,
                        flaggedViolations: 2
                    },
                    approvalState: "approved"
                },
                {
                    id: "pharmacology-essay-check",
                    title: "Pharmacology Essay and Safety Review",
                    course: "Pharmacology Intensive",
                    category: "Pharmacology",
                    ownerRole: "admin",
                    ownerName: "Institution Exam Office",
                    assignmentScope: "Institution Pharmacology Checkpoint",
                    assignedStudents: ["student-demo"],
                    durationMinutes: 75,
                    questionCount: 7,
                    passMark: 75,
                    mode: "real",
                    lifecycle: "completed",
                    publishState: "published",
                    resultPublication: "after-grading",
                    browserLock: true,
                    webcamRequired: true,
                    randomizeQuestions: false,
                    randomizeOptions: true,
                    scheduleLabel: "Submitted • awaiting manual grading",
                    availabilityWindow: "Lecturer review pending",
                    instructions: [
                        "Objective items are auto-marked, but essays wait for lecturer review.",
                        "Results remain hidden until manual grading and publication are complete."
                    ],
                    materials: [
                        { label: "Medication safety pack", type: "DOCX", size: "850 KB" }
                    ],
                    questionTypes: ["MCQ", "True/False", "Essay", "Fill in the blank", "Matching", "Drag and drop", "Case study"],
                    questions: buildQuestionSet("pharmacology"),
                    analytics: {
                        assignedStudents: 82,
                        submitted: 79,
                        averageScore: 81,
                        flaggedViolations: 5
                    },
                    approvalState: "approved"
                },
                {
                    id: "community-health-final",
                    title: "Community Health Final Examination",
                    course: "Global Nursing Lecture Series",
                    category: "Community Health",
                    ownerRole: "lecturer",
                    ownerName: "Sr. Mary Atieno",
                    assignmentScope: "Community Track",
                    assignedStudents: ["student-demo"],
                    durationMinutes: 80,
                    questionCount: 7,
                    passMark: 70,
                    mode: "real",
                    lifecycle: "graded",
                    publishState: "published",
                    resultPublication: "published",
                    browserLock: true,
                    webcamRequired: true,
                    randomizeQuestions: true,
                    randomizeOptions: true,
                    scheduleLabel: "Graded • results published",
                    availabilityWindow: "Published score available",
                    instructions: [
                        "Published results are visible after lecturer review and release."
                    ],
                    materials: [
                        { label: "Case study handout", type: "PDF", size: "720 KB" }
                    ],
                    questionTypes: ["MCQ", "True/False", "Essay", "Fill in the blank", "Matching", "Drag and drop", "Case study"],
                    questions: buildQuestionSet("community"),
                    analytics: {
                        assignedStudents: 41,
                        submitted: 41,
                        averageScore: 84,
                        flaggedViolations: 1
                    },
                    approvalState: "approved"
                },
                {
                    id: "rapid-triage-practice",
                    title: "Rapid Triage Practice Mode",
                    course: "NCK Licensing Exam Masterclass",
                    category: "Practice Mode",
                    ownerRole: "lecturer",
                    ownerName: "Simulation Faculty",
                    assignmentScope: "Open to assigned learners",
                    assignedStudents: ["student-demo"],
                    durationMinutes: 45,
                    questionCount: 7,
                    passMark: 65,
                    mode: "practice",
                    lifecycle: "practice",
                    publishState: "published",
                    resultPublication: "instant",
                    browserLock: false,
                    webcamRequired: false,
                    randomizeQuestions: true,
                    randomizeOptions: true,
                    scheduleLabel: "Start any time",
                    availabilityWindow: "Available on demand",
                    instructions: [
                        "Practice mode offers instant results and weak-topic analysis.",
                        "You may still use the secure workspace to simulate real exam timing."
                    ],
                    materials: [
                        { label: "Practice instructions", type: "PDF", size: "410 KB" }
                    ],
                    questionTypes: ["MCQ", "True/False", "Essay", "Fill in the blank", "Matching", "Drag and drop", "Case study"],
                    questions: buildQuestionSet("triage"),
                    analytics: {
                        assignedStudents: 124,
                        submitted: 90,
                        averageScore: 76,
                        flaggedViolations: 0
                    },
                    approvalState: "approved"
                },
                {
                    id: "critical-care-remediation-draft",
                    title: "Critical Care Remediation Draft",
                    course: "Med-Surg Readiness Bootcamp",
                    category: "Lecturer Draft",
                    ownerRole: "lecturer",
                    ownerName: "Dr. Njeri Otieno",
                    assignmentScope: "Not yet assigned",
                    assignedStudents: [],
                    durationMinutes: 60,
                    questionCount: 7,
                    passMark: 70,
                    mode: "real",
                    lifecycle: "draft",
                    publishState: "unpublished",
                    resultPublication: "manual",
                    browserLock: true,
                    webcamRequired: true,
                    randomizeQuestions: true,
                    randomizeOptions: true,
                    scheduleLabel: "Draft • lecturer workspace",
                    availabilityWindow: "Not available to students",
                    instructions: ["Draft exam awaiting publication and approval."],
                    materials: [
                        { label: "Critical care notes", type: "DOCX", size: "960 KB" }
                    ],
                    questionTypes: ["MCQ", "Essay", "Case study"],
                    questions: buildQuestionSet("adult"),
                    analytics: {
                        assignedStudents: 0,
                        submitted: 0,
                        averageScore: 0,
                        flaggedViolations: 0
                    },
                    approvalState: "pending-approval"
                }
            ],
            materialsLibrary: [
                { id: uid("mat"), title: "Adult Health Mock Blueprint", type: "PDF", uploadedBy: "Dr. Njeri Otieno", updatedAt: "May 5, 2026" },
                { id: uid("mat"), title: "Pharmacology Safety Slides", type: "PPT", uploadedBy: "Institution Exam Office", updatedAt: "May 3, 2026" },
                { id: uid("mat"), title: "Community Health Review Notes", type: "DOCX", uploadedBy: "Sr. Mary Atieno", updatedAt: "April 29, 2026" }
            ],
            generatedDrafts: [],
            activityLogs: [],
            resultsByExamUser: {},
            settings: {
                maxWarnings: MAX_WARNINGS,
                lockdownEnabled: true,
                fullscreenRequired: true
            }
        };
    }

    function normalizeState(candidate) {
        const fallback = buildDefaultState();
        const source = candidate && typeof candidate === "object" ? candidate : {};
        const state = {
            ...fallback,
            ...source
        };

        state.role = ["student", "lecturer", "admin"].includes(state.role) ? state.role : fallback.role;
        state.exams = Array.isArray(state.exams) && state.exams.length ? state.exams : fallback.exams;
        state.materialsLibrary = Array.isArray(state.materialsLibrary) ? state.materialsLibrary : fallback.materialsLibrary;
        state.generatedDrafts = Array.isArray(state.generatedDrafts) ? state.generatedDrafts : [];
        state.activityLogs = Array.isArray(state.activityLogs) ? state.activityLogs : [];
        state.resultsByExamUser = state.resultsByExamUser && typeof state.resultsByExamUser === "object" ? state.resultsByExamUser : {};
        state.settings = state.settings && typeof state.settings === "object" ? state.settings : fallback.settings;
        return state;
    }

    function buildResultKey(examId, userId) {
        return `${examId}::${userId}`;
    }

    function loadState() {
        const parsed = safeJsonParse(localStorage.getItem(STATE_KEY), null);
        const state = normalizeState(parsed);
        const user = getCurrentUser();
        ensureSeededHistory(state, user.userId);
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        return state;
    }

    function saveState(state) {
        localStorage.setItem(STATE_KEY, JSON.stringify(normalizeState(state)));
    }

    function ensureSeededHistory(state, userId) {
        const gradedKey = buildResultKey("community-health-final", userId);
        if (!state.resultsByExamUser[gradedKey]) {
            state.resultsByExamUser[gradedKey] = {
                resultId: uid("result"),
                examId: "community-health-final",
                examTitle: "Community Health Final Examination",
                userId,
                submissionMode: "real",
                score: 88,
                objectiveScore: 88,
                passMark: 70,
                passed: true,
                status: "graded",
                published: true,
                manualPendingCount: 0,
                answeredCount: 7,
                totalQuestions: 7,
                submittedAt: "2026-04-20T10:00:00.000Z",
                lecturerFeedback: "Strong prioritization and safe escalation reasoning. Continue strengthening medication rationales.",
                strengths: ["Community assessment", "Patient teaching", "Priority response"],
                weakAreas: ["Medication monitoring"],
                performanceBreakdown: [
                    { category: "Community assessment", score: 92 },
                    { category: "Patient teaching", score: 90 },
                    { category: "Medication monitoring", score: 68 }
                ],
                proctoringEvents: ["No major integrity issues recorded."],
                answerReview: []
            };
        }

        const completedKey = buildResultKey("pharmacology-essay-check", userId);
        if (!state.resultsByExamUser[completedKey]) {
            state.resultsByExamUser[completedKey] = {
                resultId: uid("result"),
                examId: "pharmacology-essay-check",
                examTitle: "Pharmacology Essay and Safety Review",
                userId,
                submissionMode: "real",
                score: null,
                objectiveScore: 74,
                passMark: 75,
                passed: null,
                status: "completed",
                published: false,
                manualPendingCount: 1,
                answeredCount: 7,
                totalQuestions: 7,
                submittedAt: "2026-05-04T09:15:00.000Z",
                lecturerFeedback: "Manual grading in progress. Final comments will appear after essay review.",
                strengths: ["Medication calculation steps"],
                weakAreas: ["High-alert medication monitoring"],
                performanceBreakdown: [
                    { category: "Medication Safety", score: 72 },
                    { category: "Dose Calculation", score: 80 },
                    { category: "High-alert Monitoring", score: 64 }
                ],
                proctoringEvents: ["Submission received. Manual grading pending."],
                answerReview: []
            };
        }
    }

    function getExam(examId) {
        return loadState().exams.find((exam) => exam.id === examId) || null;
    }

    function getStudentExamStatus(exam, userId, state) {
        const result = getResultForExam(exam.id, userId, state);
        if (result) {
            return result.published ? "graded" : "completed";
        }

        if (exam.lifecycle === "practice") {
            return "practice";
        }
        if (exam.lifecycle === "active") {
            return "active";
        }
        return "upcoming";
    }

    function getResultForExam(examId, userId, state = null) {
        const resolved = state || loadState();
        return resolved.resultsByExamUser[buildResultKey(examId, userId)] || null;
    }

    function getAssignedExams(userId, state = null) {
        const resolved = state || loadState();
        return resolved.exams.filter((exam) => Array.isArray(exam.assignedStudents) && exam.assignedStudents.includes(userId));
    }

    function getExamsForRole(role, userId, state = null) {
        const resolved = state || loadState();
        if (role === "student") {
            return getAssignedExams(userId, resolved);
        }
        if (role === "lecturer") {
            return resolved.exams.filter((exam) => exam.ownerRole === "lecturer");
        }
        return resolved.exams;
    }

    function groupStudentExams(userId, state = null) {
        const resolved = state || loadState();
        const grouped = {
            upcoming: [],
            active: [],
            completed: [],
            graded: [],
            practice: []
        };

        getAssignedExams(userId, resolved).forEach((exam) => {
            const status = getStudentExamStatus(exam, userId, resolved);
            grouped[status]?.push(exam);
        });

        return grouped;
    }

    function getRoleMetrics(role, userId, state = null) {
        const resolved = state || loadState();
        if (role === "student") {
            const grouped = groupStudentExams(userId, resolved);
            return {
                assigned: getAssignedExams(userId, resolved).length,
                active: grouped.active.length + grouped.practice.length,
                graded: grouped.graded.length,
                awaiting: grouped.completed.length
            };
        }

        const exams = getExamsForRole(role, userId, resolved);
        return {
            assigned: exams.reduce((sum, exam) => sum + Number(exam.analytics?.assignedStudents || 0), 0),
            active: exams.filter((exam) => exam.lifecycle === "active").length,
            graded: Object.values(resolved.resultsByExamUser).filter((result) => result.published).length,
            awaiting: exams.filter((exam) => exam.approvalState === "pending-approval").length
        };
    }

    function getQuestionMap(exam) {
        const map = {};
        exam.questions.forEach((question) => {
            map[question.id] = question;
        });
        return map;
    }

    function startExam(examId) {
        const state = loadState();
        const role = inferRole();
        const user = getCurrentUser();
        const exam = state.exams.find((item) => item.id === examId);

        if (!exam) {
            return { ok: false, error: "Exam not found." };
        }

        if (role !== "student") {
            return { ok: false, error: "Only student mode may launch the secure exam workspace." };
        }

        if (!exam.assignedStudents.includes(user.userId)) {
            return { ok: false, error: "This exam is not assigned to the current student." };
        }

        const status = getStudentExamStatus(exam, user.userId, state);
        if (!["active", "practice"].includes(status)) {
            return { ok: false, error: "This exam is not yet open for student access." };
        }

        const orderedQuestions = exam.randomizeQuestions ? shuffle(exam.questions) : exam.questions.slice();
        const normalizedQuestions = orderedQuestions.map((question) => {
            if (question.options && exam.randomizeOptions) {
                return { ...question, options: shuffle(question.options) };
            }
            if (question.choices && exam.randomizeOptions) {
                return { ...question, choices: shuffle(question.choices) };
            }
            return question;
        });

        const session = {
            sessionId: uid("attempt"),
            examId: exam.id,
            userId: user.userId,
            userName: user.name,
            role,
            examTitle: exam.title,
            course: exam.course,
            durationMinutes: exam.durationMinutes,
            passMark: exam.passMark,
            submissionMode: exam.mode,
            startedAt: null,
            answers: {},
            flags: {},
            notes: "",
            warnings: [],
            warningCount: 0,
            autoSaveAt: "",
            currentQuestionId: normalizedQuestions[0]?.id || "",
            fullscreenAccepted: false,
            randomizedQuestions: normalizedQuestions
        };

        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
        return { ok: true, session };
    }

    function loadActiveSession() {
        return safeJsonParse(localStorage.getItem(ACTIVE_SESSION_KEY), null);
    }

    function saveActiveSession(session) {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }

    function clearActiveSession() {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
    }

    function isQuestionAnswered(question, answer) {
        if (answer == null) {
            return false;
        }

        if (["mcq", "true_false", "fill_blank", "essay", "case_study"].includes(question.type)) {
            return String(answer).trim() !== "";
        }

        if (question.type === "matching") {
            return answer && typeof answer === "object" && Object.keys(answer).length === question.pairs.length;
        }

        if (question.type === "drag_drop") {
            return Array.isArray(answer) && answer.length === question.correctOrder.length;
        }

        return false;
    }

    function normalizeAnswer(value) {
        return String(value || "").trim().toLowerCase();
    }

    function gradeQuestion(question, answer) {
        if (question.type === "essay") {
            return {
                earned: 0,
                possible: question.points,
                pendingManual: true,
                isCorrect: null
            };
        }

        if (question.type === "mcq" || question.type === "true_false" || question.type === "case_study") {
            const correct = normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);
            return {
                earned: correct ? question.points : 0,
                possible: question.points,
                pendingManual: false,
                isCorrect: correct
            };
        }

        if (question.type === "fill_blank") {
            const normalized = normalizeAnswer(answer);
            const correct = (question.acceptableAnswers || []).some((item) => normalizeAnswer(item) === normalized);
            return {
                earned: correct ? question.points : 0,
                possible: question.points,
                pendingManual: false,
                isCorrect: correct
            };
        }

        if (question.type === "matching") {
            const response = answer && typeof answer === "object" ? answer : {};
            let correctCount = 0;
            question.pairs.forEach((pair) => {
                if (normalizeAnswer(response[pair.left]) === normalizeAnswer(pair.right)) {
                    correctCount += 1;
                }
            });
            const correct = correctCount === question.pairs.length;
            return {
                earned: correct ? question.points : 0,
                possible: question.points,
                pendingManual: false,
                isCorrect: correct
            };
        }

        if (question.type === "drag_drop") {
            const response = Array.isArray(answer) ? answer : [];
            const correct = question.correctOrder.every((itemId, index) => response[index] === itemId);
            return {
                earned: correct ? question.points : 0,
                possible: question.points,
                pendingManual: false,
                isCorrect: correct
            };
        }

        return {
            earned: 0,
            possible: question.points,
            pendingManual: false,
            isCorrect: false
        };
    }

    function buildWeakAreas(breakdown) {
        return breakdown.filter((item) => item.score < 70).map((item) => item.category);
    }

    function buildStrengths(breakdown) {
        return breakdown.filter((item) => item.score >= 80).map((item) => item.category);
    }

    function finalizeExam({ autoSubmitted = false, forcePending = false, reason = "" } = {}) {
        const state = loadState();
        const session = loadActiveSession();
        const user = getCurrentUser();

        if (!session) {
            return { ok: false, error: "No active exam session found." };
        }

        const exam = state.exams.find((item) => item.id === session.examId);
        if (!exam) {
            return { ok: false, error: "Exam data could not be loaded." };
        }

        const questions = session.randomizedQuestions || exam.questions;
        const categoryTotals = {};
        let earnedPoints = 0;
        let possibleObjectivePoints = 0;
        let manualPendingCount = 0;

        const answerReview = questions.map((question) => {
            const answer = session.answers[question.id];
            const grade = gradeQuestion(question, answer);

            categoryTotals[question.category] ??= { total: 0, earned: 0 };
            categoryTotals[question.category].total += grade.possible;
            categoryTotals[question.category].earned += grade.earned;
            earnedPoints += grade.earned;

            if (grade.pendingManual) {
                manualPendingCount += 1;
            } else {
                possibleObjectivePoints += grade.possible;
            }

            return {
                questionId: question.id,
                category: question.category,
                question: question.prompt,
                type: question.type,
                answer: answer ?? "No response submitted",
                correctAnswer: question.type === "essay" ? "Manual lecturer review required" : question.correctAnswer || question.acceptableAnswers?.[0] || "",
                explanation: question.explanation || "",
                flagged: Boolean(session.flags[question.id]),
                status: grade.pendingManual ? "Pending manual review" : grade.isCorrect ? "Correct" : "Review needed"
            };
        });

        const performanceBreakdown = Object.entries(categoryTotals)
            .map(([category, totals]) => ({
                category,
                score: totals.total ? Math.round((totals.earned / totals.total) * 100) : 0
            }))
            .sort((left, right) => right.score - left.score);

        const objectiveScore = possibleObjectivePoints ? Math.round((earnedPoints / possibleObjectivePoints) * 100) : 0;
        const published = exam.resultPublication === "instant" || (manualPendingCount === 0 && exam.resultPublication === "published");
        const finalScore = manualPendingCount > 0 || forcePending ? null : objectiveScore;
        const passed = finalScore == null ? null : finalScore >= exam.passMark;

        const result = {
            resultId: uid("result"),
            examId: exam.id,
            examTitle: exam.title,
            userId: user.userId,
            submissionMode: exam.mode,
            score: finalScore,
            objectiveScore,
            passMark: exam.passMark,
            passed,
            status: published && finalScore != null ? "graded" : "completed",
            published,
            manualPendingCount,
            answeredCount: questions.filter((question) => isQuestionAnswered(question, session.answers[question.id])).length,
            totalQuestions: questions.length,
            submittedAt: new Date().toISOString(),
            autoSubmitted,
            lecturerFeedback: manualPendingCount
                ? "Manual grading is still pending for written responses. Final comments will appear after lecturer review."
                : "Automatic marking completed. Review your weak topics and lecturer notes.",
            strengths: buildStrengths(performanceBreakdown),
            weakAreas: buildWeakAreas(performanceBreakdown),
            performanceBreakdown,
            proctoringEvents: session.warnings.length
                ? session.warnings.map((warning) => `${warning.message} (${warning.timeLabel})`)
                : ["No major integrity issues recorded."],
            answerReview,
            notes: session.notes || "",
            submissionReason: reason || (autoSubmitted ? "Auto-submitted at the end of the exam timer." : "Submitted by student.")
        };

        state.resultsByExamUser[buildResultKey(exam.id, user.userId)] = result;

        const examIndex = state.exams.findIndex((item) => item.id === exam.id);
        if (examIndex >= 0) {
            state.exams[examIndex] = {
                ...state.exams[examIndex],
                lifecycle: result.status
            };
        }

        appendActivityLog(state, {
            scope: "student-exam",
            severity: autoSubmitted ? "warning" : "info",
            examId: exam.id,
            message: `${exam.title} ${autoSubmitted ? "auto-submitted" : "submitted"} by ${user.name}.`
        });

        saveState(state);
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
        clearActiveSession();
        return { ok: true, result };
    }

    function appendActivityLog(state, log) {
        const entry = {
            id: uid("log"),
            createdAt: new Date().toISOString(),
            timeLabel: new Date().toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }),
            ...log
        };

        state.activityLogs.unshift(entry);
        state.activityLogs = state.activityLogs.slice(0, 80);
        return entry;
    }

    function addExamActivity(log) {
        const state = loadState();
        const entry = appendActivityLog(state, log);
        saveState(state);
        return entry;
    }

    function getLastResult() {
        return safeJsonParse(localStorage.getItem(LAST_RESULT_KEY), null);
    }

    function getResultsForUser(userId, state = null) {
        const resolved = state || loadState();
        return Object.values(resolved.resultsByExamUser).filter((result) => result.userId === userId);
    }

    function generateDraftFromMaterial(fileName) {
        const state = loadState();
        const draft = {
            id: uid("draft"),
            fileName,
            createdAt: new Date().toISOString(),
            title: `AI Draft from ${fileName}`,
            summary: "Generated question draft ready for lecturer review and exam assignment.",
            questions: [
                "Which cue most strongly suggests the patient needs urgent reassessment?",
                "What teaching point must the nurse include before medication administration?",
                "Which action should be prioritized first in this case study?"
            ]
        };

        state.generatedDrafts.unshift(draft);
        state.generatedDrafts = state.generatedDrafts.slice(0, 10);
        appendActivityLog(state, {
            scope: "lecturer-tools",
            severity: "info",
            message: `AI draft generated from ${fileName}.`
        });
        saveState(state);
        return draft;
    }

    function toggleExamPublish(examId) {
        const state = loadState();
        const exam = state.exams.find((item) => item.id === examId);
        if (!exam) {
            return null;
        }

        exam.publishState = exam.publishState === "published" ? "unpublished" : "published";
        appendActivityLog(state, {
            scope: "lecturer-tools",
            severity: "info",
            examId,
            message: `${exam.title} ${exam.publishState === "published" ? "published" : "unpublished"} by role workspace.`
        });
        saveState(state);
        return exam.publishState;
    }

    function toggleExamApproval(examId) {
        const state = loadState();
        const exam = state.exams.find((item) => item.id === examId);
        if (!exam) {
            return null;
        }

        exam.approvalState = exam.approvalState === "approved" ? "pending-approval" : "approved";
        appendActivityLog(state, {
            scope: "admin-tools",
            severity: "info",
            examId,
            message: `${exam.title} ${exam.approvalState === "approved" ? "approved" : "returned for review"} by admin workspace.`
        });
        saveState(state);
        return exam.approvalState;
    }

    function formatTimestamp(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "Recently";
        }
        return date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    window.GnpExamSystem = {
        STATE_KEY,
        ACTIVE_SESSION_KEY,
        LAST_RESULT_KEY,
        MAX_WARNINGS,
        clone,
        uid,
        escapeHtml,
        safeJsonParse,
        shuffle,
        getSession,
        getCurrentUser,
        inferRole,
        setRole,
        loadState,
        saveState,
        getExam,
        getResultForExam,
        getAssignedExams,
        getExamsForRole,
        groupStudentExams,
        getRoleMetrics,
        startExam,
        loadActiveSession,
        saveActiveSession,
        clearActiveSession,
        isQuestionAnswered,
        getQuestionMap,
        gradeQuestion,
        finalizeExam,
        addExamActivity,
        generateDraftFromMaterial,
        toggleExamPublish,
        toggleExamApproval,
        getLastResult,
        getResultsForUser,
        formatTimestamp
    };
})();
