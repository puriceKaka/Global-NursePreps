(() => {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    function uid(prefix = "id") {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return `${prefix}_${window.crypto.randomUUID()}`;
        }
        return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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

    function openDrawer() {
        $("#drawer")?.classList.remove("hidden");
        $("#drawerOverlay")?.classList.remove("hidden");
        $("#drawerOverlay")?.setAttribute("aria-hidden", "false");
        document.body.classList.add("drawer-open");
    }

    function closeDrawer() {
        $("#drawer")?.classList.add("hidden");
        $("#drawerOverlay")?.classList.add("hidden");
        $("#drawerOverlay")?.setAttribute("aria-hidden", "true");
        document.body.classList.remove("drawer-open");
    }

    function scrollToTarget(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    function initDrawerNav() {
        $("#menuToggle")?.addEventListener("click", openDrawer);
        $("#drawerClose")?.addEventListener("click", closeDrawer);
        $("#drawerOverlay")?.addEventListener("click", closeDrawer);

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeDrawer();
        });

        $$(".drawer-link").forEach((item) => {
            item.addEventListener("click", (event) => {
                const target = item.dataset.target;
                if (target) {
                    const el = document.getElementById(target);
                    if (el) {
                        event.preventDefault();
                        scrollToTarget(target);
                    }
                }
                closeDrawer();
            });
        });
    }

    function initLogout() {
        $("#logoutBtn")?.addEventListener("click", () => {
            localStorage.removeItem("nurseprep_session");
            window.location.replace("login.html");
        });
    }

    function renderUserSummary(session) {
        const name = String(session.name || "Member").trim() || "Member";
        const email = String(session.email || "—").trim() || "—";

        const avatar = $("#drawerAvatar");
        if (avatar && !avatar.querySelector("img")) {
            avatar.textContent = name.slice(0, 1).toUpperCase() || "N";
        }

        const drawerName = $("#drawerName");
        if (drawerName) drawerName.textContent = name;

        const drawerEmail = $("#drawerEmail");
        if (drawerEmail) drawerEmail.textContent = email;
    }

    function renderLearnings() {
        const grid = $("#learningsGrid");
        if (!grid) return;

        const core = window.GnpLearning;
        if (!core) {
            grid.innerHTML = `<div class="info-card"><strong>Learning data missing</strong><p class="muted" style="margin: 8px 0 0;">Missing \`learning-core.js\`.</p></div>`;
            return;
        }

        const state = core.loadState();
        const enrolledIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];
        const enrolledCourses = enrolledIds
            .map((id) => core.getCourseMeta(id) || { id, title: state.progress?.[id]?.courseTitle || id, category: "Course", difficulty: "—" })
            .filter(Boolean);

        let completedCount = 0;
        let certCount = 0;

        grid.innerHTML = "";

        if (enrolledCourses.length === 0) {
            grid.innerHTML = `
                <div class="info-card">
                    <strong>No enrolled courses yet</strong>
                    <p class="muted" style="margin: 8px 0 0;">
                        Open the Courses catalog, enroll in a course, then come back here to continue learning and track progress.
                    </p>
                    <div style="margin-top: 12px;">
                        <a class="primary-button" href="EXAMINATION%20PREP%20SITE/courses.html">Open Courses</a>
                    </div>
                </div>
            `;
        }

        enrolledCourses.forEach((course) => {
            const progress = core.ensureCourseProgress(state, course.id, course);
            const percent = core.getProgressPercent(course.id, state);
            const totalModules = progress.totalModules || course.moduleCount || 0;
            const doneModules = Array.isArray(progress.completedModules) ? progress.completedModules.length : 0;
            const isComplete = percent === 100 && totalModules > 0;

            if (isComplete) completedCount += 1;

            if (isComplete && !progress.certificate?.id) {
                progress.certificate = { id: uid("cert"), issuedAt: new Date().toISOString() };
                progress.lastVisited = progress.lastVisited || new Date().toISOString();
                core.saveState(state);
            }

            if (progress.certificate?.id) certCount += 1;

            const card = document.createElement("div");
            card.className = "learning-card";

            const header = document.createElement("div");
            header.innerHTML = `
                <div class="badge-row" style="margin-bottom: 8px;">
                    <span class="badge">${course.category || "Course"}</span>
                    <span class="badge alt">${course.difficulty || "—"}</span>
                    <span class="badge alt">${totalModules ? `${doneModules}/${totalModules} modules` : "0 modules"}</span>
                </div>
            `;

            const title = document.createElement("h4");
            title.textContent = course.title || "Course";

            const desc = document.createElement("p");
            desc.className = "muted";
            desc.style.margin = "0";
            desc.textContent = course.summary || "Continue your learning modules and unlock a certificate at 100%.";

            const progressWrap = document.createElement("div");
            progressWrap.className = "progress-wrap";
            progressWrap.innerHTML = `
                <div class="progress-meta">
                    <span>Progress</span>
                    <span class="muted">${totalModules ? `${doneModules}/${totalModules}` : "0/0"} • ${percent}%</span>
                </div>
                <div class="progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar" style="width: ${percent}%;"></div>
                </div>
            `;

            const activity = document.createElement("div");
            activity.className = "muted small";
            activity.style.marginTop = "10px";
            activity.textContent = progress.lastVisited ? `Last activity: ${formatDateTime(progress.lastVisited)}` : "Not started yet. Open the workspace to begin.";

            const actions = document.createElement("div");
            actions.className = "card-actions";

            const continueLink = document.createElement("a");
            continueLink.className = "primary-button";
            continueLink.href = `EXAMINATION%20PREP%20SITE/exam-lobby/anatomy.html?course=${encodeURIComponent(course.id)}`;
            continueLink.textContent = percent > 0 ? "Continue" : "Start learning";

            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "secondary-button";
            cancelBtn.textContent = "Cancel course";
            cancelBtn.addEventListener("click", () => {
                const ok = window.confirm(`Cancel enrollment in \"${course.title}\"?`);
                if (!ok) return;
                core.cancelEnrollment(course.id);
                renderLearnings();
            });

            const certBtn = document.createElement("a");
            certBtn.className = isComplete ? "pill-button" : "secondary-button";
            certBtn.textContent = isComplete ? "View certificate" : "Certificate locked";
            if (isComplete && progress.certificate?.id) {
                const query = new URLSearchParams({
                    source: "exam",
                    courseId: course.id,
                    title: course.title,
                    certId: progress.certificate.id
                });
                certBtn.href = `certificate.html?${query.toString()}`;
            } else {
                certBtn.href = "#";
                certBtn.setAttribute("aria-disabled", "true");
                certBtn.addEventListener("click", (event) => event.preventDefault());
            }

            actions.appendChild(continueLink);
            actions.appendChild(certBtn);
            actions.appendChild(cancelBtn);

            card.appendChild(header);
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(progressWrap);
            card.appendChild(activity);
            card.appendChild(actions);

            grid.appendChild(card);
        });

        const enrolledLabel = $("#enrolledCount");
        if (enrolledLabel) enrolledLabel.textContent = String(enrolledCourses.length);

        const completedLabel = $("#completedCount");
        if (completedLabel) completedLabel.textContent = String(completedCount);

        const certLabel = $("#certCount");
        if (certLabel) certLabel.textContent = String(certCount);
    }

    function initYear() {
        const yearLabel = $("#yearLabel");
        if (yearLabel) yearLabel.textContent = String(new Date().getFullYear());
    }

    function main() {
        const session = requireSession();
        if (!session) return;

        renderUserSummary(session);
        initDrawerNav();
        initLogout();
        initYear();
        renderLearnings();
    }

    document.addEventListener("DOMContentLoaded", main);
})();
