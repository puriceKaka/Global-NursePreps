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

    function getMap(key) {
        const data = safeJsonParse(localStorage.getItem(key), {});
        return data && typeof data === "object" ? data : {};
    }

    function setMap(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getUserGoals(userId) {
        const map = getMap("nurseprep_goals_by_user");
        return Array.isArray(map[userId]) ? map[userId] : [];
    }

    function setUserGoals(userId, goals) {
        const map = getMap("nurseprep_goals_by_user");
        map[userId] = goals;
        setMap("nurseprep_goals_by_user", map);
    }

    function getQuestionsForUser(userId) {
        const list = safeJsonParse(localStorage.getItem("nurseprep_questions"), []);
        return Array.isArray(list) ? list.filter((q) => q.authorId === userId) : [];
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
        const core = window.GnpLearning;
        const state = core?.loadState ? core.loadState() : { enrolledCourseIds: [], progress: {} };
        const enrolledIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];
        const goals = getUserGoals(session.userId);

        $("#profileName").textContent = "Purice mweo";
        $("#profileEmail").textContent = "puricekaka@gmail.com";
        $("#membershipLabel").textContent = "Professional Membership";
        $("#membershipHint").textContent = "Membership active.";
        $("#coursesLabel").textContent = String(enrolledIds.length);
        $("#goalsLabel").textContent = String(goals.length);
        $("#questionsLabel").textContent = String(getQuestionsForUser(session.userId).length);

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

    function renderGoals(userId) {
        const wrap = $("#profileGoalsList");
        if (!wrap) return;
        const goals = getUserGoals(userId);
        wrap.innerHTML = "";

        if (goals.length === 0) {
            const empty = document.createElement("div");
            empty.className = "muted small";
            empty.textContent = "No goals yet. Add reminders for study blocks, exams, or clinical skills.";
            wrap.appendChild(empty);
            return;
        }

        goals.forEach((goal) => {
            const item = document.createElement("div");
            item.className = "profile-goal-item";

            const text = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = goal.title || "Goal";
            const meta = document.createElement("div");
            meta.className = "muted small";
            meta.textContent = goal.targetDate ? `Target: ${goal.targetDate}` : "No date set";
            text.append(title, meta);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "danger-button";
            remove.textContent = "Remove";
            remove.addEventListener("click", () => {
                setUserGoals(userId, getUserGoals(userId).filter((itemGoal) => itemGoal.id !== goal.id));
                renderGoals(userId);
                renderProfile({ userId });
            });

            item.append(text, remove);
            wrap.appendChild(item);
        });
    }

    function initGoals(userId) {
        $("#profileGoalForm")?.addEventListener("submit", (event) => {
            event.preventDefault();
            const input = $("#profileGoalInput");
            if (!input) return;
            const title = input.value.trim();
            if (!title) return;
            const date = ($("#profileGoalDate")?.value || "").trim();
            const next = [
                { id: `goal_${Date.now().toString(36)}`, title, targetDate: date || null, done: false, createdAt: new Date().toISOString() },
                ...getUserGoals(userId)
            ];
            setUserGoals(userId, next);
            input.value = "";
            const dateEl = $("#profileGoalDate");
            if (dateEl) dateEl.value = "";
            renderGoals(userId);
            renderProfile({ userId });
        });
        renderGoals(userId);
    }

    function main() {
        const session = requireSession();
        if (!session) return;
        initLogout();
        renderProfile(session);
        initGoals(session.userId);
    }

    document.addEventListener("DOMContentLoaded", main);
})();
