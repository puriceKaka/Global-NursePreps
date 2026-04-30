(() => {
    const $ = (selector) => document.querySelector(selector);

    const MEMBERSHIP_TITLES = {
        student: "Student Membership",
        professional: "Professional Membership",
        mentor: "Mentor Membership"
    };

    function safeJsonParse(raw, fallback) {
        if (typeof raw !== "string" || raw.trim() === "") return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    function getUsers() {
        return safeJsonParse(localStorage.getItem("nurseprep_users"), []);
    }

    function getMembershipPlanId(userId) {
        const map = safeJsonParse(localStorage.getItem("nurseprep_membership_by_user"), {});
        return map?.[userId] || null;
    }

    function formatDateTime(iso) {
        try {
            return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
        } catch {
            return iso;
        }
    }

    function requireSession() {
        const session = window.GnpLearning?.getSession ? window.GnpLearning.getSession() : null;
        if (!session || !session.userId) {
            window.location.replace("login.html");
            return null;
        }
        return session;
    }

    function initLogout() {
        $("#logoutBtn")?.addEventListener("click", () => {
            localStorage.removeItem("nurseprep_session");
            window.location.replace("login.html");
        });
    }

    function renderProfile(session) {
        const users = getUsers();
        const user = users.find((u) => u.id === session.userId) || { name: session.name || "Member", email: session.email || "—" };

        $("#profileName").textContent = String(user.name || "Member");
        $("#profileEmail").textContent = String(user.email || "—");

        const planId = getMembershipPlanId(session.userId);
        const title = planId ? MEMBERSHIP_TITLES[planId] || String(planId) : "Not selected";
        $("#membershipLabel").textContent = title;
        $("#membershipHint").textContent = planId ? "Membership active." : "Choose a plan to unlock the full experience.";

        const core = window.GnpLearning;
        const state = core?.loadState ? core.loadState() : { enrolledCourseIds: [], progress: {} };
        const enrolledIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];

        const completedCount = enrolledIds.filter((id) => (core?.getProgressPercent ? core.getProgressPercent(id, state) : 0) === 100).length;
        const certificatesCount = enrolledIds.filter((id) => state.progress?.[id]?.certificate?.id).length;

        $("#coursesLabel").textContent = String(enrolledIds.length);
        $("#completedLabel").textContent = String(completedCount);
        $("#certificatesLabel").textContent = String(certificatesCount);

        let last = null;
        enrolledIds.forEach((id) => {
            const p = state.progress?.[id];
            if (!p?.lastVisited) return;
            if (!last || String(p.lastVisited) > String(last.lastVisited)) {
                last = { courseTitle: p.courseTitle || id, lastVisited: p.lastVisited };
            }
        });

        $("#lastActivityLabel").textContent = last ? `${last.courseTitle} • ${formatDateTime(last.lastVisited)}` : "—";
    }

    function main() {
        const session = requireSession();
        if (!session) return;
        initLogout();
        renderProfile(session);
    }

    document.addEventListener("DOMContentLoaded", main);
})();

