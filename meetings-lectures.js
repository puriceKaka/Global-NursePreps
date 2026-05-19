(() => {
    const MEETINGS_KEY = "gnp_lecturer_meetings";
    const $ = (selector) => document.querySelector(selector);

    function readJson(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || "");
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatDate(value) {
        if (!value) return "Date pending";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function getMeetings() {
        return readJson(MEETINGS_KEY, [])
            .filter((meeting) => meeting && typeof meeting === "object")
            .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    }

    function lectures() {
        return (window.GnpLmsData?.courses || []).flatMap((course) => (
            window.GnpLmsData.flattenLessons(course).map((lesson) => ({ ...lesson, courseId: course.id, courseTitle: course.title, category: course.category }))
        ));
    }

    function openLecture(meeting) {
        const link = String(meeting.link || "").trim();
        if (/^https?:\/\//i.test(link)) {
            window.open(link, "_blank", "noopener");
            return;
        }
        const joinInput = $("#joinCodeInput");
        const nameInput = $("#userNameInput");
        if (joinInput) joinInput.value = link || meeting.id || "";
        if (nameInput && nameInput.value === "Guest") nameInput.value = "Student";
        $("#joinMeetingBtn")?.click();
    }

    function renderMetrics() {
        const lectureCount = lectures().length;
        const meetingCount = getMeetings().length;
        const courseCount = window.GnpLmsData?.courses?.length || 0;
        $("#lectureMetrics").innerHTML = [
            ["Courses", courseCount],
            ["Lectures", lectureCount],
            ["Live Sessions", meetingCount]
        ].map(([label, value]) => `<div class="lms-metric"><strong>${value}</strong><span>${label}</span></div>`).join("");
    }

    function renderFilters() {
        const select = $("#lectureCourseFilter");
        if (!select) return;
        const courses = window.GnpLmsData?.courses || [];
        select.innerHTML = `<option value="All">All Courses</option>${courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join("")}`;
    }

    function renderScheduledLectures() {
        const container = $("#scheduledLectures");
        if (!container) return;
        const meetings = getMeetings();
        container.innerHTML = meetings.map((meeting) => `
            <article class="lms-note">
                <strong>${escapeHtml(meeting.title || "Lecture")}</strong>
                <p class="lms-muted">${escapeHtml(meeting.groupName || "Course group")} - ${escapeHtml(formatDate(meeting.date))}</p>
                <p class="lms-muted">Lecturer: ${escapeHtml(meeting.lecturerName || "Lecturer")}</p>
                <button type="button" class="lms-button" data-open-lecture="${escapeHtml(meeting.id)}">Join Lecture</button>
            </article>
        `).join("") || `<article class="lms-note"><strong>No live lectures scheduled</strong><p class="lms-muted">Lecturer sessions will appear here after they are scheduled.</p></article>`;
    }

    function renderLectureLibrary() {
        const query = ($("#lectureSearch")?.value || "").trim().toLowerCase();
        const courseFilter = $("#lectureCourseFilter")?.value || "All";
        const items = lectures().filter((lecture) => {
            const text = [lecture.title, lecture.lectureTitle, lecture.courseTitle, lecture.category, lecture.termTitle, ...lecture.concepts].join(" ").toLowerCase();
            return (!query || text.includes(query)) && (courseFilter === "All" || lecture.courseId === courseFilter);
        });
        $("#lectureLibrary").innerHTML = items.map((lecture) => `
            <article class="lms-note">
                <strong>${escapeHtml(lecture.title)}</strong>
                <p class="lms-muted">${escapeHtml(lecture.courseTitle)} - ${escapeHtml(lecture.termTitle)} - ${lecture.duration} min</p>
                <p>${escapeHtml(lecture.objective)}</p>
                <div class="lms-chip-row">${lecture.concepts.map((concept) => `<span class="lms-chip">${escapeHtml(concept)}</span>`).join("")}</div>
                <div class="lms-actions" style="margin-top:0.7rem;">
                    <a class="lms-button" href="EXAMINATION%20PREP%20SITE/course-workspace.html?course=${encodeURIComponent(lecture.courseId)}">Open in Course</a>
                </div>
            </article>
        `).join("") || `<article class="lms-note"><strong>No lectures found</strong><p class="lms-muted">Try another course or search term.</p></article>`;
    }

    function setupQuestionGenerator() {
        const fileInput = $("#lectureFileElem");
        const fileName = $("#lectureFileName");
        const generateButton = $("#lectureGenerateBtn");
        const preview = $("#lectureQuestionsPreview");
        const dropArea = $("#lectureDropArea");

        if (!fileInput || !generateButton || !preview || !fileName) return;
        fileInput.addEventListener("change", (event) => {
            const [file] = event.target.files;
            fileName.textContent = file ? file.name : "No file selected";
            generateButton.disabled = !file;
            dropArea?.classList.toggle("has-file", Boolean(file));
        });

        generateButton.addEventListener("click", () => {
            if (fileName.textContent === "No file selected") return;
            preview.innerHTML = `
                <article class="lms-note">
                    <strong>Generated Lecture Questions</strong>
                    <ol>
                        <li>Which assessment finding from this lecture requires priority action?</li>
                        <li>Which nursing intervention is safest based on the patient cue?</li>
                        <li>Which teaching point should the nurse confirm before discharge?</li>
                        <li>Which option is unsafe, and what rationale explains why?</li>
                    </ol>
                </article>
            `;
        });
    }

    function renderAll() {
        renderMetrics();
        renderScheduledLectures();
        renderLectureLibrary();
    }

    document.addEventListener("DOMContentLoaded", () => {
        renderFilters();
        setupQuestionGenerator();
        renderAll();
        $("#scheduledLectures")?.addEventListener("click", (event) => {
            const id = event.target.dataset.openLecture;
            if (!id) return;
            const meeting = getMeetings().find((item) => item.id === id);
            if (meeting) openLecture(meeting);
        });
        $("#refreshLecturesBtn")?.addEventListener("click", renderAll);
        $("#lectureSearch")?.addEventListener("input", renderLectureLibrary);
        $("#lectureCourseFilter")?.addEventListener("change", renderLectureLibrary);
    });
})();
