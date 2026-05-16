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

    document.addEventListener("DOMContentLoaded", () => {
        renderLectures();
        $("#scheduledLectures")?.addEventListener("click", handleClick);
        $("#refreshLecturesBtn")?.addEventListener("click", renderLectures);
    });
})();
