document.addEventListener("DOMContentLoaded", () => {
    const storedExam = JSON.parse(localStorage.getItem("activeExam") || "null");
    if (!storedExam) {
        alert("No lecturer or admin exam session is active. Returning to the supervised exam lobby.");
        window.location.href = "../exam-lobby/exam-lobby.html";
        return;
    }

    const examConfig = storedExam;
    const examKey = `exam-progress:${examConfig.id}`;
    const startKey = `exam-start:${examConfig.id}`;

    const examName = document.querySelector(".exam-name");
    const autosaveIndicator = document.querySelector(".autosave-indicator");
    const warningMessages = document.getElementById("warning-messages");
    const questionContent = document.getElementById("question-content");
    const questionGrid = document.getElementById("question-grid");
    const notesField = document.getElementById("notes");
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    const flagButton = document.getElementById("flag-btn");
    const summaryPanel = document.getElementById("exam-summary-panel");
    const proctorVideo = document.getElementById("proctor-video");

    examName.textContent = examConfig.title || "Active Exam";

    const questions = buildQuestionBank(examConfig);
    const answers = Array(questions.length).fill(null);
    const flagged = Array(questions.length).fill(false);
    const proctoringEvents = [];
    let current = 0;
    let submitted = false;
    let autosaveTimeout = null;
    let countdownInterval = null;

    restoreSavedSession();
    renderQuestion(current);
    renderGrid();
    renderSummary();
    wireEvents();
    enforceSecureExamMode();
    startCountdown();
    startProctoring();

    function wireEvents() {
        document.addEventListener("visibilitychange", () => {
            if (document.hidden && !submitted) {
                logWarning("Tab switch detected.");
            }
        });

        window.addEventListener("blur", () => {
            if (!submitted) {
                logWarning("Focus lost. Stay within the examination interface.");
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key === "PrintScreen" || event.keyCode === 44) {
                logWarning("Screenshot attempt detected.");
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText("").catch(() => {});
                }
            }
        });

        prevButton.addEventListener("click", () => moveToQuestion(current - 1));
        nextButton.addEventListener("click", () => moveToQuestion(current + 1));
        flagButton.addEventListener("click", () => {
            flagged[current] = !flagged[current];
            renderGrid();
            renderSummary();
            updateNavState();
            scheduleAutosave();
        });

        notesField.addEventListener("input", scheduleAutosave);

        const submitButton = document.createElement("button");
        submitButton.type = "button";
        submitButton.textContent = "Finish & Submit Exam";
        submitButton.className = "btn-submit-final";
        submitButton.addEventListener("click", () => {
            if (submitted) {
                return;
            }

            const unanswered = answers.filter((answer) => !answer).length;
            const flaggedCount = flagged.filter(Boolean).length;
            const message = `Submit this exam now?\n\nUnanswered: ${unanswered}\nFlagged for review: ${flaggedCount}\n\nYou cannot return after submission.`;
            if (confirm(message)) {
                finalizeExam(false);
            }
        });
        document.querySelector(".bottom-nav").appendChild(submitButton);
    }

    function enforceSecureExamMode() {
        document.body.classList.add("secure-exam-mode");

        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {
                logWarning("Fullscreen request was blocked by the browser.");
            });
        }

        document.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            logWarning("Right-click attempt detected.");
        });

        ["copy", "cut", "paste"].forEach((eventName) => {
            document.addEventListener(eventName, (event) => {
                event.preventDefault();
                logWarning(`${eventName} action blocked.`);
            });
        });

        document.addEventListener("selectstart", (event) => {
            if (!event.target.closest("textarea, input")) {
                event.preventDefault();
            }
        });
    }

    function renderQuestion(index) {
        const question = questions[index];
        const answerMarkup = buildAnswerMarkup(question, index);

        questionContent.innerHTML = `
            <div class="question-shell">
                <div class="question-meta-bar">
                    <span class="question-tag">${escapeHtml(question.category)}</span>
                    <span class="question-tag">${escapeHtml(question.difficulty)}</span>
                    <span class="question-progress">Question ${index + 1} of ${questions.length}</span>
                </div>
                <h2>${escapeHtml(question.prompt)}</h2>
                <p class="question-rationale-hint">${getQuestionHint(question)}</p>
                ${answerMarkup}
            </div>
        `;

        questionContent.querySelectorAll("input[type='radio']").forEach((radio) => {
            radio.addEventListener("change", (event) => {
                answers[index] = event.target.value;
                renderGrid();
                renderSummary();
                scheduleAutosave();
            });
        });

        questionContent.querySelectorAll("input[type='text'], textarea").forEach((field) => {
            field.addEventListener("input", (event) => {
                answers[index] = event.target.value;
                renderGrid();
                renderSummary();
                scheduleAutosave();
            });
        });

        updateNavState();
    }

    function buildAnswerMarkup(question, index) {
        if (question.type === "essay" || question.type === "case") {
            return `<textarea class="exam-textarea" placeholder="Type your response here...">${escapeHtml(answers[index] || "")}</textarea>`;
        }

        if (question.type === "fill") {
            return `<input class="exam-text-input" type="text" value="${escapeHtml(answers[index] || "")}" placeholder="Type the missing word or phrase">`;
        }

        const options = Array.isArray(question.options) && question.options.length ? question.options : ["True", "False"];
        return `
            <div class="options-list">
                ${options.map((option, optionIndex) => `
                    <label class="option-item" for="opt${index}-${optionIndex}">
                        <input type="radio" name="q${index}" id="opt${index}-${optionIndex}" value="${escapeHtml(option)}" ${answers[index] === option ? "checked" : ""}>
                        <span>${escapeHtml(option)}</span>
                    </label>
                `).join("")}
            </div>
        `;
    }

    function getQuestionHint(question) {
        if (question.type === "essay") {
            return "Write a clear response. Essays can be manually reviewed by lecturers.";
        }
        if (question.type === "case") {
            return "Use the case cues to identify the safest priority nursing response.";
        }
        if (question.type === "fill") {
            return "Type the most accurate missing word or phrase.";
        }
        return "Choose the safest answer based on the cues given.";
    }

    function renderGrid() {
        questionGrid.innerHTML = "";

        questions.forEach((_, index) => {
            const button = document.createElement("button");
            const stateClass = flagged[index] ? "flagged" : (answers[index] ? "answered" : "not-answered");
            button.type = "button";
            button.className = `question-btn ${stateClass} ${index === current ? "current" : ""}`.trim();
            button.textContent = index + 1;
            button.setAttribute("aria-label", `Go to question ${index + 1}`);
            button.addEventListener("click", () => moveToQuestion(index));
            questionGrid.appendChild(button);
        });
    }

    function renderSummary() {
        if (!summaryPanel) {
            return;
        }

        const answeredCount = answers.filter(Boolean).length;
        const flaggedCount = flagged.filter(Boolean).length;
        const unansweredCount = questions.length - answeredCount;
        const progress = Math.round((answeredCount / questions.length) * 100);

        summaryPanel.innerHTML = `
            <h4>Exam Progress</h4>
            <div class="progress-meter" aria-label="Answered ${progress}% of questions">
                <span style="width: ${progress}%"></span>
            </div>
            <div class="summary-grid">
                <div><strong>${answeredCount}</strong><span>Answered</span></div>
                <div><strong>${unansweredCount}</strong><span>Unanswered</span></div>
                <div><strong>${flaggedCount}</strong><span>Flagged</span></div>
            </div>
            <div class="legend-row">
                <span><i class="legend answered"></i>Answered</span>
                <span><i class="legend flagged"></i>Flagged</span>
                <span><i class="legend not-answered"></i>Open</span>
            </div>
        `;
    }

    function moveToQuestion(index) {
        if (index < 0 || index >= questions.length) {
            return;
        }

        current = index;
        renderQuestion(current);
        renderGrid();
        renderSummary();
        scheduleAutosave();
    }

    function updateNavState() {
        prevButton.disabled = current === 0;
        nextButton.disabled = current === questions.length - 1;
        flagButton.textContent = flagged[current] ? "Unflag" : "Flag";
    }

    function startCountdown() {
        const durationSeconds = Math.max(1, Number(examConfig.duration || 45)) * 60;
        const display = document.querySelector(".countdown-timer");
        const startedAt = Number(localStorage.getItem(startKey)) || Date.now();
        localStorage.setItem(startKey, String(startedAt));

        countdownInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = Math.max(0, durationSeconds - elapsed);
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;

            display.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            display.classList.toggle("is-low", remaining <= 300);

            if (remaining === 0 && !submitted) {
                finalizeExam(true);
            }
        }, 1000);
    }

    function startProctoring() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            logWarning("Media capture is unsupported in this browser.");
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                proctorVideo.srcObject = stream;
                proctorVideo.play();
            })
            .catch(() => {
                logWarning("Camera or microphone permission was denied.");
            });
    }

    function logWarning(message) {
        const warningDiv = document.createElement("div");
        warningDiv.className = "warning-popup";
        warningDiv.textContent = `Warning: ${message}`;
        warningMessages.prepend(warningDiv);

        const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        proctoringEvents.unshift(`${message} (${timestamp})`);
        scheduleAutosave();
    }

    function scheduleAutosave() {
        autosaveIndicator.textContent = "Saving...";
        autosaveIndicator.classList.add("is-saving");
        clearTimeout(autosaveTimeout);

        autosaveTimeout = setTimeout(() => {
            const payload = {
                answers,
                flagged,
                notes: notesField.value,
                current,
                proctoringEvents
            };
            localStorage.setItem(examKey, JSON.stringify(payload));
            autosaveIndicator.textContent = "Saved";
            autosaveIndicator.classList.remove("is-saving");
        }, 250);
    }

    function restoreSavedSession() {
        const saved = JSON.parse(localStorage.getItem(examKey) || "null");
        if (!saved) {
            return;
        }

        if (Array.isArray(saved.answers)) {
            saved.answers.forEach((answer, index) => {
                if (index < answers.length) {
                    answers[index] = answer;
                }
            });
        }

        if (Array.isArray(saved.flagged)) {
            saved.flagged.forEach((value, index) => {
                if (index < flagged.length) {
                    flagged[index] = Boolean(value);
                }
            });
        }

        if (Array.isArray(saved.proctoringEvents)) {
            proctoringEvents.push(...saved.proctoringEvents);
        }

        notesField.value = saved.notes || "";
        current = Number.isInteger(saved.current) ? Math.min(saved.current, questions.length - 1) : 0;
        autosaveIndicator.textContent = "Restored";
    }

    function finalizeExam(autoSubmitted) {
        submitted = true;
        clearInterval(countdownInterval);
        const results = buildResults(autoSubmitted);
        localStorage.setItem("submittedExamResults", JSON.stringify(results));
        localStorage.removeItem("activeExam");
        localStorage.removeItem(examKey);
        localStorage.removeItem(startKey);
        window.location.href = "../results/results.html";
    }

    function buildResults(autoSubmitted) {
        const categoryTotals = {};
        let earnedPoints = 0;

        questions.forEach((question, index) => {
            const score = scoreQuestion(question, answers[index]);
            earnedPoints += score;
            categoryTotals[question.category] ??= { total: 0, earned: 0 };
            categoryTotals[question.category].total += 1;
            categoryTotals[question.category].earned += score;
        });

        const performanceBreakdown = Object.entries(categoryTotals)
            .map(([category, totals]) => ({
                category,
                score: Math.round((totals.earned / totals.total) * 100)
            }))
            .sort((left, right) => right.score - left.score);

        return {
            examTitle: examConfig.title || "Active Exam",
            examId: examConfig.id,
            scheduledAt: examConfig.scheduledAt,
            submittedAt: new Date().toISOString(),
            autoSubmitted,
            score: Math.round((earnedPoints / questions.length) * 100),
            answeredCount: answers.filter(Boolean).length,
            totalQuestions: questions.length,
            strengths: performanceBreakdown.filter((item) => item.score >= 80).map((item) => item.category),
            weakAreas: performanceBreakdown.filter((item) => item.score < 70).map((item) => item.category),
            performanceBreakdown,
            proctoringEvents: proctoringEvents.length ? proctoringEvents : ["No proctoring issues were recorded."],
            answerReview: questions.map((question, index) => ({
                question: question.prompt,
                category: question.category,
                answer: answers[index] || "No response submitted",
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                flagged: flagged[index]
            }))
        };
    }
});

