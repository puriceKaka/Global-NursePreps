document.addEventListener("DOMContentLoaded", async () => {
    if (document.body.dataset.page !== "landing") {
        return;
    }

    const {
        escapeHtml,
        fetchContent,
        getCourseById,
        revealElements
    } = window.ExamPrep;

    const content = await fetchContent();
    const settings = content.settings || {};
    const courses = Array.isArray(content.courses) ? content.courses : [];
    const hero = settings.hero || {};
    const announcement = settings.announcement || {};

    const primaryButtons = ["go-courses", "cta-courses"].map((id) => document.getElementById(id)).filter(Boolean);
    const secondaryButtons = ["go-lobby", "cta-lobby"].map((id) => document.getElementById(id)).filter(Boolean);

    const navigate = (path) => {
        window.location.href = path;
    };

    primaryButtons.forEach((button) => {
        button.textContent = hero.primaryCtaLabel || "Explore Courses";
        button.addEventListener("click", () => navigate("courses.html"));
    });

    secondaryButtons.forEach((button) => {
        button.textContent = hero.secondaryCtaLabel || "Open Exam Center";
        button.addEventListener("click", () => navigate("exam-lobby/exam-lobby.html"));
    });

    const heroImage = document.getElementById("landing-hero-image");
    document.getElementById("landing-hero-eyebrow").textContent = hero.eyebrow || "Global Nurse Training and Exam Prep";
    document.getElementById("landing-hero-title").textContent = hero.title || "GlobalNursePrep";
    document.getElementById("landing-hero-lead").textContent = hero.lead || "Study inside a professional nursing exam learning workspace.";
    if (heroImage && hero.image) {
        heroImage.src = hero.image;
    }

    document.getElementById("announcement-label").textContent = announcement.label || "Platform Update";
    document.getElementById("announcement-message").textContent = announcement.message || "The workspace now supports timed quizzes, flashcards, and saved progress.";

    const announcementLink = document.getElementById("announcement-link");
    if (announcementLink) {
        announcementLink.textContent = announcement.actionLabel || "Open Courses";
        announcementLink.href = announcement.actionHref || "courses.html";
    }

    renderHeroProof(courses);
    renderStats(settings.stats);
    renderFeaturedPrograms(settings.featuredCourseIds, courses);
    renderHighlights(settings.studentHighlights);
    revealElements(document.querySelectorAll(".reveal-on-scroll"));

    function renderHeroProof(courseList) {
        const totalQuestions = courseList.reduce((sum, course) => sum + Number(course.questions || 0), 0);
        const totalModules = courseList.reduce((sum, course) => sum + Number(course.modules?.length || 0), 0);
        const totalHours = courseList.reduce((sum, course) => sum + Number(course.durationHours || 0), 0);
        const proofGrid = document.getElementById("landing-proof-grid");

        proofGrid.innerHTML = [
            { value: `${courseList.length}`, label: "Learning tracks" },
            { value: `${totalQuestions.toLocaleString()}+`, label: "Practice questions" },
            { value: `${totalHours}h`, label: "Guided study hours" }
        ]
            .map((item) => `<div><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></div>`)
            .join("");

        const heading = document.querySelector(".featured-programs .section-heading h2");
        if (heading && totalModules) {
            heading.textContent = `Choose the path that matches your exam goal across ${totalModules} guided modules.`;
        }
    }

    function renderStats(stats) {
        const band = document.getElementById("landing-stats-band");
        const entries = Array.isArray(stats) && stats.length
            ? stats
            : [
                { value: String(courses.length), label: "Learning tracks" },
                { value: "5,000+", label: "Practice questions" },
                { value: "15", label: "Guided modules" },
                { value: "Auto", label: "Progress sync" }
            ];

        band.innerHTML = entries
            .map((item) => `
                <div class="stat-item">
                    <strong>${escapeHtml(item.value)}</strong>
                    <span>${escapeHtml(item.label)}</span>
                </div>
            `)
            .join("");
    }

    function renderFeaturedPrograms(featuredIds, courseList) {
        const featuredGrid = document.getElementById("featured-programs-grid");
        const resolvedIds = Array.isArray(featuredIds) && featuredIds.length ? featuredIds : courseList.slice(0, 3).map((course) => course.id);
        const featuredCourses = resolvedIds.map((courseId) => getCourseById(courseList, courseId)).filter(Boolean);

        featuredGrid.innerHTML = featuredCourses
            .map((course) => `
                <article class="program-card">
                    <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" class="program-image">
                    <div class="program-body">
                        <span class="program-tag">${escapeHtml(course.category)}</span>
                        <h3>${escapeHtml(course.title)}</h3>
                        <p>${escapeHtml(course.summary)}</p>
                        <a href="courses.html?course=${encodeURIComponent(course.id)}" class="text-link">Open learning track</a>
                    </div>
                </article>
            `)
            .join("");
    }

    function renderHighlights(highlights) {
        const grid = document.getElementById("student-highlights-grid");
        const items = Array.isArray(highlights) && highlights.length
            ? highlights
            : [
                {
                    title: "Structured pathways",
                    description: "Clear course tracks for learners preparing for major nursing exams."
                },
                {
                    title: "Course workspace engine",
                    description: "Sidebar navigation, timed quizzes, progress bars, and locked module flow."
                },
                {
                    title: "Weak-area coaching",
                    description: "Missed questions immediately surface the next topic to revisit."
                }
            ];

        grid.innerHTML = items
            .map((item) => `
                <article class="program-card highlight-card">
                    <div class="program-body">
                        <span class="program-tag">Learning Feature</span>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description)}</p>
                    </div>
                </article>
            `)
            .join("");
    }
});
