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
        return date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getMeetings() {
        return readJson(MEETINGS_KEY, [])
            .filter((meeting) => meeting && typeof meeting === "object")
            .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
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

    function renderLectures() {
        const container = $("#scheduledLectures");
        if (!container) return;

        const meetings = getMeetings();
        container.innerHTML = meetings.map((meeting) => `
            <article class="lecture-card">
                <h3>${escapeHtml(meeting.title || "Lecture")}</h3>
                <p>${escapeHtml(meeting.groupName || "Course group")} • ${escapeHtml(formatDate(meeting.date))}</p>
                <p>Lecturer: ${escapeHtml(meeting.lecturerName || "Lecturer")}</p>
                <button type="button" class="primary-button" data-open-lecture="${escapeHtml(meeting.id)}">Join lecture</button>
            </article>
        `).join("") || `<article class="lecture-card"><h3>No lectures scheduled</h3><p>Lecturer sessions will appear here after they are scheduled.</p></article>`;
    }

    function handleClick(event) {
        const id = event.target.dataset.openLecture;
        if (!id) return;
        const meeting = getMeetings().find((item) => item.id === id);
        if (meeting) openLecture(meeting);
    }

    function setupQuizGenerator() {
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
            preview.innerHTML = `<p>Generating lecture questions from "<strong>${escapeHtml(fileName.textContent)}</strong>"...</p><div class="loading-spinner"></div>`;
            window.setTimeout(() => {
                preview.innerHTML = `
                    <h3>Generated Lecture Questions</h3>
                    <ol>
                        <li>Which assessment finding should the nurse prioritize from this lecture topic?</li>
                        <li>Which patient teaching point is safest for this condition?</li>
                        <li>Which action should be completed before giving medication?</li>
                    </ol>
                `;
            }, 900);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        renderLectures();
        setupQuizGenerator();
        $("#scheduledLectures")?.addEventListener("click", handleClick);
        $("#refreshLecturesBtn")?.addEventListener("click", renderLectures);
    });
})();