function scoreQuestion(question, answer) {
    if (!answer) {
        return 0;
    }

    if (question.type === "essay" || question.type === "case") {
        const normalized = String(answer).toLowerCase();
        const keywords = Array.isArray(question.expectedKeywords) ? question.expectedKeywords : [];
        if (!keywords.length) {
            return 0.5;
        }
        const matches = keywords.filter((keyword) => normalized.includes(String(keyword).toLowerCase())).length;
        return matches >= Math.ceil(keywords.length / 2) ? 1 : matches > 0 ? 0.5 : 0;
    }

    if (question.type === "fill") {
        return String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase() ? 1 : 0;
    }

    return answer === question.correctAnswer ? 1 : 0;
}

function buildQuestionBank(examConfig) {
    if (Array.isArray(examConfig.questionBank) && examConfig.questionBank.length) {
        const normalized = examConfig.questionBank.map((question, index) => ({
            type: question.type || "mcq",
            category: question.category || "Assigned Exam",
            difficulty: question.difficulty || "Application",
            prompt: question.prompt || question.question || `Question ${index + 1}`,
            options: examConfig.randomized ? shuffle(question.options || []) : (question.options || []),
            correctAnswer: question.correctAnswer || question.answer || "",
            expectedKeywords: question.expectedKeywords || [],
            explanation: question.explanation || ""
        }));
        return examConfig.randomized ? shuffle(normalized) : normalized;
    }

    const targetCount = 100;
    const blueprint = getBlueprint(examConfig);
    const questions = [];
    let index = 0;

    while (questions.length < targetCount) {
        blueprint.forEach((section) => {
            section.focus.forEach((focus) => {
                if (questions.length < targetCount) {
                    questions.push(buildQuestion(section.unit, focus, index));
                    index += 1;
                }
            });
        });
    }

    return questions;
}

