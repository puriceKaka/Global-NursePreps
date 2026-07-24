(() => {
    const $ = (selector) => document.querySelector(selector);
    let course;
    let lessons;
    let state;
    let progress;
    let activeIndex = 0;
    let synthUtterance = null;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function cleanText(value) {
        return String(value || "")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function splitSentences(value, limit = 4) {
        return cleanText(value)
            .split(/(?<=[.!?])\s+/)
            .map((part) => part.trim())
            .filter(Boolean)
            .slice(0, limit);
    }

    function shorten(value, limit = 160) {
        const text = cleanText(value);
        if (!text) return "";
        return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
    }

    function buildStudyNotes(lesson) {
        const conceptItems = Array.isArray(lesson.concepts) ? lesson.concepts.filter(Boolean) : [];
        const bodySentences = splitSentences(lesson.body, 5);
        const sourceText = cleanText(course.contentNotes);
        const sourceSentences = splitSentences(sourceText, 6);
        const sourceDocument = course.uploadedDocument?.name || course.lectureVideoName || "";

        const sections = [];

        sections.push(`
            <div class="note-block">
                <h3>Lesson focus</h3>
                <p>${escapeHtml(lesson.objective)}</p>
                <p>${escapeHtml(shorten(bodySentences.join(" "), 360) || lesson.body)}</p>
            </div>
        `);

        sections.push(`
            <div class="note-block">
                <h3>Key nursing points</h3>
                <ul>
                    ${[
                        `${lesson.title} sits inside ${course.category || "the course"} and should be read as a clinical decision topic, not a memorization topic.`,
                        conceptItems[0] ? `Anchor the lesson around ${conceptItems[0]}.` : `Anchor the lesson around the main assessment cue and the safest first action.`,
                        conceptItems[1] ? `Link ${conceptItems[1]} to the patient finding that would make it relevant on an exam.` : `Link each detail to a patient finding, not just a definition.`,
                        conceptItems[2] ? `Use ${conceptItems[2]} when you explain why the answer is safe.` : `Use the safest response, not the longest explanation.`,
                        bodySentences[0] || "Start with the main idea before moving into detail.",
                        bodySentences[1] || "Use the lesson body to connect structure, function, and action.",
                        bodySentences[2] || "Recheck the lesson body for the clue the exam writer is hiding."
                    ].filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
            </div>
        `);

        sections.push(`
            <div class="note-block">
                <h3>What the uploaded material adds</h3>
                ${sourceDocument ? `<div class="source-chip">Source: ${escapeHtml(sourceDocument)}</div>` : ""}
                <p>${sourceSentences.length
                    ? escapeHtml(sourceSentences.join(" "))
                    : (sourceText
                        ? escapeHtml(shorten(sourceText, 520))
                        : "If the admin attaches lecture notes or a PDF, this panel expands the source into student-ready study notes.")}</p>
                <ul>
                    ${[
                        sourceSentences[0] ? `First takeaway: ${sourceSentences[0]}` : "First takeaway: identify the main idea before copying details.",
                        sourceSentences[1] ? `Second takeaway: ${sourceSentences[1]}` : "Second takeaway: convert notes into nursing action.",
                        sourceSentences[2] ? `Third takeaway: ${sourceSentences[2]}` : "Third takeaway: explain the reason behind the answer.",
                        sourceSentences[3] ? `Fourth takeaway: ${sourceSentences[3]}` : "Fourth takeaway: focus on patient safety and assessment."
                    ].map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
            </div>
        `);

        sections.push(`
            <div class="note-block">
                <h3>Revision checklist</h3>
                <ul>
                    <li>Read the lesson objective first.</li>
                    <li>Say the key concepts out loud before opening the checkpoint.</li>
                    <li>Use the uploaded notes or course notes as your study source, not as decoration.</li>
                    <li>Pass the 10-question check with at least 80% before moving on.</li>
                    <li>Redo the questions if you score below 80%.</li>
                </ul>
            </div>
        `);

        return sections.join("");
    }

    function buildCheckpointQuiz(lesson) {
        const concepts = Array.isArray(lesson.concepts) && lesson.concepts.length
            ? lesson.concepts
            : [lesson.objective, lesson.title, course.category];
        const primary = concepts[0] || lesson.title || "the topic";
        const secondary = concepts[1] || lesson.objective || "the objective";
        const tertiary = concepts[2] || course.category || "the course";
        const firstSentence = splitSentences(lesson.body, 1)[0] || lesson.objective || lesson.title;
        const secondSentence = splitSentences(lesson.body, 2)[1] || firstSentence;
        const sourceHasNotes = Boolean(cleanText(course.contentNotes));

        return [
            {
                prompt: `1. What is the main focus of this unit?`,
                options: [lesson.title, tertiary, "A random unrelated topic", "The final exam only"],
                correct: 0,
                rationale: `Correct. The unit is centered on ${lesson.title}.`
            },
            {
                prompt: `2. Which statement best matches the lesson objective?`,
                options: [lesson.objective, "Ignore the objective and memorize the title only", "Focus on guessing", "Skip the lesson body entirely"],
                correct: 0,
                rationale: "Correct. The objective tells the student exactly what mastery should look like."
            },
            {
                prompt: `3. Which concept belongs in this lesson?`,
                options: [primary, "A non-clinical distraction", "An unrelated school holiday", "A random number"],
                correct: 0,
                rationale: `Correct. ${primary} is one of the core concepts for this lesson.`
            },
            {
                prompt: `4. Which concept should you connect to the lesson next?`,
                options: [secondary, "A guess with no evidence", "A completely different course", "A blank answer"],
                correct: 0,
                rationale: "Correct. Related concepts should be linked back to the main clinical idea."
            },
            {
                prompt: `5. What is the safest way to use the lesson body?`,
                options: [
                    "Read it once and stop",
                    "Link it to assessment cues and safe action",
                    "Memorize only the first word",
                    "Skip the explanation and move on"
                ],
                correct: 1,
                rationale: "Correct. The body should be used for cue recognition and safe decision making."
            },
            {
                prompt: `6. What does the tutor script emphasize?`,
                options: [
                    "The clinical cue, the safest nursing action, and the reason behind the answer",
                    "The easiest distractor",
                    "Guessing faster",
                    "Ignoring safety"
                ],
                correct: 0,
                rationale: "Correct. The tutor script is meant to sharpen clinical reasoning."
            },
            {
                prompt: `7. What should the uploaded notes or source text do for the learner?`,
                options: [
                    "Generate student-ready study notes and explanations",
                    "Replace all learning with one sentence",
                    "Hide the lesson objectives",
                    "Remove the need to study"
                ],
                correct: 0,
                rationale: sourceHasNotes
                    ? "Correct. The source material should become rich study notes, not just a file attachment."
                    : "Correct. Any attached material should be turned into study notes and explanations."
            },
            {
                prompt: `8. What does the first major point in the lesson body tell the learner to focus on?`,
                options: [
                    shorten(firstSentence, 110) || "The first safe nursing action and the clue that makes it safest",
                    "The most dramatic option",
                    "The longest answer choice",
                    "The option that sounds clever"
                ],
                correct: 0,
                rationale: secondSentence
                    ? `Correct. The lesson body starts by emphasizing ${shorten(firstSentence, 90)}.`
                    : "Correct. Safe nursing action comes before style or length."
            },
            {
                prompt: `9. What score is required to pass this unit?`,
                options: ["80% or higher", "50% or higher", "100% only", "Any score is fine"],
                correct: 0,
                rationale: "Correct. The pass mark for the unit check is 80%."
            },
            {
                prompt: `10. What happens if the score is below the pass mark?`,
                options: [
                    "The learner must redo the questions",
                    "The system should ignore the score",
                    "The unit should close permanently",
                    "The next unit should open automatically"
                ],
                correct: 0,
                rationale: "Correct. Students must retry until they reach the passing score."
            }
        ];
    }

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
        progress.quizScores = progress.quizScores && typeof progress.quizScores === "object" ? progress.quizScores : {};
        progress.quizAttempts = progress.quizAttempts && typeof progress.quizAttempts === "object" ? progress.quizAttempts : {};
        progress.quizFlow = progress.quizFlow && typeof progress.quizFlow === "object" ? progress.quizFlow : {};
        progress.notes = progress.notes && typeof progress.notes === "object" ? progress.notes : {};
        progress.bookmarks = Array.isArray(progress.bookmarks) ? progress.bookmarks : [];
        progress.flashcards = Array.isArray(progress.flashcards) ? progress.flashcards : [];
        progress.assignmentScores = progress.assignmentScores && typeof progress.assignmentScores === "object" ? progress.assignmentScores : {};
        progress.assignmentSubmissions = progress.assignmentSubmissions && typeof progress.assignmentSubmissions === "object" ? progress.assignmentSubmissions : {};
        progress.studyTimeMinutes = Number(progress.studyTimeMinutes || 0);
    }

    function isUnlocked(index) {
        return index === 0 || progress.quizPassed[lessons[index - 1].id] === true;
    }

    function percent() {
        return lessons.length ? Math.round((progress.completedLessons.length / lessons.length) * 100) : 0;
    }

    function listItems(items, emptyText) {
        return Array.isArray(items) && items.length
            ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
            : `<p class="lms-muted">${escapeHtml(emptyText)}</p>`;
    }

    function objectCards(items, emptyText, renderer) {
        return Array.isArray(items) && items.length
            ? items.map(renderer).join("")
            : `<article class="lms-structure-card"><p class="lms-muted">${escapeHtml(emptyText)}</p></article>`;
    }

    function defaultAssignments() {
        return Array.isArray(course.assignments) && course.assignments.length ? course.assignments : [
            { id: "assignment-1", title: "Case Study Submission", dueDate: "Set by lecturer", marks: "Ungraded", instructions: "Apply the course concepts to a nursing case scenario." }
        ];
    }

    function defaultAssessments() {
        return Array.isArray(course.assessments) && course.assessments.length ? course.assessments : [
            { id: "midterm", title: "Midterm Test", type: "Quiz", marks: "30 marks", instructions: "Checkpoint performance contributes to readiness." },
            { id: "final", title: "Final Examination", type: "Final", marks: "70 marks", instructions: "Complete all lessons and pass required quizzes before certification." }
        ];
    }

    function defaultResources() {
        const resources = Array.isArray(course.resources) ? [...course.resources] : [];
        if (course.uploadedDocument?.name) {
            resources.unshift({ title: course.uploadedDocument.name, type: course.uploadedDocument.type || "PDF Documents", link: course.uploadedDocument.name });
        }
        if (course.lectureVideoSource) {
            resources.unshift({ title: course.lectureVideoName || "Lecture video", type: "Video", link: course.lectureVideoSource });
        }
        return resources;
    }

    function renderStructure() {
        const panels = $("#structurePanels");
        if (!panels) return;

        const completed = progress.completedLessons.length;
        const quizScores = Object.values(progress.quizScores || {}).filter((score) => Number.isFinite(Number(score)));
        const averageQuiz = quizScores.length
            ? Math.round(quizScores.reduce((sum, score) => sum + Number(score), 0) / quizScores.length)
            : 0;
        const certificateReady = percent() >= 100;
        const analytics = course.analytics || {};
        const enrollmentCount = Number(analytics.enrollmentCount || analytics.enrollments || 0);
        const rating = analytics.rating || analytics.studentRatings || "Not rated";

        panels.innerHTML = `
            <section class="lms-structure-panel active" data-panel="info">
                <div class="lms-structure-grid">
                    ${[
                        ["Course Title", course.title],
                        ["Category", course.category],
                        ["Faculty", course.faculty || "Not set"],
                        ["Department", course.department || "Not set"],
                        ["Course Code", course.courseCode || course.id],
                        ["Lecturer / Instructor", course.lecturer || "Global NursePrep"],
                        ["Skill Level", course.level || course.difficulty || "Beginner"],
                        ["Study Duration", `${course.durationHours || 0} hours`],
                        ["Language", course.language || "English"],
                        ["Course Price", Number(course.price || 0) > 0 ? `KES ${Number(course.price).toLocaleString()}` : "Free"]
                    ].map(([label, value]) => `<div class="lms-structure-card"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
                </div>
                <div class="lms-structure-split">
                    <article><h3>Learning Outcomes</h3>${listItems(course.learningOutcomes || course.outcomes, "Learning outcomes will appear when the lecturer adds them.")}</article>
                    <article><h3>Prerequisites</h3>${listItems(course.prerequisites, "No prerequisites listed.")}</article>
                </div>
            </section>
            <section class="lms-structure-panel" data-panel="modules">
                ${course.terms.map((term) => `
                    <article class="lms-structure-card">
                        <span>${escapeHtml(term.title)}</span>
                        <strong>${escapeHtml(term.description || "Module")}</strong>
                        <ul>${term.lessons.map((lesson) => `<li>${escapeHtml(lesson.title)} - video, notes, concepts, practice questions, discussion, and topic quiz</li>`).join("")}</ul>
                    </article>
                `).join("")}
            </section>
            <section class="lms-structure-panel" data-panel="assignments">
                ${objectCards(defaultAssignments(), "No assignments posted yet.", (item) => `
                    <article class="lms-structure-card"><span>${escapeHtml(item.dueDate || "No deadline")}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.instructions || item.type || "Submission details will be posted by the lecturer.")}</p><small>${escapeHtml(item.marks || "Marks not set")}</small></article>
                `)}
            </section>
            <section class="lms-structure-panel" data-panel="assessments">
                ${objectCards(defaultAssessments(), "No assessments posted yet.", (item) => `
                    <article class="lms-structure-card"><span>${escapeHtml(item.type || "Assessment")}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.instructions || "Complete when released.")}</p><small>${escapeHtml(item.marks || "Score pending")}</small></article>
                `)}
            </section>
            <section class="lms-structure-panel" data-panel="resources">
                ${objectCards(defaultResources(), "No extra course resources uploaded yet.", (item) => `
                    <article class="lms-structure-card"><span>${escapeHtml(item.type || "Resource")}</span><strong>${escapeHtml(item.title || item.name || "Course resource")}</strong><p>${escapeHtml(item.link || "Available in this course workspace.")}</p></article>
                `)}
            </section>
            <section class="lms-structure-panel" data-panel="communication">
                ${objectCards(course.announcements, "No announcements posted yet.", (item) => `
                    <article class="lms-structure-card"><span>${escapeHtml(item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Announcement")}</span><strong>${escapeHtml(item.title || "Course announcement")}</strong><p>${escapeHtml(item.message || item.body || "")}</p></article>
                `)}
                <article class="lms-structure-card"><span>Questions and Answers</span><strong>Discussion forum</strong><p>Students can discuss the current topic and lecturer messages stay connected to this course.</p></article>
            </section>
            <section class="lms-structure-panel" data-panel="progress">
                <div class="lms-structure-grid">
                    ${[
                        ["Topics Completed", `${completed}/${lessons.length}`],
                        ["Quiz Average", `${averageQuiz}%`],
                        ["Completion", `${percent()}%`],
                        ["Time Spent", `${progress.studyTimeMinutes || 0} minutes`],
                        ["Last Accessed", progress.lastVisited ? new Date(progress.lastVisited).toLocaleString() : "Today"]
                    ].map(([label, value]) => `<div class="lms-structure-card"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
                </div>
            </section>
            <section class="lms-structure-panel" data-panel="certificate">
                <article class="lms-structure-card"><span>Completion Status</span><strong>${certificateReady ? "Eligible" : "Locked"}</strong><p>${certificateReady ? "All required lessons are complete." : "Complete all lessons and pass required checkpoints to unlock the certificate."}</p><small>Verification code: ${escapeHtml(progress.certificate?.id || "Generated after completion")}</small></article>
            </section>
            <section class="lms-structure-panel" data-panel="analytics">
                <div class="lms-structure-grid">
                    ${[
                        ["Enrollment Count", enrollmentCount],
                        ["Student Ratings", rating],
                        ["Reviews", analytics.reviews || 0],
                        ["Average Completion", analytics.averageCompletionRate || `${percent()}%`],
                        ["Performance", averageQuiz ? `${averageQuiz}% quiz average` : "Collecting data"]
                    ].map(([label, value]) => `<div class="lms-structure-card"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
                </div>
            </section>
        `;
    }

    function renderShell() {
        $("#courseKicker").textContent = course.category;
        $("#courseTitle").textContent = course.title;
        $("#courseSummary").textContent = course.summary;
        $("#courseImage").src = course.image;
        $("#courseImage").alt = course.title;
        const videoFrame = $("#videoFrame");
        const lessonBackground = String(course.lessonBackgroundImage || course.image || "").trim();
        if (videoFrame) {
            if (lessonBackground) {
                const safeBackground = lessonBackground.replace(/'/g, "\\'");
                videoFrame.classList.add("has-lesson-background");
                videoFrame.style.backgroundImage = `linear-gradient(180deg, rgba(3, 17, 34, 0.18), rgba(3, 17, 34, 0.72)), url('${safeBackground}')`;
            } else {
                videoFrame.classList.remove("has-lesson-background");
                videoFrame.style.backgroundImage = "";
            }
        }
        $("#courseMetrics").innerHTML = [
            ["Lectures", lessons.length],
            ["Questions", Number(course.questions).toLocaleString()],
            ["Format", course.format]
        ].map(([label, value]) => `<div class="lms-metric"><strong>${value}</strong><span>${label}</span></div>`).join("");
    }

    function getLectureVideoSource() {
        return String(course.lectureVideo || course.videoUrl || "").trim();
    }

    function renderLectureVideo() {
        const video = $("#lectureVideo");
        if (!video) return;

        const src = getLectureVideoSource();
        if (!src) {
            video.pause?.();
            video.removeAttribute("src");
            video.removeAttribute("data-source");
            video.load?.();
            video.classList.add("hidden");
            return;
        }

        if (video.dataset.source !== src) {
            video.src = src;
            video.dataset.source = src;
        }
        video.poster = course.image || "";
        video.classList.remove("hidden");
    }

    function renderOutline() {
        const outline = $("#outline");
        if (!outline) return;

        const sections = Array.isArray(course.terms) && course.terms.length
            ? course.terms.map((term) => ({
                title: term.title,
                description: term.description,
                lessons: Array.isArray(term.lessons) && term.lessons.length
                    ? term.lessons
                    : lessons.map((lesson) => ({
                        id: lesson.id,
                        title: lesson.title,
                        duration: lesson.duration
                    }))
            }))
            : [{
                title: course.yearLabel || course.category || "Study Outline",
                description: course.summary || "Course lessons",
                lessons: lessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    duration: lesson.duration
                }))
            }];

        outline.innerHTML = sections.map((term) => `
            <section class="lms-term">
                <div>
                    <strong>${term.title}</strong>
                    <p class="lms-muted" style="margin:0.2rem 0 0;">${term.description}</p>
                </div>
                ${(term.lessons || []).map((lesson) => {
                    const index = lessons.findIndex((item) => item.id === lesson.id);
                    const completed = index !== -1 && progress.completedLessons.includes(lesson.id);
                    const watched = index !== -1 && progress.watchedLessons.includes(lesson.id);
                    const unlocked = index === -1 ? true : isUnlocked(index);
                    return `
                        <button type="button" class="lms-lesson-button ${index === activeIndex ? "active" : ""} ${unlocked ? "" : "locked"}" data-lesson="${index}" ${unlocked ? "" : "disabled"}>
                            <strong>${lesson.title}</strong>
                            <span>${completed ? "Complete" : (watched ? "Checkpoint ready" : (unlocked ? `${lesson.duration || 0} min lecture` : "Locked"))}</span>
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
        const quiz = buildCheckpointQuiz(lesson);
        const flow = progress.quizFlow[lesson.id] ||= {
            index: 0,
            answers: {},
            firstTryCorrect: {},
            attempts: {},
            score: null,
            retryRequired: false
        };
        if (!Number.isFinite(flow.index)) flow.index = 0;
        if (!flow.answers || typeof flow.answers !== "object") flow.answers = {};
        if (!flow.firstTryCorrect || typeof flow.firstTryCorrect !== "object") flow.firstTryCorrect = {};
        if (!flow.attempts || typeof flow.attempts !== "object") flow.attempts = {};
        if (!Number.isFinite(flow.score) && flow.score !== null) flow.score = null;

        $("#lessonTitle").textContent = lesson.title;
        $("#lessonSubtitle").textContent = `${lesson.termTitle} - ${lesson.lectureTitle} - ${lesson.duration} minutes`;
        $("#lessonObjective").textContent = lesson.objective;
        $("#lessonBody").textContent = lesson.body;
        $("#conceptList").innerHTML = lesson.concepts.map((concept) => `<span>${concept}</span>`).join("");
        const studyNotes = $("#studyNotes");
        if (studyNotes) studyNotes.innerHTML = buildStudyNotes(lesson);
        renderLectureVideo();
        const video = $("#lectureVideo");
        const hasVideo = Boolean(video && !video.classList.contains("hidden"));
        $("#startLectureBtn").textContent = hasVideo
            ? (video.paused ? "Play Lecture" : "Pause Lecture")
            : (watched ? "Lecture Watched" : "Start Lecture");
        $("#startLectureBtn").disabled = !hasVideo && watched;
        $("#bookmarkBtn").textContent = progress.bookmarks.includes(lesson.id) ? "Bookmarked" : "Bookmark";
        $("#prevBtn").disabled = activeIndex === 0;
        $("#nextBtn").disabled = activeIndex >= lessons.length - 1 || !isUnlocked(activeIndex + 1);

        $("#checkpointGate").textContent = complete
            ? `Checkpoint passed. Last score: ${progress.quizScores[lesson.id] || 100}%.`
            : (checkpointOpen ? "Checkpoint unlocked. Answer all 10 questions and reach 80% to continue." : "Watch the lecture and read the lesson before attempting the checkpoint.");
        $("#quizArea").classList.toggle("hidden", !checkpointOpen);
        const quizForm = $("#quizForm");
        if (quizForm) {
            const currentQuestion = quiz[flow.index];
            quizForm.innerHTML = currentQuestion ? `
                ${flow.retryRequired && typeof flow.score === "number" && flow.score < 80 ? `
                    <div class="workspace-question">
                        <strong>Redo required</strong>
                        <p>You scored ${flow.score}%. Start the 10-question unit check again and reach 80% or higher.</p>
                    </div>
                ` : ""}
                <div class="workspace-question">
                    <strong>${escapeHtml(currentQuestion.prompt)}</strong>
                    <div class="question-options">
                        ${currentQuestion.options.map((option, optionIndex) => `
                            <label>
                                <input type="radio" name="checkpoint" value="${optionIndex}" ${flow.answers[flow.index] === optionIndex ? "checked" : ""}>
                                ${escapeHtml(option)}
                            </label>
                        `).join("")}
                    </div>
                    <p class="lms-muted" style="margin:0.75rem 0 0;">Question ${flow.index + 1} of ${quiz.length}</p>
                </div>
            ` : "";
        }
        const score = progress.quizScores[lesson.id];
        if (progress.quizPassed[lesson.id]) {
            $("#quizFeedback").textContent = `Passed with ${score || 100}%. Good work.`;
            $("#quizFeedback").className = "lms-feedback correct";
        } else if (typeof score === "number") {
            $("#quizFeedback").textContent = `Score: ${score}%. You need 80% or higher. Redo the questions.`;
            $("#quizFeedback").className = "lms-feedback incorrect";
        } else {
            $("#quizFeedback").textContent = "";
            $("#quizFeedback").className = "lms-feedback";
        }
        updateReadGate();
        renderNotes();
        renderReport();
        renderOutline();
        renderStructure();
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
        const reportGrid = $("#reportGrid");
        const certificateLink = $("#certificateLink");
        if (!reportGrid || !certificateLink) return;

        const watched = progress.watchedLessons.length;
        const completed = progress.completedLessons.length;
        const bookmarks = progress.bookmarks.length;
        reportGrid.innerHTML = [
            ["Watched", `${watched}/${lessons.length}`],
            ["Passed", `${completed}/${lessons.length}`],
            ["Bookmarks", bookmarks],
            ["Readiness", percent() >= 100 ? "Complete" : "In progress"]
        ].map(([label, value]) => `<div class="lms-report-card"><strong>${value}</strong><span>${label}</span></div>`).join("");

        if (percent() >= 100) {
            progress.certificate ||= { id: `cert_${Date.now().toString(36)}`, issuedAt: new Date().toISOString() };
            certificateLink.textContent = "View Certificate";
            certificateLink.href = `../certificate.html?source=course&courseId=${encodeURIComponent(course.id)}&title=${encodeURIComponent(course.title)}&certId=${encodeURIComponent(progress.certificate.id)}`;
        } else {
            certificateLink.textContent = "Certificate Locked";
            certificateLink.href = "#";
        }
        saveState();
    }

    function renderNotes() {
        const noteList = $("#studyNotes") || $("#noteList");
        const flashcardList = $("#flashcardList");
        const lesson = lessons[activeIndex];
        if (noteList) noteList.innerHTML = buildStudyNotes(lesson);
        if (flashcardList) {
            flashcardList.innerHTML = progress.flashcards.map((card) => `
                <div class="lms-flashcard"><strong>${card.front}</strong><p>${card.back}</p></div>
            `).join("") || `<p class="lms-muted">Flashcards made from notes will appear here.</p>`;
        }
    }

    function speak() {
        const lesson = lessons[activeIndex];
        if (!lesson) return;

        const speechText = [
            lesson.tutorScript,
            lesson.objective,
            lesson.body,
            `Key concepts: ${lesson.concepts.join(", ")}`
        ].filter(Boolean).join(" ");

        if (window.AvatarVoiceTutor?.instance) {
            window.AvatarVoiceTutor.instance.startLessonNarration(speechText);
            return;
        }

        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const synthUtterance = new SpeechSynthesisUtterance(speechText);
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
                const video = $("#lectureVideo");
                if (video && !video.classList.contains("hidden")) {
                    if (video.paused) {
                        if (!progress.watchedLessons.includes(lesson.id)) progress.watchedLessons.push(lesson.id);
                        const playPromise = video.play();
                        saveState();
                        if (playPromise && typeof playPromise.then === "function") {
                            playPromise.then(() => renderLesson()).catch(() => renderLesson());
                        } else {
                            renderLesson();
                        }
                    } else {
                        video.pause();
                        saveState();
                        renderLesson();
                    }
                    return;
                }
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
                const lesson = lessons[activeIndex];
                const quiz = buildCheckpointQuiz(lesson);
                const flow = progress.quizFlow[lesson.id] ||= {
                    index: 0,
                    answers: {},
                    firstTryCorrect: {},
                    attempts: {},
                    score: null,
                    locked: false
                };
                const currentQuestion = quiz[flow.index];
                const selected = document.querySelector("input[name='checkpoint']:checked");
                if (!selected || !currentQuestion) {
                    $("#quizFeedback").textContent = "Select an answer first.";
                    $("#quizFeedback").className = "lms-feedback incorrect";
                    return;
                }

                const selectedValue = Number(selected.value);
                flow.answers[flow.index] = selectedValue;
                flow.attempts[flow.index] = (flow.attempts[flow.index] || 0) + 1;
                if (selectedValue === currentQuestion.correct) {
                    if (flow.attempts[flow.index] === 1) {
                        flow.firstTryCorrect[flow.index] = true;
                    }

                    if (flow.index < quiz.length - 1) {
                        flow.index += 1;
                        $("#quizFeedback").textContent = `Correct. Move to question ${flow.index + 1}.`;
                        $("#quizFeedback").className = "lms-feedback correct";
                    } else {
                        const firstTryCorrect = Object.values(flow.firstTryCorrect).filter(Boolean).length;
                        const score = Math.round((firstTryCorrect / quiz.length) * 100);
                        progress.quizAttempts[lesson.id] = (progress.quizAttempts[lesson.id] || 0) + 1;
                        progress.quizScores[lesson.id] = score;
                        progress.quizPassed[lesson.id] = score >= 80;
                        flow.score = score;
                        flow.locked = score < 80;
                        if (score >= 80) {
                            if (!progress.completedLessons.includes(lesson.id)) progress.completedLessons.push(lesson.id);
                            $("#quizFeedback").textContent = `Passed with ${score}%. The next lecture is unlocked.`;
                            $("#quizFeedback").className = "lms-feedback correct";
                        } else {
                            $("#quizFeedback").textContent = `Score: ${score}%. You need 80% or higher. Redo the full unit check.`;
                            $("#quizFeedback").className = "lms-feedback incorrect";
                            flow.index = 0;
                            flow.answers = {};
                            flow.firstTryCorrect = {};
                            flow.attempts = {};
                        }
                    }
                } else {
                    $("#quizFeedback").textContent = "Incorrect. Choose again before moving on.";
                    $("#quizFeedback").className = "lms-feedback incorrect";
                }
                saveState();
                renderLesson();
                return;
            }
            if (event.target.closest("#saveNoteBtn")) {
                const noteText = $("#noteText");
                if (!noteText) return;
                progress.notes[lessons[activeIndex].id] = noteText.value.trim();
                saveState();
                renderNotes();
                return;
            }
            if (event.target.closest("#makeFlashcardBtn")) {
                const noteText = $("#noteText");
                if (!noteText) return;
                const note = noteText.value.trim();
                if (note) {
                    progress.flashcards.push({ front: lessons[activeIndex].title, back: note.slice(0, 220), createdAt: new Date().toISOString() });
                    saveState();
                    renderNotes();
                }
                return;
            }
            if (event.target.closest("#voiceBtn")) speak();
            const structureTab = event.target.closest("[data-structure-panel]");
            if (structureTab) {
                document.querySelectorAll("[data-structure-panel]").forEach((button) => button.classList.toggle("active", button === structureTab));
                document.querySelectorAll(".lms-structure-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === structureTab.dataset.structurePanel));
            }
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
