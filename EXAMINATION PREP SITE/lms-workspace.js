(() => {
    const $ = (selector) => document.querySelector(selector);
    let course;
    let lessons;
    let state;
    let progress;
    let activeIndex = 0;
    let synthUtterance = null;

    function readState() {
        const loaded = window.GnpLearning?.loadState?.() || {};
        loaded.enrolledCourseIds = Array.isArray(loaded.enrolledCourseIds) ? loaded.enrolledCourseIds : [];
        loaded.progress = loaded.progress && typeof loaded.progress === "object" ? loaded.progress : {};
        return loaded;
    }

    function saveState() {
        progress.currentLesson = activeIndex;
        progress.lastVisited = new Date().toISOString();
        state.selectedCourseId = course.id;
        window.GnpLearning?.saveState?.(state);
    }

    function ensureProgress() {
        state.progress[course.id] ||= {};
        progress = state.progress[course.id];
        progress.currentLesson = Number.isFinite(progress.currentLesson) ? progress.currentLesson : 0;
        progress.watchedLessons = Array.isArray(progress.watchedLessons) ? progress.watchedLessons : [];
        progress.readLessons = Array.isArray(progress.readLessons) ? progress.readLessons : [];
        progress.completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
        progress.quizPassed = progress.quizPassed && typeof progress.quizPassed === "object" ? progress.quizPassed : {};
        progress.notes = progress.notes && typeof progress.notes === "object" ? progress.notes : {};
        progress.bookmarks = Array.isArray(progress.bookmarks) ? progress.bookmarks : [];
        progress.flashcards = Array.isArray(progress.flashcards) ? progress.flashcards : [];
    }

    function isUnlocked(index) {
        return index === 0 || progress.quizPassed[lessons[index - 1].id] === true;
    }

    function percent() {
        return lessons.length ? Math.round((progress.completedLessons.length / lessons.length) * 100) : 0;
    }

    function renderShell() {
        $("#courseKicker").textContent = course.category;
        $("#courseTitle").textContent = course.title;
        $("#courseSummary").textContent = course.summary;
        $("#courseImage").src = course.image;
        $("#courseImage").alt = course.title;
        $("#courseMetrics").innerHTML = [
            ["Lectures", lessons.length],
            ["Questions", Number(course.questions).toLocaleString()],
            ["Format", course.format]
        ].map(([label, value]) => `<div class="lms-metric"><strong>${value}</strong><span>${label}</span></div>`).join("");
    }

    function renderOutline() {
        $("#outline").innerHTML = course.terms.map((term) => `
            <section class="lms-term">
                <div>
                    <strong>${term.title}</strong>
                    <p class="lms-muted" style="margin:0.2rem 0 0;">${term.description}</p>
                </div>
                ${term.lessons.map((lesson) => {
                    const index = lessons.findIndex((item) => item.id === lesson.id);
                    const completed = progress.completedLessons.includes(lesson.id);
                    const watched = progress.watchedLessons.includes(lesson.id);
                    const unlocked = isUnlocked(index);
                    return `
                        <button type="button" class="lms-lesson-button ${index === activeIndex ? "active" : ""} ${unlocked ? "" : "locked"}" data-lesson="${index}" ${unlocked ? "" : "disabled"}>
                            <strong>${lesson.title}</strong>
                            <span>${completed ? "Complete" : (watched ? "Checkpoint ready" : (unlocked ? `${lesson.duration} min lecture` : "Locked"))}</span>
                        </button>
                    `;
                }).join("")}
            </section>
        `).join("");
    }

    function renderLesson() {
        const lesson = lessons[activeIndex];
        const watched = progress.watchedLessons.includes(lesson.id);
        const read = progress.readLessons.includes(lesson.id);
        const complete = progress.completedLessons.includes(lesson.id);
        const checkpointOpen = watched && read;

        $("#lessonTitle").textContent = lesson.title;
        $("#lessonSubtitle").textContent = `${lesson.termTitle} - ${lesson.lectureTitle} - ${lesson.duration} minutes`;
        $("#lessonObjective").textContent = lesson.objective;
        $("#lessonBody").textContent = lesson.body;
        $("#conceptList").innerHTML = lesson.concepts.map((concept) => `<span>${concept}</span>`).join("");
        $("#tutorText").textContent = lesson.tutorScript;
        $("#startLectureBtn").textContent = watched ? "Lecture Watched" : "Start Lecture";
        $("#startLectureBtn").disabled = watched;
        $("#bookmarkBtn").textContent = progress.bookmarks.includes(lesson.id) ? "Bookmarked" : "Bookmark";
        $("#prevBtn").disabled = activeIndex === 0;
        $("#nextBtn").disabled = activeIndex >= lessons.length - 1 || !isUnlocked(activeIndex + 1);

        $("#checkpointGate").textContent = complete
            ? "Checkpoint passed. The next lecture is unlocked."
            : (checkpointOpen ? "Checkpoint unlocked. Pass it to complete this lecture." : "Watch the lecture and read the lesson before attempting the checkpoint.");
        $("#quizArea").classList.toggle("hidden", !checkpointOpen);
        $("#quizPrompt").textContent = lesson.quiz.prompt;
        $("#quizOptions").innerHTML = lesson.quiz.options.map((option, index) => `
            <label><input type="radio" name="checkpoint" value="${index}">${option}</label>
        `).join("");
        $("#quizFeedback").textContent = progress.quizPassed[lesson.id] ? lesson.quiz.rationale : "";
        $("#quizFeedback").className = progress.quizPassed[lesson.id] ? "lms-feedback correct" : "lms-feedback";
        $("#noteText").value = progress.notes[lesson.id] || "";
        updateReadGate();
        renderNotes();
        renderReport();
        renderOutline();
        updateProgress();
    }

    function updateReadGate() {
        const lesson = lessons[activeIndex];
        if (progress.readLessons.includes(lesson.id)) return;
        const markRead = () => {
            if (progress.readLessons.includes(lesson.id)) return;
            progress.readLessons.push(lesson.id);
            saveState();
            renderLesson();
            window.removeEventListener("scroll", markRead);
        };
        window.removeEventListener("scroll", markRead);
        window.addEventListener("scroll", () => {
            const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
            if (nearBottom) markRead();
        }, { once: true, passive: true });
        window.setTimeout(() => {
            if (document.documentElement.scrollHeight <= window.innerHeight + 180) markRead();
        }, 300);
    }

    function updateProgress() {
        $("#courseProgressBar").style.width = `${percent()}%`;
        $("#courseProgressText").textContent = `${percent()}% complete - ${progress.completedLessons.length}/${lessons.length} lectures passed`;
    }

    function renderReport() {
        const watched = progress.watchedLessons.length;
        const completed = progress.completedLessons.length;
        const bookmarks = progress.bookmarks.length;
        $("#reportGrid").innerHTML = [
            ["Watched", `${watched}/${lessons.length}`],
            ["Passed", `${completed}/${lessons.length}`],
            ["Bookmarks", bookmarks],
            ["Readiness", percent() >= 100 ? "Complete" : "In progress"]
        ].map(([label, value]) => `<div class="lms-report-card"><strong>${value}</strong><span>${label}</span></div>`).join("");

        const cert = $("#certificateLink");
        if (percent() >= 100) {
            progress.certificate ||= { id: `cert_${Date.now().toString(36)}`, issuedAt: new Date().toISOString() };
            cert.textContent = "View Certificate";
            cert.href = `../certificate.html?source=course&courseId=${encodeURIComponent(course.id)}&title=${encodeURIComponent(course.title)}&certId=${encodeURIComponent(progress.certificate.id)}`;
        } else {
            cert.textContent = "Certificate Locked";
            cert.href = "#";
        }
        saveState();
    }

    function renderNotes() {
        const lessonNotes = Object.entries(progress.notes)
            .filter(([, value]) => String(value || "").trim())
            .map(([lessonId, value]) => {
                const found = lessons.find((item) => item.id === lessonId);
                return `<div class="lms-note"><strong>${found?.title || "Lesson"}</strong><p>${String(value).replace(/[<>&]/g, "")}</p></div>`;
            }).join("");
        $("#noteList").innerHTML = lessonNotes || `<p class="lms-muted">Saved notes will appear here.</p>`;
        $("#flashcardList").innerHTML = progress.flashcards.map((card) => `
            <div class="lms-flashcard"><strong>${card.front}</strong><p>${card.back}</p></div>
        `).join("") || `<p class="lms-muted">Flashcards made from notes will appear here.</p>`;
    }

    function speak() {
        const lesson = lessons[activeIndex];
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        synthUtterance = new SpeechSynthesisUtterance(`${lesson.tutorScript} ${lesson.objective}`);
        synthUtterance.rate = 0.95;
        window.speechSynthesis.speak(synthUtterance);
    }

    function bind() {
        document.addEventListener("click", (event) => {
            const lessonButton = event.target.closest("[data-lesson]");
            if (lessonButton) {
                activeIndex = Number(lessonButton.dataset.lesson);
                progress.currentLesson = activeIndex;
                saveState();
                renderLesson();
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            if (event.target.closest("#startLectureBtn")) {
                const lesson = lessons[activeIndex];
                if (!progress.watchedLessons.includes(lesson.id)) progress.watchedLessons.push(lesson.id);
                saveState();
                renderLesson();
                return;
            }
            if (event.target.closest("#bookmarkBtn")) {
                const lesson = lessons[activeIndex];
                progress.bookmarks = progress.bookmarks.includes(lesson.id)
                    ? progress.bookmarks.filter((id) => id !== lesson.id)
                    : [...progress.bookmarks, lesson.id];
                saveState();
                renderLesson();
                return;
            }
            if (event.target.closest("#prevBtn") && activeIndex > 0) {
                activeIndex -= 1;
                saveState();
                renderLesson();
                return;
            }
            if (event.target.closest("#nextBtn") && activeIndex < lessons.length - 1 && isUnlocked(activeIndex + 1)) {
                activeIndex += 1;
                saveState();
                renderLesson();
                return;
            }
            if (event.target.closest("#checkAnswerBtn")) {
                const checked = document.querySelector("input[name='checkpoint']:checked");
                const lesson = lessons[activeIndex];
                if (!checked) {
                    $("#quizFeedback").textContent = "Select an answer first.";
                    $("#quizFeedback").className = "lms-feedback incorrect";
                    return;
                }
                if (Number(checked.value) === lesson.quiz.correct) {
                    progress.quizPassed[lesson.id] = true;
                    if (!progress.completedLessons.includes(lesson.id)) progress.completedLessons.push(lesson.id);
                    $("#quizFeedback").textContent = lesson.quiz.rationale;
                    $("#quizFeedback").className = "lms-feedback correct";
                    saveState();
                    renderLesson();
                } else {
                    $("#quizFeedback").textContent = "Review the lesson and try again. Focus on the safest nursing action.";
                    $("#quizFeedback").className = "lms-feedback incorrect";
                }
                return;
            }
            if (event.target.closest("#saveNoteBtn")) {
                progress.notes[lessons[activeIndex].id] = $("#noteText").value.trim();
                saveState();
                renderNotes();
                return;
            }
            if (event.target.closest("#makeFlashcardBtn")) {
                const note = $("#noteText").value.trim();
                if (note) {
                    progress.flashcards.push({ front: lessons[activeIndex].title, back: note.slice(0, 220), createdAt: new Date().toISOString() });
                    saveState();
                    renderNotes();
                }
                return;
            }
            if (event.target.closest("#voiceBtn")) speak();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const params = new URLSearchParams(window.location.search);
        course = window.GnpLmsData.getCourse(params.get("course"));
        lessons = window.GnpLmsData.flattenLessons(course);
        state = readState();
        if (!state.enrolledCourseIds.includes(course.id)) {
            window.location.replace(`courses.html?enroll=${encodeURIComponent(course.id)}`);
            return;
        }
        ensureProgress();
        activeIndex = Math.max(0, Math.min(Number(progress.currentLesson || 0), lessons.length - 1));
        while (!isUnlocked(activeIndex) && activeIndex > 0) activeIndex -= 1;
        renderShell();
        renderLesson();
        bind();
    });
})();
