document.addEventListener("DOMContentLoaded", async () => {
    if (document.body.dataset.page !== "admin-exam-prep" || !window.ExamPrep) {
        return;
    }

    const {
        clone,
        fetchContent,
        revealElements
    } = window.ExamPrep;

    const statusBanner = document.getElementById("admin-status-banner");
    const refreshButton = document.getElementById("refresh-content-btn");
    const saveSettingsButton = document.getElementById("save-settings-btn");
    const saveCourseButton = document.getElementById("save-course-btn");
    const saveJsonButton = document.getElementById("save-json-btn");
    const saveAllButton = document.getElementById("save-all-btn");
    const courseSelect = document.getElementById("course-select");

    const fields = {
        heroEyebrow: document.getElementById("hero-eyebrow-input"),
        heroTitle: document.getElementById("hero-title-input"),
        heroLead: document.getElementById("hero-lead-input"),
        heroImage: document.getElementById("hero-image-input"),
        heroPrimaryCta: document.getElementById("hero-primary-cta-input"),
        heroSecondaryCta: document.getElementById("hero-secondary-cta-input"),
        announcementLabel: document.getElementById("announcement-label-input"),
        announcementMessage: document.getElementById("announcement-message-input"),
        announcementActionLabel: document.getElementById("announcement-action-label-input"),
        announcementActionHref: document.getElementById("announcement-action-href-input"),
        courseTitle: document.getElementById("course-title-input"),
        courseCategory: document.getElementById("course-category-input"),
        courseDifficulty: document.getElementById("course-difficulty-input"),
        courseBadge: document.getElementById("course-badge-input"),
        courseDuration: document.getElementById("course-duration-input"),
        courseQuestions: document.getElementById("course-questions-input"),
        courseExams: document.getElementById("course-exams-input"),
        courseFormat: document.getElementById("course-format-input"),
        courseSummary: document.getElementById("course-summary-input"),
        courseImage: document.getElementById("course-image-input"),
        practiceExamJson: document.getElementById("practice-exam-json-input"),
        modulesJson: document.getElementById("modules-json-input"),
        fullContentJson: document.getElementById("full-content-json")
    };

    let content = await loadLatestContent();
    populateSettings(content.settings || {});
    populateCourseSelect(content.courses || []);
    populateCourseEditor(content.courses?.[0] || null);
    populateFullJson(content);
    revealElements(document.querySelectorAll(".reveal-on-scroll"));

    courseSelect.addEventListener("change", () => {
        const course = getSelectedCourse();
        populateCourseEditor(course);
    });

    refreshButton.addEventListener("click", async () => {
        content = await loadLatestContent(true);
        populateSettings(content.settings || {});
        populateCourseSelect(content.courses || []);
        populateCourseEditor(getSelectedCourse());
        populateFullJson(content);
        showStatus("Content refreshed from the backend store.", false);
    });

    saveSettingsButton.addEventListener("click", async () => {
        const nextSettings = {
            ...(content.settings || {}),
            hero: {
                ...(content.settings?.hero || {}),
                eyebrow: fields.heroEyebrow.value.trim(),
                title: fields.heroTitle.value.trim(),
                lead: fields.heroLead.value.trim(),
                image: fields.heroImage.value.trim(),
                primaryCtaLabel: fields.heroPrimaryCta.value.trim(),
                secondaryCtaLabel: fields.heroSecondaryCta.value.trim()
            },
            announcement: {
                ...(content.settings?.announcement || {}),
                label: fields.announcementLabel.value.trim(),
                message: fields.announcementMessage.value.trim(),
                actionLabel: fields.announcementActionLabel.value.trim(),
                actionHref: fields.announcementActionHref.value.trim()
            }
        };

        const response = await fetch("/api/exam-prep/settings", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ settings: nextSettings })
        });

        await handleSaveResponse(response, "Settings saved.");
    });

    saveCourseButton.addEventListener("click", async () => {
        const selectedCourse = getSelectedCourse();
        if (!selectedCourse) {
            showStatus("Select a course before saving.", true);
            return;
        }

        let practiceExam;
        let modules;
        try {
            practiceExam = JSON.parse(fields.practiceExamJson.value);
        } catch {
            showStatus("Practice exam JSON is not valid.", true);
            return;
        }

        try {
            modules = JSON.parse(fields.modulesJson.value);
        } catch {
            showStatus("Modules JSON is not valid.", true);
            return;
        }

        const nextCourse = {
            ...selectedCourse,
            title: fields.courseTitle.value.trim(),
            category: fields.courseCategory.value.trim(),
            difficulty: fields.courseDifficulty.value.trim(),
            badge: fields.courseBadge.value.trim(),
            durationHours: Number(fields.courseDuration.value || 0),
            questions: Number(fields.courseQuestions.value || 0),
            exams: Number(fields.courseExams.value || 0),
            format: fields.courseFormat.value.trim(),
            summary: fields.courseSummary.value.trim(),
            image: fields.courseImage.value.trim(),
            practiceExam,
            modules
        };

        const response = await fetch(`/api/exam-prep/courses/${encodeURIComponent(selectedCourse.id)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ course: nextCourse })
        });

        await handleSaveResponse(response, `Course "${selectedCourse.title}" saved.`);
    });

    saveJsonButton.addEventListener("click", async () => {
        await saveFullContentFromJson();
    });

    saveAllButton.addEventListener("click", async () => {
        await saveFullContentFromJson();
    });

    function populateSettings(settings) {
        const hero = settings.hero || {};
        const announcement = settings.announcement || {};

        fields.heroEyebrow.value = hero.eyebrow || "";
        fields.heroTitle.value = hero.title || "";
        fields.heroLead.value = hero.lead || "";
        fields.heroImage.value = hero.image || "";
        fields.heroPrimaryCta.value = hero.primaryCtaLabel || "";
        fields.heroSecondaryCta.value = hero.secondaryCtaLabel || "";
        fields.announcementLabel.value = announcement.label || "";
        fields.announcementMessage.value = announcement.message || "";
        fields.announcementActionLabel.value = announcement.actionLabel || "";
        fields.announcementActionHref.value = announcement.actionHref || "";
    }

    function populateCourseSelect(courses) {
        const selectedId = courseSelect.value || courses[0]?.id || "";
        courseSelect.innerHTML = courses
            .map((course) => `<option value="${course.id}">${course.title}</option>`)
            .join("");
        courseSelect.value = courses.some((course) => course.id === selectedId) ? selectedId : courses[0]?.id || "";
    }

    function populateCourseEditor(course) {
        if (!course) {
            return;
        }

        fields.courseTitle.value = course.title || "";
        fields.courseCategory.value = course.category || "";
        fields.courseDifficulty.value = course.difficulty || "";
        fields.courseBadge.value = course.badge || "";
        fields.courseDuration.value = String(course.durationHours ?? "");
        fields.courseQuestions.value = String(course.questions ?? "");
        fields.courseExams.value = String(course.exams ?? "");
        fields.courseFormat.value = course.format || "";
        fields.courseSummary.value = course.summary || "";
        fields.courseImage.value = course.image || "";
        fields.practiceExamJson.value = JSON.stringify(course.practiceExam || {}, null, 2);
        fields.modulesJson.value = JSON.stringify(course.modules || [], null, 2);
    }

    function populateFullJson(currentContent) {
        fields.fullContentJson.value = JSON.stringify(currentContent, null, 2);
    }

    function getSelectedCourse() {
        return (content.courses || []).find((course) => course.id === courseSelect.value) || null;
    }

    async function saveFullContentFromJson() {
        let nextContent;
        try {
            nextContent = JSON.parse(fields.fullContentJson.value);
        } catch {
            showStatus("Full content JSON is not valid.", true);
            return;
        }

        const response = await fetch("/api/exam-prep/content", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content: nextContent })
        });

        await handleSaveResponse(response, "Full content saved.");
    }

    async function loadLatestContent(force = false) {
        if (force) {
            content = clone(await fetchContent(true));
            return content;
        }

        content = clone(await fetchContent());
        return content;
    }

    async function handleSaveResponse(response, successMessage) {
        if (!response.ok) {
            const payload = await safeResponseJson(response);
            showStatus(payload?.error || "Save failed.", true);
            return;
        }

        const payload = await safeResponseJson(response);
        content = clone(payload?.content || content);
        populateSettings(content.settings || {});
        populateCourseSelect(content.courses || []);
        populateCourseEditor(getSelectedCourse());
        populateFullJson(content);
        showStatus(successMessage, false);
    }

    async function safeResponseJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    function showStatus(message, isError) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "is-error", "is-success");
        statusBanner.classList.add(isError ? "is-error" : "is-success");
    }
});
