document.addEventListener("DOMContentLoaded", async () => {
    const page = document.body.dataset.page;
    if (!page || !window.ExamPrep) {
        return;
    }

    const {
        buildWeakAreaRecommendations,
        clampModuleIndex,
        createMetaPill,
        createUid,
        escapeHtml,
        fetchContent,
        formatDate,
        getCourseById,
        getGamificationSnapshot,
        getHighestUnlockedModule,
        getLearningState,
        getProgressPercent,
        isModuleUnlocked,
        markStudyActivity,
        normalizeVideoUrl,
        revealElements,
        saveLearningState,
        ensureCourseProgress
    } = window.ExamPrep;

    const content = await fetchContent();
    const settings = content.settings || {};
    const courses = Array.isArray(content.courses) ? content.courses : [];
    prepareCiscoStyleCourses(courses);

    if (!courses.length) {
        renderUnavailableState(page);
        return;
    }

    if (page === "catalog") {
        initializeCatalogPage(settings, courses);
    }

    if (page === "course-detail") {
        initializeCourseDetailPage(settings, courses);
    }

    function renderUnavailableState(currentPage) {
        const selector = currentPage === "course-detail" ? ".workspace-main" : "#course-grid";
        const target = document.querySelector(selector);
        if (!target) {
            return;
        }

        target.innerHTML = `
            <div class="empty-state">
                <h3>Course content is not available right now.</h3>
                <p>Check back after course content is published and synced to this learning area.</p>
            </div>
        `;
    }

    function prepareCiscoStyleCourses(courseList) {
        const expansionTemplates = [
            {
                title: "Guided Concept Lab",
                objective: "Apply the core concepts using a structured clinical reasoning routine.",
                body: "This Cisco-style lab connects content, activity, and assessment in one workflow. Watch the lesson, build a quick checklist, answer the scenario, and review the rationale before moving on.",
                videoSummary: "A guided lab lesson that demonstrates how to convert facts into nursing actions.",
                structures: ["Watch", "Practice", "Check understanding", "Review feedback"],
                flashcards: [
                    { front: "Best learning sequence", back: "Watch the lesson, practice the skill, take the test, review feedback." },
                    { front: "Checkpoint goal", back: "Show that you can apply the concept, not only remember it." }
                ],
                recommendedFocus: ["Use a checklist before answering scenario questions", "Review feedback before progressing"],
                quiz: {
                    prompt: "What is the best sequence for a structured learning module?",
                    timeLimitSeconds: 75,
                    options: ["Skip to certificate", "Watch, practice, test, review", "Test first and ignore feedback", "Read the title only"],
                    correctOption: 1,
                    success: "Correct. Structured learning builds skill step by step.",
                    failure: "Follow the learning flow before progressing.",
                    rationale: "Cisco-style pathways combine lesson content, practice, assessment, and feedback."
                }
            },
            {
                title: "Clinical Scenario Practice",
                objective: "Use patient cues to select safe nursing priorities.",
                body: "Work through a short clinical scenario and identify abnormal cues, risk level, safest first action, and reassessment needs. This keeps course tests inside the learning pathway.",
                videoSummary: "A scenario walkthrough showing how to identify risk and choose the safest first action.",
                structures: ["Abnormal cue", "Priority decision", "Nursing action", "Reassessment"],
                flashcards: [
                    { front: "Priority clue", back: "Acute change and safety risk usually outrank routine needs." },
                    { front: "Scenario habit", back: "Name the patient problem before choosing the intervention." }
                ],
                recommendedFocus: ["Identify abnormal cues before interventions", "Sort urgent cues from routine findings"],
                quiz: {
                    prompt: "What should guide the first action in a clinical scenario?",
                    timeLimitSeconds: 75,
                    options: ["The longest option", "The safest response to the highest-risk cue", "The last sentence only", "A random familiar topic"],
                    correctOption: 1,
                    success: "Correct. Safety and risk guide the first action.",
                    failure: "Look for the cue that creates the most immediate risk.",
                    rationale: "Clinical scenarios test whether you can link patient cues to safe nursing priorities."
                }
            },
            {
                title: "Module Skills Checkpoint",
                objective: "Confirm readiness before the next course unit unlocks.",
                body: "This checkpoint mirrors the module-exam pattern used in professional learning platforms. Complete the video lesson, review flashcards, and pass the timed check before progressing.",
                videoSummary: "A checkpoint lesson that summarizes the module competency and common test traps.",
                structures: ["Competency", "Timed test", "Feedback", "Next module readiness"],
                flashcards: [
                    { front: "When to progress", back: "After the module test is passed and feedback is reviewed." },
                    { front: "Why checkpoints matter", back: "They prevent weak concepts from carrying into the next module." }
                ],
                recommendedFocus: ["Retake missed checks after reviewing the rationale", "Use notes to capture weak areas"],
                quiz: {
                    prompt: "When should the next module unlock?",
                    timeLimitSeconds: 75,
                    options: ["After passing the current module test", "Before starting the course", "After skipping feedback", "Only after opening the exam lobby"],
                    correctOption: 0,
                    success: "Correct. Passing the module test unlocks the next step.",
                    failure: "The course progression should stay inside the course.",
                    rationale: "Module gates keep course assessment separate from supervised lecturer exams."
                }
            }
        ];

        const fallbackImages = [
            "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
        ];

        courseList.forEach((course) => {
            course.modules = Array.isArray(course.modules) ? course.modules : [];
            course.modules.forEach((module, index) => normalizeCourseModule(module, course, index));

            if (!course.modules.some((module) => module.id === `${course.id}-intro`)) {
                const introModule = {
                    id: `${course.id}-intro`,
                    title: `Introduction to ${course.title}`,
                    objective: "Understand the course path, module flow, tests, final assessment, and result feedback before starting.",
                    body: "Begin here to see how this course works. Each course opens into modules, each module includes a lesson, rapid revision flashcards, and a timed test. Complete the module tests, then open the course final test. After testing, review strengths, weak areas, and the next topics to repeat.",
                    videoSummary: "Course orientation covering modules, tests, final assessment, certificates, and weak-area review.",
                    image: course.image,
                    videoResourceUrl: "",
                    videoEmbedUrl: "",
                    structures: ["Course overview", "Module lessons", "Between-module tests", "Final test and results"],
                    flashcards: [
                        { front: "Course flow", back: "Intro, modules, module tests, final test, results review." },
                        { front: "After a test", back: "Check strengths, weak areas, and repeat the weakest module first." }
                    ],
                    recommendedFocus: ["Open the module list first", "Use results to choose what to revise next"],
                    quiz: {
                        prompt: "What should you review after completing a course test?",
                        timeLimitSeconds: 60,
                        options: ["Only the score", "Strengths, weak areas, and missed rationales", "Nothing until certificate", "Only the course title"],
                        correctOption: 1,
                        success: "Correct. Results should guide the next revision step.",
                        failure: "Use the result breakdown to decide what to repeat.",
                        rationale: "Cisco-style learning paths use assessment feedback to direct the next study action."
                    }
                };
                normalizeCourseModule(introModule, course, 0);
                course.modules.unshift(introModule);
            }

            let templateIndex = 0;
            while (course.modules.length < 6) {
                const template = expansionTemplates[templateIndex % expansionTemplates.length];
                const moduleIndex = course.modules.length;
                const module = {
                    ...template,
                    id: `${course.id}-generated-${moduleIndex + 1}`,
                    title: `${template.title} - Unit ${moduleIndex + 1}`,
                    image: course.image,
                    videoResourceUrl: "",
                    videoEmbedUrl: ""
                };
                normalizeCourseModule(module, course, moduleIndex);
                course.modules.push(module);
                templateIndex += 1;
            }

            course.practiceExam ||= {
                title: `${course.title} Course Final Test`,
                durationMinutes: 45,
                questionCount: Math.max(10, course.modules.length * 2),
                passMark: 70,
                instructions: "Complete all modules, then sit this course assessment inside the learning workspace."
            };

            if (!course.image || course.image.trim() === "" || course.image.includes("undefined")) {
                course.image = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
            }
        });
    }

    function normalizeCourseModule(module, course, index) {
        module.id ||= `${course.id}-module-${index + 1}`;
        module.image ||= course.image;
        module.videoSummary ||= `Watch the guided lesson for ${module.title} before attempting the module check.`;
        module.structures = Array.isArray(module.structures) && module.structures.length
            ? module.structures
            : ["Lesson summary", "Practice activity", "Timed module check", "Feedback review"];
        module.flashcards = Array.isArray(module.flashcards) && module.flashcards.length
            ? module.flashcards
            : [
                { front: `${module.title} focus`, back: module.objective || "Review the module objective and key nursing action." },
                { front: "Before moving on", back: "Pass the timed check and save one revision note." }
            ];
        module.recommendedFocus = Array.isArray(module.recommendedFocus) && module.recommendedFocus.length
            ? module.recommendedFocus
            : [module.objective || "Review this module and retry the timed knowledge check."];
        module.quiz ||= {
            prompt: `Which habit best supports success in ${module.title}?`,
            timeLimitSeconds: 75,
            options: ["Skip feedback", "Watch, practice, test, and review", "Open the exam lobby", "Ignore weak areas"],
            correctOption: 1,
            success: "Correct. The course workflow keeps practice inside the module.",
            failure: "Use the course learning flow before moving forward.",
            rationale: "Course tests are part of the course pathway, separate from supervised lecturer exams."
        };
    }

    function initializeCatalogPage(currentSettings, courseList) {
        const queryCourseId = new URLSearchParams(window.location.search).get("course");
        const grid = document.getElementById("course-grid");
        const categoryContainer = document.getElementById("category-filters");
        const searchInput = document.getElementById("course-search");
        const sortSelect = document.getElementById("sort-select");
        const resultCount = document.getElementById("catalog-results");
        const enrollButton = document.getElementById("selected-enroll-btn");
        const difficultyInputs = Array.from(document.querySelectorAll(".difficulty-filter"));

        const state = getLearningState(courseList);
        const defaultCourse = getCourseById(courseList, queryCourseId) || getCourseById(courseList, state.selectedCourseId) || courseList[0];
        const categories = ["All Courses", ...new Set(courseList.map((course) => course.category))];
        const view = {
            category: "All Courses",
            search: "",
            difficulties: [],
            sort: "featured",
            selectedCourseId: defaultCourse.id
        };

        document.getElementById("catalog-hero-eyebrow").textContent = "Academy Course Catalog";
        document.getElementById("catalog-hero-title").textContent = "Choose a structured course pathway.";
        document.getElementById("catalog-hero-description").textContent = "Browse offerings, open modules, complete tests, and review strengths and weak areas from one clean catalog.";

        const announcementMessage = document.getElementById("catalog-announcement-message");
        const announcementLink = document.getElementById("catalog-announcement-link");
        if (announcementMessage) {
            announcementMessage.textContent = currentSettings.announcement?.message || "AI weak-area coaching, timed quizzes, and theme switching are now live.";
        }
        if (announcementLink) {
            announcementLink.textContent = currentSettings.announcement?.actionLabel || "Open Course Workspace";
            announcementLink.href = currentSettings.announcement?.actionHref || "#selected-program";
        }

        categoryContainer.innerHTML = categories
            .map((category) => renderCategoryFilter(category, category === view.category))
            .join("");

        categoryContainer.addEventListener("click", (event) => {
            const target = event.target.closest(".filter-chip");
            if (!target) {
                return;
            }

            view.category = target.dataset.category;
            categoryContainer.querySelectorAll(".filter-chip").forEach((chip) => {
                chip.classList.toggle("active", chip === target);
            });
            renderCatalog();
        });

        searchInput.addEventListener("input", (event) => {
            view.search = event.target.value.trim().toLowerCase();
            renderCatalog();
        });

        difficultyInputs.forEach((input) => {
            input.addEventListener("change", () => {
                view.difficulties = difficultyInputs.filter((item) => item.checked).map((item) => item.value);
                renderCatalog();
            });
        });

        sortSelect.addEventListener("change", (event) => {
            view.sort = event.target.value;
            renderCatalog();
        });

        if (enrollButton) {
            enrollButton.addEventListener("click", () => {
                const latest = getLearningState(courseList);
                const selectedCourse = getCourseById(courseList, view.selectedCourseId);
                if (!selectedCourse) {
                    return;
                }

                toggleEnrollment(latest, selectedCourse);
                latest.selectedCourseId = selectedCourse.id;
                saveLearningState(latest);
                renderCatalog();
            });
        }

        renderCatalog();

        function renderCatalog() {
            const latestState = getLearningState(courseList);
            const filteredCourses = courseList
                .filter((course) => matchesCategory(course, view.category))
                .filter((course) => matchesDifficulty(course, view.difficulties))
                .filter((course) => matchesSearch(course, view.search))
                .sort((left, right) => sortCourses(left, right, view.sort));

            if (!filteredCourses.some((course) => course.id === view.selectedCourseId)) {
                view.selectedCourseId = filteredCourses[0]?.id || courseList[0].id;
            }

            const selectedCourse = getCourseById(courseList, view.selectedCourseId) || courseList[0];
            latestState.selectedCourseId = selectedCourse.id;
            ensureCourseProgress(latestState, selectedCourse);
            saveLearningState(latestState);

            resultCount.textContent = `${filteredCourses.length} ${filteredCourses.length === 1 ? "course" : "courses"}`;
            renderHeroStats(latestState);
            renderSelectedProgram(selectedCourse, latestState);

            if (!filteredCourses.length) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <h3>No courses match those filters.</h3>
                        <p>Try a broader search, switch category, or clear a difficulty filter.</p>
                    </div>
                `;
                revealElements(document.querySelectorAll(".reveal-on-scroll"));
                return;
            }

            grid.innerHTML = filteredCourses
                .map((course) => renderCourseCard(course, latestState))
                .join("");

            grid.querySelectorAll("[data-select-course]").forEach((button) => {
                button.addEventListener("click", () => {
                    view.selectedCourseId = button.dataset.selectCourse;
                    renderCatalog();
                    document.getElementById("selected-program")?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
            });

            grid.querySelectorAll("[data-enroll-course]").forEach((button) => {
                button.addEventListener("click", () => {
                    const latest = getLearningState(courseList);
                    const course = getCourseById(courseList, button.dataset.enrollCourse);
                    if (!course) {
                        return;
                    }

                    toggleEnrollment(latest, course);
                    latest.selectedCourseId = course.id;
                    saveLearningState(latest);
                    view.selectedCourseId = course.id;
                    renderCatalog();
                });
            });

            revealElements(document.querySelectorAll(".reveal-on-scroll"));
        }

        function renderCategoryFilter(category, isActive) {
            const source = category === "All Courses"
                ? courseList
                : courseList.filter((course) => course.category === category);
            const moduleCount = source.reduce((sum, course) => sum + Number(course.modules?.length || 0), 0);
            const questionCount = source.reduce((sum, course) => sum + Number(course.questions || 0), 0);
            const label = category === "All Courses" ? "Full catalog" : category;

            return `
                <button class="filter-chip academy-category-chip${isActive ? " active" : ""}" data-category="${escapeHtml(category)}">
                    <span class="category-marker" aria-hidden="true"></span>
                    <span class="category-copy">
                        <strong>${escapeHtml(label)}</strong>
                        <small>${moduleCount} modules, ${questionCount.toLocaleString()} questions</small>
                    </span>
                    <span class="category-count">${source.length}</span>
                </button>
            `;
        }

        function renderHeroStats(state) {
            const activeCourses = state.enrolledCourseIds.map((courseId) => getCourseById(courseList, courseId)).filter(Boolean);
            const dataSource = activeCourses.length ? activeCourses : courseList;
            const totalHours = dataSource.reduce((sum, course) => sum + Number(course.durationHours || 0), 0);
            const totalQuestions = dataSource.reduce((sum, course) => sum + Number(course.questions || 0), 0);

            document.getElementById("hero-active-count").textContent = String(activeCourses.length || courseList.length);
            document.getElementById("hero-hours-count").textContent = `${totalHours}h`;
            document.getElementById("hero-question-count").textContent = `${totalQuestions.toLocaleString()}+`;
        }
        function renderSelectedProgram(course, state) {
            const progress = ensureCourseProgress(state, course);
            const percent = getProgressPercent(course, state);
            const enrolled = state.enrolledCourseIds.includes(course.id);
            const workspaceHref = `course-workspace.html?course=${encodeURIComponent(course.id)}`;

            document.getElementById("selected-title").textContent = course.title;
            document.getElementById("selected-summary").textContent = course.summary;
            document.getElementById("selected-image").src = course.image || "../assets/nursing-hero.svg";
            document.getElementById("selected-image").alt = course.title;
            document.getElementById("selected-facts").innerHTML = [
                createMetaPill("Duration", `${course.durationHours} hours`),
                createMetaPill("Format", course.format),
                createMetaPill("Modules", `${course.modules.length} modules`)
            ].join("");
            renderSelectedModulePreview(course);
            renderTestCategories(courseList, course);

            const openBtn = document.getElementById("selected-open-btn");
            if (openBtn) {
                openBtn.href = workspaceHref;
                openBtn.target = "_blank";
                openBtn.rel = "noopener";
                openBtn.textContent = enrolled ? "Open Workspace" : "Preview Workspace";
                openBtn.classList.remove("is-disabled");
            }

            const finalTestBtn = document.getElementById("selected-final-test-btn");
            if (finalTestBtn) {
                finalTestBtn.href = enrolled ? `${workspaceHref}#course-final-test` : workspaceHref;
                finalTestBtn.target = "_blank";
                finalTestBtn.rel = "noopener";
                finalTestBtn.textContent = enrolled ? "Course Final Test" : "Preview Course";
                finalTestBtn.classList.remove("is-disabled");
            }

            if (enrollButton) {
                enrollButton.textContent = enrolled ? "Cancel Enrollment" : "Enroll";
                enrollButton.classList.toggle("btn-outline", enrolled);
                enrollButton.classList.toggle("btn-primary", !enrolled);
            }

            document.getElementById("selected-enrollment-status").textContent = enrolled ? "Enrolled" : "Not enrolled";
            document.getElementById("selected-progress-status").textContent = `${percent}%`;
            document.getElementById("selected-progress-bar").style.width = `${percent}%`;
            document.getElementById("selected-last-activity").textContent = progress.lastVisited
                ? `Last activity: ${formatDate(progress.lastVisited)}`
                : "No activity yet. Open the workspace to begin tracking your progress.";

            document.getElementById("hero-course-image").src = course.image || "../assets/nursing-hero.svg";
            document.getElementById("hero-course-image").alt = course.title;
        }

        function renderSelectedModulePreview(course) {
            const container = document.getElementById("selected-module-preview");
            if (!container) {
                return;
            }

            container.innerHTML = `
                <div class="module-preview-head">
                    <strong>Learning Pathway</strong>
                    <span>${course.modules.length} guided modules + final test</span>
                </div>
                <div class="module-preview-list">
                    ${course.modules.slice(0, 4).map((module, index) => `
                        <a href="course-workspace.html?course=${encodeURIComponent(course.id)}&module=${index}" class="module-preview-item" target="_blank" rel="noopener">
                            <span>${index + 1}</span>
                            <strong>${escapeHtml(module.title)}</strong>
                            <small>${index === 0 ? "Intro, structure, test path" : "Lesson, flashcards, timed check"}</small>
                        </a>
                    `).join("")}
                </div>
            `;
        }

        function renderTestCategories(courseList, selectedCourse) {
            const testCategoryList = document.getElementById("test-category-list");
            if (!testCategoryList) {
                return;
            }

            const categories = [...new Set(courseList.map((course) => course.category).filter(Boolean))];
            testCategoryList.innerHTML = categories
                .map((category) => {
                    const count = courseList.filter((course) => course.category === category).length;
                    const active = category === selectedCourse.category ? " active" : "";
                    return `
                        <button class="test-category-chip${active}" type="button" data-category-jump="${escapeHtml(category)}">
                            <strong>${escapeHtml(category)}</strong>
                            <span>${count} ${count === 1 ? "course" : "courses"}</span>
                        </button>
                    `;
                })
                .join("");

            testCategoryList.querySelectorAll("[data-category-jump]").forEach((button) => {
                button.addEventListener("click", () => {
                    view.category = button.dataset.categoryJump;
                    categoryContainer.querySelectorAll(".filter-chip").forEach((chip) => {
                        chip.classList.toggle("active", chip.dataset.category === view.category);
                    });
                    renderCatalog();
                });
            });
        }

        function renderLearnerRail(selectedCourseId, state) {
            const container = document.getElementById("learner-rail-list");
            const enrolledCourses = state.enrolledCourseIds.map((courseId) => getCourseById(courseList, courseId)).filter(Boolean);

            if (!enrolledCourses.length) {
                container.innerHTML = `<div class="empty-state"><p>No enrolled courses yet. Enroll in one course and it will appear here for quick switching.</p></div>`;
                return;
            }

            container.innerHTML = enrolledCourses
                .map((course) => `
                    <a class="learner-chip${course.id === selectedCourseId ? " active" : ""}" href="course-workspace.html?course=${encodeURIComponent(course.id)}" target="_blank" rel="noopener">
                        <strong>${escapeHtml(course.title)}</strong>
                        <span>${getProgressPercent(course, state)}% complete</span>
                    </a>
                `)
                .join("");
        }
    }

    function initializeCourseDetailPage(currentSettings, courseList) {
        const state = getLearningState(courseList);
        const params = new URLSearchParams(window.location.search);
        const requestedCourseId = params.get("course");
        const requestedModuleIndex = Number(params.get("module"));
        const currentCourse = getCourseById(courseList, requestedCourseId) || getCourseById(courseList, state.selectedCourseId) || courseList[0];

        state.selectedCourseId = currentCourse.id;
        const currentProgress = ensureCourseProgress(state, currentCourse);
        currentProgress.currentModuleIndex = Number.isInteger(requestedModuleIndex)
            ? clampModuleIndex(requestedModuleIndex, currentCourse.modules.length)
            : clampModuleIndex(currentProgress.currentModuleIndex, currentCourse.modules.length);
        saveLearningState(state);

        if (!state.enrolledCourseIds.includes(currentCourse.id)) {
            state.enrolledCourseIds.push(currentCourse.id);
            ensureCourseProgress(state, currentCourse);
            saveLearningState(state);
        }

        const elements = {
            workspaceTitle: document.getElementById("workspace-course-title"),
            workspaceSummary: document.getElementById("workspace-course-summary"),
            workspaceImage: document.getElementById("workspace-course-image"),
            workspaceMeta: document.getElementById("workspace-meta"),
            workspaceProgressLabel: document.getElementById("workspace-progress-label"),
            workspaceProgressBar: document.getElementById("workspace-progress-bar"),
            workspaceSaveState: document.getElementById("workspace-save-state"),
            workspaceStatusMessage: document.getElementById("workspace-status-message"),
            certificateLink: document.getElementById("view-certificate-link"),
            switcher: document.getElementById("workspace-course-switcher"),
            outlineList: document.getElementById("workspace-outline-list"),
            guidanceList: document.getElementById("course-guidance-list"),
            points: document.getElementById("workspace-points"),
            badge: document.getElementById("workspace-badge"),
            streak: document.getElementById("workspace-streak"),
            aiRecommendations: document.getElementById("workspace-ai-recommendations"),
            moduleTitle: document.getElementById("module-title"),
            moduleObjective: document.getElementById("module-objective"),
            moduleBody: document.getElementById("module-body"),
            moduleImage: document.getElementById("module-image"),
            moduleVideoTitle: document.getElementById("module-video-title"),
            moduleVideoSummary: document.getElementById("module-video-summary"),
            moduleVideoFrame: document.getElementById("module-video-frame"),
            videoPlaceholderBadge: document.getElementById("video-placeholder-badge"),
            moduleVideoResource: document.getElementById("module-video-resource"),
            startVideoButton: document.getElementById("start-video-btn"),
            modulePearlTitle: document.getElementById("module-pearl-title"),
            modulePearlBody: document.getElementById("module-pearl-body"),
            structureList: document.getElementById("module-structures"),
            quizTimer: document.getElementById("quiz-timer"),
            quizPrompt: document.getElementById("quiz-prompt"),
            quizOptions: document.querySelector(".quiz-options"),
            quizFeedback: document.querySelector(".quiz-feedback"),
            notes: document.getElementById("module-notes"),
            prevButton: document.getElementById("prev-module-btn"),
            nextButton: document.getElementById("next-module-btn"),
            markCompleteButton: document.getElementById("mark-complete-btn"),
            practiceExamTitle: document.getElementById("practice-exam-title"),
            practiceExamSummary: document.getElementById("practice-exam-summary"),
            practiceExamMeta: document.getElementById("practice-exam-meta"),
            resourceList: document.getElementById("workspace-resource-list"),
            flashcardCard: document.getElementById("flashcard-card"),
            flashcardFront: document.getElementById("flashcard-front"),
            flashcardBack: document.getElementById("flashcard-back"),
            flashcardProgress: document.getElementById("flashcard-progress"),
            flashcardPrevButton: document.getElementById("flashcard-prev-btn"),
            flashcardFlipButton: document.getElementById("flashcard-flip-btn"),
            flashcardNextButton: document.getElementById("flashcard-next-btn"),
            finalTest: document.getElementById("course-final-test")
        };

        let saveTimer = null;
        let quizTimerHandle = null;
        const quizDeadlines = {};
        let activeCourse = currentCourse;
        let activeModuleIndex = currentProgress.currentModuleIndex;
        let flashcardIndex = 0;
        let flashcardFlipped = false;

        elements.startVideoButton?.addEventListener("click", () => {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            progress.videoWatched[activeModuleIndex] = true;
            markStudyActivity(progress);
            saveLearningState(latest);
            elements.workspaceSaveState.textContent = "Lesson marked watched";
            setStatusMessage("Lesson marked as reviewed.", false);
            renderWorkspace();
        });

        elements.prevButton.addEventListener("click", () => {
            if (activeModuleIndex > 0) {
                activeModuleIndex -= 1;
                resetFlashcards();
                persistModulePosition();
                renderWorkspace();
            }
        });

        elements.nextButton.addEventListener("click", () => {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);

            if (!progress.completedModules.includes(activeModuleIndex)) {
                setStatusMessage("Complete the current module to unlock the next one.", true);
                return;
            }

            const nextIndex = activeModuleIndex + 1;
            if (nextIndex < activeCourse.modules.length && isModuleUnlocked(progress, nextIndex)) {
                activeModuleIndex = nextIndex;
                resetFlashcards();
                persistModulePosition();
                renderWorkspace();
            }
        });

        elements.markCompleteButton.addEventListener("click", () => {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            if (progress.completedModules.includes(activeModuleIndex)) {
                return;
            }

            const passed = progress.quizPassed?.[activeModuleIndex] === true;
            const watched = progress.videoWatched?.[activeModuleIndex] === true;

            if (!watched) {
                setStatusMessage("Watch or mark the lesson as reviewed before completing this module.", true);
                return;
            }

            if (!passed) {
                setStatusMessage("Pass the timed knowledge check before completing this module.", true);
                return;
            }

            progress.completedModules.push(activeModuleIndex);
            progress.completedModules = Array.from(new Set(progress.completedModules)).sort((left, right) => left - right);
            progress.currentModuleIndex = activeModuleIndex;
            markStudyActivity(progress);
            saveLearningState(latest);
            elements.workspaceSaveState.textContent = "Module completed";
            setStatusMessage("Module completed. The next module is now unlocked.", false);
            renderWorkspace();
        });

        elements.quizOptions.addEventListener("change", (event) => {
            const selectedOption = event.target.closest("input[type='radio']");
            if (!selectedOption) {
                return;
            }

            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            const module = activeCourse.modules[activeModuleIndex];
            progress.quizAnswers[activeModuleIndex] = Number(selectedOption.value);
            progress.quizChecked[activeModuleIndex] = false;
            progress.quizPassed[activeModuleIndex] = false;
            progress.quizScores[activeModuleIndex] = 0;
            markStudyActivity(progress);
            saveLearningState(latest);
            quizDeadlines[activeModuleIndex] = Date.now() + (Number(module.quiz.timeLimitSeconds || 75) * 1000);
            elements.workspaceSaveState.textContent = "Answer saved";
            setStatusMessage("Answer saved. Submit before the timer expires.", false);
            renderWorkspace();
        });

        document.querySelector(".check-answer-btn").addEventListener("click", () => {
            submitQuiz(false);
        });

        elements.notes.addEventListener("input", () => {
            elements.workspaceSaveState.textContent = "Saving...";
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                const latest = getLearningState(courseList);
                const progress = ensureCourseProgress(latest, activeCourse);
                progress.notes[activeModuleIndex] = elements.notes.value;
                progress.currentModuleIndex = activeModuleIndex;
                markStudyActivity(progress);
                saveLearningState(latest);
                elements.workspaceSaveState.textContent = "Synced";
            }, 250);
        });

        elements.flashcardCard.addEventListener("click", () => {
            flashcardFlipped = !flashcardFlipped;
            renderFlashcards(activeCourse.modules[activeModuleIndex]);
        });
        elements.flashcardFlipButton.addEventListener("click", () => {
            flashcardFlipped = !flashcardFlipped;
            renderFlashcards(activeCourse.modules[activeModuleIndex]);
        });
        elements.flashcardPrevButton.addEventListener("click", () => {
            const cards = activeCourse.modules[activeModuleIndex].flashcards || [];
            if (!cards.length) {
                return;
            }
            flashcardIndex = (flashcardIndex - 1 + cards.length) % cards.length;
            flashcardFlipped = false;
            renderFlashcards(activeCourse.modules[activeModuleIndex]);
        });
        elements.flashcardNextButton.addEventListener("click", () => {
            const cards = activeCourse.modules[activeModuleIndex].flashcards || [];
            if (!cards.length) {
                return;
            }
            flashcardIndex = (flashcardIndex + 1) % cards.length;
            flashcardFlipped = false;
            renderFlashcards(activeCourse.modules[activeModuleIndex]);
        });

        elements.finalTest?.addEventListener("click", (event) => {
            const startButton = event.target.closest("[data-start-final-test]");
            const submitButton = event.target.closest("[data-submit-final-test]");
            const retryButton = event.target.closest("[data-retry-final-test]");

            if (startButton) {
                const latest = getLearningState(courseList);
                const progress = ensureCourseProgress(latest, activeCourse);
                progress.finalTest = {
                    started: true,
                    submitted: false,
                    answers: {},
                    score: 0,
                    submittedAt: ""
                };
                markStudyActivity(progress);
                saveLearningState(latest);
                renderWorkspace();
                return;
            }

            if (retryButton) {
                const latest = getLearningState(courseList);
                const progress = ensureCourseProgress(latest, activeCourse);
                progress.finalTest = {
                    started: true,
                    submitted: false,
                    answers: {},
                    score: 0,
                    submittedAt: ""
                };
                saveLearningState(latest);
                renderWorkspace();
                return;
            }

            if (submitButton) {
                submitFinalTest();
            }
        });

        elements.finalTest?.addEventListener("change", (event) => {
            const selected = event.target.closest("input[type='radio'][data-final-question]");
            if (!selected) {
                return;
            }

            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            progress.finalTest ||= { started: true, submitted: false, answers: {}, score: 0, submittedAt: "" };
            progress.finalTest.answers[selected.dataset.finalQuestion] = Number(selected.value);
            markStudyActivity(progress);
            saveLearningState(latest);
        });

        renderWorkspace();

        function renderWorkspace() {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            const percent = getProgressPercent(activeCourse, latest);

            elements.workspaceTitle.textContent = activeCourse.title;
            elements.workspaceSummary.textContent = activeCourse.summary;
            elements.workspaceImage.src = activeCourse.image;
            elements.workspaceImage.alt = activeCourse.title;
            elements.workspaceMeta.innerHTML = [
                createMetaPill("Track", activeCourse.category),
                createMetaPill("Level", activeCourse.difficulty),
                createMetaPill("Format", activeCourse.format)
            ].join("");

            elements.workspaceProgressLabel.textContent = `${percent}% complete`;
            elements.workspaceProgressBar.style.width = `${percent}%`;
            renderCertificateLink(latest, progress, percent);
            renderGuidance(progress);
            renderScoreboard(progress);
            renderAIRecommendations(progress);
            renderSwitcher(latest);
            renderOutline(progress);
            renderModule(progress);
            renderPracticeExam();
            renderResources(progress);
            renderFinalTest(progress);
            revealElements(document.querySelectorAll(".reveal-on-scroll"));
        }

        function renderCertificateLink(latestState, progress, percent) {
            const link = elements.certificateLink;
            if (!link) {
                return;
            }

            const finalPassMark = Number(activeCourse.practiceExam?.passMark || 70);
            const finalPassed = Number(progress.finalTest?.score || 0) >= finalPassMark && progress.finalTest?.submitted === true;

            if (percent === 100 && finalPassed) {
                if (!progress.certificate?.id) {
                    progress.certificate = {
                        id: createUid("cert"),
                        issuedAt: new Date().toISOString()
                    };
                    saveLearningState(latestState);
                }

                const params = new URLSearchParams({
                    source: "course",
                    courseId: activeCourse.id,
                    title: activeCourse.title,
                    certId: progress.certificate.id
                });
                link.href = `../certificate.html?${params.toString()}`;
                link.target = "_blank";
                link.rel = "noopener";
                link.textContent = "View Certificate";
                link.classList.remove("is-disabled");
                link.setAttribute("aria-disabled", "false");
                return;
            }

            link.href = "#";
            link.target = "";
            link.rel = "";
            link.textContent = percent === 100 ? "Pass final test to unlock certificate" : "Certificate locked";
            link.classList.add("is-disabled");
            link.setAttribute("aria-disabled", "true");
        }

        function renderGuidance(progress) {
            const guidance = Array.isArray(currentSettings.workspaceGuidance) && currentSettings.workspaceGuidance.length
                ? currentSettings.workspaceGuidance
                : [
                    "Start with the lesson summary before attempting the quiz.",
                    "Use flashcards to lock in cues, rationales, and nursing priorities.",
                    "Pass the module quiz before you move forward.",
                    "Finish every module to unlock your certificate."
                ];
            const completedCount = progress.completedModules.length;
            elements.guidanceList.innerHTML = guidance
                .map((step, index) => `<li${index === Math.min(completedCount, guidance.length - 1) ? " class=\"active\"" : ""}>${escapeHtml(step)}</li>`)
                .join("");
        }

        function renderScoreboard(progress) {
            const snapshot = getGamificationSnapshot(activeCourse, progress);
            elements.points.textContent = `${snapshot.points} XP`;
            elements.badge.textContent = snapshot.badge;
            elements.streak.textContent = `${snapshot.streakDays} ${snapshot.streakDays === 1 ? "day" : "days"}`;
        }

        function renderAIRecommendations(progress) {
            const suggestions = buildWeakAreaRecommendations(activeCourse, progress);
            elements.aiRecommendations.innerHTML = suggestions.length
                ? suggestions.map((item) => `
                    <article class="ai-coach-item">
                        <strong>${escapeHtml(item.moduleTitle)}</strong>
                        <p>${escapeHtml(item.reason)}</p>
                        <span>${escapeHtml(item.focus)}</span>
                    </article>
                `).join("")
                : `<p class="muted">No weak areas detected yet. Keep going.</p>`;
        }

        function renderSwitcher(latestState) {
            const enrolledCourses = latestState.enrolledCourseIds.map((courseId) => getCourseById(courseList, courseId)).filter(Boolean);
            elements.switcher.innerHTML = enrolledCourses
                .map((course) => `
                    <a class="workspace-course-link${course.id === activeCourse.id ? " active" : ""}" href="course-workspace.html?course=${encodeURIComponent(course.id)}">
                        <strong>${escapeHtml(course.title)}</strong>
                        <span>${getProgressPercent(course, latestState)}% complete</span>
                    </a>
                `)
                .join("");
        }

        function renderOutline(progress) {
            elements.outlineList.innerHTML = activeCourse.modules
                .map((module, index) => {
                    const unlocked = isModuleUnlocked(progress, index);
                    const completed = progress.completedModules.includes(index);
                    const passed = progress.quizPassed?.[index] === true;
                    return `
                        <li class="outline-item${index === activeModuleIndex ? " active" : ""}${completed ? " completed" : ""}${passed ? " tested" : ""}${unlocked ? "" : " locked"}" data-module-index="${index}">
                            <span>${escapeHtml(module.title)}</span>
                            <small>${unlocked ? (completed ? "Completed" : "Unlocked") : "Locked"}</small>
                        </li>
                    `;
                })
                .join("");

            elements.outlineList.querySelectorAll("[data-module-index]").forEach((item) => {
                item.addEventListener("click", () => {
                    const index = Number(item.dataset.moduleIndex);
                    if (!isModuleUnlocked(progress, index)) {
                        setStatusMessage("That module is still locked. Complete the previous module first.", true);
                        return;
                    }

                    activeModuleIndex = index;
                    resetFlashcards();
                    persistModulePosition();
                    renderWorkspace();
                });
            });
        }

        function renderModule(progress) {
            const module = activeCourse.modules[activeModuleIndex];
            const savedAnswer = progress.quizAnswers[activeModuleIndex];
            const passed = progress.quizPassed?.[activeModuleIndex] === true;
            const checked = progress.quizChecked?.[activeModuleIndex] === true;
            const watched = progress.videoWatched?.[activeModuleIndex] === true;
            const completed = progress.completedModules.includes(activeModuleIndex);

            elements.moduleTitle.textContent = module.title;
            elements.moduleObjective.textContent = module.objective;
            elements.moduleBody.textContent = module.body;
            elements.moduleImage.src = module.image;
            elements.moduleImage.alt = module.title;
            elements.moduleVideoTitle.textContent = `${module.title} Lesson`;
            elements.moduleVideoSummary.textContent = module.videoSummary || "Review the lesson before attempting the knowledge check.";
            elements.modulePearlTitle.textContent = "Clinical Focus";
            elements.modulePearlBody.textContent = module.recommendedFocus?.[0] || "Use the module summary and flashcards to guide your revision.";
            elements.structureList.innerHTML = module.structures.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
            elements.notes.value = progress.notes[activeModuleIndex] || "";

            renderVideo(module, watched);
            renderQuiz(module, savedAnswer, passed, checked);
            renderFlashcards(module);

            elements.prevButton.disabled = activeModuleIndex === 0;
            elements.nextButton.disabled = activeModuleIndex >= activeCourse.modules.length - 1 || !completed;
            elements.nextButton.textContent = activeModuleIndex >= activeCourse.modules.length - 1
                ? "Final Module Reached"
                : completed
                    ? "Next Module"
                    : "Complete to Unlock Next";

            elements.startVideoButton.textContent = watched ? "Lesson Reviewed" : "Mark Lesson Reviewed";
            elements.startVideoButton.disabled = watched;
            elements.markCompleteButton.disabled = completed || !passed || !watched;
            elements.markCompleteButton.textContent = completed
                ? "Completed"
                : passed && watched
                    ? "Mark Complete"
                    : !watched
                        ? "Review lesson first"
                        : "Pass timed quiz";

            const highestUnlockedIndex = getHighestUnlockedModule(progress, activeCourse.modules.length);
            if (activeModuleIndex > highestUnlockedIndex) {
                activeModuleIndex = highestUnlockedIndex;
            }
        }

        function renderVideo(module, watched) {
            const embedUrl = normalizeVideoUrl(module.videoEmbedUrl);
            const resourceUrl = normalizeVideoUrl(module.videoResourceUrl) || module.videoResourceUrl || "#";

            if (embedUrl) {
                elements.moduleVideoFrame.src = embedUrl;
                elements.moduleVideoFrame.classList.remove("hidden");
                elements.moduleImage.classList.add("hidden");
                elements.videoPlaceholderBadge.classList.add("hidden");
            } else {
                elements.moduleVideoFrame.src = "";
                elements.moduleVideoFrame.classList.add("hidden");
                elements.moduleImage.classList.remove("hidden");
                elements.videoPlaceholderBadge.classList.remove("hidden");
                elements.videoPlaceholderBadge.textContent = watched ? "Lesson reviewed" : "Video lesson link can be attached later";
            }

            if (resourceUrl && resourceUrl !== "#") {
                elements.moduleVideoResource.href = resourceUrl;
                elements.moduleVideoResource.classList.remove("hidden");
                elements.moduleVideoResource.textContent = embedUrl ? "Open lesson in a new tab" : "Open lesson resource";
            } else {
                elements.moduleVideoResource.href = "#";
                elements.moduleVideoResource.classList.add("hidden");
            }
        }

        function renderQuiz(module, savedAnswer, passed, checked) {
            elements.quizPrompt.textContent = module.quiz.prompt;
            elements.quizOptions.innerHTML = module.quiz.options
                .map((option, optionIndex) => `
                    <label>
                        <input type="radio" name="module-quiz" value="${optionIndex}" ${savedAnswer === optionIndex ? "checked" : ""}>
                        <span>${escapeHtml(option)}</span>
                    </label>
                `)
                .join("");

            if (checked) {
                elements.quizFeedback.textContent = passed ? module.quiz.success : `${module.quiz.failure} ${module.quiz.rationale}`;
                elements.quizFeedback.className = `quiz-feedback ${passed ? "correct" : "incorrect"}`;
                elements.quizTimer.textContent = passed ? "Quiz passed" : "Quiz reviewed";
                clearQuizTimer();
                delete quizDeadlines[activeModuleIndex];
            } else {
                elements.quizFeedback.textContent = "";
                elements.quizFeedback.className = "quiz-feedback";
                startQuizTimer(module);
            }
        }

        function renderFlashcards(module) {
            const cards = Array.isArray(module.flashcards) ? module.flashcards : [];
            if (!cards.length) {
                elements.flashcardFront.textContent = "No flashcards added yet.";
                elements.flashcardBack.textContent = "Rapid revision cards can be added to this module later.";
                elements.flashcardProgress.textContent = "No cards";
                elements.flashcardCard.classList.remove("is-flipped");
                elements.flashcardPrevButton.disabled = true;
                elements.flashcardNextButton.disabled = true;
                elements.flashcardFlipButton.disabled = true;
                return;
            }

            flashcardIndex = Math.max(0, Math.min(flashcardIndex, cards.length - 1));
            const card = cards[flashcardIndex];
            elements.flashcardFront.textContent = card.front;
            elements.flashcardBack.textContent = card.back;
            elements.flashcardProgress.textContent = `Card ${flashcardIndex + 1} of ${cards.length}`;
            elements.flashcardCard.classList.toggle("is-flipped", flashcardFlipped);
            elements.flashcardPrevButton.disabled = cards.length === 1;
            elements.flashcardNextButton.disabled = cards.length === 1;
            elements.flashcardFlipButton.disabled = false;
        }

        function renderPracticeExam() {
            const practiceExam = activeCourse.practiceExam || {};
            elements.practiceExamTitle.textContent = practiceExam.title || "Course Practice Exam";
            elements.practiceExamSummary.textContent = practiceExam.instructions || "Complete this assessment inside the course after all modules are done.";
            elements.practiceExamMeta.innerHTML = [
                createMetaPill("Duration", `${Number(practiceExam.durationMinutes || 45)} min`),
                createMetaPill("Questions", `${Number(practiceExam.questionCount || 30)}`),
                createMetaPill("Pass Mark", `${Number(practiceExam.passMark || 70)}%`)
            ].join("");
        }

        function renderFinalTest(progress) {
            if (!elements.finalTest) {
                return;
            }

            const allModulesComplete = activeCourse.modules.every((_, index) => progress.completedModules.includes(index));
            const finalTest = progress.finalTest || {};
            const practiceExam = activeCourse.practiceExam || {};
            const passMark = Number(practiceExam.passMark || 70);
            const questions = buildFinalTestQuestions();

            if (!allModulesComplete) {
                const remaining = activeCourse.modules.length - progress.completedModules.length;
                elements.finalTest.innerHTML = `
                    <div class="final-test-locked">
                        <strong>Locked until all modules are complete</strong>
                        <p>Finish ${remaining} more ${remaining === 1 ? "module" : "modules"} to unlock the course final test.</p>
                    </div>
                `;
                return;
            }

            if (finalTest.submitted) {
                const passed = Number(finalTest.score || 0) >= passMark;
                const resultHref = "../results/results.html";
                elements.finalTest.innerHTML = `
                    <div class="final-test-result ${passed ? "passed" : "retry"}">
                        <strong>${passed ? "Passed" : "Needs Review"}</strong>
                        <span>${Number(finalTest.score || 0)}%</span>
                        <p>${passed ? "Course assessment complete. Your certificate will unlock when progress reaches 100%." : "Review weak modules, then retry the course final test."}</p>
                        <div class="final-result-actions">
                            <a class="btn-outline" href="${resultHref}">View Strengths and Weaknesses</a>
                        </div>
                        <button class="btn-outline" type="button" data-retry-final-test>Retry Final Test</button>
                    </div>
                `;
                return;
            }

            if (!finalTest.started) {
                elements.finalTest.innerHTML = `
                    <div class="final-test-intro">
                        <p>${escapeHtml(practiceExam.instructions || "This course assessment is completed inside the course workspace.")}</p>
                        <div class="selected-facts support-meta">
                            ${createMetaPill("Questions", String(questions.length))}
                            ${createMetaPill("Pass Mark", `${passMark}%`)}
                            ${createMetaPill("Mode", "Course practice")}
                        </div>
                        <button class="btn-primary" type="button" data-start-final-test>Start Course Final Test</button>
                    </div>
                `;
                return;
            }

            elements.finalTest.innerHTML = `
                <div class="final-test-questions">
                    ${questions.map((question, index) => `
                        <fieldset class="final-question">
                            <legend>${index + 1}. ${escapeHtml(question.prompt)}</legend>
                            ${question.options.map((option, optionIndex) => `
                                <label>
                                    <input type="radio" name="final-${index}" data-final-question="${index}" value="${optionIndex}" ${finalTest.answers?.[index] === optionIndex ? "checked" : ""}>
                                    <span>${escapeHtml(option)}</span>
                                </label>
                            `).join("")}
                        </fieldset>
                    `).join("")}
                    <button class="btn-primary" type="button" data-submit-final-test>Submit Course Final Test</button>
                </div>
            `;
        }

        function buildFinalTestQuestions() {
            return activeCourse.modules.slice(0, 10).map((module) => ({
                prompt: module.quiz.prompt,
                options: module.quiz.options,
                correctOption: module.quiz.correctOption
            }));
        }

        function submitFinalTest() {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            const questions = buildFinalTestQuestions();
            progress.finalTest ||= { started: true, submitted: false, answers: {}, score: 0, submittedAt: "" };

            const answeredCount = questions.filter((_, index) => Number.isInteger(progress.finalTest.answers?.[index])).length;
            if (answeredCount < questions.length) {
                setStatusMessage(`Answer all ${questions.length} final test questions before submitting.`, true);
                return;
            }

            const earned = questions.reduce((sum, question, index) => (
                sum + (Number(progress.finalTest.answers[index]) === Number(question.correctOption) ? 1 : 0)
            ), 0);
            progress.finalTest.score = Math.round((earned / questions.length) * 100);
            progress.finalTest.submitted = true;
            progress.finalTest.submittedAt = new Date().toISOString();
            markStudyActivity(progress);
            saveLearningState(latest);
            saveCourseResultForReview(progress, questions);
            setStatusMessage("Course final test submitted. Review your score below.", false);
            renderWorkspace();
        }

        function saveCourseResultForReview(progress, questions) {
            const categoryScores = activeCourse.modules.slice(0, questions.length).map((module, index) => {
                const correct = Number(progress.finalTest.answers[index]) === Number(questions[index].correctOption);
                return {
                    category: module.title,
                    score: correct ? 100 : 0
                };
            });
            const strengths = categoryScores.filter((item) => item.score >= 80).map((item) => item.category).slice(0, 4);
            const weakAreas = categoryScores.filter((item) => item.score < 80).map((item) => item.category).slice(0, 4);

            localStorage.setItem("submittedExamResults", JSON.stringify({
                examTitle: `${activeCourse.title} Final Test`,
                score: Number(progress.finalTest.score || 0),
                answeredCount: questions.length,
                totalQuestions: questions.length,
                strengths,
                weakAreas,
                performanceBreakdown: categoryScores,
                proctoringEvents: ["Course final test completed inside the learning workspace."],
                answerReview: questions.map((question, index) => ({
                    category: activeCourse.modules[index]?.title || "Course test",
                    question: question.prompt,
                    answer: question.options[progress.finalTest.answers[index]] || "No answer",
                    correctAnswer: question.options[question.correctOption] || "Review required",
                    explanation: activeCourse.modules[index]?.quiz?.rationale || ""
                }))
            }));
        }

        function renderResources(progress) {
            const module = activeCourse.modules[activeModuleIndex];
            const items = [];

            if (module.videoResourceUrl) {
                items.push({
                    label: "Lesson resource",
                    href: module.videoResourceUrl,
                    note: "Open the supporting video or lesson reference."
                });
            }

            items.push({
                label: "Course final test",
                href: "#course-final-test",
                note: "Complete practice assessment inside this course workspace."
            });

            if (progress.certificate?.id) {
                items.push({
                    label: "Completion certificate",
                    href: elements.certificateLink.href,
                    note: "View your unlocked certificate in a new tab."
                });
            }

            elements.resourceList.innerHTML = items
                .map((item) => `
                    <a class="resource-item" href="${escapeHtml(item.href)}" ${item.href.startsWith("http") ? "target=\"_blank\" rel=\"noopener\"" : ""}>
                        <strong>${escapeHtml(item.label)}</strong>
                        <span>${escapeHtml(item.note)}</span>
                    </a>
                `)
                .join("");
        }

        function startQuizTimer(module) {
            clearQuizTimer();

            if (!quizDeadlines[activeModuleIndex]) {
                quizDeadlines[activeModuleIndex] = Date.now() + (Number(module.quiz.timeLimitSeconds || 75) * 1000);
            }

            updateQuizTimerLabel();
            quizTimerHandle = window.setInterval(() => {
                updateQuizTimerLabel();
                if ((quizDeadlines[activeModuleIndex] || 0) <= Date.now()) {
                    clearQuizTimer();
                    submitQuiz(true);
                }
            }, 1000);
        }

        function clearQuizTimer() {
            if (quizTimerHandle) {
                window.clearInterval(quizTimerHandle);
                quizTimerHandle = null;
            }
        }

        function updateQuizTimerLabel() {
            const remaining = Math.max(0, Math.ceil(((quizDeadlines[activeModuleIndex] || 0) - Date.now()) / 1000));
            const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
            const seconds = String(remaining % 60).padStart(2, "0");
            elements.quizTimer.textContent = `Timed quiz: ${minutes}:${seconds}`;
        }

        function submitQuiz(timedOut) {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            const module = activeCourse.modules[activeModuleIndex];
            const selectedOption = elements.quizOptions.querySelector("input[type='radio']:checked");
            const selectedValue = selectedOption ? Number(selectedOption.value) : -1;
            const isCorrect = selectedValue === module.quiz.correctOption;

            progress.quizAnswers[activeModuleIndex] = selectedValue;
            progress.quizChecked[activeModuleIndex] = true;
            progress.quizPassed[activeModuleIndex] = isCorrect;
            progress.quizAttempts[activeModuleIndex] = Number(progress.quizAttempts[activeModuleIndex] || 0) + 1;
            progress.quizScores[activeModuleIndex] = isCorrect ? 100 : 0;
            markStudyActivity(progress);
            saveLearningState(latest);
            elements.workspaceSaveState.textContent = isCorrect ? "Knowledge check passed" : "Review and retry";
            delete quizDeadlines[activeModuleIndex];
            clearQuizTimer();

            if (timedOut && !selectedOption) {
                setStatusMessage("Time expired before an answer was submitted. Review the module and retry.", true);
            } else if (timedOut && selectedOption && !isCorrect) {
                setStatusMessage("Time expired and the answer was not correct. Review the rationale and retry.", true);
            } else if (isCorrect) {
                setStatusMessage("Knowledge check passed. You can now complete this module after reviewing the lesson.", false);
            } else {
                setStatusMessage("Knowledge check not passed yet. Review the flashcards and rationale, then try again.", true);
            }

            renderWorkspace();
        }

        function persistModulePosition() {
            const latest = getLearningState(courseList);
            const progress = ensureCourseProgress(latest, activeCourse);
            progress.currentModuleIndex = activeModuleIndex;
            markStudyActivity(progress);
            latest.selectedCourseId = activeCourse.id;
            saveLearningState(latest);
            elements.workspaceSaveState.textContent = "Synced";
        }

        function setStatusMessage(message, isError) {
            if (!elements.workspaceStatusMessage) {
                return;
            }

            elements.workspaceStatusMessage.textContent = message || "";
            elements.workspaceStatusMessage.classList.toggle("is-error", Boolean(isError));
            elements.workspaceStatusMessage.classList.toggle("is-success", Boolean(message) && !isError);
        }

        function resetFlashcards() {
            flashcardIndex = 0;
            flashcardFlipped = false;
        }
    }

    function renderCourseCard(course, state) {
        const enrolled = state.enrolledCourseIds.includes(course.id);
        const workspaceHref = `course-workspace.html?course=${encodeURIComponent(course.id)}`;
        const courseImage = escapeHtml(course.image || "../assets/nursing-hero.svg");
        const percent = getProgressPercent(course, state);

        return `
            <article class="course-card netacad-course-card reveal-on-scroll">
                <div class="netacad-card-icon" aria-hidden="true">
                    <img src="${courseImage}" alt="" loading="lazy">
                    <span>${escapeHtml(course.title.slice(0, 2).toUpperCase())}</span>
                </div>
                <div class="course-card-body">
                    <div class="course-card-top">
                        <div>
                            <span class="learning-type">${escapeHtml(course.format || "Self-paced")}</span>
                            <h3>${escapeHtml(course.title)}</h3>
                            <p>${escapeHtml(course.summary)}</p>
                        </div>
                        <span class="course-badge">${escapeHtml(course.badge)}</span>
                    </div>
                    <div class="course-meta">
                        ${createMetaPill("Track", course.category)}
                        ${createMetaPill("Level", course.difficulty)}
                        ${createMetaPill("Modules", `${course.modules.length}`)}
                    </div>
                    <div class="course-stats">
                        <div><strong>${Number(course.questions || 0).toLocaleString()}+</strong><span>Questions</span></div>
                        <div><strong>${Number(course.durationHours || 0)}h</strong><span>Guided hours</span></div>
                        <div><strong>${Number(course.exams || 0)}</strong><span>Assessments</span></div>
                    </div>
                    <div class="course-progress-inline">
                        <div class="progress-bar"><span style="width:${percent}%"></span></div>
                        <small>${percent}% complete</small>
                    </div>
                    <div class="course-actions">
                        <button class="btn-outline" data-select-course="${escapeHtml(course.id)}">Details</button>
                        <a class="btn-primary" href="${workspaceHref}" target="_blank" rel="noopener">Open Course</a>
                        <button class="${enrolled ? "btn-outline" : "btn-primary"}" data-enroll-course="${escapeHtml(course.id)}">${enrolled ? "Cancel" : "Enroll"}</button>
                        <a class="btn-outline" href="${workspaceHref}#course-final-test" target="_blank" rel="noopener">Final Test</a>
                    </div>
                </div>
            </article>
        `;
    }

    function matchesCategory(course, selectedCategory) {
        return selectedCategory === "All Courses" || course.category === selectedCategory;
    }

    function matchesDifficulty(course, selectedDifficulties) {
        return selectedDifficulties.length === 0 || selectedDifficulties.includes(course.difficulty);
    }

    function matchesSearch(course, searchValue) {
        if (!searchValue) {
            return true;
        }

        const haystack = [
            course.title,
            course.category,
            course.summary,
            ...(course.keywords || []),
            ...(course.outcomes || []),
            ...(course.facts || [])
        ].join(" ").toLowerCase();

        return haystack.includes(searchValue);
    }

    function sortCourses(left, right, sortMode) {
        if (sortMode === "questions") {
            return Number(right.questions || 0) - Number(left.questions || 0);
        }
        if (sortMode === "duration") {
            return Number(right.durationHours || 0) - Number(left.durationHours || 0);
        }
        if (sortMode === "title") {
            return left.title.localeCompare(right.title);
        }
        return Number(right.exams || 0) - Number(left.exams || 0);
    }

    function toggleEnrollment(state, course) {
        const enrolledIndex = state.enrolledCourseIds.indexOf(course.id);
        if (enrolledIndex === -1) {
            state.enrolledCourseIds.push(course.id);
            ensureCourseProgress(state, course);
            return;
        }

        const okay = window.confirm(
            `Cancel enrollment in "${course.title}"?\n\nYou can re-enroll any time and your saved notes and progress will still be available.`
        );
        if (!okay) {
            return;
        }

        state.enrolledCourseIds.splice(enrolledIndex, 1);
    }
});
