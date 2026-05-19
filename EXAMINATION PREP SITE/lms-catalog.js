(() => {
    const stateKey = () => window.GnpLearning?.getStorageKey?.() || "gnp-learning-state-v2:guest";
    const $ = (selector) => document.querySelector(selector);

    function readState() {
        if (window.GnpLearning?.loadState) return window.GnpLearning.loadState();
        try {
            return JSON.parse(localStorage.getItem(stateKey()) || "{}");
        } catch {
            return {};
        }
    }

    function saveState(state) {
        if (window.GnpLearning?.saveState) {
            window.GnpLearning.saveState(state);
            return;
        }
        localStorage.setItem(stateKey(), JSON.stringify(state));
    }

    function hasSession() {
        return Boolean(window.GnpLearning?.getSession?.()?.userId);
    }

    function ensureState() {
        const state = readState();
        state.selectedCourseId ||= window.GnpLmsData.courses[0].id;
        state.enrolledCourseIds = Array.isArray(state.enrolledCourseIds) ? state.enrolledCourseIds : [];
        state.progress = state.progress && typeof state.progress === "object" ? state.progress : {};
        saveState(state);
        return state;
    }

    function getProgress(courseId, state = ensureState()) {
        const progress = state.progress?.[courseId];
        const course = window.GnpLmsData.getCourse(courseId);
        const total = window.GnpLmsData.flattenLessons(course).length;
        const completed = Array.isArray(progress?.completedLessons) ? progress.completedLessons.length : 0;
        return total ? Math.round((completed / total) * 100) : 0;
    }

    function renderSelected(course, state) {
        $("#selectedTitle").textContent = course.title;
        $("#selectedSummary").textContent = course.summary;
        $("#selectedImage").src = course.image;
        $("#selectedImage").alt = course.title;
        $("#selectedMetrics").innerHTML = [
            ["Terms", course.terms.length],
            ["Lectures", window.GnpLmsData.flattenLessons(course).length],
            ["Questions", Number(course.questions).toLocaleString()]
        ].map(([label, value]) => `<div class="lms-metric"><strong>${value}</strong><span>${label}</span></div>`).join("");

        const enrolled = state.enrolledCourseIds.includes(course.id);
        $("#enrollBtn").textContent = enrolled ? "Continue Learning" : (hasSession() ? "Enroll and Start" : "Register to Enroll");
        $("#workspaceBtn").href = enrolled ? `course-workspace.html?course=${encodeURIComponent(course.id)}` : "#";
        $("#workspaceBtn").style.pointerEvents = enrolled ? "auto" : "none";
        $("#workspaceBtn").style.opacity = enrolled ? "1" : "0.55";
    }

    function courseCard(course, state) {
        const enrolled = state.enrolledCourseIds.includes(course.id);
        const percent = getProgress(course.id, state);
        const lessons = window.GnpLmsData.flattenLessons(course);
        return `
            <article class="lms-card" data-course-card="${course.id}">
                <img src="${course.image}" alt="${course.title}">
                <div class="lms-chip-row">
                    <span class="lms-chip">${course.category}</span>
                    <span class="lms-chip">${course.level}</span>
                    ${enrolled ? `<span class="lms-chip">Enrolled</span>` : ""}
                </div>
                <h3>${course.title}</h3>
                <p class="lms-muted">${course.summary}</p>
                <div class="lms-meta-grid">
                    <div class="lms-meta"><strong>${course.terms.length}</strong><span>Sections</span></div>
                    <div class="lms-meta"><strong>${lessons.length}</strong><span>Lectures</span></div>
                    <div class="lms-meta"><strong>${course.durationHours}h</strong><span>Study</span></div>
                </div>
                <div>
                    <div class="lms-progress"><span style="width:${percent}%"></span></div>
                    <p class="lms-muted" style="margin:0.45rem 0 0;">${percent}% complete</p>
                </div>
                <div class="lms-actions">
                    <button type="button" class="lms-button" data-enroll="${course.id}">${enrolled ? "Continue" : (hasSession() ? "Enroll" : "Register")}</button>
                    <button type="button" class="lms-secondary" data-preview="${course.id}">View Structure</button>
                </div>
            </article>
        `;
    }

    function render() {
        const state = ensureState();
        const query = ($("#courseSearch")?.value || "").trim().toLowerCase();
        const category = $("#categoryFilter")?.value || "All";
        const level = $("#levelFilter")?.value || "All";
        const activeView = document.querySelector(".lms-tab.active")?.dataset.view || "all";

        let courses = window.GnpLmsData.courses.filter((course) => {
            const text = [
                course.title,
                course.category,
                course.level,
                course.summary,
                ...window.GnpLmsData.flattenLessons(course).flatMap((lesson) => [lesson.title, lesson.lectureTitle, ...lesson.concepts])
            ].join(" ").toLowerCase();
            return (!query || text.includes(query))
                && (category === "All" || course.category === category)
                && (level === "All" || course.level === level);
        });

        if (activeView === "enrolled") {
            courses = courses.filter((course) => state.enrolledCourseIds.includes(course.id));
        } else if (activeView === "lectures") {
            courses = courses.filter((course) => window.GnpLmsData.flattenLessons(course).length >= 6);
        } else if (activeView === "exam") {
            courses = courses.filter((course) => /prep|licensing|nclex/i.test(`${course.category} ${course.title}`));
        }

        const selected = window.GnpLmsData.getCourse(state.selectedCourseId);
        renderSelected(selected, state);
        $("#courseGrid").innerHTML = courses.map((course) => courseCard(course, state)).join("")
            || `<article class="lms-card"><h3>No courses found</h3><p class="lms-muted">Try a broader search or filter.</p></article>`;
    }

    function enroll(courseId) {
        if (!hasSession()) {
            const next = encodeURIComponent(`EXAMINATION%20PREP%20SITE/courses.html?enroll=${encodeURIComponent(courseId)}`);
            window.location.href = `../register.html?next=${next}`;
            return;
        }

        const state = ensureState();
        if (!state.enrolledCourseIds.includes(courseId)) state.enrolledCourseIds.push(courseId);
        state.selectedCourseId = courseId;
        state.progress[courseId] ||= {
            currentLesson: 0,
            watchedLessons: [],
            readLessons: [],
            completedLessons: [],
            quizPassed: {},
            notes: {},
            bookmarks: [],
            flashcards: [],
            lastVisited: ""
        };
        saveState(state);
        window.location.href = `course-workspace.html?course=${encodeURIComponent(courseId)}`;
    }

    function initFilters() {
        const categories = ["All", ...new Set(window.GnpLmsData.courses.map((course) => course.category))];
        const levels = ["All", ...new Set(window.GnpLmsData.courses.map((course) => course.level))];
        $("#categoryFilter").innerHTML = categories.map((item) => `<option>${item}</option>`).join("");
        $("#levelFilter").innerHTML = levels.map((item) => `<option>${item}</option>`).join("");
    }

    document.addEventListener("DOMContentLoaded", () => {
        initFilters();
        const state = ensureState();
        const params = new URLSearchParams(window.location.search);
        const requestedEnroll = params.get("enroll");
        if (requestedEnroll) {
            enroll(requestedEnroll);
            return;
        }
        $("#authLink").textContent = hasSession() ? "Profile" : "Login";
        $("#authLink").href = hasSession() ? "../Profile.html" : "../login.html";
        render();
        document.addEventListener("input", (event) => {
            if (event.target.matches("#courseSearch, #categoryFilter, #levelFilter")) render();
        });
        document.addEventListener("click", (event) => {
            const tab = event.target.closest(".lms-tab");
            if (tab) {
                document.querySelectorAll(".lms-tab").forEach((item) => item.classList.toggle("active", item === tab));
                render();
                return;
            }
            const preview = event.target.closest("[data-preview]");
            if (preview) {
                state.selectedCourseId = preview.dataset.preview;
                saveState(state);
                render();
                document.getElementById("selectedCourse")?.scrollIntoView({ behavior: "smooth" });
                return;
            }
            const enrollButton = event.target.closest("[data-enroll], #enrollBtn");
            if (enrollButton) {
                enroll(enrollButton.dataset.enroll || ensureState().selectedCourseId);
            }
        });
    });
})();