function getBlueprint(examConfig) {
    const label = `${examConfig.title || ""} ${examConfig.id || ""}`.toLowerCase();

    if (label.includes("pharm")) {
        return [
            { unit: "Pharmacology", focus: ["safe administration", "side effects", "high-alert medications", "patient teaching"] },
            { unit: "Medication Safety", focus: ["five rights", "allergy checks", "dose calculations", "adverse reactions"] },
            { unit: "Adult Health", focus: ["cardiac medications", "respiratory drugs", "diuretics", "pain management"] },
            { unit: "Patient Education", focus: ["teach-back", "home adherence", "warning signs", "follow-up care"] }
        ];
    }

    if (label.includes("anatomy")) {
        return [
            { unit: "Skeletal System", focus: ["bone structure", "joints", "movement", "fracture care"] },
            { unit: "Cardiovascular System", focus: ["blood flow", "heart chambers", "circulation", "perfusion"] },
            { unit: "Respiratory System", focus: ["gas exchange", "airway anatomy", "ventilation", "oxygenation"] },
            { unit: "Digestive System", focus: ["absorption", "liver function", "nutrition", "elimination"] }
        ];
    }

    return [
        { unit: "Safe and Effective Care Environment", focus: ["priority setting", "delegation", "care coordination", "legal practice"] },
        { unit: "Health Promotion and Maintenance", focus: ["prenatal teaching", "developmental milestones", "screening", "prevention"] },
        { unit: "Psychosocial Integrity", focus: ["coping support", "therapeutic communication", "grief care", "mental health safety"] },
        { unit: "Physiological Integrity", focus: ["basic care", "pharmacology", "risk reduction", "adaptation"] },
        { unit: "Adult Health", focus: ["cardiovascular care", "respiratory care", "fluid balance", "pain management"] },
        { unit: "Leadership and Delegation", focus: ["supervision", "assignment planning", "urgent cues", "team communication"] }
    ];
}

