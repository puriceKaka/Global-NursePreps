(() => {
    const $ = (selector) => document.querySelector(selector);

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") return fallback;
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

    function formatDate(iso) {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }

    function setStatus(message, locked = false) {
        const box = $("#statusBox");
        if (!box) return;
        box.textContent = message;
        box.classList.toggle("is-locked", locked);
    }

    function setField(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function main() {
        const params = new URLSearchParams(window.location.search);
        const source = (params.get("source") || "home").toLowerCase();
        const courseId = params.get("courseId") || params.get("course") || "";
        const titleParam = params.get("title") || params.get("courseTitle") || "";

        const core = window.GnpLearning;
        const session = core?.getSession ? core.getSession() : safeJsonParse(localStorage.getItem("nurseprep_session"), null);
        if (!session || !session.userId) {
            setStatus("Login required to view certificate credentials.", true);
            return;
        }

        const studentName = String(session.name || "Student").trim() || "Student";
        const studentEmail = String(session.email || "—").trim() || "—";

        setField("studentName", studentName);
        setField("studentEmail", studentEmail);
        setField("courseTitle", titleParam || "Course");

        let certificateId = "";
        let issuedAt = "";

        if (!courseId) {
            setStatus("Missing course ID in the certificate link.", true);
            return;
        }

        if (source === "exam") {
            const examState = core?.loadState ? core.loadState() : safeJsonParse(localStorage.getItem("gnp-learning-state-v2"), null);
            const progress = examState?.progress?.[courseId];
            const certificate = progress?.certificate;

            if (!certificate?.id) {
                setStatus("Certificate locked. Finish all modules to unlock.", true);
                return;
            }

            certificateId = String(certificate.id);
            issuedAt = String(certificate.issuedAt || "");

            if (!titleParam && progress?.courseTitle) {
                setField("courseTitle", String(progress.courseTitle));
            }
        } else {
            const learningByUser = safeJsonParse(localStorage.getItem("nurseprep_learning_by_user"), {});
            const userLearning = learningByUser?.[session.userId] || {};
            const learning = userLearning?.[courseId];

            if (!learning?.completedAt) {
                setStatus("Certificate locked. Complete all learning steps to unlock.", true);
                return;
            }

            const now = new Date().toISOString();
            const next = { ...(learning || {}) };
            next.certificate = next.certificate || { id: uid("cert"), issuedAt: now };
            if (!next.certificate.issuedAt) next.certificate.issuedAt = now;

            userLearning[courseId] = next;
            learningByUser[session.userId] = userLearning;
            localStorage.setItem("nurseprep_learning_by_user", JSON.stringify(learningByUser));

            certificateId = String(next.certificate.id);
            issuedAt = String(next.certificate.issuedAt || "");
        }

        setField("certificateId", certificateId || "—");
        setField("issuedDate", issuedAt ? formatDate(issuedAt) : "—");
        setStatus("Certificate verified. You can print this page as proof of completion.");

        const printBtn = $("#printBtn");
        if (printBtn) {
            printBtn.disabled = false;
            printBtn.addEventListener("click", () => window.print());
        }
    }

    document.addEventListener("DOMContentLoaded", main);
})();
