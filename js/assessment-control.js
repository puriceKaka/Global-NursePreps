window.GnpAssessmentControl = (() => {
    const KEYS = {
        attempts: "gnp_exam_attempts",
        students: "gnp_student_conduct"
    };

    function read(key, fallback = []) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "");
            return value ?? fallback;
        } catch {
            return fallback;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent("gnp:assessment-updated", { detail: { key } }));
        return value;
    }

    function attemptId(userId, examId) {
        return `${String(userId || "guest")}:${String(examId || "exam")}`;
    }

    function listAttempts() {
        return read(KEYS.attempts, []);
    }

    function saveAttempt(attempt) {
        const attempts = listAttempts();
        const index = attempts.findIndex((item) => item.id === attempt.id);
        const next = index >= 0
            ? attempts.map((item, itemIndex) => itemIndex === index ? { ...item, ...attempt, updatedAt: new Date().toISOString() } : item)
            : [{ ...attempt, updatedAt: new Date().toISOString() }, ...attempts];
        return write(KEYS.attempts, next);
    }

    function startAttempt({ session = {}, exam = {} } = {}) {
        const id = attemptId(session.userId, exam.id);
        const existing = listAttempts().find((item) => item.id === id);
        const attempt = {
            ...existing,
            id,
            examId: exam.id,
            examTitle: exam.title || "Exam",
            lecturerId: exam.lecturerId || "",
            lecturerName: exam.lecturerName || "",
            studentId: session.userId || "guest",
            studentName: session.name || session.email || "Student",
            studentEmail: session.email || "",
            status: "active",
            startedAt: existing?.startedAt || new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            currentQuestion: 1,
            answeredCount: 0,
            cameraStatus: "starting",
            microphoneStatus: "starting",
            connectionStatus: "online",
            violations: existing?.violations || []
        };
        registerStudent(attempt);
        return saveAttempt(attempt);
    }

    function updateAttempt(id, changes = {}) {
        const existing = listAttempts().find((item) => item.id === id);
        if (!existing) return null;
        return saveAttempt({ ...existing, ...changes });
    }

    function addViolation(id, type, message) {
        const existing = listAttempts().find((item) => item.id === id);
        if (!existing) return null;
        const violations = [{
            id: `violation_${Date.now().toString(36)}`,
            type,
            message,
            occurredAt: new Date().toISOString()
        }, ...(existing.violations || [])];
        return saveAttempt({ ...existing, violations, riskLevel: violations.length >= 2 ? "high" : "review" });
    }

    function completeAttempt(id, results = {}) {
        return updateAttempt(id, {
            ...results,
            status: results.terminated ? "terminated" : "submitted",
            connectionStatus: "closed",
            submittedAt: results.submittedAt || new Date().toISOString()
        });
    }

    function registerStudent(attempt) {
        const students = read(KEYS.students, []);
        const id = attempt.studentId || "guest";
        const existing = students.find((item) => item.id === id);
        const record = {
            ...existing,
            id,
            name: attempt.studentName,
            email: attempt.studentEmail,
            status: existing?.status || "active",
            warningCount: Number(existing?.warningCount || 0),
            lastSeenAt: new Date().toISOString()
        };
        write(KEYS.students, existing
            ? students.map((item) => item.id === id ? record : item)
            : [record, ...students]);
    }

    function listStudents() {
        return read(KEYS.students, []);
    }

    function setStudentStatus(studentId, status, reason = "") {
        const students = listStudents();
        const existing = students.find((item) => item.id === studentId);
        if (!existing) return null;
        const updated = {
            ...existing,
            status,
            suspensionReason: status === "suspended" ? reason : "",
            reviewedAt: new Date().toISOString()
        };
        write(KEYS.students, students.map((item) => item.id === studentId ? updated : item));
        return updated;
    }

    function isStudentSuspended(studentId) {
        return listStudents().some((item) => item.id === studentId && item.status === "suspended");
    }

    function canStartAttempt(studentId, examId) {
        if (isStudentSuspended(studentId)) return { ok: false, reason: "Your student account is suspended." };
        const previous = listAttempts().find((item) => item.id === attemptId(studentId, examId));
        if (previous && ["submitted", "terminated", "locked"].includes(previous.status)) {
            return { ok: false, reason: "This exam attempt is locked. Ask an administrator to reopen it." };
        }
        return { ok: true };
    }

    function reopenAttempt(id) {
        return updateAttempt(id, {
            status: "reopened",
            submittedAt: null,
            terminationReason: "",
            reopenedAt: new Date().toISOString()
        });
    }

    return {
        KEYS,
        attemptId,
        listAttempts,
        startAttempt,
        updateAttempt,
        addViolation,
        completeAttempt,
        listStudents,
        setStudentStatus,
        isStudentSuspended,
        canStartAttempt,
        reopenAttempt
    };
})();
