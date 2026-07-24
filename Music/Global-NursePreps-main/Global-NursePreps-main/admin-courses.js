(() => {
    const $ = (selector) => document.querySelector(selector);

    function slugify(value) {
        return String(value || "course")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "course";
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Failed to read notes file"));
            reader.readAsText(file);
        });
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Failed to read image file"));
            reader.readAsDataURL(file);
        });
    }

    function parseModuleTitles(rawValue, fallbackCount, courseTitle) {
        const lines = String(rawValue || "")
            .split(/\r?\n/)
            .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
            .filter(Boolean);

        if (lines.length) {
            return lines;
        }

        const count = Math.max(1, Number(fallbackCount || 1));
        const base = String(courseTitle || "Course").trim();
        return Array.from({ length: count }, (_, index) => `${base} Module ${index + 1}`);
    }

    function parseLines(rawValue) {
        return String(rawValue || "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function parseStructuredRows(rawValue, defaults = {}) {
        return parseLines(rawValue).map((line, index) => {
            const parts = line.split("|").map((part) => part.trim());
            return {
                id: `${defaults.prefix || "item"}-${index + 1}`,
                title: parts[0] || `${defaults.label || "Item"} ${index + 1}`,
                type: parts[1] || defaults.type || "",
                dueDate: parts[1] && /marks?|pass|score/i.test(parts[2] || "") ? "" : (parts[1] || ""),
                marks: parts[2] || defaults.marks || "",
                link: parts[2] && !/marks?|pass|score/i.test(parts[2]) ? parts[2] : (parts[3] || ""),
                instructions: parts[3] || defaults.instructions || ""
            };
        });
    }

    function buildGeneratedLessons({ title, unit, subunit, category, difficulty, summary, contentNotes, moduleTitles }) {
        const notes = cleanNotesText(contentNotes);
        const sourceLines = notes
            ? notes.split(/\n+/).map((line) => line.trim()).filter(Boolean)
            : [];
        const conceptSeed = [unit, subunit, category, difficulty, "Nursing practice"].filter(Boolean);

        return moduleTitles.map((moduleTitle, index) => {
            const noteSlice = sourceLines.slice(index * 2, index * 2 + 3).join(" ").trim();
            const body = noteSlice || notes || `${moduleTitle} supports the learning path for ${title}.`;
            const objective = `Understand ${moduleTitle} within the ${unit || category || "course"} unit.`;
            const lectureTitle = subunit ? `${unit || category} • ${subunit}` : unit || category || "Course module";

            return {
                title: moduleTitle,
                lectureTitle,
                objective,
                body,
                concepts: [
                    moduleTitle,
                    conceptSeed[index % conceptSeed.length] || category || title,
                    summary || `${title} study guide`
                ].filter(Boolean).slice(0, 3),
                summary: `${moduleTitle} for ${title}.`,
                tutorScript: `Focus on ${moduleTitle}, the safest nursing action, and the reason behind the answer.`,
                quiz: {
                    prompt: `What is the main study focus of ${moduleTitle}?`,
                    options: [
                        moduleTitle,
                        category || unit || title,
                        "A random unrelated topic",
                        "The final exam only"
                    ],
                    correct: 0,
                    rationale: `Correct. ${moduleTitle} is the core focus of this module.`
                }
            };
        });
    }

    function cleanNotesText(value) {
        return String(value || "")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function looksLikePdf(file) {
        return Boolean(file && (/\.pdf$/i.test(file.name || "") || file.type === "application/pdf"));
    }

    function normalizeLessons(payload) {
        if (!payload) return [];
        const lessons = Array.isArray(payload) ? payload : payload.lessons;
        if (!Array.isArray(lessons)) return [];
        return lessons
            .map((lesson, index) => ({
                title: String(lesson?.title || `Lesson ${index + 1}`).trim(),
                lectureTitle: String(lesson?.lectureTitle || lesson?.title || `Lesson ${index + 1}`).trim(),
                objective: String(lesson?.objective || lesson?.title || "").trim(),
                body: String(lesson?.body || lesson?.summary || "").trim(),
                concepts: Array.isArray(lesson?.concepts) ? lesson.concepts.map((item) => String(item || "").trim()).filter(Boolean) : []
            }))
            .filter((lesson) => lesson.title && lesson.body);
    }

    function populateCategoryOptions() {
        const core = window.GnpLearning;
        const datalist = $("#categoryOptions");
        if (!core || !datalist) return;

        const escapeHtml = (value) => String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

        const options = new Set();
        const courses = core.getCourses ? core.getCourses() : core.COURSE_META || [];
        courses.forEach((course) => {
            [course.category, course.unit, course.subunit]
                .map((value) => String(value || "").trim())
                .filter(Boolean)
                .forEach((value) => options.add(value));
        });

        datalist.innerHTML = Array.from(options)
            .sort((left, right) => left.localeCompare(right))
            .map((value) => `<option value="${escapeHtml(value)}"></option>`)
            .join("");
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

            const unit = document.createElement("span");
            unit.className = "badge";
            unit.textContent = course.unit || course.category;

            badges.append(unit, category, difficulty, modules);

            const title = document.createElement("h4");
            title.textContent = course.title;

            const courseMeta = document.createElement("p");
            courseMeta.className = "muted small";
            courseMeta.textContent = [course.subunit, course.lectureVideo ? "Video attached" : ""].filter(Boolean).join(" • ");

            const modulePreview = document.createElement("div");
            modulePreview.className = "course-module-preview";
            const moduleTitles = Array.isArray(course.moduleTitles) ? course.moduleTitles : [];
            modulePreview.textContent = moduleTitles.length
                ? moduleTitles.slice(0, 3).join(" • ")
                : `${course.moduleCount} module${course.moduleCount === 1 ? "" : "s"} ready`;

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

            card.append(image, badges, title, courseMeta, modulePreview, summary, remove);
            grid.appendChild(card);
        });

        populateCategoryOptions();
    }

    async function onSubmit(event) {
        event.preventDefault();
        const core = window.GnpLearning;
        if (!core) return;

        const title = ($("#titleInput")?.value || "").trim();
        const unit = ($("#unitInput")?.value || "").trim();
        const subunit = ($("#subunitInput")?.value || "").trim();
        const category = ($("#categoryInput")?.value || "").trim();
        const faculty = ($("#facultyInput")?.value || "").trim();
        const department = ($("#departmentInput")?.value || "").trim();
        const courseCode = ($("#courseCodeInput")?.value || "").trim();
        const difficulty = ($("#difficultyInput")?.value || "Beginner").trim();
        const moduleCount = Number($("#moduleCountInput")?.value || 1);
        const durationHours = Number($("#durationInput")?.value || 0);
        const language = ($("#languageInput")?.value || "English").trim();
        const price = Number($("#priceInput")?.value || 0);
        const moduleTitles = parseModuleTitles($("#moduleTitlesInput")?.value || "", moduleCount, title);
        const image = ($("#imageInput")?.value || "assets/course-images/default.jpg").trim();
        const courseImageFile = $("#courseImageInput")?.files?.[0] || null;
        const backgroundImageFile = $("#backgroundImageInput")?.files?.[0] || null;
        const documentImageFile = $("#documentImageInput")?.files?.[0] || null;
        const videoUrl = ($("#videoUrlInput")?.value || "").trim();
        const videoFile = $("#videoFileInput")?.files?.[0] || null;
        const lectureVideo = videoFile ? await readFileAsDataUrl(videoFile) : videoUrl;
        const notesFile = $("#notesFileInput")?.files?.[0] || null;
        const summary = ($("#summaryInput")?.value || "").trim();
        const rawNotes = cleanNotesText($("#contentNotesInput")?.value || "");
        const backgroundImage = backgroundImageFile ? await readFileAsDataUrl(backgroundImageFile) : image;
        const documentCoverImage = documentImageFile
            ? await readFileAsDataUrl(documentImageFile)
            : (courseImageFile ? await readFileAsDataUrl(courseImageFile) : "");
        const courseCoverImage = documentCoverImage || backgroundImage || image;

        let contentNotes = rawNotes;
        let generatedLessons = [];

        if (notesFile && looksLikePdf(notesFile)) {
            try {
                const pdfDataUrl = await readFileAsDataUrl(notesFile);
                const result = await window.GnpAdminApi?.generateLessonsFromPdf?.({
                    fileName: notesFile.name,
                    pdfDataUrl
                });
                contentNotes = cleanNotesText(result?.contentNotes || rawNotes);
                generatedLessons = normalizeLessons(result?.lessons || result?.generatedLessons);
            } catch (error) {
                console.error("PDF lesson generation failed", error);
                contentNotes = cleanNotesText(rawNotes || `Uploaded PDF: ${notesFile.name}`);
                generatedLessons = [];
            }
        } else if (notesFile && /\.(txt|md|rtf)$/i.test(notesFile.name)) {
            contentNotes = cleanNotesText(await readFileAsText(notesFile));
        }

        if (!contentNotes && notesFile) {
            contentNotes = `Uploaded study file: ${notesFile.name}\nUse the notes field to paste the extracted lecture text so students get full generated study notes.`;
        }

        if (!generatedLessons.length && contentNotes) {
            generatedLessons = normalizeLessons({
                lessons: buildGeneratedLessons({
                    title,
                    unit,
                    subunit,
                    category,
                    difficulty,
                    summary,
                    contentNotes,
                    moduleTitles
                })
            });
        }

        if (!title || !category || !summary) return;

        core.addCourse({
            id: `${slugify(title)}-${Date.now().toString(36)}`,
            title,
            unit,
            subunit,
            category,
            faculty,
            department,
            courseCode,
            difficulty,
            language,
            prerequisites: parseLines($("#prerequisitesInput")?.value || ""),
            learningOutcomes: parseLines($("#learningOutcomesInput")?.value || ""),
            moduleCount,
            access: price > 0 ? "paid" : "free",
            price,
            image: courseCoverImage,
            documentCoverImage,
            courseImage: courseCoverImage,
            lessonBackgroundImage: backgroundImage,
            summary,
            contentNotes,
            moduleTitles,
            uploadedDocument: notesFile ? {
                name: notesFile.name,
                type: notesFile.type,
                size: notesFile.size
            } : null,
            generatedLessons,
            assignments: parseStructuredRows($("#assignmentsInput")?.value || "", { prefix: "assignment", label: "Assignment", type: "Assignment" }),
            assessments: parseStructuredRows($("#assessmentsInput")?.value || "", { prefix: "assessment", label: "Assessment", type: "Assessment" }),
            resources: parseStructuredRows($("#resourcesInput")?.value || "", { prefix: "resource", label: "Resource" }),
            announcements: parseLines($("#announcementsInput")?.value || "").map((message, index) => ({
                id: `announcement-${index + 1}`,
                title: `Announcement ${index + 1}`,
                message,
                createdAt: new Date().toISOString()
            })),
            lectureVideo,
            lectureVideoName: videoFile?.name || "",
            lectureVideoSource: videoFile?.name || videoUrl || "",
            badge: "Admin Added",
            format: "Self-paced",
            durationHours,
            questions: 0,
            exams: 0
        });

        event.target.reset();
        $("#imageInput").value = "assets/course-images/default.jpg";
        $("#moduleCountInput").value = "3";
        $("#videoUrlInput").value = "";
        $("#contentNotesInput").value = "";
        $("#backgroundImageInput").value = "";
        $("#documentImageInput").value = "";
        $("#moduleTitlesInput").value = "";
        $("#courseImageInput").value = "";
        $("#languageInput").value = "English";
        renderCourses();
        populateCategoryOptions();
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const user = await window.GnpAdminAuth?.requireAdmin?.("admin.html");
        if (!user) return;
        $("#courseForm")?.addEventListener("submit", onSubmit);
        populateCategoryOptions();
        renderCourses();
        if (window.GnpLearning?.refreshCourses) {
            void window.GnpLearning.refreshCourses().then(() => renderCourses());
        }
        window.addEventListener("gnp-courses-updated", () => {
            populateCategoryOptions();
            renderCourses();
        });
    });
})();
