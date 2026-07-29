(() => {
    if (window.location.hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    const stateKey = () => window.GnpLearning?.getStorageKey?.() || "gnp-learning-state-v2:guest";
    const $ = (selector) => document.querySelector(selector);
    const catalogParams = new URLSearchParams(window.location.search);
    const requestedTrack = String(catalogParams.get("track") || "all").toLowerCase();
    const requestedUnit = String(catalogParams.get("unit") || "").trim();
    const requestedSearch = String(catalogParams.get("search") || "").trim();
    const requestedCourseId = String(catalogParams.get("course") || "").trim();

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

    function isCertifiedCourse(course) {
        const unit = getCourseUnit(course);
        const text = `${course?.id || ""} ${course?.title || ""} ${course?.category || ""} ${unit}`.toLowerCase();
        return /licensing|nclex|nck|cna|certif|critical care|emergency|icu|cbt|australia/.test(text);
    }

    function matchesRequestedTrack(course) {
        if (requestedTrack === "certified") return isCertifiedCourse(course);
        if (requestedTrack === "bscn") return !isCertifiedCourse(course);
        return true;
    }

    const COURSE_FILTERS = [
        { value: "all", label: "All Courses" },
        { value: "track:bscn", label: "BSCN Courses" },
        { value: "track:certified", label: "Certified Courses" },
        { value: "subject:anatomy", label: "Anatomy" },
        { value: "subject:physiology", label: "Physiology" },
        { value: "subject:pharmacology", label: "Pharmacology" },
        { value: "subject:med-surg", label: "Medical-Surgical Nursing" },
        { value: "subject:pediatrics", label: "Pediatric Nursing" },
        { value: "subject:mental-health", label: "Mental Health Nursing" },
        { value: "subject:midwifery", label: "Midwifery" },
        { value: "subject:community-health", label: "Community Health Nursing" },
        { value: "subject:research", label: "Nursing Research" },
        { value: "subject:cna", label: "CNA Preparation" },
        { value: "subject:nclex", label: "NCLEX-RN Preparation" },
        { value: "subject:uk-cbt", label: "UK CBT Preparation" },
        { value: "subject:australia", label: "Australia Nursing Licensing" },
        { value: "subject:icu", label: "ICU & Critical Care Nursing" },
        { value: "subject:emergency", label: "Emergency Nursing" },
        { value: "subject:licensing", label: "All Licensing & Certifications" }
    ];

    const SUBJECT_PATTERNS = {
        anatomy: /anatomy|skeletal|muscular|cardiovascular|respiratory|digestive|endocrine|nervous|cells|tissues/,
        physiology: /physiology/,
        pharmacology: /pharmacology|medication|drug|dosage/,
        "med-surg": /med[- ]?surg|medical[- ]?surgical|adult health/,
        pediatrics: /pediatric|child health/,
        "mental-health": /mental health|psychiatric/,
        midwifery: /midwifery|maternal|maternity|newborn|obstetric/,
        "community-health": /community health|public health/,
        research: /nursing research|research|evidence/,
        cna: /\bcna\b|certified nursing assistant/,
        nclex: /nclex/,
        "uk-cbt": /uk cbt|\bcbt\b/,
        australia: /australia/,
        icu: /\bicu\b|critical care|intensive care/,
        emergency: /emergency|triage/,
        licensing: /licensing|nclex|\bnck\b|\bcna\b|certif|\bcbt\b|australia|critical care|emergency|\bicu\b/
    };

    function getCourseSearchText(course) {
        return [
            course?.id,
            course?.title,
            course?.category,
            getCourseUnit(course),
            getCourseSubunit(course),
            course?.yearLabel,
            course?.summary,
            ...(Array.isArray(course?.keywords) ? course.keywords : []),
            ...window.GnpLmsData.flattenLessons(course).flatMap((lesson) => [
                lesson.title,
                lesson.lectureTitle,
                ...(Array.isArray(lesson.concepts) ? lesson.concepts : [])
            ])
        ].filter(Boolean).join(" ").toLowerCase();
    }

    function matchesCourseFilter(course, filterValue) {
        if (!filterValue || filterValue === "all") return true;
        if (filterValue === "track:bscn") return !isCertifiedCourse(course);
        if (filterValue === "track:certified") return isCertifiedCourse(course);
        if (filterValue.startsWith("subject:")) {
            const subject = filterValue.slice("subject:".length);
            return Boolean(SUBJECT_PATTERNS[subject]?.test(getCourseSearchText(course)));
        }
        return true;
    }

    function requestedCourseFilter() {
        if (requestedUnit) {
            const normalized = requestedUnit.toLowerCase();
            const subjectMatch = COURSE_FILTERS.find((item) =>
                item.value.startsWith("subject:") &&
                (item.label.toLowerCase() === normalized || item.value.slice(8) === normalized)
            );
            if (subjectMatch) return subjectMatch.value;
        }
        if (requestedTrack === "bscn" || requestedTrack === "certified") {
            return `track:${requestedTrack}`;
        }
        return "all";
    }

    const COURSE_THEMES = [
        {
            match: /(nck|licensing)/i,
            accent: "#0F4C81",
            accentStrong: "#0A2342",
            accentSoft: "#E7F1FB",
            wash: "#F6FAFF",
            ink: "#FFFFFF"
        },
        {
            match: /nclex/i,
            accent: "#5B72D6",
            accentStrong: "#293241",
            accentSoft: "#EBEEFF",
            wash: "#FBFCFF",
            ink: "#FFFFFF"
        },
        {
            match: /lecture|professional/i,
            accent: "#14679C",
            accentStrong: "#0B3A62",
            accentSoft: "#EAF4FD",
            wash: "#F8FBFF",
            ink: "#FFFFFF"
        },
        {
            match: /pharmacology|drug|medication/i,
            accent: "#1FA67A",
            accentStrong: "#5B4B8A",
            accentSoft: "#EAF8F2",
            wash: "#F7FCFA",
            ink: "#FFFFFF"
        },
        {
            match: /pediatric/i,
            accent: "#D85B89",
            accentStrong: "#9B315B",
            accentSoft: "#FCE8F0",
            wash: "#FFF8FB",
            ink: "#FFFFFF"
        },
        {
            match: /med[- ]?surg|clinical practice|critical care|emergency/i,
            accent: "#20825F",
            accentStrong: "#2F4858",
            accentSoft: "#E6F6EE",
            wash: "#F8FCF9",
            ink: "#FFFFFF"
        }
    ];

    const DEFAULT_COURSE_THEME = {
        accent: "#14679C",
        accentStrong: "#0A2342",
        accentSoft: "#E7F1FB",
        wash: "#F7FBFF",
        ink: "#FFFFFF"
    };

    function getCourseTheme(course, index = 0) {
        const text = `${course?.id || ""} ${course?.title || ""} ${course?.category || ""} ${course?.summary || ""}`.toLowerCase();
        const matched = COURSE_THEMES.find((theme) => theme.match.test(text));
        return matched || COURSE_THEMES[index % COURSE_THEMES.length] || DEFAULT_COURSE_THEME;
    }

    function courseThemeStyle(course, index = 0) {
        const theme = getCourseTheme(course, index);
        return `--course-accent:${theme.accent}; --course-accent-strong:${theme.accentStrong}; --course-accent-soft:${theme.accentSoft}; --course-wash:${theme.wash}; --course-ink:${theme.ink};`;
    }

    function applyCourseTheme(element, course, index = 0) {
        if (!element) return;
        const theme = getCourseTheme(course, index);
        element.style.setProperty("--course-accent", theme.accent);
        element.style.setProperty("--course-accent-strong", theme.accentStrong);
        element.style.setProperty("--course-accent-soft", theme.accentSoft);
        element.style.setProperty("--course-wash", theme.wash);
        element.style.setProperty("--course-ink", theme.ink);
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
        applyCourseTheme($("#selected-program"), course);
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

        const courseSelect = $("#categoryFilter");
        const selectedPlaceholder = courseSelect?.querySelector('option[value=""]');
        if (courseSelect && selectedPlaceholder) {
            selectedPlaceholder.textContent = course.title;
            courseSelect.value = "";
            courseSelect.setAttribute("aria-label", `Selected course: ${course.title}. Choose another course.`);
        }
    }

    function scrollCourseToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function courseCard(course, state, index = 0) {
        const enrolled = state.enrolledCourseIds.includes(course.id);
        const loggedIn = hasSession();
        const percent = getProgress(course.id, state);
        const lessons = window.GnpLmsData.flattenLessons(course);
        const moduleCount = Math.max(course.terms?.length || 0, 1);
        const progressLabel = loggedIn ? `${percent}% complete` : `0/${moduleCount} modules`;
        const accessLabel = enrolled ? "Enrolled" : "Free";
        const themeStyle = courseThemeStyle(course, index);
        if (!loggedIn) {
            return `
            <article class="lms-card" data-course-card="${course.id}" style="${themeStyle}">
                <p class="course-family-label">${getCourseUnit(course)}</p>
                <img class="course-card-image" src="${course.image}" alt="${course.title}" onerror="this.onerror=null;this.src='../assets/course-images/default.jpg';">
                <h3>${course.title}</h3>
                <div class="lms-chip-row">
                    <span class="lms-chip">${course.level}</span>
                    <span class="lms-chip">${lessons.length} lessons</span>
                    <span class="lms-chip">${accessLabel}</span>
                </div>
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
            <article class="lms-card" data-course-card="${course.id}" style="${themeStyle}">
                <p class="course-family-label">${getCourseUnit(course)}</p>
                <img class="course-card-image" src="${course.image}" alt="${course.title}" onerror="this.onerror=null;this.src='../assets/course-images/default.jpg';">
                <h3>${course.title}</h3>
                <div class="lms-chip-row">
                    <span class="lms-chip">${course.level}</span>
                    <span class="lms-chip">${lessons.length} lessons</span>
                    <span class="lms-chip">${accessLabel}</span>
                </div>
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
        const courseFilter = $("#categoryFilter")?.dataset.activeFilter || "all";
        const level = $("#levelFilter")?.value || "All";
        let activeView = document.querySelector(".lms-tab.active")?.dataset.view || "all";
        if (!hasSession() && activeView === "enrolled") {
            activeView = "all";
        }

        let courses = window.GnpLmsData.courses.filter((course) => {
            const text = getCourseSearchText(course);
            return (!query || text.includes(query))
                && matchesCourseFilter(course, courseFilter)
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

        courses.sort((left, right) => {
            const unitDifference = getUnitSortRank(getCourseUnit(left)) - getUnitSortRank(getCourseUnit(right));
            return unitDifference || left.title.localeCompare(right.title);
        });

        $("#courseGrid").innerHTML = courses
            .map((course, index) => courseCard(course, state, index))
            .join("");
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
        const levels = ["All", ...new Set(window.GnpLmsData.courses.map((course) => course.level))];
        const categorySelect = $("#categoryFilter");
        const levelSelect = $("#levelFilter");

        if (categorySelect) {
            const current = categorySelect.dataset.activeFilter || requestedCourseFilter();
            categorySelect.dataset.activeFilter = COURSE_FILTERS.some((item) => item.value === current) ? current : "all";
            categorySelect.innerHTML = [
                '<option value="" disabled selected>Selected course</option>',
                ...COURSE_FILTERS.map((item) =>
                `<option value="${item.value}">${item.label}</option>`
                )
            ].join("");
            categorySelect.value = "";
        }

        if (levelSelect) {
            const current = levelSelect.value || "All";
            levelSelect.innerHTML = levels.map((item) =>
                `<option value="${item}">${item === "All" ? "All Levels" : item}</option>`
            ).join("");
            levelSelect.value = levels.includes(current) ? current : "All";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initFilters();
        const searchInput = $("#courseSearch");
        if (searchInput && requestedSearch) {
            searchInput.value = requestedSearch;
        }
        const categorySelect = $("#categoryFilter");
        if (categorySelect) {
            categorySelect.dataset.activeFilter = requestedCourseFilter();
            categorySelect.value = "";
        }
        document.querySelectorAll("[data-catalog-track]").forEach((link) => {
            link.classList.toggle("active", link.dataset.catalogTrack === requestedTrack);
        });
        const loggedIn = hasSession();
        applySessionState(loggedIn);
        const state = ensureState();
        if (requestedCourseId && window.GnpLmsData.courses.some((course) => course.id === requestedCourseId)) {
            state.selectedCourseId = requestedCourseId;
            saveState(state);
        } else if (requestedUnit || requestedTrack !== "all") {
            const initialFilter = requestedCourseFilter();
            const firstCourseInSelection = window.GnpLmsData.courses.find((course) => {
                return matchesCourseFilter(course, initialFilter);
            });
            if (firstCourseInSelection) {
                state.selectedCourseId = firstCourseInSelection.id;
                saveState(state);
            }
        }
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
                window.GnpUtils?.clearSession?.();
                void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            });
        }
        const enrolledTab = document.querySelector('.lms-tab[data-view="enrolled"]');
        if (enrolledTab && !loggedIn) {
            enrolledTab.hidden = true;
        }
        render();
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
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
            if (event.target.matches("#courseSearch")) render();
        });
        document.addEventListener("change", (event) => {
            if (event.target.matches("#levelFilter")) render();
            if (event.target.matches("#categoryFilter")) {
                const chosenFilter = event.target.value;
                if (!chosenFilter) return;
                event.target.dataset.activeFilter = chosenFilter;
                const firstMatch = window.GnpLmsData.courses.find((course) =>
                    matchesCourseFilter(course, chosenFilter)
                );
                if (firstMatch) {
                    const nextState = ensureState();
                    nextState.selectedCourseId = firstMatch.id;
                    saveState(nextState);
                }
                render();
                scrollCourseToTop();
            }
        });
        document.addEventListener("click", (event) => {
            const animatedControl = event.target.closest(".lms-button, .lms-secondary, .lms-icon-button, .lms-tab, .lms-nav-links a");
            if (animatedControl) {
                animatedControl.classList.remove("is-clicked");
                void animatedControl.offsetWidth;
                animatedControl.classList.add("is-clicked");
                window.setTimeout(() => animatedControl.classList.remove("is-clicked"), 420);
            }

            const animatedLink = animatedControl?.closest("a[href]");
            if (
                animatedLink &&
                !event.defaultPrevented &&
                event.button === 0 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey &&
                animatedLink.target !== "_blank"
            ) {
                const destination = animatedLink.href;
                event.preventDefault();
                window.setTimeout(() => {
                    window.location.href = destination;
                }, 230);
                return;
            }

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
                scrollCourseToTop();
                return;
            }
            const enrollButton = event.target.closest("[data-enroll], #enrollBtn");
            if (enrollButton) {
                const courseId = enrollButton.dataset.enroll || ensureState().selectedCourseId;
                window.setTimeout(() => enroll(courseId), 230);
            }
        });
    });
})();
