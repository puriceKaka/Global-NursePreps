(() => {
    const $ = (selector) => document.querySelector(selector);

    function slugify(value) {
        return String(value || "course")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "course";
    }

    function renderCourses() {
        const grid = $("#adminCourseGrid");
        const core = window.GnpLearning;
        if (!grid || !core) return;

        const courses = core.getCourses ? core.getCourses() : core.COURSE_META || [];
        grid.innerHTML = "";

        courses.forEach((course) => {
            const card = document.createElement("article");
            card.className = "admin-course-card";

            const image = document.createElement("img");
            image.src = course.image || "assets/course-images/default.jpg";
            image.alt = course.title;

            const badges = document.createElement("div");
            badges.className = "badge-row";

            const category = document.createElement("span");
            category.className = "badge";
            category.textContent = course.category;

            const difficulty = document.createElement("span");
            difficulty.className = "badge alt";
            difficulty.textContent = course.difficulty;

            const modules = document.createElement("span");
            modules.className = "badge alt";
            modules.textContent = `${course.moduleCount} modules`;

            badges.append(category, difficulty, modules);

            const title = document.createElement("h4");
            title.textContent = course.title;

            const summary = document.createElement("p");
            summary.className = "muted";
            summary.textContent = course.summary;

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "danger-button";
            remove.textContent = "Delete course";
            remove.addEventListener("click", () => {
                const ok = window.confirm(`Delete "${course.title}" from the homepage catalog?`);
                if (!ok) return;
                core.deleteCourse(course.id);
                renderCourses();
            });

            card.append(image, badges, title, summary, remove);
            grid.appendChild(card);
        });
    }

    function onSubmit(event) {
        event.preventDefault();
        const core = window.GnpLearning;
        if (!core) return;

        const title = ($("#titleInput")?.value || "").trim();
        const category = ($("#categoryInput")?.value || "").trim();
        const difficulty = ($("#difficultyInput")?.value || "Beginner").trim();
        const moduleCount = Number($("#moduleCountInput")?.value || 1);
        const image = ($("#imageInput")?.value || "assets/course-images/default.jpg").trim();
        const summary = ($("#summaryInput")?.value || "").trim();

        if (!title || !category || !summary) return;

        core.addCourse({
            id: `${slugify(title)}-${Date.now().toString(36)}`,
            title,
            category,
            difficulty,
            moduleCount,
            image,
            summary,
            badge: "Admin Added",
            format: "Self-paced",
            durationHours: 0,
            questions: 0,
            exams: 0
        });

        event.target.reset();
        $("#imageInput").value = "assets/course-images/default.jpg";
        $("#moduleCountInput").value = "3";
        renderCourses();
    }

    document.addEventListener("DOMContentLoaded", () => {
        $("#courseForm")?.addEventListener("submit", onSubmit);
        renderCourses();
    });
})();
