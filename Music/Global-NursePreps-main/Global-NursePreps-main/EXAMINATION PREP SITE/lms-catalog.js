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

    function getCourseUnit(course) {
        const explicitUnit = String(course?.unit || "").trim();
        if (explicitUnit) return explicitUnit;

        const text = String([
            course?.title,
            course?.category,
            course?.summary,
            ...(Array.isArray(course?.keywords) ? course.keywords : [])
        ].filter(Boolean).join(" ")).toLowerCase();
        if (/nclex/.test(text)) return "NCLEX";
        if (/nck|licensing/.test(text)) return "Licensing";
        if (/anatomy|physiology/.test(text)) return "Anatomy";
        if (/med[- ]?surg|medical[- ]?surgical|surgical/.test(text)) return "Med-Surg";
        if (/pediatric/.test(text)) return "Pediatrics";
        if (/pharmacology|medication|drug/.test(text)) return "Pharmacology";
        if (/mental/.test(text)) return "Mental Health";
        if (/community/.test(text)) return "Community Health";
        if (/leadership|research/.test(text)) return "Professional Growth";
        if (/bsn|bscn/.test(text)) return "BSN";
        if (/professional lecture|lecture series/.test(text)) return "Professional Growth";
        if (/clinical practice/.test(text)) return "Clinical Practice";
        return "General Nursing";
    }

    function getCourseSubunit(course) {
        return String(course?.subunit || course?.yearLabel || course?.badge || course?.category || "General Nursing").trim();
    }

    function getCourseTrackLabel(course) {
        const unit = getCourseUnit(course);
        const subunit = getCourseSubunit(course);
        if (course?.yearLabel && unit === "Anatomy") {
            return `${unit} - ${course.yearLabel}`;
        }
        if (course?.yearLabel && unit === "BSN") {
            return `${unit} - ${course.yearLabel}`;
        }
        return `${unit}${subunit && subunit !== unit ? ` • ${subunit}` : ""}`;
    }

    function getUnitSortRank(label) {
        const value = String(label || "").toLowerCase();
        const order = [
            "bsn",
            "licensing",
            "nclex",
            "anatomy",
            "med-surg",
            "pharmacology",
            "pediatrics",
            "mental health",
            "community health",
            "professional growth",
            "clinical practice",
            "general nursing"
        ];
        const index = order.findIndex((item) => value.startsWith(item));
        return index === -1 ? order.length + value.localeCompare("") : index;
    }

    function getCatalogReturnPath() {
        return `${window.location.pathname.replace(/^\//, "")}${window.location.search}${window.location.hash}`;
    }

    function buildAuthHref(page) {
        return `../${page}.html?next=${encodeURIComponent(getCatalogReturnPath())}`;
    }

    function applySessionState(loggedIn) {
        document.body.classList.toggle("has-session", loggedIn);
        document.body.classList.toggle("guest-view", !loggedIn);

        const menuToggle = $("#menuToggle");
        if (menuToggle) {
            menuToggle.hidden = !loggedIn;
        }

        const drawer = $("#drawer");
        if (drawer) {
            drawer.hidden = !loggedIn;
        }

        const overlay = $("#drawerOverlay");
        if (overlay) {
            overlay.hidden = !loggedIn;
        }

        const authLink = $("#authLink");
        if (authLink) {
            authLink.textContent = loggedIn ? "Logout" : "Login";
            authLink.href = loggedIn ? "../login.html" : buildAuthHref("login");
        }

        const registerLink = $("#registerLink");
        if (registerLink) {
            registerLink.hidden = loggedIn;
            registerLink.href = buildAuthHref("register");
        }

        const guestBanner = $("#guestAccessBanner");
        if (guestBanner) {
            guestBanner.classList.toggle("hidden", loggedIn);
        }

        const enrolledTab = document.querySelector('.lms-tab[data-view="enrolled"]');
        if (enrolledTab) {
            enrolledTab.hidden = !loggedIn;
        }

        const heroActions = document.querySelector("#selected-program .lms-actions");
        if (heroActions) {
            heroActions.classList.toggle("hidden", !loggedIn);
        }
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
        const loggedIn = hasSession();
        $("#selectedTitle").textContent = course.title;
        $("#selectedSummary").textContent = course.summary;
        $("#selectedImage").src = course.image;
        $("#selectedImage").onerror = () => {
            $("#selectedImage").onerror = null;
            $("#selectedImage").src = "../assets/course-images/default.jpg";
        };
        $("#selectedImage").alt = course.title;
        $("#selectedMetrics").innerHTML = [
            ["Unit", getCourseUnit(course)],
            ["Year", course.yearLabel || "Mixed"],
            ["Focus", getCourseSubunit(course)],
            ["Lectures", window.GnpLmsData.flattenLessons(course).length]
        ].map(([label, value]) => `<div class="lms-metric"><strong>${value}</strong><span>${label}</span></div>`).join("");

        const enrolled = state.enrolledCourseIds.includes(course.id);
        const enrollBtn = $("#enrollBtn");
        const workspaceBtn = $("#workspaceBtn");
        if (enrollBtn) {
            enrollBtn.textContent = enrolled ? "Continue Learning" : (loggedIn ? "Enroll and Start" : "Create account to enroll");
            enrollBtn.disabled = false;
        }
        if (workspaceBtn) {
            if (loggedIn) {
                workspaceBtn.hidden = false;
                workspaceBtn.href = enrolled
                    ? `course-workspace.html?course=${encodeURIComponent(course.id)}`
                    : `courses.html?enroll=${encodeURIComponent(course.id)}`;
                workspaceBtn.style.pointerEvents = "auto";
                workspaceBtn.style.opacity = "1";
            } else {
                workspaceBtn.hidden = true;
                workspaceBtn.href = buildAuthHref("register");
            }
        }
        const guestBanner = $("#guestAccessBanner");
        if (guestBanner) {
            guestBanner.classList.toggle("hidden", loggedIn);
        }
    }

    function courseCard(course, state) {
        const enrolled = state.enrolledCourseIds.includes(course.id);
        const loggedIn = hasSession();
        const percent = getProgress(course.id, state);
        const lessons = window.GnpLmsData.flattenLessons(course);
        const moduleCount = Math.max(course.terms?.length || 0, 1);
        const progressLabel = loggedIn ? `${percent}% complete` : `0/${moduleCount} modules`;
        const accessLabel = enrolled ? "Enrolled" : "Free";
        if (!loggedIn) {
            return `
            <article class="lms-card" data-course-card="${course.id}">
                <img class="course-card-image" src="${course.image}" alt="${course.title}" onerror="this.onerror=null;this.src='../assets/course-images/default.jpg';">
                <div class="lms-chip-row">
                    <span class="lms-chip">${getCourseTrackLabel(course)}</span>
                    <span class="lms-chip">${course.level}</span>
                    <span class="lms-chip">${lessons.length} lessons</span>
                    <span class="lms-chip">${accessLabel}</span>
                </div>
                <h3>${course.title}</h3>
                <p class="lms-muted">${course.summary}</p>
                <div class="course-card-footer">
                    <p class="course-card-progress">${progressLabel}</p>
                    <div class="lms-progress"><span style="width:${percent}%"></span></div>
                    <p class="lms-muted course-card-note">Login or create an account to enroll and save progress.</p>
                    <div class="lms-actions course-card-actions">
                        <button type="button" class="lms-button" data-enroll="${course.id}">Create account to enroll</button>
                        <button type="button" class="lms-secondary" data-preview="${course.id}">View Structure</button>
                    </div>
                </div>
            </article>
        `;
        }
        return `
            <article class="lms-card" data-course-card="${course.id}">
                <img class="course-card-image" src="${course.image}" alt="${course.title}" onerror="this.onerror=null;this.src='../assets/course-images/default.jpg';">
                <div class="lms-chip-row">
                    <span class="lms-chip">${getCourseTrackLabel(course)}</span>
                    <span class="lms-chip">${course.level}</span>
                    <span class="lms-chip">${lessons.length} lessons</span>
                    <span class="lms-chip">${accessLabel}</span>
                    ${enrolled ? `<span class="lms-chip">Enrolled</span>` : ""}
                </div>
                <h3>${course.title}</h3>
                <p class="lms-muted">${course.summary}</p>
                <div class="course-card-footer">
                    <p class="course-card-progress">${progressLabel}</p>
                    <div class="lms-progress"><span style="width:${percent}%"></span></div>
                    <p class="lms-muted course-card-note">${course.durationHours}h study plan and ${lessons.length} guided lessons.</p>
                    <div class="lms-actions course-card-actions">
                        <button type="button" class="lms-button" data-enroll="${course.id}">${enrolled ? "Continue" : (hasSession() ? "Enroll" : "Register")}</button>
                        <button type="button" class="lms-secondary" data-preview="${course.id}">View Structure</button>
                    </div>
                </div>
            </article>
        `;
    }

    function render() {
        const state = ensureState();
        const query = ($("#courseSearch")?.value || "").trim().toLowerCase();
        const category = $("#categoryFilter")?.value || "All";
        const level = $("#levelFilter")?.value || "All";
        let activeView = document.querySelector(".lms-tab.active")?.dataset.view || "all";
        if (!hasSession() && activeView === "enrolled") {
            activeView = "all";
        }

        let courses = window.GnpLmsData.courses.filter((course) => {
            const text = [
                course.title,
                course.category,
                getCourseUnit(course),
                getCourseSubunit(course),
                course.yearLabel,
                course.level,
                course.summary,
                ...window.GnpLmsData.flattenLessons(course).flatMap((lesson) => [lesson.title, lesson.lectureTitle, ...lesson.concepts])
            ].join(" ").toLowerCase();
            return (!query || text.includes(query))
                && (category === "All" || getCourseUnit(course) === category)
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
        if (courses.length === 0) {
            $("#courseGrid").innerHTML = `<article class="lms-card"><h3>No courses found</h3><p class="lms-muted">Try a broader search, switch unit, or clear the level filter.</p></article>`;
            return;
        }

        const groups = new Map();
        courses.forEach((course) => {
            const key = category === "All"
                ? getCourseUnit(course)
                : (course.yearLabel || getCourseSubunit(course) || getCourseUnit(course));
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(course);
        });

        const groupedCourses = Array.from(groups.entries())
            .map(([label, items]) => ({
                label,
                items: items.slice().sort((left, right) => left.title.localeCompare(right.title))
            }))
            .sort((left, right) => getUnitSortRank(left.label) - getUnitSortRank(right.label));

        $("#courseGrid").innerHTML = groupedCourses.map(({ label, items }) => `
            <section class="course-group">
                <header class="course-group-head">
                    <div>
                        <p class="lms-kicker">${category === "All" ? "Unit" : "Year / Focus"}</p>
                        <h3>${label}</h3>
                    </div>
                    <span class="lms-chip">${items.length} courses</span>
                </header>
                <div class="lms-grid">
                    ${items.map((course) => courseCard(course, state)).join("")}
                </div>
            </section>
        `).join("");
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
        refreshFilters();
    }

    function refreshFilters() {
        const categories = ["All", ...new Set(window.GnpLmsData.courses.map((course) => getCourseUnit(course)))];
        const levels = ["All", ...new Set(window.GnpLmsData.courses.map((course) => course.level))];
        const categorySelect = $("#categoryFilter");
        const levelSelect = $("#levelFilter");

        if (categorySelect) {
            const current = categorySelect.value || "All";
            categorySelect.innerHTML = categories.map((item) => `<option>${item}</option>`).join("");
            categorySelect.value = categories.includes(current) ? current : "All";
        }

        if (levelSelect) {
            const current = levelSelect.value || "All";
            levelSelect.innerHTML = levels.map((item) => `<option>${item}</option>`).join("");
            levelSelect.value = levels.includes(current) ? current : "All";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initFilters();
        const loggedIn = hasSession();
        applySessionState(loggedIn);
        const state = ensureState();
        const params = new URLSearchParams(window.location.search);
        const requestedEnroll = params.get("enroll");
        if (requestedEnroll && loggedIn) {
            enroll(requestedEnroll);
            return;
        }
        const authLink = $("#authLink");
        if (authLink && loggedIn) {
            authLink.textContent = "Logout";
            authLink.href = "../login.html";
            authLink.addEventListener("click", () => {
                void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            });
        }
        const enrolledTab = document.querySelector('.lms-tab[data-view="enrolled"]');
        if (enrolledTab && !loggedIn) {
            enrolledTab.hidden = true;
        }
        render();
        if (window.GnpLearning?.refreshCourses) {
            void window.GnpLearning.refreshCourses().then(() => {
                refreshFilters();
                render();
            });
        }
        window.addEventListener("gnp-courses-updated", () => {
            refreshFilters();
            render();
        });
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
                document.getElementById("selected-program")?.scrollIntoView({ behavior: "smooth" });
                return;
            }
            const enrollButton = event.target.closest("[data-enroll], #enrollBtn");
            if (enrollButton) {
                enroll(enrollButton.dataset.enroll || ensureState().selectedCourseId);
            }
        });
    });
})();
