document.addEventListener("DOMContentLoaded", () => {
    const session = window.GnpUtils?.getSession?.() || null;
    const userId = String(session?.userId || "guest").trim() || "guest";
    const activeExamKey = `activeExam:${userId}`;
    const submittedResultsKey = `submittedExamResults:${userId}`;
    const progressKey = (examId) => `exam-progress:${userId}:${examId}`;
    const examConfig = JSON.parse(localStorage.getItem(activeExamKey) || "null");
    if (!examConfig) {
        alert("No active session found. Returning to the exam lobby.");
        window.location.href = "../exam-lobby/exam-lobby.html";
        return;
    }
    const assessmentControl = window.GnpAssessmentControl;
    const access = assessmentControl?.canStartAttempt(userId, examConfig.id) || { ok: true };
    if (!access.ok) {
        alert(access.reason);
        localStorage.removeItem(activeExamKey);
        window.location.href = "../exam-lobby/exam-lobby.html";
        return;
    }
    const attempt = assessmentControl?.startAttempt({ session: session || { userId }, exam: examConfig });
    const attemptId = attempt?.id || assessmentControl?.attemptId(userId, examConfig.id);

    const examName = document.querySelector(".exam-name");
    const autosaveIndicator = document.querySelector(".autosave-indicator");
    const warningMessages = document.getElementById("warning-messages");
    examName.textContent = examConfig.title || "Active Exam";

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
            console.log("Fullscreen request failed. Most browsers require user interaction first.");
        });
    }

    const proctoringEvents = [];
    let submitted = false;
    let autosaveTimeout = null;
    let heartbeatTimer = null;

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            terminateExamForViolation("Tab switch detected. The exam attempt was stopped automatically.");
        }
    });

    window.addEventListener("blur", () => {
        window.setTimeout(() => {
            if (document.hidden) {
                terminateExamForViolation("Exam tab focus was lost. The exam attempt was stopped automatically.");
            }
        }, 200);
    });

    window.addEventListener("keyup", (event) => {
        if (event.key === "PrintScreen" || event.keyCode === 44) {
            logWarning("Screenshot attempt detected.");
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText("");
            }
        }
    });

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link || submitted) {
            return;
        }
        event.preventDefault();
        terminateExamForViolation("Navigation away from the exam was attempted. The exam attempt was stopped automatically.");
    });

    const totalDurationSeconds = Number(examConfig.duration) * 60;
    startCountdown(totalDurationSeconds);

    const video = document.getElementById("proctor-video");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
                assessmentControl?.updateAttempt(attemptId, { cameraStatus: "on", microphoneStatus: "on" });
            })
            .catch(() => {
                alert("Camera and microphone access are required to continue the exam.");
                logWarning("Camera or microphone permission was denied.");
                assessmentControl?.updateAttempt(attemptId, { cameraStatus: "blocked", microphoneStatus: "blocked" });
            });
    } else {
        logWarning("Media capture is unsupported in this browser.");
    }

    const questions = Array.isArray(examConfig.questions) && examConfig.questions.length
        ? examConfig.questions
        : buildQuestionBank(examConfig);

    let current = 0;
    const answers = Array(questions.length).fill(null);
    const flagged = Array(questions.length).fill(false);

    function renderQuestion(index) {
        const question = questions[index];
        const container = document.getElementById("question-content");
        let html = `
            <div class="question-shell">
                <div class="question-meta-bar">
                    <span class="question-tag">${question.category}</span>
                    <span class="question-tag">${question.type === "msq" ? "MSQ: select all that apply" : "MCQ: select one"}</span>
                    <span class="question-progress">Question ${index + 1} of ${questions.length}</span>
                </div>
                <h2>Question ${index + 1}</h2>
                <p>${question.text}</p>
        `;

        if (question.type === "mcq") {
            question.options.forEach((option, optionIndex) => {
                html += `
                    <div class="option-item">
                        <input type="radio" name="q${index}" id="opt${index}-${optionIndex}" value="${option}" ${answers[index] === option ? "checked" : ""}>
                        <label for="opt${index}-${optionIndex}">${option}</label>
                    </div>
                `;
            });
        } else if (question.type === "msq") {
            const selectedAnswers = Array.isArray(answers[index]) ? answers[index] : [];
            question.options.forEach((option, optionIndex) => {
                html += `
                    <div class="option-item">
                        <input type="checkbox" name="q${index}" id="opt${index}-${optionIndex}" value="${option}" ${selectedAnswers.includes(option) ? "checked" : ""}>
                        <label for="opt${index}-${optionIndex}">${option}</label>
                    </div>
                `;
            });
        }

        html += "</div>";
        container.innerHTML = html;

        container.querySelectorAll('input[type="radio"]').forEach((radio) => {
            radio.addEventListener("change", (event) => {
                answers[index] = event.target.value;
                renderGrid();
                scheduleAutosave();
            });
        });

        container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                answers[index] = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((item) => item.value);
                renderGrid();
                scheduleAutosave();
            });
        });

        updateNavState();
    }

    function renderGrid() {
        const grid = document.getElementById("question-grid");
        grid.innerHTML = "";

        questions.forEach((_, index) => {
            const button = document.createElement("button");
            const stateClass = flagged[index] ? "flagged" : (hasAnswer(answers[index]) ? "answered" : "not-answered");
            button.className = `question-btn ${stateClass} ${index === current ? "current" : ""}`.trim();
            button.textContent = index + 1;
            button.onclick = () => {
                current = index;
                renderQuestion(current);
                renderGrid();
            };
            grid.appendChild(button);
        });
    }

    function hasAnswer(answer) {
        return Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
    }

    document.getElementById("prev-btn").onclick = () => {
        if (current > 0) {
            current -= 1;
            renderQuestion(current);
            renderGrid();
        }
    };

    document.getElementById("next-btn").onclick = () => {
        if (current < questions.length - 1) {
            current += 1;
            renderQuestion(current);
            renderGrid();
        }
    };

    document.getElementById("flag-btn").onclick = () => {
        flagged[current] = !flagged[current];
        renderGrid();
        updateNavState();
        scheduleAutosave();
    };

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Finish & Submit Exam";
    submitBtn.className = "btn-submit-final";
    submitBtn.onclick = () => {
        if (submitted) {
            return;
        }

        if (confirm("Are you sure you want to submit? You cannot return to the exam.")) {
            finalizeExam();
        }
    };
    document.querySelector(".bottom-nav").appendChild(submitBtn);

    document.getElementById("notes").addEventListener("input", scheduleAutosave);

    restoreSavedSession();
    renderQuestion(current);
    renderGrid();
    heartbeatTimer = window.setInterval(() => {
        assessmentControl?.updateAttempt(attemptId, {
            lastSeenAt: new Date().toISOString(),
            connectionStatus: "online",
            currentQuestion: current + 1,
            answeredCount: answers.filter(hasAnswer).length
        });
    }, 5000);

    window.addEventListener("pagehide", () => {
        if (!submitted) {
            assessmentControl?.updateAttempt(attemptId, {
                connectionStatus: "disconnected",
                lastSeenAt: new Date().toISOString()
            });
        }
    });

    function logWarning(message) {
        const warningDiv = document.createElement("div");
        warningDiv.className = "warning-popup";
        warningDiv.textContent = `Warning: ${message}`;
        warningMessages.prepend(warningDiv);

        const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        proctoringEvents.unshift(`${message} (${timestamp})`);
        assessmentControl?.addViolation(attemptId, "browser", message);
        document.body.style.border = "5px solid #c54444";
        setTimeout(() => {
            document.body.style.border = "none";
        }, 3000);
    }

    function startCountdown(duration) {
        let timer = duration;
        const display = document.querySelector(".countdown-timer");

        setInterval(() => {
            const hours = Math.floor(timer / 3600);
            const minutes = Math.floor((timer % 3600) / 60);
            const seconds = Math.floor(timer % 60);
            display.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

            timer -= 1;
            if (timer < 0 && !submitted) {
                alert("Time is up. Your exam is being submitted.");
                finalizeExam(true);
            }
        }, 1000);
    }

    function scheduleAutosave() {
        autosaveIndicator.textContent = "Saving...";
        autosaveIndicator.classList.add("is-saving");
        clearTimeout(autosaveTimeout);

        autosaveTimeout = setTimeout(() => {
            const payload = {
                answers,
                flagged,
                notes: document.getElementById("notes").value,
                current
            };
            localStorage.setItem(progressKey(examConfig.id), JSON.stringify(payload));
            autosaveIndicator.textContent = "Saved";
            autosaveIndicator.classList.remove("is-saving");
        }, 300);
    }

    function restoreSavedSession() {
        const saved = JSON.parse(localStorage.getItem(progressKey(examConfig.id)) || "null");
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

        document.getElementById("notes").value = saved.notes || "";
        current = Number.isInteger(saved.current) ? Math.min(saved.current, questions.length - 1) : 0;
        autosaveIndicator.textContent = "Restored";
    }

    function updateNavState() {
        document.getElementById("prev-btn").disabled = current === 0;
        document.getElementById("next-btn").disabled = current === questions.length - 1;
        document.getElementById("flag-btn").textContent = flagged[current] ? "Unflag" : "Flag";
    }

    function finalizeExam(autoSubmitted = false) {
        submitted = true;
        window.clearInterval(heartbeatTimer);
        const results = buildResults(autoSubmitted);
        localStorage.setItem(submittedResultsKey, JSON.stringify(results));
        assessmentControl?.completeAttempt(attemptId, results);
        localStorage.removeItem(activeExamKey);
        localStorage.removeItem(progressKey(examConfig.id));
        window.location.href = "../results/results.html";
    }

    function terminateExamForViolation(message) {
        if (submitted) {
            return;
        }

        logWarning(message);
        submitted = true;
        const results = buildResults(true);
        results.terminated = true;
        results.terminationReason = message;
        results.proctoringEvents = [message, ...proctoringEvents];
        localStorage.setItem(submittedResultsKey, JSON.stringify(results));
        window.clearInterval(heartbeatTimer);
        assessmentControl?.completeAttempt(attemptId, results);
        localStorage.removeItem(activeExamKey);
        localStorage.removeItem(progressKey(examConfig.id));
        void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

        window.setTimeout(() => {
            window.close();
            window.location.replace("../../login.html?examTerminated=tab-left");
        }, 250);
    }

    function buildResults(autoSubmitted) {
        const categoryTotals = {};
        let earnedPoints = 0;

        questions.forEach((question, index) => {
            const score = scoreResponse(question, answers[index]);
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
            answeredCount: answers.filter(hasAnswer).length,
            totalQuestions: questions.length,
            strengths: performanceBreakdown.filter((item) => item.score >= 80).map((item) => item.category),
            weakAreas: performanceBreakdown.filter((item) => item.score < 70).map((item) => item.category),
            performanceBreakdown,
            proctoringEvents: proctoringEvents.length ? proctoringEvents : ["No proctoring issues were recorded."],
            answerReview: questions.map((question, index) => ({
                question: question.text,
                category: question.category,
                answer: formatAnswer(answers[index]),
                flagged: flagged[index]
            }))
        };
    }

    function scoreResponse(question, answer) {
        if (!hasAnswer(answer)) {
            return 0;
        }

        if (question.type === "mcq") {
            return answer === question.correctAnswer ? 1 : 0;
        }

        if (question.type === "msq") {
            const selected = Array.isArray(answer) ? answer.slice().sort() : [];
            const correct = (question.correctAnswers || []).slice().sort();
            return selected.length === correct.length && selected.every((item, index) => item === correct[index]) ? 1 : 0;
        }

        return 0;
    }

    function formatAnswer(answer) {
        if (!hasAnswer(answer)) {
            return "No response submitted";
        }
        return Array.isArray(answer) ? answer.join(", ") : answer;
    }

    function buildQuestionBank(config) {
        const category = String(config.category || config.title || "Licensing").toLowerCase();
        const isNclex = category.includes("nclex");
        const isCbt = category.includes("cbt") || category.includes("uk");
        const isNck = category.includes("nck") || category.includes("kenya");

        const base = [
            {
                type: "mcq",
                category: "Adult Health",
                text: "A patient reports chest pain and shortness of breath. Which nursing action is the priority?",
                options: ["Offer oral fluids", "Assess airway, breathing, circulation, and vital signs", "Document the complaint at shift end", "Delay care until family arrives"],
                correctAnswer: "Assess airway, breathing, circulation, and vital signs"
            },
            {
                type: "msq",
                category: "Medication Safety",
                text: "Which checks should the nurse complete before administering a high-alert medication? Select all that apply.",
                options: ["Confirm patient identity", "Check allergies", "Verify dose and route", "Skip documentation", "Ignore abnormal vital signs"],
                correctAnswers: ["Confirm patient identity", "Check allergies", "Verify dose and route"]
            },
            {
                type: "mcq",
                category: "Infection Prevention",
                text: "Which action best supports standard precautions?",
                options: ["Use hand hygiene before and after patient contact", "Wear sterile gloves for every patient interaction", "Reuse disposable equipment", "Place all patients in airborne isolation"],
                correctAnswer: "Use hand hygiene before and after patient contact"
            },
            {
                type: "msq",
                category: "Clinical Judgement",
                text: "Which findings suggest a patient may be deteriorating? Select all that apply.",
                options: ["New confusion", "Falling blood pressure", "Increasing respiratory rate", "Stable appetite", "Warm dry skin with normal pulse"],
                correctAnswers: ["New confusion", "Falling blood pressure", "Increasing respiratory rate"]
            }
        ];

        const licensingSpecific = isNclex
            ? [
                {
                    type: "msq",
                    category: "NCLEX-RN NGN",
                    text: "Which actions reflect safe prioritization and delegation? Select all that apply.",
                    options: ["Keep initial assessment of chest pain with the RN", "Delegate routine stable vital signs with clear instructions", "Delegate patient teaching to unlicensed staff", "Reassess after an intervention", "Ignore acute changes in condition"],
                    correctAnswers: ["Keep initial assessment of chest pain with the RN", "Delegate routine stable vital signs with clear instructions", "Reassess after an intervention"]
                }
            ]
            : isCbt
                ? [
                    {
                        type: "msq",
                        category: "UK CBT Professional Practice",
                        text: "Which behaviours support professional nursing practice? Select all that apply.",
                        options: ["Maintain confidentiality", "Escalate safety concerns", "Document accurately", "Share passwords", "Practice outside competence"],
                        correctAnswers: ["Maintain confidentiality", "Escalate safety concerns", "Document accurately"]
                    }
                ]
                : isNck
                    ? [
                        {
                            type: "msq",
                            category: "NCK Readiness",
                            text: "Which areas should be revised before a licensing mock exam? Select all that apply.",
                            options: ["Professional ethics", "Medication safety", "Maternal-child nursing", "Skipping rationales", "Unreviewed weak topics"],
                            correctAnswers: ["Professional ethics", "Medication safety", "Maternal-child nursing"]
                        }
                    ]
                    : [];

        return base.concat(licensingSpecific);
    }
});
(function () {
    const EXAM_TARGET_COUNT = 100;

    const EXAM_BLUEPRINTS = {
        default: [
            { unit: "Foundations of Nursing Practice", focus: ["patient safety", "infection prevention", "documentation", "ethics"] },
            { unit: "Adult Health", focus: ["cardiovascular care", "respiratory care", "fluid balance", "pain management"] },
            { unit: "Pharmacology", focus: ["safe administration", "side effects", "high-alert drugs", "patient teaching"] },
            { unit: "Maternal and Newborn Care", focus: ["antenatal care", "labor stages", "postpartum care", "newborn assessment"] },
            { unit: "Pediatrics", focus: ["growth milestones", "family education", "hydration", "common pediatric illness"] },
            { unit: "Mental Health Nursing", focus: ["therapeutic communication", "crisis response", "anxiety disorders", "patient advocacy"] },
            { unit: "Leadership and Delegation", focus: ["priority setting", "delegation", "supervision", "time management"] },
            { unit: "Community Health", focus: ["health promotion", "screening", "immunization", "population health"] }
        ],
        nclex: [
            { unit: "Safe and Effective Care Environment", focus: ["priority setting", "delegation", "care coordination", "legal practice"] },
            { unit: "Health Promotion and Maintenance", focus: ["prenatal teaching", "developmental milestones", "screening", "prevention"] },
            { unit: "Psychosocial Integrity", focus: ["coping support", "communication", "grief care", "mental health safety"] },
            { unit: "Physiological Integrity", focus: ["basic care", "pharmacology", "reduction of risk", "adaptation"] }
        ],
        anatomy: [
            { unit: "Skeletal System", focus: ["bone structure", "joints", "movement", "fracture care"] },
            { unit: "Cardiovascular System", focus: ["blood flow", "heart chambers", "circulation", "perfusion"] },
            { unit: "Respiratory System", focus: ["gas exchange", "airway anatomy", "ventilation", "oxygenation"] },
            { unit: "Digestive System", focus: ["absorption", "liver function", "nutrition", "elimination"] }
        ]
    };

    function pickBlueprint() {
        const title = [
            typeof selectedExam !== "undefined" && selectedExam && selectedExam.title,
            typeof examConfig !== "undefined" && examConfig && examConfig.title,
            typeof examData !== "undefined" && examData && examData.title,
            document.title,
            document.body ? document.body.textContent.slice(0, 500) : ""
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (title.includes("nclex")) return EXAM_BLUEPRINTS.nclex;
        if (title.includes("anatomy")) return EXAM_BLUEPRINTS.anatomy;
        return EXAM_BLUEPRINTS.default;
    }

    function shuffle(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function makeOptions(correct, distractors) {
        return shuffle([correct].concat(distractors.slice(0, 3)));
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
                explanation: `Safe nursing care in ${unit.toLowerCase()} starts by recognizing the highest-risk cue and responding to it early.`
            },
            {
                prompt: `During a review of ${unit.toLowerCase()}, which finding should the nurse identify as requiring immediate follow-up related to ${focus}?`,
                correct: `A change that places the patient at risk of rapid deterioration.`,
                distractors: [
                    "A stable finding that matches the expected plan of care.",
                    "A routine request that can be handled during rounding.",
                    "A nonurgent concern already resolved by previous teaching."
                ],
                explanation: `Questions tied to ${focus} often test whether the nurse can distinguish urgent cues from expected or lower-priority findings.`
            },
            {
                prompt: `A student nurse is preparing for an exam on ${unit.toLowerCase()}. Which principle is most important when applying knowledge about ${focus}?`,
                correct: `Link assessment data, patient safety, and the most appropriate nursing intervention.`,
                distractors: [
                    "Choose the intervention that is fastest regardless of patient condition.",
                    "Memorize terminology without connecting it to patient outcomes.",
                    "Delay action until every possible diagnosis is confirmed."
                ],
                explanation: `Strong clinical reasoning connects assessment findings with safety and the next best intervention.`
            },
            {
                prompt: `Which statement by the nurse best supports patient education during ${focus} in ${unit.toLowerCase()}?`,
                correct: `Use clear teaching, check understanding, and relate instructions to the patient's current care plan.`,
                distractors: [
                    "Give all instructions at once and avoid asking for feedback.",
                    "Use only technical language so the chart matches the lesson.",
                    "Postpone teaching until discharge even when concerns appear now."
                ],
                explanation: `Effective education is clear, timely, and verified using feedback from the patient.`
            }
        ];

        const stem = stems[index % stems.length];
        const options = makeOptions(stem.correct, stem.distractors);

        return {
            id: `generated-${unit.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
            unit,
            category: unit,
            topic: focus,
            question: stem.prompt,
            prompt: stem.prompt,
            options,
            choices: options,
            answer: stem.correct,
            correctAnswer: stem.correct,
            explanation: stem.explanation,
            difficulty: index % 3 === 0 ? "Foundational" : index % 3 === 1 ? "Application" : "Priority"
        };
    }

    function generateQuestionBank(targetCount) {
        const blueprint = pickBlueprint();
        const generated = [];
        let index = 0;

        while (generated.length < targetCount) {
            blueprint.forEach((section) => {
                section.focus.forEach((focus) => {
                    if (generated.length < targetCount) {
                        generated.push(buildQuestion(section.unit, focus, index));
                        index += 1;
                    }
                });
            });
        }

        return generated.slice(0, targetCount);
    }

    function getQuestionArray() {
        if (typeof questions !== "undefined" && Array.isArray(questions)) return questions;
        if (typeof examQuestions !== "undefined" && Array.isArray(examQuestions)) return examQuestions;
        if (typeof questionBank !== "undefined" && Array.isArray(questionBank)) return questionBank;
        if (typeof examData !== "undefined" && examData && Array.isArray(examData.questions)) return examData.questions;
        if (typeof selectedExam !== "undefined" && selectedExam && Array.isArray(selectedExam.questions)) return selectedExam.questions;
        if (typeof currentExam !== "undefined" && currentExam && Array.isArray(currentExam.questions)) return currentExam.questions;
        return null;
    }

    function ensureQuestionDepth() {
        const bank = getQuestionArray();
        if (!bank) return null;

        const normalizedExisting = bank.map((item, index) => ({
            id: item.id || `existing-${index + 1}`,
            unit: item.unit || item.category || "General Nursing",
            category: item.category || item.unit || "General Nursing",
            topic: item.topic || item.unit || "Core Review",
            question: item.question || item.prompt || `Question ${index + 1}`,
            prompt: item.prompt || item.question || `Question ${index + 1}`,
            options: item.options || item.choices || [],
            choices: item.choices || item.options || [],
            answer: item.answer || item.correctAnswer || "",
            correctAnswer: item.correctAnswer || item.answer || "",
            explanation: item.explanation || "",
            difficulty: item.difficulty || "Application"
        }));

        bank.splice(0, bank.length, ...normalizedExisting);

        if (bank.length >= EXAM_TARGET_COUNT) {
            return bank;
        }

        const generated = generateQuestionBank(EXAM_TARGET_COUNT + 20);
        const seenPrompts = new Set(bank.map((item) => item.prompt || item.question));

        generated.forEach((item) => {
            if (bank.length >= EXAM_TARGET_COUNT) return;
            const label = item.prompt || item.question;
            if (!seenPrompts.has(label)) {
                bank.push(item);
                seenPrompts.add(label);
            }
        });

        return bank;
    }

    function currentIndex() {
        if (typeof currentQuestionIndex !== "undefined") return currentQuestionIndex;
        if (typeof currentQuestion !== "undefined") return currentQuestion;
        return 0;
    }

    function setCurrentIndex(value) {
        if (typeof currentQuestionIndex !== "undefined") {
            currentQuestionIndex = value;
            return;
        }
        if (typeof currentQuestion !== "undefined") {
            currentQuestion = value;
        }
    }

    function rerenderQuestion() {
        if (typeof renderQuestion === "function") return renderQuestion();
        if (typeof renderCurrentQuestion === "function") return renderCurrentQuestion();
        if (typeof showQuestion === "function") return showQuestion();
        if (typeof updateQuestionView === "function") return updateQuestionView();
        if (typeof loadQuestion === "function") return loadQuestion();
        return null;
    }

    function updateExamCountLabels(count) {
        document.querySelectorAll("[data-question-total], .question-total, .exam-total, .js-total-questions").forEach((node) => {
            node.textContent = count;
        });

        document.querySelectorAll(".question-progress, .progress-label, .js-question-progress").forEach((node) => {
            const text = (node.textContent || "").replace(/\b\d+\s*\/\s*\d+\b/, `${currentIndex() + 1}/${count}`);
            node.textContent = text;
        });
    }

    function injectNavigator(bank) {
        if (!Array.isArray(bank) || !bank.length) return;
        if (document.querySelector(".question-nav-panel")) return;

        const style = document.createElement("style");
        style.textContent = `
            .question-nav-panel {
                position: sticky;
                top: 88px;
                align-self: start;
                padding: 1rem;
                border: 1px solid #d6e2ee;
                border-radius: 12px;
                background: #ffffff;
                box-shadow: 0 16px 30px rgba(19, 35, 53, 0.08);
                margin-top: 1rem;
            }
            .question-nav-panel h3 {
                margin: 0 0 0.35rem;
                font-size: 1rem;
                color: #16314f;
            }
            .question-nav-panel p {
                margin: 0 0 0.85rem;
                font-size: 0.9rem;
                color: #5a6b7e;
            }
            .question-nav-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
                gap: 0.45rem;
            }
            .question-nav-btn {
                height: 42px;
                border: 1px solid #c8d8e6;
                border-radius: 10px;
                background: #f7fafc;
                color: #16314f;
                font-weight: 700;
                cursor: pointer;
            }
            .question-nav-btn.is-active {
                background: #0f86a6;
                border-color: #0f86a6;
                color: #ffffff;
            }
            .question-nav-btn.is-answered {
                background: #e7f6ec;
                border-color: #66b77a;
            }
            .question-nav-actions {
                display: flex;
                gap: 0.65rem;
                margin-top: 0.9rem;
            }
            .question-nav-actions button {
                flex: 1;
                min-height: 42px;
                border-radius: 10px;
                border: 1px solid #c8d8e6;
                background: #ffffff;
                color: #16314f;
                font-weight: 600;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);

        const panel = document.createElement("aside");
        panel.className = "question-nav-panel";
        panel.innerHTML = `
            <h3>Question Navigation</h3>
            <p>Move freely through the exam and review progress as you go.</p>
            <div class="question-nav-grid"></div>
            <div class="question-nav-actions">
                <button type="button" class="nav-prev-btn">Previous</button>
                <button type="button" class="nav-next-btn">Next</button>
            </div>
        `;

        const grid = panel.querySelector(".question-nav-grid");
        bank.forEach((item, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "question-nav-btn";
            button.dataset.index = String(index);
            button.textContent = String(index + 1);
            button.addEventListener("click", () => {
                setCurrentIndex(index);
                rerenderQuestion();
                syncNavigatorState(bank.length);
            });
            grid.appendChild(button);
        });

        panel.querySelector(".nav-prev-btn").addEventListener("click", () => {
            const nextIndex = Math.max(0, currentIndex() - 1);
            setCurrentIndex(nextIndex);
            rerenderQuestion();
            syncNavigatorState(bank.length);
        });

        panel.querySelector(".nav-next-btn").addEventListener("click", () => {
            const nextIndex = Math.min(bank.length - 1, currentIndex() + 1);
            setCurrentIndex(nextIndex);
            rerenderQuestion();
            syncNavigatorState(bank.length);
        });

        const host =
            document.querySelector(".exam-layout") ||
            document.querySelector(".exam-shell") ||
            document.querySelector(".exam-container") ||
            document.querySelector("main") ||
            document.body;

        host.appendChild(panel);
    }

    function injectExamTopNav() {
        if (document.querySelector(".exam-top-nav")) return;

        const style = document.createElement("style");
        style.textContent = `
            .exam-top-nav {
                position: sticky;
                top: 0;
                z-index: 120;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.9rem 1.25rem;
                margin: 0 0 1rem;
                background: #102c4d;
                color: #ffffff;
                box-shadow: 0 14px 28px rgba(16, 44, 77, 0.16);
            }
            .exam-top-brand {
                display: flex;
                flex-direction: column;
                gap: 0.15rem;
            }
            .exam-top-brand strong {
                font-size: 1rem;
                line-height: 1.2;
            }
            .exam-top-brand span {
                font-size: 0.82rem;
                color: rgba(255, 255, 255, 0.78);
            }
            .exam-top-links {
                display: flex;
                align-items: center;
                gap: 0.65rem;
                flex-wrap: wrap;
            }
            .exam-top-links a {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 40px;
                padding: 0.65rem 1rem;
                border-radius: 999px;
                border: 1px solid rgba(255, 255, 255, 0.24);
                color: #ffffff;
                text-decoration: none;
                font-weight: 600;
                transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
            }
            .exam-top-links a:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(255, 255, 255, 0.4);
                transform: translateY(-1px);
            }
            @media (max-width: 760px) {
                .exam-top-nav {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .exam-top-links {
                    width: 100%;
                }
                .exam-top-links a {
                    flex: 1 1 140px;
                }
            }
        `;
        document.head.appendChild(style);

        const nav = document.createElement("div");
        nav.className = "exam-top-nav";
        nav.innerHTML = `
            <div class="exam-top-brand">
                <strong>GlobalNursePrep Exam</strong>
                <span>Stay in the exam and move where you need with ease.</span>
            </div>
            <nav class="exam-top-links" aria-label="Exam quick navigation">
                <a href="../landing.html">Home</a>
                <a href="../courses.html">Courses</a>
                <a href="../exam-lobby/exam-lobby.html">Exam Lobby</a>
            </nav>
        `;

        const anchor =
            document.querySelector("main") ||
            document.querySelector(".exam-layout") ||
            document.querySelector(".exam-shell") ||
            document.body.firstElementChild ||
            document.body;

        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(nav, anchor);
        } else {
            document.body.prepend(nav);
        }
    }

    function syncNavigatorState(total) {
        const activeIndex = currentIndex();
        document.querySelectorAll(".question-nav-btn").forEach((button) => {
            const index = Number(button.dataset.index);
            button.classList.toggle("is-active", index === activeIndex);
        });

        const answeredMarkers = document.querySelectorAll(
            "input[type='radio']:checked, input[type='checkbox']:checked, .option.is-selected, .choice.selected"
        ).length;

        document.querySelectorAll(".question-nav-btn").forEach((button, index) => {
            button.classList.toggle("is-answered", index < answeredMarkers);
        });

        updateExamCountLabels(total);
    }

    function bootExamEnhancements() {
        return;
        const bank = ensureQuestionDepth();
        injectExamTopNav();
        if (!bank || !bank.length) return;
        injectNavigator(bank);
        updateExamCountLabels(bank.length);
        syncNavigatorState(bank.length);

        document.addEventListener("click", () => {
            window.setTimeout(() => syncNavigatorState(bank.length), 20);
        });

        document.addEventListener("change", () => {
            window.setTimeout(() => syncNavigatorState(bank.length), 20);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootExamEnhancements);
    } else {
        bootExamEnhancements();
    }
})();