function buildQuestion(unit, focus, index) {
    const stems = [
        {
            prompt: `A nurse is caring for a patient in ${unit.toLowerCase()}. Which action best demonstrates safe practice during ${focus}?`,
            correct: `Prioritize the assessment finding that most directly affects ${focus}.`,
            distractors: [
                "Wait until the end of the shift to compare findings.",
                "Document before reassessing the patient response.",
                "Delegate the initial clinical judgment to an unlicensed assistant."
            ],
            explanation: `Safe nursing care in ${unit.toLowerCase()} starts by recognizing the highest-risk cue and responding early.`
        },
        {
            prompt: `During a review of ${unit.toLowerCase()}, which finding requires immediate follow-up related to ${focus}?`,
            correct: "A change that places the patient at risk of rapid deterioration.",
            distractors: [
                "A stable finding that matches the expected plan of care.",
                "A routine request that can be handled during rounding.",
                "A nonurgent concern already resolved by previous teaching."
            ],
            explanation: `Questions tied to ${focus} test whether the nurse can separate urgent cues from expected findings.`
        },
        {
            prompt: `A student nurse is preparing for an exam on ${unit.toLowerCase()}. Which principle matters most when applying ${focus}?`,
            correct: "Link assessment data, patient safety, and the most appropriate nursing intervention.",
            distractors: [
                "Choose the intervention that is fastest regardless of patient condition.",
                "Memorize terminology without connecting it to patient outcomes.",
                "Delay action until every possible diagnosis is confirmed."
            ],
            explanation: "Strong clinical reasoning connects assessment findings with safety and the next best intervention."
        },
        {
            prompt: `Which statement best supports patient education during ${focus} in ${unit.toLowerCase()}?`,
            correct: "Use clear teaching, check understanding, and relate instructions to the current care plan.",
            distractors: [
                "Give all instructions at once and avoid asking for feedback.",
                "Use only technical language so the chart matches the lesson.",
                "Postpone teaching until discharge even when concerns appear now."
            ],
            explanation: "Effective nursing education is clear, timely, and verified with patient feedback."
        }
    ];
    const stem = stems[index % stems.length];

    return {
        category: unit,
        difficulty: index % 3 === 0 ? "Foundational" : index % 3 === 1 ? "Application" : "Priority",
        prompt: stem.prompt,
        options: shuffle([stem.correct, ...stem.distractors]),
        correctAnswer: stem.correct,
        explanation: stem.explanation
    };
}

function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
